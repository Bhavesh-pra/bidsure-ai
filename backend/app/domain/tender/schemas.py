from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel, Field

class RequirementCategory(str, Enum):
    STATUTORY = "STATUTORY"
    FINANCIAL = "FINANCIAL"
    TECHNICAL = "TECHNICAL"
    REGISTRATION = "REGISTRATION"
    DOCUMENT = "DOCUMENT"
    ELIGIBILITY = "ELIGIBILITY"

class ComparisonOperator(str, Enum):
    EQUALS = "=="
    NOT_EQUALS = "!="
    GREATER_THAN_OR_EQUAL = ">="
    LESS_THAN_OR_EQUAL = "<="
    CONTAINS = "CONTAINS"
    EXISTS = "EXISTS"

class RequirementSchema(BaseModel):
    id: str = Field(..., description="Unique requirement identifier, e.g. REQ-001")
    title: str = Field(..., description="Short title of the requirement")
    description: Optional[str] = Field(None, description="Detailed description or clause text")
    category: RequirementCategory = Field(..., description="Domain category")
    mandatory: bool = Field(True, description="Whether requirement is compulsory for qualification")
    applicability: str = Field("ALL_BIDDERS", description="Applicability scope or exception rule")
    operator: Optional[ComparisonOperator] = Field(None, description="Deterministic rule comparison operator")
    expected_value: Optional[Union[str, float, int, bool]] = Field(None, description="Target value for evaluation")
    unit: Optional[str] = Field(None, description="Unit of measurement, e.g. INR, Years, Days")
    evaluation_period: Optional[str] = Field(None, description="Evaluation period reference, e.g. FY 2024-25")
    source_clause: Optional[str] = Field(None, description="Tender document clause reference")
    source_page: Optional[int] = Field(None, description="Page number in tender PDF")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="LLM extraction confidence score")

    class Config:
        use_enum_values = True
