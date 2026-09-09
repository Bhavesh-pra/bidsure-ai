from flask import Blueprint, g

from app.security.decorators import jwt_required
from app.services.verification_service import (
    VerificationPipelineError,
    get_cached_verification,
    verify_bid,
)
from app.utils.response import error_response, success_response

verification_bp = Blueprint("verification", __name__)


@verification_bp.post("/bids/<string:bid_id>/verify")
@jwt_required
def run_bid_verification(bid_id: str):
    """
    Triggers and returns the complete BidSure AI verification pipeline for a bid.
    Evaluates:
      - OCR and document extractions
      - Mock government registry checks (GSTN, PAN, Udyam)
      - Cross-document identity & contradiction verification
      - Deterministic compliance rules
      - Deterministic compliance score, risk level, and AI recommendation
    """
    try:
        result = verify_bid(bid_id, g.current_org_id)
        return success_response(result, 200)
    except VerificationPipelineError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
    except Exception as exc:
        return error_response("INTERNAL_ERROR", f"Verification pipeline encountered an error: {str(exc)}", 500)


@verification_bp.get("/bids/<string:bid_id>/verification")
@jwt_required
def get_bid_verification_detail(bid_id: str):
    """
    Retrieves the latest verification result for a bid.
    """
    try:
        result = get_cached_verification(bid_id, g.current_org_id)
        return success_response(result, 200)
    except VerificationPipelineError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
    except Exception as exc:
        return error_response("INTERNAL_ERROR", f"Failed to retrieve verification: {str(exc)}", 500)
