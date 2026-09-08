from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# Re-export Requirement domain components for backward compatibility
from app.domain.requirement.schemas import (
    RequirementSchema,
    RequirementCategory,
    ComparisonOperator,
)

class TenderStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ACTIVE = "ACTIVE"
    EVALUATION = "EVALUATION"
    AWARDED = "AWARDED"
    CANCELLED = "CANCELLED"

class TenderVersionSchema(BaseModel):
    id: str = Field(..., description="Unique tender version ID")
    tender_id: str = Field(..., description="Associated parent tender ID")
    version_number: int = Field(1, description="Sequential version index")
    source_document_id: Optional[str] = Field(None, description="Original tender document reference")
    effective_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Effective timestamp")
    change_summary: Optional[str] = Field(None, description="Summary of changes in this version")
    requirements: List[RequirementSchema] = Field(default_factory=list, description="Extracted requirements")

    model_config = ConfigDict(use_enum_values=True)

class TenderSchema(BaseModel):
    id: str = Field(..., description="Unique tender ID, e.g. TND-001")
    organization_id: str = Field(..., description="Procurement organization ID")
    tender_number: str = Field(..., description="Official tender identifier, e.g. GEM/2026/B/1001")
    title: str = Field(..., description="Official title of the tender")
    entity: str = Field(..., description="Issuing government entity/department")
    category: str = Field(..., description="Tender category, e.g. GOODS, SERVICES, EQUIPMENT")
    submission_deadline: datetime = Field(..., description="Submission deadline timestamp")
    status: TenderStatus = Field(TenderStatus.ACTIVE, description="Current tender lifecycle status")
    requirements: List[RequirementSchema] = Field(default_factory=list, description="List of tender requirements")

    model_config = ConfigDict(use_enum_values=True)

__all__ = [
    "TenderSchema",
    "TenderVersionSchema",
    "TenderStatus",
    "RequirementSchema",
    "RequirementCategory",
    "ComparisonOperator",
]
