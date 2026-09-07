from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FindingSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

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

    class Config:
        use_enum_values = True

class RiskAssessmentSchema(BaseModel):
    id: str = Field(..., description="Risk assessment UUID")
    bid_id: str = Field(..., description="Target Bid ID")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Overall calculated risk score")
    risk_level: FindingSeverity = Field(..., description="Overall risk category")
    factors: Dict[str, Any] = Field(default_factory=dict, description="Factor breakdown JSON")
    methodology_version: str = Field("1.0", description="Risk scoring methodology version")
    explanation: str = Field(..., description="Human-readable risk summary")

    class Config:
        use_enum_values = True
