from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class RecommendationStatus(str, Enum):
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"

class RecommendationSchema(BaseModel):
    status: RecommendationStatus = Field(..., description="AI Recommendation status")
    rationale: str = Field(..., description="Justification and explanation of recommendation")
    supporting_findings: List[str] = Field(default_factory=list, description="IDs or keys of findings supporting recommendation")
    officer_override_note: Optional[str] = Field(None, description="Space reserved for Human Procurement Officer decision notes")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "REVIEW_REQUIRED",
                "rationale": "OEM authorization requires manual review.",
                "supporting_findings": [
                    "FIND-001"
                ]
            }
        }
    }
