"""
Cycle 9 Document Classification Service Package.

Exposes the canonical DocumentType enum, classification models,
and the deterministic DocumentClassifier service.
"""

from typing import Optional
from app.services.classification.document_types import (
    ClassificationMethod,
    ClassificationStatus,
    DocumentType,
    normalize_document_type,
)
from app.services.classification.schemas import (
    ClassificationResult,
    ClassifierConfig,
    MatchedSignal,
    SignalType,
)
from app.services.classification.classifier import DocumentClassifier

_DEFAULT_CLASSIFIER: Optional[DocumentClassifier] = None


def get_classifier() -> DocumentClassifier:
    """Returns the shared default DocumentClassifier instance."""
    global _DEFAULT_CLASSIFIER
    if _DEFAULT_CLASSIFIER is None:
        _DEFAULT_CLASSIFIER = DocumentClassifier()
    return _DEFAULT_CLASSIFIER


__all__ = [
    "DocumentClassifier",
    "DocumentType",
    "ClassificationStatus",
    "ClassificationMethod",
    "ClassificationResult",
    "ClassifierConfig",
    "MatchedSignal",
    "SignalType",
    "normalize_document_type",
    "get_classifier",
]
