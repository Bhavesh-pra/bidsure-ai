import re
from typing import Any, Dict, List, Optional

from app.services.evidence_extraction.service import normalize_name, normalize_identifier


class CrossVerificationEngine:
    """
    Performs cross-document and cross-source consistency checks:
      1. GSTIN <-> PAN structural alignment (characters 3-12 of GSTIN).
      2. Multi-source legal name consistency across Bidder, GST, PAN, and Udyam records.
      3. Contradiction and discrepancy detection.
    """

    @classmethod
    def verify_gstin_pan(cls, gstin: Optional[str], pan: Optional[str]) -> Dict[str, Any]:
        if not gstin or not pan:
            return {
                "field": "GSTIN_PAN_CONSISTENCY",
                "status": "REVIEW_REQUIRED",
                "match": False,
                "details": "Cannot verify GSTIN-PAN alignment because one or both identifiers are missing",
            }

        clean_gstin = normalize_identifier(gstin)
        clean_pan = normalize_identifier(pan)

        if len(clean_gstin) == 15 and len(clean_pan) == 10:
            inner_pan = clean_gstin[2:12]
            if inner_pan == clean_pan:
                return {
                    "field": "GSTIN_PAN_CONSISTENCY",
                    "status": "MATCH",
                    "match": True,
                    "details": f"Embedded PAN '{inner_pan}' in GSTIN '{clean_gstin}' strictly matches declared PAN",
                }
            else:
                return {
                    "field": "GSTIN_PAN_CONSISTENCY",
                    "status": "MISMATCH",
                    "match": False,
                    "details": f"Embedded PAN '{inner_pan}' in GSTIN '{clean_gstin}' conflicts with declared PAN '{clean_pan}'",
                }

        return {
            "field": "GSTIN_PAN_CONSISTENCY",
            "status": "REVIEW_REQUIRED",
            "match": False,
            "details": "GSTIN or PAN length does not match standard statutory length",
        }

    @classmethod
    def verify_legal_names(
        cls,
        declared_name: Optional[str],
        gst_name: Optional[str] = None,
        pan_name: Optional[str] = None,
        udyam_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        sources: Dict[str, str] = {}
        if declared_name:
            sources["Declared Bidder"] = declared_name
        if gst_name:
            sources["GST Record"] = gst_name
        if pan_name:
            sources["PAN Record"] = pan_name
        if udyam_name:
            sources["Udyam Record"] = udyam_name

        if len(sources) < 2:
            return {
                "field": "LEGAL_NAME",
                "status": "MATCH" if sources else "REVIEW_REQUIRED",
                "match": True if sources else False,
                "details": "Single entity name provided; no conflicting cross-document sources",
                "normalized_names": {k: normalize_name(v) for k, v in sources.items()},
            }

        norm_map = {k: normalize_name(v) for k, v in sources.items()}
        unique_norms = set(norm_map.values())

        if len(unique_norms) == 1:
            return {
                "field": "LEGAL_NAME",
                "status": "MATCH",
                "match": True,
                "details": f"Entity name '{list(sources.values())[0]}' matches identically across all {len(sources)} sources",
                "normalized_names": norm_map,
            }

        # Contradiction detected
        discrepancies = [f"{src}: '{raw}'" for src, raw in sources.items()]
        return {
            "field": "LEGAL_NAME",
            "status": "MISMATCH",
            "match": False,
            "details": f"Conflicting entity legal names detected across documents: {'; '.join(discrepancies)}",
            "normalized_names": norm_map,
            "contradiction": True,
        }

    @classmethod
    def run_all_cross_checks(
        cls,
        bidder: Any,
        gst_result: Dict[str, Any],
        pan_result: Dict[str, Any],
        udyam_result: Dict[str, Any],
        evidence_fields: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []

        # 1. GSTIN status check
        gst_status = gst_result.get("status")
        results.append({
            "field": "GSTIN",
            "status": "MATCH" if gst_status == "VERIFIED" else "MISMATCH" if gst_status == "VERIFIED_FAIL" else gst_status,
            "details": gst_result.get("reason", "GST verification outcome"),
        })

        # 2. PAN status check
        pan_status = pan_result.get("status")
        results.append({
            "field": "PAN",
            "status": "MATCH" if pan_status == "VERIFIED" else "MISMATCH" if pan_status == "VERIFIED_FAIL" else pan_status,
            "details": pan_result.get("reason", "PAN verification outcome"),
        })

        # 3. GSTIN <-> PAN cross alignment
        gstin = getattr(bidder, "gstin", None) or gst_result.get("identifier")
        pan = getattr(bidder, "pan", None) or pan_result.get("identifier")
        gstin_pan_check = cls.verify_gstin_pan(gstin, pan)
        results.append({
            "field": "GSTIN_PAN_ALIGNMENT",
            "status": gstin_pan_check["status"],
            "details": gstin_pan_check["details"],
        })

        # 4. Multi-source legal name matching
        declared_name = getattr(bidder, "legal_name", None)
        gst_name = gst_result.get("legal_name")
        pan_name = pan_result.get("legal_name")
        udyam_name = udyam_result.get("legal_name")

        name_check = cls.verify_legal_names(
            declared_name=declared_name,
            gst_name=gst_name,
            pan_name=pan_name,
            udyam_name=udyam_name,
        )
        results.append({
            "field": "LEGAL_NAME",
            "status": name_check["status"],
            "details": name_check["details"],
        })

        return results
