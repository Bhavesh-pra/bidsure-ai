import uuid
from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel, Field, ConfigDict

def generate_evidence_id() -> str:
    return f"EVD-{uuid.uuid4().hex[:8]}"

class ExtractionMethod(str, Enum):
    OCR_LLM = "OCR_LLM"
    OCR_TESSERACT = "OCR_TESSERACT"
    REGEX = "REGEX"
    MANUAL_ENTRY = "MANUAL_ENTRY"
    BARCODE_QR = "BARCODE_QR"

class EvidenceSchema(BaseModel):
    id: str = Field(default_factory=generate_evidence_id, description="Unique evidence ID, e.g. EVD-001")
    document_id: str = Field(..., description="Referenced source document ID")
    requirement_id: Optional[str] = Field(None, description="Mapped requirement ID")
    field: str = Field(..., description="Extracted key or field name, e.g. gstin, legal_name, turnover")
    value: Union[str, float, int, bool] = Field(..., description="Raw extracted value from document")
    normalized_value: Optional[Union[str, float, int, bool]] = Field(
        None, description="Standardized, typed, or normalized representation of value"
    )
    page: Optional[int] = Field(None, description="Page number where evidence is found")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score (0.0 to 1.0)")
    extraction_method: ExtractionMethod = Field(
        ExtractionMethod.OCR_LLM, description="Extraction mechanism utilized"
    )
    source_type: Optional[str] = Field("BIDDER_DOCUMENT", description="Source classification")

    model_config = ConfigDict(use_enum_values=True)
