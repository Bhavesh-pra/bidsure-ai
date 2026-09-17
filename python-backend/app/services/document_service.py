"""
Document service for Cycle 7 bid-document management.

Handles upload, listing, detail retrieval, and deletion of bidder documents
attached to a specific bid.  Owns the authorization, validation, duplicate-
detection and storage orchestration logic.
"""

import uuid

from app.domain.document.schemas import DocumentType
from app.models.models import db, Bid, Document, DocumentPage
from app.services.file_validator import validate_file, FileValidationError
from app.services.storage import get_storage_service, build_storage_key
from app.services.ocr import OCRService
from app.services.classification import DocumentClassifier, ClassifierConfig, get_classifier


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


def process_document_pipeline(document_id: str, org_id: str) -> dict:
    """
    Triggers the Cycle 8 OCR pipeline for a document, persists extracted pages,
    and updates document lifecycle state.
    """
    document = _get_document_with_auth(document_id, org_id)

    # Guard against overlapping concurrent processing
    if document.processing_status == "PROCESSING":
        return {
            "document_id": document.id,
            "processing_status": "PROCESSING",
            "message": "Document is already being processed",
        }

    # Set state to PROCESSING
    document.processing_status = "PROCESSING"
    db.session.commit()

    storage = get_storage_service()
    file_path = storage.get_url(document.storage_key)

    ocr_service = OCRService()
    result = ocr_service.process_document(
        document_id=document.id,
        file_path=file_path,
        bid_id=document.bid_id,
        document_type=document.document_type,
    )

    try:
        # Clean up previously processed pages for idempotency
        DocumentPage.query.filter_by(document_id=document.id).delete()

        for page in result.pages:
            doc_page = DocumentPage(
                document_id=document.id,
                page_number=page.page_number,
                raw_text=page.text,
                ocr_confidence=page.confidence,
                word_count=page.word_count,
                char_count=page.char_count,
                extraction_method=page.extraction_method,
                processing_metadata=page.metadata,
            )
            db.session.add(doc_page)

        document.page_count = result.page_count
        document.processing_status = result.processing_status
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        document.processing_status = "PROCESSING_FAILED"
        db.session.commit()
        raise DocumentDomainError(f"Failed to persist OCR results: {str(exc)}", "PERSISTENCE_ERROR", 500)

    return {
        "document_id": document.id,
        "processing_status": document.processing_status,
        "page_count": document.page_count,
        "ocr_engine": result.ocr_engine,
        "average_confidence": result.average_confidence,
        "error_code": result.error_code,
        "error_message": result.error_message,
    }


def get_document_pages(document_id: str, org_id: str) -> dict:
    """
    Retrieves the ordered page-aware raw text and confidence scores for a document.
    """
    document = _get_document_with_auth(document_id, org_id)
    pages = (
        DocumentPage.query
        .filter_by(document_id=document_id)
        .order_by(DocumentPage.page_number.asc())
        .all()
    )
    return {
        "document_id": document.id,
        "filename": document.original_filename,
        "processing_status": document.processing_status,
        "page_count": document.page_count or len(pages),
        "pages": [p.to_dict() for p in pages],
    }


def classify_document_pipeline(
    document_id: str,
    org_id: str,
    force_ocr: bool = False,
    confidence_threshold: float | None = None,
) -> dict:
    """
    Executes Cycle 9 Document Classification on an ingested document.

    If OCR has not yet been executed (or if force_ocr=True), automatically
    triggers the Cycle 8 OCR pipeline first to populate DocumentPage records.
    Then executes the deterministic DocumentClassifier, persists document_type,
    classification_confidence, and updates processing_status.
    """
    document = _get_document_with_auth(document_id, org_id)

    # 1. Automatic OCR Chaining: Ensure OCR text pages exist
    pages = (
        DocumentPage.query
        .filter_by(document_id=document.id)
        .order_by(DocumentPage.page_number.asc())
        .all()
    )

    if not pages or force_ocr:
        # Auto-chain Cycle 8 OCR
        process_document_pipeline(document_id, org_id)
        pages = (
            DocumentPage.query
            .filter_by(document_id=document.id)
            .order_by(DocumentPage.page_number.asc())
            .all()
        )

    # 2. State Transition to CLASSIFICATION_PROCESSING
    document.processing_status = "CLASSIFICATION_PROCESSING"
    db.session.commit()

    # 3. Setup Classifier and Extract Texts
    classifier = get_classifier()
    if confidence_threshold is not None:
        classifier = DocumentClassifier(config=ClassifierConfig(confidence_threshold=confidence_threshold))

    page_texts = [p.raw_text for p in pages] if pages else []
    combined_text = "\n\n--- PAGE BREAK ---\n\n".join(page_texts) if page_texts else ""

    # 4. Execute Classification
    try:
        result = classifier.classify(combined_text, document_id=document.id, pages=page_texts)

        doc_type_val = (
            result.document_type.value if hasattr(result.document_type, "value") else str(result.document_type)
        )
        status_val = (
            result.status.value if hasattr(result.status, "value") else str(result.status)
        )

        # 5. Persist Classification Result in Database
        document.document_type = doc_type_val
        document.classification_confidence = round(result.confidence, 4)
        document.processing_status = status_val  # "CLASSIFIED" or "REVIEW_REQUIRED"
        db.session.commit()

        return {
            "document_id": document.id,
            "bid_id": document.bid_id,
            "document_type": document.document_type,
            "classification_confidence": document.classification_confidence,
            "status": document.processing_status,
            "method": result.method.value if hasattr(result.method, "value") else str(result.method),
            "matched_signals": result.matched_signals,
            "scores_by_type": {k: round(v, 4) for k, v in result.scores_by_type.items()},
            "review_reason": result.review_reason,
            "classified_at": result.classified_at,
        }
    except Exception as exc:
        db.session.rollback()
        document.processing_status = "CLASSIFICATION_FAILED"
        db.session.commit()
        raise DocumentDomainError(f"Document classification failed: {str(exc)}", "CLASSIFICATION_FAILED", 500)

