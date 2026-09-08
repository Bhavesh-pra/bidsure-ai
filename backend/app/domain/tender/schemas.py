import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator

# Re-export Requirement domain components for backward compatibility
from app.domain.requirement.schemas import (
    RequirementSchema,
    RequirementCategory,
    RequirementMandatoryLevel,
    RequirementReviewStatus,
    ComparisonOperator,
)

class TenderStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    PUBLISHED = "PUBLISHED"
    EVALUATION = "EVALUATION"
    AWARDED = "AWARDED"

class TenderType(str, Enum):
    OPEN = "OPEN"
    LIMITED = "LIMITED"
    CLOSED = "CLOSED"
    EOI = "EOI"
    RFP = "RFP"

class TenderVersionSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"TV-{uuid.uuid4().hex[:8].upper()}", description="Unique tender version ID")
    tender_id: str = Field(..., description="Associated parent tender ID")
    version_number: int = Field(1, description="Sequential version index")
    source_document_id: Optional[str] = Field(None, description="Original tender document reference")
    effective_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Effective timestamp")
    change_summary: Optional[str] = Field(None, description="Summary of changes in this version")
    requirements: List[RequirementSchema] = Field(default_factory=list, description="Extracted requirements")

    model_config = ConfigDict(use_enum_values=True)

class TenderSchema(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: f"TND-{uuid.uuid4().hex[:8].upper()}", description="Unique tender ID, e.g. TND-001")
    tender_number: str = Field(..., min_length=1, max_length=100, description="Official tender identifier, e.g. GEM/2026/B/1234567")
    title: str = Field(..., min_length=1, max_length=500, description="Official title of the tender")
    description: Optional[str] = Field(None, description="Detailed description of the tender scope")
    organization: Optional[str] = Field(None, description="Procurement organization name")
    organization_id: Optional[str] = Field(None, description="Procurement organization unique tenant ID")
    entity: Optional[str] = Field(None, description="Issuing government entity/department (compatibility alias)")
    category: Union[RequirementCategory, str] = Field(..., description="Tender category, e.g. TECHNICAL, STATUTORY, GOODS")
    tender_type: TenderType = Field(TenderType.OPEN, description="Procurement procedure type (OPEN, LIMITED, etc.)")
    submission_deadline: datetime = Field(..., description="Submission deadline timestamp")
    status: TenderStatus = Field(TenderStatus.DRAFT, description="Current tender lifecycle status")
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), description="Creation timestamp")
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last update timestamp")
    requirements: List[RequirementSchema] = Field(default_factory=list, description="List of tender requirements")

    model_config = ConfigDict(use_enum_values=True, populate_by_name=True)

    @field_validator("tender_number", "title")
    @classmethod
    def validate_non_empty_string(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} must not be empty or purely whitespace")
        return v.strip()

    @model_validator(mode="after")
    def populate_org_and_entity_aliases(self):
        # Synchronize organization, organization_id, and entity for full backward compatibility
        if not self.organization and self.entity:
            self.organization = self.entity
        elif not self.entity and self.organization:
            self.entity = self.organization

        if not self.organization_id:
            self.organization_id = "ORG-DEFAULT"
        return self

__all__ = [
    "TenderSchema",
    "TenderVersionSchema",
    "TenderStatus",
    "TenderType",
    "RequirementSchema",
    "RequirementCategory",
    "RequirementMandatoryLevel",
    "RequirementReviewStatus",
    "ComparisonOperator",
]
