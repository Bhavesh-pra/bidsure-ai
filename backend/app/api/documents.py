import hashlib
import os
import uuid
from pathlib import Path

from flask import Blueprint, current_app, g, request
from werkzeug.utils import secure_filename

from app.domain.tender.contracts import ExtractionResult
from app.models.models import db, Document, Requirement, Tender, TenderVersion
from app.services.tender_extraction import TenderRequirementExtractor, extract_pdf_pages
from app.services.tender_extraction.pdf_reader import PdfExtractionError
from app.security.decorators import jwt_required, roles_required
from app.utils.response import error_response, success_response

documents_bp = Blueprint("documents", __name__)
PDF_SIGNATURE = b"%PDF-"
ALLOWED_MIME_TYPES = {"application/pdf", "application/x-pdf", ""}


def _owned_tender(tender_id: str):
    tender = Tender.query.filter_by(id=tender_id).first()
    if not tender:
        return None, error_response("NOT_FOUND", f"Tender with ID '{tender_id}' was not found", 404)
    if tender.organization_id != g.current_org_id:
        return None, error_response("FORBIDDEN", "Access denied: tender belongs to another organization", 403)
    return tender, None


def _validate_pdf(file_storage):
    if not file_storage or not file_storage.filename:
        return None, "A PDF file is required"
    filename = secure_filename(file_storage.filename)
    if not filename.lower().endswith(".pdf"):
        return None, "Only PDF files are accepted"
    content = file_storage.read()
    file_storage.stream.seek(0)
    max_size = current_app.config["MAX_CONTENT_LENGTH"]
    if not content:
        return None, "The uploaded file is empty"
    if len(content) > max_size:
        return None, f"File exceeds the maximum size of {max_size} bytes"
    if not content.startswith(PDF_SIGNATURE):
        return None, "The uploaded file is not a valid PDF (signature mismatch)"
    mimetype = (file_storage.mimetype or "").lower()
    if mimetype not in ALLOWED_MIME_TYPES and not mimetype.startswith("application/pdf"):
        return None, "Invalid PDF MIME type"
    return {"filename": filename, "content": content, "mimetype": "application/pdf"}, None


def _document_dict(document):
    return document.to_dict()


@documents_bp.post("/tenders/<string:tender_id>/documents")
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def upload_document(tender_id):
    tender, error = _owned_tender(tender_id)
    if error:
        return error
    validated, validation_error = _validate_pdf(request.files.get("file"))
    if validation_error:
        return error_response("VALIDATION_ERROR", validation_error, 400)

    document_id = f"DOC-{uuid.uuid4().hex[:10].upper()}"
    digest = hashlib.sha256(validated["content"]).hexdigest()
    storage_root = Path(current_app.config["UPLOAD_FOLDER"])
    storage_root.mkdir(parents=True, exist_ok=True)
    storage_name = f"{tender_id}/{document_id}-{validated['filename']}"
    storage_path = storage_root / storage_name
    storage_path.parent.mkdir(parents=True, exist_ok=True)
    storage_path.write_bytes(validated["content"])

    document = Document(
        id=document_id,
        tender_id=tender_id,
        document_type="TENDER_NOTICE",
        original_filename=validated["filename"],
        storage_key=storage_name,
        mime_type=validated["mimetype"],
        size_bytes=len(validated["content"]),
        sha256=digest,
        processing_status="PROCESSING",
        uploaded_by=g.current_user.get("id"),
    )
    db.session.add(document)
    db.session.commit()

    try:
        pages = extract_pdf_pages(str(storage_path))
        result = TenderRequirementExtractor().extract_requirements(tender_id, document_id, pages=pages)
        version = TenderVersion(
            id=f"TV-{uuid.uuid4().hex[:10].upper()}",
            tender_id=tender_id,
            version_number=(max((v.version_number for v in tender.versions), default=0) + 1),
            source_document_id=document_id,
            change_summary="Requirements extracted from tender document",
        )
        db.session.add(version)
        db.session.flush()
        for extracted in result.requirements:
            db.session.add(Requirement(
                id=extracted.id or f"REQ-{uuid.uuid4().hex[:10].upper()}",
                tender_version_id=version.id,
                category=extracted.category,
                title=extracted.title,
                description=extracted.description,
                mandatory=extracted.mandatory,
                applicability=extracted.applicability,
                operator=extracted.operator,
                expected_value=str(extracted.expected_value) if extracted.expected_value is not None else None,
                unit=extracted.unit,
                evaluation_period=extracted.evaluation_period,
                source_clause=extracted.source_clause,
                source_page=extracted.source_page,
                confidence=extracted.confidence,
            ))
        document.page_count = len(pages)
        document.processing_status = "PROCESSED"
        tender.current_version_id = version.id
        db.session.commit()
    except (PdfExtractionError, ValueError, Exception) as exc:
        db.session.rollback()
        document = Document.query.get(document_id)
        if document:
            document.processing_status = "FAILED"
            db.session.commit()
        return error_response("EXTRACTION_FAILED", str(exc), 422)

    return success_response({
        "document_id": document.id,
        "tender_id": tender_id,
        "filename": document.original_filename,
        "status": document.processing_status,
        "page_count": document.page_count,
        "requirements_count": len(result.requirements),
    }, 201)


@documents_bp.get("/tenders/<string:tender_id>/documents")
@jwt_required
def list_documents(tender_id):
    tender, error = _owned_tender(tender_id)
    if error:
        return error
    return success_response([_document_dict(document) for document in tender.documents])


@documents_bp.get("/tenders/<string:tender_id>/requirements")
@jwt_required
def list_requirements(tender_id):
    tender, error = _owned_tender(tender_id)
    if error:
        return error
    requirements = []
    for version in sorted(tender.versions, key=lambda item: item.version_number, reverse=True):
        requirements.extend(version.requirements)
        if requirements:
            break
    return success_response({
        "tender_id": tender_id,
        "requirements": [{
            "id": req.id,
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "mandatory": req.mandatory,
            "mandatory_level": "MANDATORY" if req.mandatory else "OPTIONAL",
            "applicability": req.applicability,
            "operator": req.operator,
            "expected_value": req.expected_value,
            "unit": req.unit,
            "evaluation_period": req.evaluation_period,
            "source_clause": req.source_clause,
            "source_page": req.source_page,
            "confidence": req.confidence,
            "status": "EXTRACTED",
        } for req in requirements],
    })
