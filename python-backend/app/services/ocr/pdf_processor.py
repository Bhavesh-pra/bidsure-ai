"""
PDF Page Processor for BidSure AI — Cycle 8.

Decomposes PDF files into individual pages, detects whether pages have
embedded digital text, extracts direct text, or rasterizes pages to high-DPI
images for OCR processing.
"""

import io
import logging
import re
from pathlib import Path
from typing import List, Optional, Tuple, Union
import fitz  # PyMuPDF
from PIL import Image

logger = logging.getLogger(__name__)


class PDFProcessingError(ValueError):
    """Raised when PDF structure is corrupt or unreadable."""
    def __init__(self, message: str, code: str = "PDF_PROCESSING_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class PDFProcessor:
    """
    Handles PDF inspection, direct embedded text extraction, and page rasterization.
    """

    IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

    def __init__(self, default_dpi: int = 300, min_embedded_chars: int = 25, min_embedded_words: int = 4):
        self.default_dpi = default_dpi
        self.min_embedded_chars = min_embedded_chars
        self.min_embedded_words = min_embedded_words

    def is_image_file(self, file_path_or_name: str) -> bool:
        ext = Path(file_path_or_name).suffix.lower()
        return ext in self.IMAGE_EXTENSIONS

    def normalize_text(self, text: str) -> str:
        """
        Lightweight text normalizer preserving layout, line breaks, and alphanumeric entities.
        """
        if not text:
            return ""
        # 1. Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # 2. Trim trailing spaces on each line
        lines = [line.rstrip() for line in text.split("\n")]
        cleaned = "\n".join(lines)
        # 3. Collapse 3+ newlines to max 2
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

    def has_usable_text(self, page: fitz.Page) -> bool:
        """
        Determines whether a PDF page contains usable embedded digital text,
        or is a scanned/rasterized/empty page requiring OCR.
        """
        raw_text = page.get_text("text") or ""
        # Count alphanumeric characters
        alnum_chars = sum(1 for c in raw_text if c.isalnum())
        words = raw_text.split()

        return alnum_chars >= self.min_embedded_chars and len(words) >= self.min_embedded_words

    def is_blank_page(self, page: fitz.Page) -> bool:
        """
        Detects whether a PDF page is completely devoid of text, images, and drawings.
        """
        raw_text = (page.get_text("text") or "").strip()
        if not raw_text:
            try:
                if len(page.get_images()) == 0 and len(page.get_drawings()) == 0:
                    return True
            except Exception:
                pass
        return False


    def extract_direct_text(self, page: fitz.Page) -> Tuple[str, float, int]:
        """
        Extracts digital vector text directly from a PDF page with 1.0 confidence.
        """
        raw_text = page.get_text("text") or ""
        normalized = self.normalize_text(raw_text)
        word_count = len(normalized.split())
        return normalized, 1.0, word_count

    def render_page_to_image(self, page: fitz.Page, dpi: Optional[int] = None) -> Image.Image:
        """
        Renders a PDF page to a high-resolution PIL Image for OCR processing.
        """
        target_dpi = dpi or self.default_dpi
        try:
            pix = page.get_pixmap(dpi=target_dpi)
            img_bytes = pix.tobytes("png")
            return Image.open(io.BytesIO(img_bytes))
        except Exception as exc:
            raise PDFProcessingError(f"Failed to rasterize page to image: {str(exc)}") from exc

    def open_document(self, file_path_or_bytes: Union[str, bytes]) -> fitz.Document:
        """
        Safely opens a PDF document from a filesystem path or raw bytes.
        """
        try:
            if isinstance(file_path_or_bytes, bytes):
                if not file_path_or_bytes:
                    raise PDFProcessingError("Document binary data is empty", code="EMPTY_DOCUMENT")
                return fitz.open(stream=file_path_or_bytes, filetype="pdf")
            else:
                path = Path(file_path_or_bytes)
                if not path.exists():
                    raise PDFProcessingError(f"File does not exist: {file_path_or_bytes}", code="FILE_NOT_FOUND")
                if path.stat().st_size == 0:
                    raise PDFProcessingError("Document file is empty (0 bytes)", code="EMPTY_DOCUMENT")
                return fitz.open(str(path))
        except PDFProcessingError:
            raise
        except Exception as exc:
            raise PDFProcessingError(f"Unable to read or parse PDF: {str(exc)}", code="CORRUPT_DOCUMENT") from exc
