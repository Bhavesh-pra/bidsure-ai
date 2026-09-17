import uuid
from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

def generate_recommendation_id() -> str:
    return f"REC-{uuid.uuid4().hex[:8]}"

class RecommendationStatus(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    PASS = "PASS"
    FAIL = "FAIL"

class RecommendationSchema(BaseModel):
    id: str = Field(default_factory=generate_recommendation_id, description="Unique recommendation ID")
    bid_id: Optional[str] = Field(None, description="Target Bid ID")
    status: Union[RecommendationStatus, str] = Field(..., description="Recommended status: APPROVED, REJECTED, REVIEW_REQUIRED")
    rationale: str = Field(..., description="Explainable justification backing the AI recommendation")
    supporting_findings: List[str] = Field(
        default_factory=list, description="IDs of supporting findings or requirement flags"
    )
    officer_authority_disclaimer: str = Field(
        "AI recommendations are strictly decision support. The human Procurement Officer retains exclusive final decision authority.",
        description="Statutory governance notice"
    )
    generated_by: str = Field("INTELLIGENCE_PIPELINE", description="Generator system indicator")
    llm_model: Optional[str] = Field("gemini-1.5-pro", description="LLM model identifier")
    pipeline_version: Optional[str] = Field("1.0", description="Pipeline version")

    model_config = ConfigDict(
        use_enum_values=True,
        protected_namespaces=()
    )
