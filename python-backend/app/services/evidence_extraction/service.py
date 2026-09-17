"""Deterministic Cycle 10 extraction from page-aware OCR text.

Documents are treated as untrusted data. This service does not execute
instructions found in OCR text and does not make verification or compliance
decisions; it only emits validated structured fields with provenance.
"""
import re
from datetime import datetime, timezone
from typing import Iterable

from app.domain.evidence.schemas import EvidenceField, ExtractionMethod, StructuredEvidence

GSTIN_RE = re.compile(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b", re.I)
PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", re.I)
UDYAM_RE = re.compile(r"\bUDYAM[-/][A-Z]{2}[-/][0-9]{2}[-/][0-9]{7}\b", re.I)
DATE_RE = re.compile(r"\b(?:[0-3]?\d)[/-](?:0?[1-9]|1[0-2])[/-](?:19|20)\d{2}\b")


def normalize_name(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9& ]+", " ", value.upper())
    value = re.sub(r"\b(PRIVATE|PVT)\.?\s+LIMITED\b", "PVT LTD", value)
    return re.sub(r"\s+", " ", value).strip()


def normalize_identifier(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", value).upper()


def normalize_date(value: str) -> str:
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    return value.strip()


def _label_value(text: str, labels: Iterable[str]) -> str | None:
    labels_re = "|".join(re.escape(label) for label in labels)
    match = re.search(rf"(?:{labels_re})\s*[:\-]?\s*([^\n|]+)", text, re.I)
    return match.group(1).strip() if match else None


def _add(fields: list[EvidenceField], field: str, value: str, normalized: str, page: int, confidence: float) -> None:
    fields.append(EvidenceField(field=field, value=value.strip(), normalized_value=normalized, page=page, confidence=confidence))


def _regex_extract(document_id: str, document_type: str, pages: list[dict]) -> StructuredEvidence:
    """Deterministic regex-based extraction (original implementation, preserved as fallback)."""
    fields: list[EvidenceField] = []
    canonical = document_type.upper().strip()
    for page_data in pages:
        page_number = int(page_data.get("page_number", 1))
        text = str(page_data.get("raw_text", page_data.get("text", "")) or "")
        if canonical == "GST_CERTIFICATE":
            match = GSTIN_RE.search(text.upper())
            if match:
                _add(fields, "gstin", match.group(), normalize_identifier(match.group()), page_number, 0.98)
            name = _label_value(text, ("Legal Name", "Name of Business", "Taxpayer Name"))
            if name:
                _add(fields, "legal_name", name, normalize_name(name), page_number, 0.94)
            trade = _label_value(text, ("Trade Name", "Trade Name of Business"))
            if trade:
                _add(fields, "trade_name", trade, normalize_name(trade), page_number, 0.9)
            status = _label_value(text, ("Status", "GST Status"))
            if status:
                _add(fields, "status", status, status.upper().strip(), page_number, 0.92)
            registration_date = _label_value(text, ("Date of Registration", "Registration Date"))
            if registration_date:
                date_match = DATE_RE.search(registration_date)
                if date_match:
                    _add(fields, "registration_date", date_match.group(), normalize_date(date_match.group()), page_number, 0.88)
            address = _label_value(text, ("Address", "Principal Place of Business"))
            if address:
                _add(fields, "address", address, re.sub(r"\s+", " ", address).strip(), page_number, 0.8)
        elif canonical in ("PAN_DOCUMENT", "PAN_CARD"):
            match = PAN_RE.search(text.upper())
            if match:
                _add(fields, "pan", match.group(), normalize_identifier(match.group()), page_number, 0.98)
            name = _label_value(text, ("Name", "Name of Assessee", "Legal Name"))
            if name:
                _add(fields, "name", name, normalize_name(name), page_number, 0.93)
            dob = _label_value(text, ("Date of Birth", "Date of Incorporation", "DOB"))
            if dob:
                date_match = DATE_RE.search(dob)
                if date_match:
                    _add(fields, "date_of_birth_or_incorporation", date_match.group(), normalize_date(date_match.group()), page_number, 0.86)
        elif canonical == "UDYAM_CERTIFICATE":
            match = UDYAM_RE.search(text.upper())
            if match:
                _add(fields, "udyam_registration_number", match.group(), normalize_identifier(match.group()), page_number, 0.98)
            name = _label_value(text, ("Enterprise Name", "Name of Enterprise", "Legal Name"))
            if name:
                _add(fields, "enterprise_name", name, normalize_name(name), page_number, 0.93)
            org_type = _label_value(text, ("Organisation Type", "Organization Type", "Type of Enterprise"))
            if org_type:
                _add(fields, "organization_type", org_type, org_type.upper().strip(), page_number, 0.88)
            registration_date = _label_value(text, ("Date of Registration", "Registration Date"))
            if registration_date:
                date_match = DATE_RE.search(registration_date)
                if date_match:
                    _add(fields, "registration_date", date_match.group(), normalize_date(date_match.group()), page_number, 0.88)
    return StructuredEvidence(document_id=document_id, document_type=canonical, fields=fields,
                               extraction_method=ExtractionMethod.REGEX, extracted_at=datetime.now(timezone.utc),
                               extraction_status="EXTRACTED" if fields else "REVIEW_REQUIRED")


def extract_structured_evidence(document_id: str, document_type: str, pages: list[dict]) -> StructuredEvidence:
    """
    Extract structured fields from OCR pages.

    Strategy: Try LLM extraction first. If LLM is unavailable or fails,
    fall back to the deterministic regex pipeline (zero-downtime guarantee).
    """
    import logging
    _logger = logging.getLogger(__name__)

    canonical = document_type.upper().strip()

    # --- Attempt LLM extraction ---
    try:
        from app.services.llm_service import extract_fields_with_llm

        # Concatenate page text for LLM
        full_text = "\n\n".join(
            str(p.get("raw_text", p.get("text", "")) or "")
            for p in pages
        )

        if full_text.strip():
            llm_result = extract_fields_with_llm(full_text, canonical, document_id)
            if llm_result and llm_result.get("fields"):
                llm_fields = [
                    EvidenceField(
                        field=f["field"],
                        value=f["value"],
                        normalized_value=f.get("normalized_value"),
                        page=f.get("page", 1),
                        confidence=f.get("confidence", 0.85),
                        source=f.get("source", "BIDDER_DOCUMENT"),
                    )
                    for f in llm_result["fields"]
                ]
                _logger.info(
                    "Using LLM extraction for doc=%s type=%s (%d fields)",
                    document_id, canonical, len(llm_fields),
                )
                return StructuredEvidence(
                    document_id=document_id,
                    document_type=canonical,
                    fields=llm_fields,
                    extraction_method=ExtractionMethod.OCR_LLM,
                    extracted_at=datetime.now(timezone.utc),
                    extraction_status="EXTRACTED" if llm_fields else "REVIEW_REQUIRED",
                )
    except Exception as e:
        _logger.warning("LLM extraction attempt failed for doc=%s, falling back to regex: %s", document_id, e)

    # --- Fallback: deterministic regex extraction ---
    _logger.info("Using regex extraction for doc=%s type=%s", document_id, canonical)
    return _regex_extract(document_id, canonical, pages)

