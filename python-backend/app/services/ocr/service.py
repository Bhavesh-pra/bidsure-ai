"""
OCR Service Orchestrator for BidSure AI — Cycle 8.

Coordinates document opening, per-page digital/OCR extraction, text normalization,
and error handling, returning page-aware raw text results.
"""

import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from PIL import Image

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

logger = logging.getLogger("bidsure.ocr")


class OCRService:
    """
    Production-grade, page-aware OCR service.
    Implements hybrid digital-text / raster-OCR pipeline.
    """

    def __init__(
        self,
        tesseract_engine: Optional[TesseractEngine] = None,
        pdf_processor: Optional[PDFProcessor] = None,
    ):
        self.tesseract_engine = tesseract_engine or TesseractEngine()
        self.pdf_processor = pdf_processor or PDFProcessor()

    def process_document(
        self,
        document_id: str,
        file_path: str,
        bid_id: Optional[str] = None,
        document_type: Optional[str] = None,
        **kwargs: Any,
    ) -> OCRDocumentResult:
        """
        Executes page-aware extraction on a document (PDF or Image).

        Args:
            document_id: Unique document identifier (e.g. DOC-001)
            file_path: Path to the target document on local disk
            bid_id: Optional parent bid identifier
            document_type: Optional classified document type

        Returns:
            OCRDocumentResult with per-page text, confidence, and status.
        """
        start_time = time.time()
        logger.info("[%s] Document processing started for file: %s", document_id, file_path)

        path = Path(file_path)
        if not path.exists():
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error("[%s] File not found: %s", document_id, file_path)
            return OCRDocumentResult(
                document_id=document_id,
                bid_id=bid_id,
                processing_status="PROCESSING_FAILED",
                ocr_engine=OCREngineType.DIRECT_EXTRACTION.value,
                error_code="FILE_NOT_FOUND",
                error_message=f"Target file does not exist: {file_path}",
                processing_time_ms=duration_ms,
            )

        if path.stat().st_size == 0:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.warning("[%s] Document file is empty (0 bytes)", document_id)
            return OCRDocumentResult(
                document_id=document_id,
                bid_id=bid_id,
                processing_status="UNREADABLE",
                ocr_engine=OCREngineType.DIRECT_EXTRACTION.value,
                error_code="EMPTY_FILE",
                error_message="Uploaded document file is 0 bytes.",
                processing_time_ms=duration_ms,
            )

        try:
            # Route based on file type
            if self.pdf_processor.is_image_file(str(path)):
                return self._process_image(document_id, bid_id, path, start_time)
            else:
                return self._process_pdf(document_id, bid_id, path, start_time)

        except (PDFProcessingError, OCREngineError, Exception) as exc:
            duration_ms = int((time.time() - start_time) * 1000)
            error_code = getattr(exc, "code", "PROCESSING_ERROR")
            logger.exception("[%s] Unexpected failure during document processing: %s", document_id, exc)
            return OCRDocumentResult(
                document_id=document_id,
                bid_id=bid_id,
                processing_status="PROCESSING_FAILED",
                ocr_engine=OCREngineType.TESSERACT.value,
                error_code=error_code,
                error_message=str(exc),
                processing_time_ms=duration_ms,
            )

    def _process_image(
        self,
        document_id: str,
        bid_id: Optional[str],
        path: Path,
        start_time: float,
    ) -> OCRDocumentResult:
        """Processes a standalone image file (JPG/PNG) as a single page."""
        logger.info("[%s] Processing standalone image file via OCR engine", document_id)
        try:
            image = Image.open(str(path))
        except Exception as exc:
            duration_ms = int((time.time() - start_time) * 1000)
            return OCRDocumentResult(
                document_id=document_id,
                bid_id=bid_id,
                processing_status="PROCESSING_FAILED",
                ocr_engine=OCREngineType.TESSERACT.value,
                error_code="INVALID_IMAGE",
                error_message=f"Unable to read image file: {str(exc)}",
                processing_time_ms=duration_ms,
            )

        text, confidence, word_count = self.tesseract_engine.extract_text_and_confidence(image)
        normalized = self.pdf_processor.normalize_text(text)
        duration_ms = int((time.time() - start_time) * 1000)

        page = ExtractedPage(
            page_number=1,
            text=normalized,
            confidence=confidence,
            word_count=word_count,
            char_count=len(normalized),
            extraction_method=PageExtractionMethod.OCR,
            metadata={"width": image.width, "height": image.height, "format": image.format},
        )

        status = "PROCESSED" if word_count > 0 else "UNREADABLE"
        return OCRDocumentResult(
            document_id=document_id,
            bid_id=bid_id,
            processing_status=status,
            ocr_engine=OCREngineType.TESSERACT.value,
            page_count=1,
            pages=[page],
            raw_text=normalized,
            average_confidence=confidence,
            processing_time_ms=duration_ms,
        )

    def _process_pdf(
        self,
        document_id: str,
        bid_id: Optional[str],
        path: Path,
        start_time: float,
    ) -> OCRDocumentResult:
        """Processes a PDF file page-by-page using hybrid digital/raster extraction."""
        doc = self.pdf_processor.open_document(str(path))
        page_count = len(doc)

        if page_count == 0:
            doc.close()
            duration_ms = int((time.time() - start_time) * 1000)
            return OCRDocumentResult(
                document_id=document_id,
                bid_id=bid_id,
                processing_status="UNREADABLE",
                ocr_engine=OCREngineType.DIRECT_EXTRACTION.value,
                page_count=0,
                error_code="NO_PAGES",
                error_message="PDF contains 0 pages.",
                processing_time_ms=duration_ms,
            )

        extracted_pages: List[ExtractedPage] = []
        engine_used = OCREngineType.DIRECT_EXTRACTION.value
        has_any_ocr = False

        try:
            for page_idx in range(page_count):
                page_start = time.time()
                page_num = page_idx + 1
                page = doc[page_idx]

                logger.info("[%s] Page %d: Processing started", document_id, page_num)

                if self.pdf_processor.has_usable_text(page):
                    # Fast-path: crisp embedded vector text
                    text, confidence, word_count = self.pdf_processor.extract_direct_text(page)
                    method = PageExtractionMethod.EMBEDDED_TEXT
                    logger.info("[%s] Page %d: Direct text extraction used (%d words)", document_id, page_num, word_count)
                elif self.pdf_processor.is_blank_page(page):
                    # Empty page: no text, images, or drawings
                    text = ""
                    confidence = 0.0
                    word_count = 0
                    method = PageExtractionMethod.EMBEDDED_TEXT
                    logger.info("[%s] Page %d: Blank page detected", document_id, page_num)
                else:
                    # Slow-path: rasterize and run OCR
                    has_any_ocr = True
                    engine_used = OCREngineType.TESSERACT.value
                    logger.info("[%s] Page %d: Scanned/image page detected, invoking OCR engine", document_id, page_num)
                    page_img = self.pdf_processor.render_page_to_image(page)
                    text, confidence, word_count = self.tesseract_engine.extract_text_and_confidence(page_img)
                    text = self.pdf_processor.normalize_text(text)
                    method = PageExtractionMethod.OCR
                    logger.info(
                        "[%s] Page %d: OCR complete (%d words, confidence=%.2f)",
                        document_id, page_num, word_count, confidence
                    )


                page_duration_ms = int((time.time() - page_start) * 1000)
                extracted_pages.append(
                    ExtractedPage(
                        page_number=page_num,
                        text=text,
                        confidence=confidence,
                        word_count=word_count,
                        char_count=len(text),
                        extraction_method=method,
                        metadata={
                            "processing_time_ms": page_duration_ms,
                            "page_width": page.rect.width,
                            "page_height": page.rect.height,
                        },
                    )
                )

        finally:
            doc.close()

        duration_ms = int((time.time() - start_time) * 1000)
        total_words = sum(p.word_count for p in extracted_pages)
        avg_confidence = (
            round(sum(p.confidence for p in extracted_pages) / len(extracted_pages), 4)
            if extracted_pages else 0.0
        )
        combined_text = "\n\n--- PAGE BREAK ---\n\n".join(
            f"[Page {p.page_number}]\n{p.text}" for p in extracted_pages if p.text
        )

        # Determine status
        if total_words == 0:
            status = "UNREADABLE"
        else:
            status = "PROCESSED"

        final_engine = OCREngineType.TESSERACT.value if has_any_ocr else OCREngineType.DIRECT_EXTRACTION.value

        logger.info(
            "[%s] Document processing finished: status=%s, pages=%d, words=%d, duration=%dms",
            document_id, status, page_count, total_words, duration_ms
        )

        return OCRDocumentResult(
            document_id=document_id,
            bid_id=bid_id,
            processing_status=status,
            ocr_engine=final_engine,
            page_count=page_count,
            pages=extracted_pages,
            raw_text=combined_text,
            average_confidence=avg_confidence,
            processing_time_ms=duration_ms,
        )
