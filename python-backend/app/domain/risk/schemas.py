import uuid
from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

def generate_risk_id() -> str:
    return f"RSK-{uuid.uuid4().hex[:8]}"

class FindingSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RiskFactorType(str, Enum):
    MISSING_EVIDENCE = "MISSING_EVIDENCE"
    IDENTIFIER_MISMATCH = "IDENTIFIER_MISMATCH"
    EXPIRED_DOCUMENT = "EXPIRED_DOCUMENT"
    THRESHOLD_BREACH = "THRESHOLD_BREACH"
    FINANCIAL_ANOMALY = "FINANCIAL_ANOMALY"
    LOCAL_CONTENT_DEFICIT = "LOCAL_CONTENT_DEFICIT"
    UNVERIFIED_CREDENTIAL = "UNVERIFIED_CREDENTIAL"
    OTHER = "OTHER"

class RiskFactor(BaseModel):
    type: Union[RiskFactorType, str] = Field(..., description="Factor classification, e.g. MISSING_EVIDENCE")
    severity: FindingSeverity = Field(..., description="Risk severity level")
    description: Optional[str] = Field(None, description="Explanation of the risk factor")
    requirement_id: Optional[str] = Field(None, description="Related requirement ID if applicable")

    model_config = ConfigDict(use_enum_values=True)

class FindingSchema(BaseModel):
    id: str = Field(..., description="Unique finding ID, e.g. FND-001")
    bid_id: str = Field(..., description="Target Bid ID")
    requirement_id: Optional[str] = Field(None, description="Associated requirement ID")
    category: str = Field(..., description="Finding category, e.g. STATUTORY, FINANCIAL")
    severity: FindingSeverity = Field(..., description="Severity level")
    status: str = Field("OPEN", description="Finding lifecycle status")
    title: str = Field(..., description="Brief finding headline")
    description: str = Field(..., description="Detailed explanation of anomaly or failure")
    rule_id: Optional[str] = Field(None, description="Triggering rule ID")
    requires_review: bool = Field(True, description="Whether officer review is required")

    model_config = ConfigDict(use_enum_values=True)

class RiskAssessmentSchema(BaseModel):
    id: str = Field(default_factory=generate_risk_id, description="Risk assessment UUID")
    bid_id: Optional[str] = Field(None, description="Target Bid ID")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Separate overall calculated risk score (0-100)")
    risk_level: FindingSeverity = Field(..., description="Overall risk category (LOW, MEDIUM, HIGH, CRITICAL)")
    factors: List[RiskFactor] = Field(default_factory=list, description="Breakdown of individual risk factors")
    explanation: Optional[str] = Field(None, description="Human-readable risk summary")
    methodology_version: str = Field("1.0", description="Risk scoring methodology version")

    model_config = ConfigDict(use_enum_values=True)
