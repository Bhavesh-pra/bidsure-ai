from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel, Field, ConfigDict

class RequirementCategory(str, Enum):
    STATUTORY = "STATUTORY"
    FINANCIAL = "FINANCIAL"
    TECHNICAL = "TECHNICAL"
    REGISTRATION = "REGISTRATION"
    DOCUMENT = "DOCUMENT"
    ELIGIBILITY = "ELIGIBILITY"
    OPERATIONAL = "OPERATIONAL"

class ComparisonOperator(str, Enum):
    EQUALS = "EQUALS"
    NOT_EQUALS = "NOT_EQUALS"
    GREATER_THAN_EQUAL = "GREATER_THAN_EQUAL"
    LESS_THAN_EQUAL = "LESS_THAN_EQUAL"
    GREATER_THAN = "GREATER_THAN"
    LESS_THAN = "LESS_THAN"
    CONTAINS = "CONTAINS"
    EXISTS = "EXISTS"
    # Aliases for symbol representation
    EQ = "=="
    NE = "!="
    GTE = ">="
    LTE = "<="

class RequirementSchema(BaseModel):
    id: str = Field(..., description="Unique requirement ID, e.g. REQ-001")
    title: str = Field(..., description="Short title of the requirement")
    description: Optional[str] = Field(None, description="Detailed requirement specification")
    category: RequirementCategory = Field(..., description="Requirement category")
    mandatory: bool = Field(True, description="Whether requirement is compulsory for qualification")
    applicability: str = Field("ALL_BIDDERS", description="Target applicability, e.g. ALL_BIDDERS, MSME_ONLY")
    operator: Optional[ComparisonOperator] = Field(None, description="Evaluation operator")
    expected_value: Optional[Union[str, float, int, bool]] = Field(None, description="Expected value for compliance")
    unit: Optional[str] = Field(None, description="Unit of measurement, e.g. INR, %, Years")
    evaluation_period: Optional[str] = Field(None, description="Evaluation period, e.g. FY 2023-24")
    source_clause: Optional[str] = Field(None, description="Tender source clause reference")
    source_page: Optional[int] = Field(None, description="Source page number in tender document")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Extraction confidence score")

    model_config = ConfigDict(use_enum_values=True)
