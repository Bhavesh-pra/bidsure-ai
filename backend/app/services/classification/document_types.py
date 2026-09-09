"""
Canonical Document Types and Status Enums for Cycle 9 Document Classification.

Freezes the canonical enum definitions used across BidSure AI's
classification and evidence extraction pipelines.
"""

from enum import Enum
from typing import Union


class DocumentType(str, Enum):
    """Canonical document classification categories for Indian public procurement."""

    GST_CERTIFICATE = "GST_CERTIFICATE"
    PAN_DOCUMENT = "PAN_DOCUMENT"
    UDYAM_CERTIFICATE = "UDYAM_CERTIFICATE"
    OEM_AUTHORIZATION = "OEM_AUTHORIZATION"
    INCOME_TAX_DOCUMENT = "INCOME_TAX_DOCUMENT"
    FINANCIAL_STATEMENT = "FINANCIAL_STATEMENT"
    TECHNICAL_SPECIFICATION = "TECHNICAL_SPECIFICATION"
    MAKE_IN_INDIA_DECLARATION = "MAKE_IN_INDIA_DECLARATION"
    STARTUP_CERTIFICATE = "STARTUP_CERTIFICATE"
    NSIC_CERTIFICATE = "NSIC_CERTIFICATE"
    UNKNOWN = "UNKNOWN"


class ClassificationStatus(str, Enum):
    """Lifecycle status of the classification decision."""

    CLASSIFIED = "CLASSIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    PROCESSING = "PROCESSING"
    FAILED = "FAILED"


class ClassificationMethod(str, Enum):
    """Technology / strategy used to determine document category."""

    RULE_BASED = "RULE_BASED"
    ML = "ML"
    LLM = "LLM"
    HYBRID = "HYBRID"


# Legacy alias mapping to maintain backward compatibility with Cycle 4 & Cycle 7
LEGACY_TYPE_ALIASES = {
    "PAN_CARD": DocumentType.PAN_DOCUMENT,
    "FINANCIAL_AUDIT": DocumentType.FINANCIAL_STATEMENT,
    "TURNOVER_CERTIFICATE": DocumentType.FINANCIAL_STATEMENT,
    "LOCAL_CONTENT_DECLARATION": DocumentType.MAKE_IN_INDIA_DECLARATION,
    "EXPERIENCE_CERTIFICATE": DocumentType.UNKNOWN,
    "PAST_EXPERIENCE": DocumentType.UNKNOWN,
    "DELIVERY_SCHEDULE": DocumentType.TECHNICAL_SPECIFICATION,
    "OTHER": DocumentType.UNKNOWN,
}


def normalize_document_type(doc_type: Union[str, DocumentType]) -> DocumentType:
    """
    Normalizes any string or legacy enum into the canonical Cycle 9 DocumentType.

    Returns DocumentType.UNKNOWN if the input is unrecognized.
    """
    if isinstance(doc_type, DocumentType):
        return doc_type

    if not isinstance(doc_type, str):
        return DocumentType.UNKNOWN

    raw = doc_type.strip().upper()

    # Exact canonical match
    try:
        return DocumentType(raw)
    except ValueError:
        pass

    # Check legacy aliases
    if raw in LEGACY_TYPE_ALIASES:
        return LEGACY_TYPE_ALIASES[raw]

    return DocumentType.UNKNOWN
