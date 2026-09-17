"""
OCR Services Package for BidSure AI — Cycle 8.
"""

from app.services.ocr.schemas import (
    ExtractedPage,
    OCRDocumentResult,
    OCREngineType,
    PageExtractionMethod,
)
from app.services.ocr.tesseract_engine import (
    OCREngineError,
    TesseractEngine,
    TesseractNotFoundError,
)
from app.services.ocr.pdf_processor import (
    PDFProcessingError,
    PDFProcessor,
)
from app.services.ocr.service import OCRService

__all__ = [
    "OCRService",
    "OCRDocumentResult",
    "ExtractedPage",
    "OCREngineType",
    "PageExtractionMethod",
    "TesseractEngine",
    "TesseractNotFoundError",
    "OCREngineError",
    "PDFProcessor",
    "PDFProcessingError",
]
