from datetime import datetime, timezone
from typing import List, Optional, Protocol, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.domain.requirement.schemas import (
    RequirementCategory,
    RequirementMandatoryLevel,
    RequirementReviewStatus,
    ComparisonOperator,
)

class ExtractionInput(BaseModel):
    """
    Contract for inputs passed to the Cycle 4 Requirement Extraction Service.
    Pipeline: Tender -> Tender Document -> Extraction Service -> Requirements
    """
    tender_id: str = Field(..., description="Unique ID of the parent tender")
    document_id: str = Field(..., description="Unique ID of the tender RFP/Notice document")
    file_path: Optional[str] = Field(None, description="Local or object storage key for document")
    file_url: Optional[str] = Field(None, description="Pre-signed download URL if stored remotely")
    mime_type: str = Field("application/pdf", description="Document MIME type")
    options: dict = Field(default_factory=dict, description="Extraction configuration flags (OCR mode, timeout, etc.)")

    model_config = ConfigDict(use_enum_values=True)


class ExtractedClause(BaseModel):
    """Represents a raw clause detected from the tender document."""
    clause_id: Optional[str] = Field(None, description="Identifier of clause, e.g. Clause 4.1")
    text: str = Field(..., description="Extracted clause text")
    page_number: Optional[int] = Field(None, description="Page number in original document")
    section: Optional[str] = Field(None, description="Section heading or category")

    model_config = ConfigDict(use_enum_values=True)


class ExtractedRequirement(BaseModel):
    """
    Structured requirement produced by the extraction service from document clauses.
    Ready for conversion into RequirementSchema and persistence.
    """
    id: Optional[str] = Field(None, description="Requirement UUID or ID, e.g. REQ-001")
    title: str = Field(..., min_length=1, description="Requirement title")
    description: Optional[str] = Field(None, description="Detailed requirement specification")
    category: RequirementCategory = Field(..., description="Frozen requirement category")
    mandatory: bool = Field(True, description="Whether requirement is compulsory for qualification")
    mandatory_level: Optional[RequirementMandatoryLevel] = Field(None, description="MANDATORY or OPTIONAL")
    review_status: Optional[RequirementReviewStatus] = Field(None, description="Officer review status")
    applicability: str = Field("ALL_BIDDERS", description="Target applicability, e.g. ALL_BIDDERS, MSME_ONLY")
    operator: Optional[ComparisonOperator] = Field(None, description="Comparison operator (>=, ==, CONTAINS, etc.)")
    expected_value: Optional[Union[str, float, int, bool]] = Field(None, description="Threshold or target value")
    unit: Optional[str] = Field(None, description="Unit of measurement, e.g. INR, Years, Projects")
    evaluation_period: Optional[str] = Field(None, description="Applicable evaluation period")
    source_clause: Optional[str] = Field(None, description="Source clause reference from tender document")
    source_page: Optional[int] = Field(None, description="Source page reference in tender document")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score (0.0 to 1.0)")

    model_config = ConfigDict(use_enum_values=True)


class ExtractionResult(BaseModel):
    """
    Contract for output returned by the Cycle 4 Requirement Extraction Service.
    """
    tender_id: str = Field(..., description="Parent tender ID")
    document_id: str = Field(..., description="Source document ID")
    requirements: List[ExtractedRequirement] = Field(default_factory=list, description="Extracted structured requirements")
    raw_clauses: List[ExtractedClause] = Field(default_factory=list, description="Raw tender clauses identified")
    total_requirements: int = Field(0, description="Count of extracted requirements")
    avg_confidence: float = Field(0.0, ge=0.0, le=1.0, description="Average confidence score across requirements")
    extracted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Extraction completion timestamp")
    model_name: Optional[str] = Field(None, description="Model or engine version used for extraction")
    processing_time_ms: Optional[int] = Field(None, description="Processing duration in milliseconds")

    model_config = ConfigDict(use_enum_values=True, protected_namespaces=())

    @model_validator(mode="after")
    def compute_summary_stats(self):
        if self.requirements:
            self.total_requirements = len(self.requirements)
            total_conf = sum(r.confidence for r in self.requirements)
            self.avg_confidence = round(total_conf / len(self.requirements), 4)
        return self


class RequirementExtractionProtocol(Protocol):
    """
    Formal callable contract for the Cycle 4 Extraction Service.
    Cycle 4 implementations must adhere to this interface.
    """
    def extract_requirements(
        self,
        tender_id: str,
        document_id: str,
        **kwargs,
    ) -> ExtractionResult:
        """
        Extract qualification requirements from tender document.
        :param tender_id: ID of the parent tender
        :param document_id: ID of the uploaded tender notice / RFP document
        :return: ExtractionResult containing structured requirements
        """
        ...


__all__ = [
    "ExtractionInput",
    "ExtractedClause",
    "ExtractedRequirement",
    "ExtractionResult",
    "RequirementExtractionProtocol",
]
