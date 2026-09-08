from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class VerificationType(str, Enum):
    GOVERNMENT_SOURCE = "GOVERNMENT_SOURCE"
    CROSS_DOCUMENT = "CROSS_DOCUMENT"
    SEMANTIC_MATCH = "SEMANTIC_MATCH"
    RULE_EVALUATION = "RULE_EVALUATION"

class VerificationStatus(str, Enum):
    VERIFIED_PASS = "VERIFIED_PASS"
    VERIFIED_FAIL = "VERIFIED_FAIL"
    PARTIAL = "PARTIAL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    EVIDENCE_MISSING = "EVIDENCE_MISSING"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"

class VerificationSchema(BaseModel):
    id: str = Field(..., description="Unique verification ID")
    bid_id: str = Field(..., description="Bid ID under evaluation")
    requirement_id: str = Field(..., description="Target requirement ID")
    evidence_id: Optional[str] = Field(None, description="Primary supporting evidence ID")
    verification_type: VerificationType = Field(..., description="Type of verification performed")
    source: str = Field(..., description="Verification source, e.g. GSTN_MOCK, MCA_ADAPTER")
    source_reference: Optional[str] = Field(None, description="External transaction or reference ID")
    status: VerificationStatus = Field(..., description="Standard verification outcome status")
    match_result: str = Field(..., description="Text description of match outcome")
    response_snapshot: Optional[Dict[str, Any]] = Field(None, description="Raw external API payload snapshot")

    class Config:
        use_enum_values = True
