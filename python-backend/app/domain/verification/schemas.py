import uuid
from enum import Enum
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict

def generate_verification_id() -> str:
    return f"VRF-{uuid.uuid4().hex[:8]}"

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    VERIFIED_PASS = "VERIFIED_PASS"  # Backward compatibility
    VERIFIED_FAIL = "VERIFIED_FAIL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"
    EVIDENCE_MISSING = "EVIDENCE_MISSING"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class VerificationType(str, Enum):
    GST_STATUS = "GST_STATUS"
    PAN_STATUS = "PAN_STATUS"
    UDYAM_STATUS = "UDYAM_STATUS"
    GOVERNMENT_SOURCE = "GOVERNMENT_SOURCE"
    CROSS_DOCUMENT = "CROSS_DOCUMENT"
    SEMANTIC_MATCH = "SEMANTIC_MATCH"
    RULE_EVALUATION = "RULE_EVALUATION"
    FINANCIAL_CHECK = "FINANCIAL_CHECK"
    OEM_AUTH_CHECK = "OEM_AUTH_CHECK"
    LOCAL_CONTENT_CHECK = "LOCAL_CONTENT_CHECK"

class VerificationSchema(BaseModel):
    id: str = Field(default_factory=generate_verification_id, description="Unique verification ID")
    bid_id: Optional[str] = Field(None, description="Bid ID under verification")
    requirement_id: str = Field(..., description="Target requirement ID, e.g. REQ-001")
    evidence_id: Optional[str] = Field(None, description="Supporting evidence ID")
    verification_type: Union[VerificationType, str] = Field(..., description="Type of verification performed")
    source: str = Field(..., description="Verification adapter/source, e.g. GST_MOCK_ADAPTER")
    status: VerificationStatus = Field(..., description="Verification outcome status")
    match_result: Union[bool, str] = Field(..., description="Verification match indicator or description")
    source_reference: Optional[str] = Field(None, description="External verification reference ID")
    response_snapshot: Optional[Dict[str, Any]] = Field(None, description="Snapshot of external source response")

    model_config = ConfigDict(use_enum_values=True)
