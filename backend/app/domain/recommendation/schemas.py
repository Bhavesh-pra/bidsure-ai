from typing import List, Optional
from pydantic import BaseModel, Field
from app.domain.verification.schemas import VerificationStatus

class RecommendationSchema(BaseModel):
    id: str = Field(..., description="Unique recommendation ID")
    bid_id: str = Field(..., description="Target Bid ID")
    status: VerificationStatus = Field(..., description="Recommended qualification status")
    rationale: str = Field(..., description="Explainable rationale backing the AI recommendation")
    supporting_findings: List[str] = Field(default_factory=list, description="IDs of supporting findings")
    generated_by: str = Field("LLM_SERVICE", description="Generator system indicator")
    model: Optional[str] = Field("gpt-4o-mini", description="LLM model used")
    model_version: Optional[str] = Field("1.0", description="Model version")

    class Config:
        use_enum_values = True
