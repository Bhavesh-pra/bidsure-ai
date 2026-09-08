from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel, Field

class ExtractionMethod(str, Enum):
    OCR_LLM = "OCR_LLM"
    REGEX = "REGEX"
    MANUAL_ENTRY = "MANUAL_ENTRY"
    BARCODE_QR = "BARCODE_QR"

class EvidenceSchema(BaseModel):
    id: str = Field(..., description="Unique evidence ID, e.g. EVD-001")
    document_id: str = Field(..., description="Referenced document ID")
    requirement_id: Optional[str] = Field(None, description="Mapped requirement ID")
    field: str = Field(..., description="Extracted field name, e.g. gstin, legal_name, turnover_amount")
    value: Union[str, float, int, bool] = Field(..., description="Raw extracted value")
    normalized_value: Optional[Union[str, float, int, bool]] = Field(None, description="Cleaned/standardized value")
    page: Optional[int] = Field(None, description="Page number where evidence was located")
    source_type: str = Field("BIDDER_DOCUMENT", description="Source of evidence")
    extraction_method: ExtractionMethod = Field(ExtractionMethod.OCR_LLM, description="Extraction method used")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score")

    class Config:
        use_enum_values = True
