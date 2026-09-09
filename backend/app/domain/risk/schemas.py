from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RiskFactorSchema(BaseModel):
    type: str = Field(..., description="Risk factor classification type e.g. MISSING_EVIDENCE")
    severity: RiskLevel = Field(..., description="Severity level of this risk factor")
    description: Optional[str] = Field(None, description="Detailed explanation of risk factor")

class RiskAssessmentSchema(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite risk score from 0 (lowest) to 100 (highest)")
    risk_level: RiskLevel = Field(..., description="Categorical risk level")
    factors: List[RiskFactorSchema] = Field(default_factory=list, description="List of identified risk factors")

    model_config = {
        "json_schema_extra": {
            "example": {
                "risk_score": 72,
                "risk_level": "MEDIUM",
                "factors": [
                    {
                        "type": "MISSING_EVIDENCE",
                        "severity": "HIGH",
                        "description": "OEM Authorization certificate page 2 missing signature"
                    }
                ]
            }
        }
    }
