from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    VERIFIED_FAIL = "VERIFIED_FAIL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"

class VerificationSchema(BaseModel):
    requirement_id: str = Field(..., description="Target requirement ID")
    verification_type: str = Field(..., description="Type e.g. GST_STATUS, UDYAM_STATUS")
    source: str = Field(..., description="Source verification adapter / API e.g. GST_MOCK_ADAPTER")
    status: VerificationStatus = Field(..., description="Outcome status of verification check")
    match_result: bool = Field(..., description="True if evidence strictly matches expectations")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional verification telemetry details")

    model_config = {
        "json_schema_extra": {
            "example": {
                "requirement_id": "REQ-001",
                "verification_type": "GST_STATUS",
                "source": "GST_MOCK_ADAPTER",
                "status": "VERIFIED",
                "match_result": True
            }
        }
    }
