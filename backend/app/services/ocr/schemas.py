"""
OCR domain schemas and contracts for BidSure AI — Cycle 8.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OCREngineType(str, Enum):
    TESSERACT = "tesseract"
    DIRECT_EXTRACTION = "direct_extraction"
    FALLBACK = "fallback"


class PageExtractionMethod(str, Enum):
    EMBEDDED_TEXT = "EMBEDDED_TEXT"
    OCR = "OCR"


class ExtractedPage(BaseModel):
    """Page-aware extracted text output for a single document page."""
    page_number: int = Field(..., ge=1, description="1-based page index")
    text: str = Field(..., description="Normalized raw text extracted from this page")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    word_count: int = Field(0, ge=0, description="Count of detected words")
    char_count: int = Field(0, ge=0, description="Total characters in extracted text")
    extraction_method: PageExtractionMethod = Field(
        PageExtractionMethod.EMBEDDED_TEXT,
        description="Method used: EMBEDDED_TEXT or OCR",
    )
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Engine specific metadata")

    model_config = ConfigDict(use_enum_values=True)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()


class OCRDocumentResult(BaseModel):
    """
    Complete page-aware OCR pipeline result for a document.
    """
    document_id: str = Field(..., description="Document identifier, e.g. DOC-001")
    bid_id: Optional[str] = Field(None, description="Parent bid identifier if associated")
    processing_status: str = Field("PROCESSED", description="PROCESSED, PROCESSING_FAILED, or UNREADABLE")
    ocr_engine: str = Field(OCREngineType.DIRECT_EXTRACTION.value, description="Engine name used")
    page_count: int = Field(0, ge=0, description="Total pages processed")
    pages: List[ExtractedPage] = Field(default_factory=list, description="List of per-page extracted texts")
    raw_text: str = Field("", description="Aggregated full document text")
    average_confidence: float = Field(1.0, ge=0.0, le=1.0, description="Average confidence across all pages")
    processing_time_ms: int = Field(0, ge=0, description="Processing duration in milliseconds")
    error_code: Optional[str] = Field(None, description="Error code if failed")
    error_message: Optional[str] = Field(None, description="Human-readable error details if failed")

    model_config = ConfigDict(use_enum_values=True)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
