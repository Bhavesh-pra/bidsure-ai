"""
Bid-document API routes — Cycle 7.

Separate blueprint from the existing tender-document routes so the two
concerns (tender docs with LLM extraction vs. bid docs for storage only)
never interfere with each other.
"""

from flask import Blueprint, g, request

from app.security.decorators import jwt_required, roles_required
from app.services.document_service import (
    DocumentDomainError,
    delete_document,
    get_document,
    list_bid_documents,
    upload_bid_document,
)
from app.services.file_validator import FileValidationError
from app.utils.response import error_response, success_response

bid_documents_bp = Blueprint("bid_documents", __name__)


@bid_documents_bp.post("/bids/<string:bid_id>/documents")
@bid_documents_bp.post("/tenders/<string:tender_id>/bids/<string:bid_id>/documents")
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def upload_document(bid_id, tender_id=None):
    """Upload a bidder document against a specific bid."""
    file = request.files.get("file")
    document_type = request.form.get("document_type", "").strip()
    description = request.form.get("description", "").strip() or None

    if not document_type:
        return error_response("VALIDATION_ERROR", "document_type is required", 400)

    try:
        result = upload_bid_document(
            bid_id=bid_id,
            org_id=g.current_org_id,
            user_id=g.current_user.get("id"),
            file_storage=file,
            document_type=document_type,
            description=description,
        )
        return success_response(result, 201)
    except FileValidationError as exc:
        return error_response(exc.code, exc.message, 400)
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)


@bid_documents_bp.get("/bids/<string:bid_id>/documents")
@bid_documents_bp.get("/tenders/<string:tender_id>/bids/<string:bid_id>/documents")
@jwt_required
def list_documents(bid_id, tender_id=None):
    """List all documents for a bid."""
    try:
        documents = list_bid_documents(bid_id, g.current_org_id)
        return success_response(documents)
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)


@bid_documents_bp.get("/documents/<string:document_id>")
@jwt_required
def document_detail(document_id):
    """Get a single document's metadata."""
    try:
        result = get_document(document_id, g.current_org_id)
        return success_response(result)
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)


@bid_documents_bp.delete("/documents/<string:document_id>")
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def remove_document(document_id):
    """Delete a document (file + metadata)."""
    try:
        result = delete_document(document_id, g.current_org_id)
        return success_response(result)
    except DocumentDomainError as exc:
        return error_response(exc.code, exc.message, exc.status_code)
