"""
Document service for Cycle 7 bid-document management.

Handles upload, listing, detail retrieval, and deletion of bidder documents
attached to a specific bid.  Owns the authorization, validation, duplicate-
detection and storage orchestration logic.
"""

import uuid

from app.domain.document.schemas import DocumentType
from app.models.models import db, Bid, Document
from app.services.file_validator import validate_file, FileValidationError
from app.services.storage import get_storage_service, build_storage_key


class DocumentDomainError(Exception):
    """Domain-level error for document operations."""

    def __init__(self, message: str, code: str = "VALIDATION_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_bid_with_auth(bid_id: str, org_id: str) -> Bid:
    """Fetch a bid and verify it belongs to the caller's organization."""
    bid = Bid.query.filter_by(id=bid_id).first()
    if not bid:
        raise DocumentDomainError("Bid not found", "NOT_FOUND", 404)
    if not bid.tender or bid.tender.organization_id != org_id:
        raise DocumentDomainError("Access denied: bid belongs to another organization", "FORBIDDEN", 403)
    return bid


def _get_document_with_auth(document_id: str, org_id: str) -> Document:
    """Fetch a document and verify org ownership through the bid → tender chain."""
    document = Document.query.filter_by(id=document_id).first()
    if not document:
        raise DocumentDomainError("Document not found", "NOT_FOUND", 404)
    # For bid documents, verify through bid → tender → organization
    if document.bid_id:
        bid = Bid.query.filter_by(id=document.bid_id).first()
        if not bid or not bid.tender or bid.tender.organization_id != org_id:
            raise DocumentDomainError("Access denied: document belongs to another organization", "FORBIDDEN", 403)
    # For tender documents, verify directly through tender
    elif document.tender_id:
        from app.models.models import Tender
        tender = Tender.query.filter_by(id=document.tender_id).first()
        if not tender or tender.organization_id != org_id:
            raise DocumentDomainError("Access denied: document belongs to another organization", "FORBIDDEN", 403)
    else:
        raise DocumentDomainError("Document has no associated bid or tender", "VALIDATION_ERROR", 400)
    return document


def _validate_document_type(document_type: str) -> str:
    """Validate that document_type is a member of the DocumentType enum."""
    try:
        return DocumentType(document_type).value
    except ValueError:
        valid_types = ", ".join(t.value for t in DocumentType)
        raise DocumentDomainError(
            f"Invalid document type '{document_type}'. Must be one of: {valid_types}",
            "INVALID_DOCUMENT_TYPE",
            400,
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def upload_bid_document(
    bid_id: str,
    org_id: str,
    user_id: str,
    file_storage,
    document_type: str,
    description: str | None = None,
) -> dict:
    """Upload a document for a specific bid.

    Pipeline:
      1. Authorize bid ownership
      2. Validate document_type enum
      3. Validate file (extension, MIME, magic bytes, size)
      4. Check for duplicates (SHA-256 within same bid)
      5. Store file via StorageService
      6. Create DB metadata record
      7. Return document dict
    """
    # 1. Authorization
    bid = _get_bid_with_auth(bid_id, org_id)

    # 2. Document type validation
    validated_type = _validate_document_type(document_type)

    # 3. File validation (raises FileValidationError on failure)
    validated = validate_file(file_storage)

    # 4. Duplicate detection
    existing = Document.query.filter_by(bid_id=bid_id, sha256=validated.sha256).first()
    if existing:
        raise DocumentDomainError(
            "This document has already been uploaded for this bid.",
            "DOCUMENT_DUPLICATE",
            409,
        )

    # 5. Store file
    document_id = f"DOC-{uuid.uuid4().hex[:10].upper()}"
    storage_key = build_storage_key(
        org_id=bid.tender.organization_id,
        bid_id=bid_id,
        document_id=document_id,
    )
    storage = get_storage_service()
    storage.upload(storage_key, validated.content, validated.mime_type)

    # 6. Create DB record
    document = Document(
        id=document_id,
        bid_id=bid_id,
        document_type=validated_type,
        original_filename=validated.filename,
        storage_key=storage_key,
        mime_type=validated.mime_type,
        size_bytes=validated.size_bytes,
        sha256=validated.sha256,
        description=description,
        processing_status="UPLOADED",
        uploaded_by=user_id,
    )
    try:
        db.session.add(document)
        db.session.commit()
    except Exception:
        db.session.rollback()
        # Clean up the stored file on DB failure
        try:
            storage.delete(storage_key)
        except Exception:
            pass
        raise DocumentDomainError("Failed to save document metadata", "INTERNAL_ERROR", 500)

    return document.to_dict()


def list_bid_documents(bid_id: str, org_id: str) -> list[dict]:
    """List all documents belonging to a bid, after verifying authorization."""
    _get_bid_with_auth(bid_id, org_id)
    documents = (
        Document.query
        .filter_by(bid_id=bid_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [doc.to_dict() for doc in documents]


def get_document(document_id: str, org_id: str) -> dict:
    """Get a single document's metadata, after verifying authorization."""
    document = _get_document_with_auth(document_id, org_id)
    return document.to_dict()


def delete_document(document_id: str, org_id: str) -> dict:
    """Delete a document (file + metadata), after verifying authorization."""
    document = _get_document_with_auth(document_id, org_id)

    # Delete from object storage
    storage = get_storage_service()
    storage.delete(document.storage_key)

    # Delete from database
    try:
        db.session.delete(document)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise DocumentDomainError("Failed to delete document", "INTERNAL_ERROR", 500)

    return {"deleted": True, "id": document_id}
