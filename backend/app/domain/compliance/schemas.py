from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from app.domain.requirement.schemas import RequirementSchema
from app.domain.evidence.schemas import EvidenceSchema
from app.domain.verification.schemas import VerificationSchema

class ComplianceStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    EVIDENCE_MISSING = "EVIDENCE_MISSING"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"

class ComplianceResult(BaseModel):
    requirement_id: str = Field(..., description="Target requirement identifier, e.g. REQ-001")
    status: ComplianceStatus = Field(..., description="Deterministic compliance outcome")
    score: Optional[Union[float, int]] = Field(0, description="Compliance score awarded")
    finding: Optional[str] = Field(None, description="Detailed finding or discrepancy note if any")
    reason: Optional[str] = Field(None, description="Human-readable explanation of rule result")
    supporting_evidence_ids: List[str] = Field(default_factory=list, description="IDs of linked evidence records")

    model_config = ConfigDict(use_enum_values=True)

# Alias for schema standard consistency
ComplianceSchema = ComplianceResult

class RuleInput(BaseModel):
    requirement: RequirementSchema
    evidence: List[EvidenceSchema] = Field(default_factory=list)
    verifications: List[VerificationSchema] = Field(default_factory=list)

    model_config = ConfigDict(use_enum_values=True)

class RuleOutput(BaseModel):
    requirement_id: str
    status: Union[ComplianceStatus, str]
    score: float = Field(..., description="Compliance score")
    reason: str = Field(..., description="Explainable justification of compliance determination")
    finding: Optional[str] = None
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    requires_manual_review: bool = False

    model_config = ConfigDict(use_enum_values=True)
