import json
import logging
import os
import re
from typing import Any, Dict, Optional

from app.services.seed_service import get_mock_data_path

logger = logging.getLogger(__name__)

GSTIN_PATTERN = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$", re.I)
PAN_PATTERN = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$", re.I)
UDYAM_PATTERN = re.compile(r"^UDYAM[-/][A-Z]{2}[-/][0-9]{2}[-/][0-9]{7}$", re.I)


class GSTAdapter:
    """
    Mock adapter for Goods and Services Tax Network (GSTN) verification.
    Reads from mock-data/gst.json with realistic fallback semantics.
    Rule: External API lookup failures/missing data degrade to UNABLE_TO_VERIFY / REVIEW_REQUIRED,
    NEVER to an automatic FAIL.
    """

    @classmethod
    def verify(cls, gstin: Optional[str]) -> Dict[str, Any]:
        if not gstin or not str(gstin).strip():
            return {
                "source": "GSTN_ADAPTER",
                "status": "REVIEW_REQUIRED",
                "identifier": gstin,
                "match_result": False,
                "reason": "GSTIN identifier is missing or empty",
                "legal_name": None,
                "snapshot": None,
            }

        clean_gstin = re.sub(r"[^A-Za-z0-9]", "", str(gstin)).upper()

        if not GSTIN_PATTERN.match(clean_gstin):
            return {
                "source": "GSTN_ADAPTER",
                "status": "UNABLE_TO_VERIFY",
                "identifier": clean_gstin,
                "match_result": False,
                "reason": f"GSTIN '{clean_gstin}' does not conform to the statutory 15-character format",
                "legal_name": None,
                "snapshot": None,
            }

        try:
            gst_file = get_mock_data_path("gst.json")
            if os.path.exists(gst_file):
                with open(gst_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for record in data.get("records", []):
                        if record.get("identifier", "").upper() == clean_gstin:
                            rec_status = record.get("status", "ACTIVE").upper()
                            if rec_status == "ACTIVE":
                                return {
                                    "source": "GSTN_ADAPTER",
                                    "status": "VERIFIED",
                                    "identifier": clean_gstin,
                                    "match_result": True,
                                    "reason": f"GSTIN active in jurisdiction {record.get('state_jurisdiction', 'India')}",
                                    "legal_name": record.get("legal_name"),
                                    "trade_name": record.get("trade_name"),
                                    "registration_date": record.get("registration_date"),
                                    "taxpayer_type": record.get("taxpayer_type"),
                                    "snapshot": record,
                                }
                            else:
                                return {
                                    "source": "GSTN_ADAPTER",
                                    "status": "VERIFIED_FAIL",
                                    "identifier": clean_gstin,
                                    "match_result": False,
                                    "reason": f"GST registration is {rec_status} as of {record.get('cancellation_date', 'recent')}",
                                    "legal_name": record.get("legal_name"),
                                    "snapshot": record,
                                }
        except Exception as exc:
            logger.warning("GSTAdapter read error: %s", exc)

        # External lookup missing/failure degrades to UNABLE_TO_VERIFY, never FAIL
        return {
            "source": "GSTN_ADAPTER",
            "status": "UNABLE_TO_VERIFY",
            "identifier": clean_gstin,
            "match_result": False,
            "reason": f"GSTIN '{clean_gstin}' was not found in the GSTN verification sandbox",
            "legal_name": None,
            "snapshot": None,
        }


class PANAdapter:
    """
    Mock adapter for Income Tax Department PAN Verification Service.
    Reads from mock-data/pan.json.
    """

    @classmethod
    def verify(cls, pan: Optional[str]) -> Dict[str, Any]:
        if not pan or not str(pan).strip():
            return {
                "source": "INCOME_TAX_PAN_ADAPTER",
                "status": "REVIEW_REQUIRED",
                "identifier": pan,
                "match_result": False,
                "reason": "PAN identifier is missing or empty",
                "legal_name": None,
                "snapshot": None,
            }

        clean_pan = re.sub(r"[^A-Za-z0-9]", "", str(pan)).upper()

        if not PAN_PATTERN.match(clean_pan):
            return {
                "source": "INCOME_TAX_PAN_ADAPTER",
                "status": "UNABLE_TO_VERIFY",
                "identifier": clean_pan,
                "match_result": False,
                "reason": f"PAN '{clean_pan}' does not conform to the statutory 10-character format",
                "legal_name": None,
                "snapshot": None,
            }

        try:
            pan_file = get_mock_data_path("pan.json")
            if os.path.exists(pan_file):
                with open(pan_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for record in data.get("records", []):
                        if record.get("identifier", "").upper() == clean_pan:
                            rec_status = record.get("status", "VALID").upper()
                            if rec_status == "VALID":
                                return {
                                    "source": "INCOME_TAX_PAN_ADAPTER",
                                    "status": "VERIFIED",
                                    "identifier": clean_pan,
                                    "match_result": True,
                                    "reason": f"PAN is operative and registered under category {record.get('category', 'ENTITY')}",
                                    "legal_name": record.get("legal_name"),
                                    "pan_status": record.get("pan_status", "OPERATIVE"),
                                    "snapshot": record,
                                }
                            else:
                                return {
                                    "source": "INCOME_TAX_PAN_ADAPTER",
                                    "status": "VERIFIED_FAIL",
                                    "identifier": clean_pan,
                                    "match_result": False,
                                    "reason": f"PAN status is {rec_status}",
                                    "legal_name": record.get("legal_name"),
                                    "snapshot": record,
                                }
        except Exception as exc:
            logger.warning("PANAdapter read error: %s", exc)

        return {
            "source": "INCOME_TAX_PAN_ADAPTER",
            "status": "UNABLE_TO_VERIFY",
            "identifier": clean_pan,
            "match_result": False,
            "reason": f"PAN '{clean_pan}' was not found in Income Tax sandbox registry",
            "legal_name": None,
            "snapshot": None,
        }


class UdyamAdapter:
    """
    Mock adapter for Ministry of MSME Udyam Registration Portal.
    Reads from mock-data/udyam.json.
    """

    @classmethod
    def verify(cls, udyam: Optional[str]) -> Dict[str, Any]:
        if not udyam or not str(udyam).strip():
            return {
                "source": "UDYAM_MSME_ADAPTER",
                "status": "NOT_APPLICABLE",
                "identifier": udyam,
                "match_result": False,
                "reason": "No Udyam number provided",
                "legal_name": None,
                "snapshot": None,
            }

        clean_udyam = str(udyam).strip().upper()

        try:
            udyam_file = get_mock_data_path("udyam.json")
            if os.path.exists(udyam_file):
                with open(udyam_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for record in data.get("records", []):
                        if record.get("identifier", "").upper() == clean_udyam:
                            rec_status = record.get("status", "ACTIVE").upper()
                            if rec_status == "ACTIVE":
                                return {
                                    "source": "UDYAM_MSME_ADAPTER",
                                    "status": "VERIFIED",
                                    "identifier": clean_udyam,
                                    "match_result": True,
                                    "reason": f"Active {record.get('enterprise_type', 'MSME')} enterprise in {record.get('state', 'India')}",
                                    "legal_name": record.get("legal_name"),
                                    "enterprise_type": record.get("enterprise_type"),
                                    "registration_date": record.get("registration_date"),
                                    "snapshot": record,
                                }
                            else:
                                return {
                                    "source": "UDYAM_MSME_ADAPTER",
                                    "status": "VERIFIED_FAIL",
                                    "identifier": clean_udyam,
                                    "match_result": False,
                                    "reason": f"Udyam registration is {rec_status}",
                                    "legal_name": record.get("legal_name"),
                                    "snapshot": record,
                                }
        except Exception as exc:
            logger.warning("UdyamAdapter read error: %s", exc)

        return {
            "source": "UDYAM_MSME_ADAPTER",
            "status": "UNABLE_TO_VERIFY",
            "identifier": clean_udyam,
            "match_result": False,
            "reason": f"Udyam number '{clean_udyam}' was not found in MSME sandbox registry",
            "legal_name": None,
            "snapshot": None,
        }
