"""Page-aware tender PDF extraction and structured requirement detection."""

from .pdf_reader import extract_pdf_pages
from .requirement_extractor import TenderRequirementExtractor

__all__ = ["extract_pdf_pages", "TenderRequirementExtractor"]
