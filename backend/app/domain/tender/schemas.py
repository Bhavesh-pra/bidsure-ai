from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.domain.requirement.schemas import RequirementSchema

class TenderStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    EVALUATION = "EVALUATION"
    AWARDED = "AWARDED"
    CLOSED = "CLOSED"

class TenderVersionSchema(BaseModel):
    version_id: str
    version_number: int = 1
    published_at: datetime = Field(default_factory=datetime.utcnow)
    requirements: List[RequirementSchema] = Field(default_factory=list)

class TenderSchema(BaseModel):
    id: str = Field(..., description="Tender ID e.g. TND-2026-001")
    title: str = Field(..., description="Title of the procurement tender")
    organization_id: str = Field(..., description="Issuing organization ID")
    category: str = Field(..., description="Tender domain category e.g. IT_INFRASTRUCTURE")
    estimated_value: float = Field(..., description="Estimated budget/value in INR")
    currency: str = Field("INR", description="Currency code")
    closing_date: datetime = Field(..., description="Tender submission deadline")
    status: TenderStatus = Field(TenderStatus.PUBLISHED, description="Current tender lifecycle status")
    current_version: Optional[TenderVersionSchema] = Field(None, description="Active tender version and requirement specifications")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "TND-2026-001",
                "title": "Supply and Installation of Server Infrastructure",
                "organization_id": "ORG-001",
                "category": "IT_INFRASTRUCTURE",
                "estimated_value": 50000000.0,
                "currency": "INR",
                "closing_date": "2026-10-31T17:00:00Z",
                "status": "PUBLISHED"
            }
        }
    }
