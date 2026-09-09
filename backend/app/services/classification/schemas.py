"""
Pydantic Schemas and Contracts for Cycle 9 Document Classification.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.services.classification.document_types import (
    ClassificationMethod,
    ClassificationStatus,
    DocumentType,
)


class SignalType(str, Enum):
    """Categorization of evidence signals during text classification."""

    EXACT_PHRASE = "EXACT_PHRASE"
    STRONG_KEYWORD = "STRONG_KEYWORD"
    SUPPORTING_KEYWORD = "SUPPORTING_KEYWORD"
    REGEX_PATTERN = "REGEX_PATTERN"
    NEGATIVE_PENALTY = "NEGATIVE_PENALTY"


class MatchedSignal(BaseModel):
    """An individual pattern or keyword matched in the document text."""

    signal: str = Field(..., description="The matched text pattern or keyword")
    signal_type: SignalType = Field(..., description="Hierarchy level of the signal")
    weight: float = Field(..., description="Calculated weight score contribution")
    document_type: DocumentType = Field(..., description="Document type supported by this signal")
    page_number: Optional[int] = Field(None, description="Page where the signal was detected")

    model_config = ConfigDict(use_enum_values=True)


class ClassifierConfig(BaseModel):
    """Runtime configuration for classification thresholds and weighting."""

    confidence_threshold: float = Field(
        0.65, ge=0.0, le=1.0, description="Minimum confidence required for CLASSIFIED status"
    )
    margin_threshold: float = Field(
        0.15, ge=0.0, le=1.0, description="Minimum difference between top and second candidate"
    )
    min_words: int = Field(5, ge=0, description="Minimum words required to attempt classification")
    page_1_weight_multiplier: float = Field(
        1.25, ge=1.0, description="Weight multiplier for signals appearing on first page"
    )

    model_config = ConfigDict(use_enum_values=True)


class ClassificationResult(BaseModel):
    """Structured result model representing the classification decision."""

    document_id: Optional[str] = Field(None, description="Target document identifier")
    document_type: DocumentType = Field(..., description="Assigned canonical document type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classification confidence between 0 and 1")
    status: ClassificationStatus = Field(..., description="CLASSIFIED or REVIEW_REQUIRED")
    method: ClassificationMethod = Field(
        ClassificationMethod.RULE_BASED, description="Classification method used"
    )
    matched_signals: List[str] = Field(
        default_factory=list, description="List of primary matched signal tokens or phrases"
    )
    scores_by_type: Dict[str, float] = Field(
        default_factory=dict, description="Raw normalized scores for each evaluated document type"
    )
    review_reason: Optional[str] = Field(
        None, description="Reason why document was marked for review (e.g. LOW_CONFIDENCE, AMBIGUOUS_DOCUMENT)"
    )
    classified_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of classification",
    )

    model_config = ConfigDict(use_enum_values=True)

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary with canonical string representations."""
        return {
            "document_id": self.document_id,
            "document_type": (
                self.document_type.value if hasattr(self.document_type, "value") else str(self.document_type)
            ),
            "confidence": round(self.confidence, 4),
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "method": self.method.value if hasattr(self.method, "value") else str(self.method),
            "matched_signals": self.matched_signals,
            "scores_by_type": {k: round(v, 4) for k, v in self.scores_by_type.items()},
            "review_reason": self.review_reason,
            "classified_at": self.classified_at,
        }
