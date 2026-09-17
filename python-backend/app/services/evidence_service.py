from datetime import datetime, timezone
import uuid

from app.models.models import db, Bid, Document, Evidence
from app.services.document_service import DocumentDomainError, _get_document_with_auth
from app.services.evidence_extraction import extract_structured_evidence


def _evidence_dict(row):
    return row.to_dict()


def _assert_bid_access(bid_id: str, org_id: str) -> Bid:
    bid = Bid.query.filter_by(id=bid_id).first()
    if not bid:
        raise DocumentDomainError("Bid not found", "NOT_FOUND", 404)
    if not bid.tender or bid.tender.organization_id != org_id:
        raise DocumentDomainError("Access denied: bid belongs to another organization", "FORBIDDEN", 403)
    return bid


def extract_document_evidence(document_id: str, org_id: str) -> dict:
    document = _get_document_with_auth(document_id, org_id)
    if not document.bid_id:
        raise DocumentDomainError("Evidence extraction requires a bidder document", "INVALID_DOCUMENT", 400)
    if document.processing_status not in ("CLASSIFIED", "REVIEW_REQUIRED"):
        raise DocumentDomainError("Document must be classified before extraction", "DOCUMENT_NOT_CLASSIFIED", 409)
    if document.processing_status == "REVIEW_REQUIRED" or document.document_type == "UNKNOWN":
        raise DocumentDomainError("Document classification requires review before extraction", "DOCUMENT_NOT_CLASSIFIED", 409)
    pages = sorted(document.pages, key=lambda page: page.page_number)
    document.processing_status = "EXTRACTING"
    db.session.commit()
    try:
        result = extract_structured_evidence(document.id, document.document_type, [p.to_dict() for p in pages])
        Evidence.query.filter_by(document_id=document.id).delete()
        rows = []
        for field in result.fields:
            row = Evidence(
                id=f"EVD-{uuid.uuid4().hex[:10].upper()}", bid_id=document.bid_id, document_id=document.id,
                field=field.field, value=field.value, normalized_value=field.normalized_value,
                page=field.page, source_type=field.source, extraction_method=result.extraction_method,
                confidence=field.confidence, status="EXTRACTED" if field.confidence >= 0.7 else "REVIEW_REQUIRED",
            )
            db.session.add(row); rows.append(row)
        document.processing_status = "EXTRACTED" if rows else "EXTRACTION_FAILED"
        db.session.commit()
        if not rows:
            raise DocumentDomainError("No structured fields could be extracted", "EXTRACTION_FAILED", 422)
        return {"document_id": document.id, "document_type": document.document_type, "fields": [_evidence_dict(row) for row in rows], "extraction_method": result.extraction_method, "processing_version": result.processing_version, "extraction_status": result.extraction_status}
    except DocumentDomainError:
        raise
    except Exception as exc:
        db.session.rollback()
        document = Document.query.get(document_id)
        if document:
            document.processing_status = "EXTRACTION_FAILED"
            db.session.commit()
        raise DocumentDomainError(f"Structured evidence could not be generated: {exc}", "EXTRACTION_FAILED", 422)


def list_bid_evidence(bid_id: str, org_id: str) -> list[dict]:
    _assert_bid_access(bid_id, org_id)
    return [_evidence_dict(row) for row in Evidence.query.filter_by(bid_id=bid_id).order_by(Evidence.document_id, Evidence.page, Evidence.field).all()]


def get_evidence(evidence_id: str, org_id: str) -> dict:
    row = Evidence.query.filter_by(id=evidence_id).first()
    if not row:
        raise DocumentDomainError("Evidence not found", "EVIDENCE_NOT_FOUND", 404)
    _assert_bid_access(row.bid_id, org_id)
    return _evidence_dict(row)
