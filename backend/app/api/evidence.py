from flask import Blueprint, g
from app.security.decorators import jwt_required
from app.services.document_service import DocumentDomainError
from app.services.evidence_service import extract_document_evidence, list_bid_evidence, get_evidence
from app.utils.response import success_response, error_response

evidence_bp = Blueprint("evidence", __name__)

@evidence_bp.post("/documents/<string:document_id>/extract")
@jwt_required
def extract(document_id):
    try:
        return success_response(extract_document_evidence(document_id, g.current_org_id), 200)
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)

@evidence_bp.get("/bids/<string:bid_id>/evidence")
@jwt_required
def bid_evidence(bid_id):
    try:
        return success_response({"bid_id": bid_id, "evidence": list_bid_evidence(bid_id, g.current_org_id)})
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)

@evidence_bp.get("/evidence/<string:evidence_id>")
@jwt_required
def evidence_detail(evidence_id):
    try:
        return success_response(get_evidence(evidence_id, g.current_org_id))
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
