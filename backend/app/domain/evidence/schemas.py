from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field

class ExtractionMethod(str, Enum):
    OCR_LLM = "OCR_LLM"
    DIRECT_PARSE = "DIRECT_PARSE"
    MANUAL = "MANUAL"
    MOCK = "MOCK"

class EvidenceSchema(BaseModel):
    document_id: str = Field(..., description="Source bidder document ID")
    field: str = Field(..., description="Field key e.g. gstin, turnover_2023")
    value: Any = Field(..., description="Raw extracted value from document")
    normalized_value: Optional[Any] = Field(None, description="Normalized standardized value for comparison")
    page: Optional[int] = Field(None, description="Page number where evidence is found")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level between 0 and 1")
    extraction_method: ExtractionMethod = Field(ExtractionMethod.OCR_LLM, description="Extraction engine used")

    model_config = {
        "json_schema_extra": {
            "example": {
                "document_id": "DOC-001",
                "field": "gstin",
                "value": "27ABCDE1234F1Z5",
                "normalized_value": "27ABCDE1234F1Z5",
                "page": 1,
                "confidence": 0.98,
                "extraction_method": "OCR_LLM"
            }
        }
    }
