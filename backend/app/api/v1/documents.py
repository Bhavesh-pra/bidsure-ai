import io
from flask import Blueprint, request, send_file, Response, g
from app.utils.response import api_success, api_error
from app.services.document_service import (
    DocumentService,
    DocumentDuplicateError,
    BidNotFoundError,
    DocumentNotFoundError,
    UnauthorizedDocumentAccessError
)
from app.domain.document import (
    InvalidFileTypeError,
    FileTooLargeError,
    CorruptFileError,
    DocumentValidationError
)

documents_bp = Blueprint("documents", __name__)
document_service = DocumentService()

def _get_org_id():
    """Extract authenticated organization ID from headers or request context."""
    return request.headers.get("X-Organization-ID") or getattr(g, "org_id", None)

def _get_user_id():
    """Extract authenticated user ID from headers or request context."""
    return request.headers.get("X-User-ID") or getattr(g, "user_id", "USR-DEV-001")

@documents_bp.route("/bids/<string:bid_id>/documents", methods=["POST"])
def upload_document(bid_id: str):
    """
    POST /api/v1/bids/<bid_id>/documents
    Upload a bidder document against a specific Bid.
    Expects multipart/form-data with fields: file, document_type.
    """
    file_obj = request.files.get("file")
    document_type = request.form.get("document_type") or request.args.get("document_type")

    if not file_obj:
        return api_error(
            code="INVALID_FILE_TYPE",
            message="No file uploaded in 'file' multipart field.",
            status_code=400
        )

    if not document_type:
        return api_error(
            code="INVALID_DOCUMENT_TYPE",
            message="Missing required 'document_type' field.",
            status_code=400
        )

    org_id = _get_org_id()
    user_id = _get_user_id()

    try:
        doc_data = document_service.upload_document(
            bid_id=bid_id,
            file_obj=file_obj,
            document_type_str=document_type,
            user_id=user_id,
            org_id=org_id
        )
        return api_success(doc_data, status_code=201)

    except BidNotFoundError as e:
        return api_error(code=e.code, message=e.message, status_code=404)

    except UnauthorizedDocumentAccessError as e:
        return api_error(code=e.code, message=e.message, status_code=403)

    except DocumentDuplicateError as e:
        return api_error(code=e.code, message=e.message, status_code=409)

    except InvalidFileTypeError as e:
        return api_error(code=e.code, message=e.message, status_code=400)

    except FileTooLargeError as e:
        return api_error(code=e.code, message=e.message, status_code=400)

    except CorruptFileError as e:
        return api_error(code=e.code, message=e.message, status_code=400)

    except DocumentValidationError as e:
        return api_error(code=e.code, message=e.message, status_code=400)

    except Exception as e:
        return api_error(code="INTERNAL_ERROR", message=str(e), status_code=500)

@documents_bp.route("/bids/<string:bid_id>/documents", methods=["GET"])
def list_bid_documents(bid_id: str):
    """
    GET /api/v1/bids/<bid_id>/documents
    List all uploaded document metadata for a bid.
    """
    org_id = _get_org_id()
    try:
        docs = document_service.list_documents_for_bid(bid_id, org_id=org_id)
        return api_success(docs)
    except BidNotFoundError as e:
        return api_error(code=e.code, message=e.message, status_code=404)
    except UnauthorizedDocumentAccessError as e:
        return api_error(code=e.code, message=e.message, status_code=403)
    except Exception as e:
        return api_error(code="INTERNAL_ERROR", message=str(e), status_code=500)

@documents_bp.route("/documents/<string:document_id>", methods=["GET"])
def get_document_details(document_id: str):
    """
    GET /api/v1/documents/<document_id>
    Retrieve metadata details for a specific document ID.
    """
    org_id = _get_org_id()
    try:
        doc = document_service.get_document_details(document_id, org_id=org_id)
        return api_success(doc)
    except DocumentNotFoundError as e:
        return api_error(code=e.code, message=e.message, status_code=404)
    except UnauthorizedDocumentAccessError as e:
        return api_error(code=e.code, message=e.message, status_code=403)
    except Exception as e:
        return api_error(code="INTERNAL_ERROR", message=str(e), status_code=500)

@documents_bp.route("/documents/<string:document_id>/file", methods=["GET"])
def get_document_file(document_id: str):
    """
    GET /api/v1/documents/<document_id>/file
    Secure route serving binary document content.
    """
    org_id = _get_org_id()
    try:
        file_bytes, mime_type, filename = document_service.get_document_file_content(document_id, org_id=org_id)
        return send_file(
            io.BytesIO(file_bytes),
            mimetype=mime_type,
            as_attachment=False,
            download_name=filename
        )
    except DocumentNotFoundError as e:
        return api_error(code=e.code, message=e.message, status_code=404)
    except UnauthorizedDocumentAccessError as e:
        return api_error(code=e.code, message=e.message, status_code=403)
    except Exception as e:
        return api_error(code="INTERNAL_ERROR", message=str(e), status_code=500)
