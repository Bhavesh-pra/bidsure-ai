import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.models.models import AuditEvent, Bid, OfficerDecision, db
from app.services.verification_service import get_cached_verification

VALID_DECISION_MAPPING = {
    "QUALIFIED": ("QUALIFIED", "APPROVE", "QUALIFIED"),
    "APPROVE": ("QUALIFIED", "APPROVE", "QUALIFIED"),
    "APPROVED": ("QUALIFIED", "APPROVE", "QUALIFIED"),
    "DISQUALIFIED": ("DISQUALIFIED", "REJECT", "DISQUALIFIED"),
    "REJECT": ("DISQUALIFIED", "REJECT", "DISQUALIFIED"),
    "REJECTED": ("DISQUALIFIED", "REJECT", "DISQUALIFIED"),
    "CLARIFICATION_REQUIRED": ("CLARIFICATION_REQUIRED", "REQUEST_CLARIFICATION", "CLARIFICATION_REQUESTED"),
    "REQUEST_CLARIFICATION": ("CLARIFICATION_REQUIRED", "REQUEST_CLARIFICATION", "CLARIFICATION_REQUESTED"),
    "CLARIFICATION_REQUESTED": ("CLARIFICATION_REQUIRED", "REQUEST_CLARIFICATION", "CLARIFICATION_REQUESTED"),
}


class DecisionServiceError(Exception):
    def __init__(self, message: str, code: str = "DECISION_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _get_bid_with_auth(bid_id: str, org_id: str) -> Bid:
    bid = Bid.query.filter_by(id=bid_id).first()
    if not bid:
        raise DecisionServiceError("Bid not found", "NOT_FOUND", 404)
    if not bid.tender or bid.tender.organization_id != org_id:
        raise DecisionServiceError("Access denied to bid", "FORBIDDEN", 403)
    return bid


def record_officer_decision(
    bid_id: str,
    user_id: str,
    org_id: str,
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Validates and records a human Procurement Officer's decision on a bid.
    Guarantees:
      - Validates allowed decision types (QUALIFIED/APPROVE, DISQUALIFIED/REJECT, CLARIFICATION_REQUIRED).
      - Updates Bid status.
      - Persists decision snapshot.
      - Automatically emits an immutable AuditEvent.
      - Human authority retains final decision; AI recommendation cannot override it.
    """
    bid = _get_bid_with_auth(bid_id, org_id)

    raw_decision = str(payload.get("decision", "")).strip().upper()
    if not raw_decision or raw_decision not in VALID_DECISION_MAPPING:
        raise DecisionServiceError(
            f"Invalid decision '{raw_decision}'. Allowed decisions: QUALIFIED / APPROVE, DISQUALIFIED / REJECT, CLARIFICATION_REQUIRED / REQUEST_CLARIFICATION",
            "INVALID_DECISION",
            400,
        )

    canonical_decision, action_name, new_bid_status = VALID_DECISION_MAPPING[raw_decision]
    remarks = payload.get("remarks", "").strip()
    conditions = payload.get("conditions", [])

    # Fetch verification snapshot context
    verification_snapshot = get_cached_verification(bid.id, org_id)
    score_at_decision = verification_snapshot.get("compliance_score")
    risk_at_decision = verification_snapshot.get("risk_level")
    rec_at_decision = verification_snapshot.get("recommendation", {}).get("status")

    previous_status = bid.status
    bid.status = new_bid_status

    # 1. Persist OfficerDecision record
    decision_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"
    decision_row = OfficerDecision(
        id=decision_id,
        bid_id=bid.id,
        officer_id=user_id,
        decision=canonical_decision,
        action=action_name,
        remarks=remarks,
        conditions=conditions,
        compliance_score_at_decision=score_at_decision,
        risk_level_at_decision=risk_at_decision,
        recommendation_at_decision=rec_at_decision,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(decision_row)

    # 2. Emit immutable AuditEvent
    audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
    audit_row = AuditEvent(
        id=audit_id,
        entity_type="BID",
        entity_id=bid.id,
        bid_id=bid.id,
        user_id=user_id,
        action=f"OFFICER_DECISION_{canonical_decision}",
        previous_state={"status": previous_status},
        new_state={
            "status": new_bid_status,
            "decision": canonical_decision,
            "action": action_name,
        },
        metadata_payload={
            "decision_id": decision_id,
            "remarks": remarks,
            "conditions": conditions,
            "compliance_score": score_at_decision,
            "risk_level": risk_at_decision,
            "ai_recommendation": rec_at_decision,
        },
        timestamp=datetime.now(timezone.utc),
    )
    db.session.add(audit_row)

    db.session.commit()

    return {
        "decision": decision_row.to_dict(),
        "bid": {
            "id": bid.id,
            "status": bid.status,
            "bidder_name": bid.bidder.legal_name if bid.bidder else None,
        },
        "audit_event": audit_row.to_dict(),
    }


def get_officer_decision(bid_id: str, org_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves the latest decision recorded for the bid."""
    bid = _get_bid_with_auth(bid_id, org_id)
    latest_decision = (
        OfficerDecision.query.filter_by(bid_id=bid.id)
        .order_by(OfficerDecision.created_at.desc())
        .first()
    )
    return latest_decision.to_dict() if latest_decision else None


def get_bid_audit_trail(bid_id: str, org_id: str) -> List[Dict[str, Any]]:
    """Retrieves chronological audit events for a bid."""
    bid = _get_bid_with_auth(bid_id, org_id)
    events = (
        AuditEvent.query.filter_by(bid_id=bid.id)
        .order_by(AuditEvent.timestamp.desc())
        .all()
    )
    return [ev.to_dict() for ev in events]
