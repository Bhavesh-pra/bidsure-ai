from flask import Blueprint, g, request

from app.security.decorators import jwt_required, roles_required
from app.services.decision_service import (
    DecisionServiceError,
    get_bid_audit_trail,
    get_officer_decision,
    record_officer_decision,
)
from app.utils.response import error_response, success_response

decision_bp = Blueprint("decision", __name__)


@decision_bp.post("/bids/<string:bid_id>/decision")
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def submit_decision(bid_id: str):
    """
    Records human Procurement Officer's decision on a bid.
    Accepts:
      - decision: "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION" (or QUALIFIED/DISQUALIFIED/CLARIFICATION_REQUIRED)
      - remarks: optional justification notes
      - conditions: optional conditions list
    """
    payload = request.get_json(silent=True) or {}
    try:
        result = record_officer_decision(
            bid_id=bid_id,
            user_id=g.current_user.get("id"),
            org_id=g.current_org_id,
            payload=payload,
        )
        return success_response(result, 201)
    except DecisionServiceError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
    except Exception as exc:
        return error_response("INTERNAL_ERROR", f"Failed to record officer decision: {str(exc)}", 500)


@decision_bp.get("/bids/<string:bid_id>/decision")
@jwt_required
def get_decision(bid_id: str):
    """
    Retrieves the latest recorded officer decision for a bid.
    """
    try:
        decision = get_officer_decision(bid_id=bid_id, org_id=g.current_org_id)
        return success_response({"bid_id": bid_id, "decision": decision}, 200)
    except DecisionServiceError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
    except Exception as exc:
        return error_response("INTERNAL_ERROR", f"Failed to retrieve decision: {str(exc)}", 500)


@decision_bp.get("/bids/<string:bid_id>/audit")
@jwt_required
def get_audit(bid_id: str):
    """
    Retrieves immutable audit event history for a bid.
    """
    try:
        events = get_bid_audit_trail(bid_id=bid_id, org_id=g.current_org_id)
        return success_response({"bid_id": bid_id, "audit_events": events}, 200)
    except DecisionServiceError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
    except Exception as exc:
        return error_response("INTERNAL_ERROR", f"Failed to retrieve audit trail: {str(exc)}", 500)
