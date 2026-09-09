from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field

class RequirementCategory(str, Enum):
    STATUTORY = "STATUTORY"
    FINANCIAL = "FINANCIAL"
    TECHNICAL = "TECHNICAL"
    EXPERIENCE = "EXPERIENCE"
    LEGAL = "LEGAL"

class RequirementOperator(str, Enum):
    EQUALS = "EQUALS"
    NOT_EQUALS = "NOT_EQUALS"
    GREATER_THAN_EQUAL = "GREATER_THAN_EQUAL"
    LESS_THAN_EQUAL = "LESS_THAN_EQUAL"
    GREATER_THAN = "GREATER_THAN"
    LESS_THAN = "LESS_THAN"
    CONTAINS = "CONTAINS"
    IN_LIST = "IN_LIST"

class RequirementSchema(BaseModel):
    id: str = Field(..., description="Unique Requirement Identifier e.g. REQ-001")
    title: str = Field(..., description="Title of requirement e.g. GST Registration")
    description: Optional[str] = Field(None, description="Detailed description")
    category: RequirementCategory = Field(RequirementCategory.STATUTORY, description="Category of requirement")
    mandatory: bool = Field(True, description="Whether requirement is mandatory")
    applicability: Optional[str] = Field("ALL", description="Applicability criteria")
    operator: RequirementOperator = Field(RequirementOperator.EQUALS, description="Comparison operator")
    expected_value: Any = Field(..., description="Target / expected value for evaluation")
    unit: Optional[str] = Field(None, description="Unit of measurement e.g. INR")
    evaluation_period: Optional[str] = Field(None, description="Period e.g. FY 2024-25")
    source_clause: Optional[str] = Field(None, description="Clause in tender e.g. Clause 4.2")
    source_page: Optional[int] = Field(None, description="Page number in tender document")
    confidence: Optional[float] = Field(None, description="Extraction confidence score 0.0 - 1.0")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "REQ-001",
                "title": "GST Registration",
                "category": "STATUTORY",
                "mandatory": True,
                "operator": "EQUALS",
                "expected_value": "ACTIVE",
                "source_clause": "Clause 4.2",
                "source_page": 7
            }
        }
    }
