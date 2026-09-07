from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.domain.tender.schemas import RequirementSchema
from app.domain.evidence.schemas import EvidenceSchema
from app.domain.verification.schemas import VerificationSchema, VerificationStatus

class RuleInput(BaseModel):
    requirement: RequirementSchema
    evidence: List[EvidenceSchema] = []
    verifications: List[VerificationSchema] = []

class RuleOutput(BaseModel):
    requirement_id: str
    status: VerificationStatus
    score: float = Field(..., ge=0.0, le=1.0, description="Normalized compliance score 0.0 to 1.0")
    reason: str = Field(..., description="Explainable justification of compliance determination")
    supporting_evidence_ids: List[str] = []
    requires_manual_review: bool = False

    class Config:
        use_enum_values = True
