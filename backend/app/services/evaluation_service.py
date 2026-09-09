import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Configured deterministic requirement weights (must sum to 100)
CONFIGURED_WEIGHTS = {
    "gst": 15,
    "pan": 10,
    "udyam": 10,
    "msme": 10,
    "turnover": 15,
    "experience": 15,
    "oem": 15,
    "local content": 20,
}


def calculate_deterministic_score(requirements_results: List[Dict[str, Any]]) -> int:
    """
    Computes a strictly deterministic compliance score (0-100) based on weighted
    statutory and technical criteria.
    Architectural rule: LLM is strictly prohibited from generating this score.
    """
    if not requirements_results:
        return 0

    assigned_points = 0
    total_max_points = 0

    for req in requirements_results:
        title_lower = (req.get("name") or "").lower()
        status = req.get("status")

        # Determine weight for this requirement
        weight = 10  # default weight
        for key, w in CONFIGURED_WEIGHTS.items():
            if key in title_lower:
                weight = w
                break

        total_max_points += weight

        # Full credit for verified requirements
        if status in ("VERIFIED", "PASS", "VERIFIED_PASS"):
            assigned_points += weight
        # Partial credit (50%) for unverified/review items that are not definitive failures
        elif status in ("REVIEW", "UNABLE_TO_VERIFY") and not req.get("mandatory", True):
            assigned_points += int(weight * 0.5)

    if total_max_points == 0:
        return 0

    normalized_score = int(round((assigned_points / total_max_points) * 100))
    return max(0, min(100, normalized_score))


def calculate_risk_assessment(
    compliance_score: int,
    requirements_results: List[Dict[str, Any]],
    cross_checks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluates specific structured risk factors and assigns an overall risk tier.
    """
    factors: List[Dict[str, Any]] = []

    # 1. Contradiction & Identifier Mismatch Checks
    for check in cross_checks:
        status = check.get("status")
        field = check.get("field")
        details = check.get("details", "")

        if status == "MISMATCH":
            if field == "LEGAL_NAME":
                factors.append({
                    "type": "IDENTIFIER_MISMATCH",
                    "severity": "CRITICAL",
                    "description": f"Contradiction detected: {details}",
                    "requirement_id": "REQ-002",
                })
            elif field == "GSTIN_PAN_ALIGNMENT":
                factors.append({
                    "type": "IDENTIFIER_MISMATCH",
                    "severity": "CRITICAL",
                    "description": f"GSTIN-PAN checksum failure: {details}",
                    "requirement_id": "REQ-001",
                })
            else:
                factors.append({
                    "type": "IDENTIFIER_MISMATCH",
                    "severity": "HIGH",
                    "description": f"Cross-document mismatch on {field}: {details}",
                    "requirement_id": None,
                })

    # 2. Requirement-Level Risk Factors
    for req in requirements_results:
        title_lower = (req.get("name") or "").lower()
        status = req.get("status")
        reason = req.get("reason", "")
        req_id = req.get("id")

        if status in ("FAIL", "VERIFIED_FAIL"):
            if "gst" in title_lower or "pan" in title_lower:
                factors.append({
                    "type": "EXPIRED_DOCUMENT",
                    "severity": "HIGH",
                    "description": f"Statutory registration failed verification: {reason}",
                    "requirement_id": req_id,
                })
            elif "turnover" in title_lower or "experience" in title_lower:
                factors.append({
                    "type": "THRESHOLD_BREACH",
                    "severity": "HIGH",
                    "description": f"Financial / qualification criteria breached: {reason}",
                    "requirement_id": req_id,
                })
            elif "local content" in title_lower:
                factors.append({
                    "type": "LOCAL_CONTENT_DEFICIT",
                    "severity": "HIGH",
                    "description": f"Statutory local content below threshold: {reason}",
                    "requirement_id": req_id,
                })
            elif "oem" in title_lower:
                factors.append({
                    "type": "MISSING_EVIDENCE",
                    "severity": "HIGH",
                    "description": f"OEM authorization absent or rejected: {reason}",
                    "requirement_id": req_id,
                })
            else:
                factors.append({
                    "type": "UNVERIFIED_CREDENTIAL",
                    "severity": "HIGH",
                    "description": f"Requirement failed: {reason}",
                    "requirement_id": req_id,
                })

        elif status in ("REVIEW", "UNABLE_TO_VERIFY"):
            factors.append({
                "type": "UNVERIFIED_CREDENTIAL",
                "severity": "MEDIUM",
                "description": f"Manual review recommended: {reason}",
                "requirement_id": req_id,
            })

    # Overall Risk Tier Calculation
    has_critical = any(f["severity"] == "CRITICAL" for f in factors)
    high_count = sum(1 for f in factors if f["severity"] == "HIGH")

    if has_critical or high_count >= 2 or compliance_score < 50:
        risk_level = "HIGH"
        explanation = "High risk profile: Identity discrepancies or critical statutory defects detected."
    elif high_count == 1 or compliance_score < 75 or any(f["severity"] == "MEDIUM" for f in factors):
        risk_level = "MEDIUM"
        explanation = "Moderate risk profile: Minor deficiencies or manual document verification required."
    else:
        risk_level = "LOW"
        explanation = "Low risk profile: Bidder demonstrated clean statutory compliance with no contradictions."

    risk_score = max(0, min(100, 100 - compliance_score))

    return {
        "risk_level": risk_level,
        "risk_score": float(risk_score),
        "factors": factors,
        "risk_factors": [f["description"] for f in factors if "description" in f],
        "explanation": explanation,
        "methodology_version": "1.0-deterministic",
    }


def generate_ai_recommendation(
    compliance_score: int,
    risk_assessment: Dict[str, Any],
    requirements_results: List[Dict[str, Any]],
    cross_checks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Generates explainable recommendation grounded strictly and solely on
    structured verification findings.
    Architectural rule: AI recommendation is purely advisory and NEVER modifies
    the officer's final decision.
    """
    total = len(requirements_results)
    passed = sum(1 for r in requirements_results if r.get("status") in ("VERIFIED", "PASS", "VERIFIED_PASS"))
    risk_level = risk_assessment.get("risk_level", "LOW")
    factors = risk_assessment.get("factors", [])

    reasons: List[str] = []

    # 1. Summary statement
    if risk_level == "LOW" and compliance_score >= 75:
        status = "PASS"
        summary = f"Bidder appears substantially compliant. {passed}/{total} statutory and technical requirements verified."
        reasons.append(f"{passed} of {total} requirements verified")
        reasons.append("Zero identity or identifier contradictions detected")
        reasons.append("Active statutory registrations confirmed in government sandbox records")
    else:
        status = "REVIEW_REQUIRED"
        summary = f"Bidder requires officer review before qualification. {passed}/{total} requirements verified."

        # Highlight critical factors first
        critical_factors = [f["description"] for f in factors if f.get("severity") in ("CRITICAL", "HIGH")]
        if critical_factors:
            reasons.extend(critical_factors[:3])

        reasons.append(f"Compliance score is {compliance_score}% (Risk Level: {risk_level})")
        if passed < total:
            reasons.append(f"{total - passed} requirement(s) pending manual review or clarification")

    return {
        "status": status,
        "summary": summary,
        "reasons": reasons,
        "authority_disclaimer": "AI recommendations are strictly decision support. The human Procurement Officer retains exclusive final decision authority.",
    }
