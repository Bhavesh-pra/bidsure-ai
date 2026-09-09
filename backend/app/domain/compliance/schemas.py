from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ComplianceStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    EVIDENCE_MISSING = "EVIDENCE_MISSING"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"

class ComplianceResultSchema(BaseModel):
    requirement_id: str = Field(..., description="ID of requirement evaluated e.g. REQ-001")
    status: ComplianceStatus = Field(..., description="Deterministic compliance status")
    score: float = Field(0.0, description="Compliance score for this requirement")
    finding: Optional[str] = Field(None, description="Detailed explanation or finding if non-compliant")

    model_config = {
        "json_schema_extra": {
            "example": {
                "requirement_id": "REQ-001",
                "status": "PASS",
                "score": 15,
                "finding": None
            }
        }
    }
