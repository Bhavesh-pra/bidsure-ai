from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator


class BidStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    UNDER_VERIFICATION = "UNDER_VERIFICATION"
    EVALUATED = "EVALUATED"
    OFFICER_REVIEW = "OFFICER_REVIEW"
    FINAL_DECISION = "FINAL_DECISION"


class BidderSchema(BaseModel):
    id: Optional[str] = None
    legal_name: str = Field(..., min_length=1, max_length=255)
    pan: Optional[str] = Field(None, max_length=10)
    gstin: Optional[str] = Field(None, max_length=15)
    udyam_number: Optional[str] = Field(None, max_length=50)
    organization_type: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=1000)
    organization_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(use_enum_values=True)

    @field_validator("legal_name")
    @classmethod
    def name_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("legal_name is required")
        return value

    @field_validator("pan")
    @classmethod
    def valid_pan(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            value = value.strip().upper()
            if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", value):
                raise ValueError("Invalid PAN format")
        return value

    @field_validator("gstin")
    @classmethod
    def valid_gstin(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            value = value.strip().upper()
            # Indian GSTIN: state code, PAN body, entity code, Z, checksum.
            if not re.fullmatch(r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]", value):
                raise ValueError("Invalid GSTIN format")
        return value


class BidMetadata(BaseModel):
    quoted_amount: float = Field(..., gt=0)
    proposed_completion_date: Optional[date] = None
    currency: str = "INR"


class BidSchema(BaseModel):
    id: Optional[str] = None
    tender_id: str = Field(..., min_length=1)
    bidder_id: str = Field(..., min_length=1)
    submission_time: Optional[datetime] = None
    quoted_amount: float = Field(..., gt=0)
    proposed_completion_date: Optional[date] = None
    status: BidStatus = BidStatus.DRAFT
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(use_enum_values=True)

    @field_validator("status")
    @classmethod
    def cycle6_status_only(cls, value: BidStatus) -> BidStatus:
        if value not in (BidStatus.DRAFT, BidStatus.SUBMITTED):
            raise ValueError("Only DRAFT and SUBMITTED bid statuses are available in Cycle 6")
        return value


class EvidenceRequirement(BaseModel):
    """Stable Cycle 6 mapping from tender requirement to future bidder evidence."""
    requirement_id: str
    expected_evidence_type: str
    document_type: str
    evidence_key: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
