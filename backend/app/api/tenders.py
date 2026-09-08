from flask import Blueprint, request, g
from app.utils.response import success_response, error_response
from app.security.decorators import jwt_required, roles_required
from app.services.tender_service import (
    create_tender as service_create_tender,
    list_tenders_for_org,
    get_tender_by_id_and_org,
    TenderValidationError,
    TenderNotFoundError,
    TenderAccessDeniedError,
)

tenders_bp = Blueprint("tenders", __name__)

@tenders_bp.route("/tenders", methods=["POST"])
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def create_tender():
    """Create a new tender record for the authenticated organization."""
    data = request.get_json()
    if not data:
        return error_response("VALIDATION_ERROR", "Request body must be valid JSON", 400)

    try:
        tender_data = service_create_tender(g.current_org_id, data)
        return success_response(tender_data, 201)
    except TenderValidationError as e:
        return error_response(e.code, e.message, e.status_code)
    except Exception as e:
        return error_response("INTERNAL_ERROR", f"Failed to create tender: {str(e)}", 500)


@tenders_bp.route("/tenders", methods=["GET"])
@jwt_required
def get_tenders():
    """List all tenders belonging to the caller's organization."""
    try:
        tenders = list_tenders_for_org(g.current_org_id)
        return success_response(tenders, 200)
    except Exception as e:
        return error_response("INTERNAL_ERROR", f"Failed to retrieve tenders: {str(e)}", 500)


@tenders_bp.route("/tenders/<string:tender_id>", methods=["GET"])
@jwt_required
def get_tender_detail(tender_id):
    """Retrieve full details of a specific tender with tenant authorization check."""
    try:
        tender = get_tender_by_id_and_org(tender_id, g.current_org_id)
        return success_response(tender, 200)
    except TenderNotFoundError as e:
        return error_response(e.code, e.message, e.status_code)
    except TenderAccessDeniedError as e:
        return error_response(e.code, e.message, e.status_code)
    except Exception as e:
        return error_response("INTERNAL_ERROR", f"Failed to retrieve tender detail: {str(e)}", 500)
