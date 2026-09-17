"""
Unit and Integration Tests for Main Developer 1 — OCR Service & PDF Processor (Cycle 8).
"""

import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ocr import (
    ExtractedPage,
    OCRDocumentResult,
    OCREngineType,
    PageExtractionMethod,
    PDFProcessor,
    PDFProcessingError,
    OCRService,
    TesseractEngine,
    TesseractNotFoundError,
)


@pytest.fixture
def ocr_docs_dir():
    # Base path to the generated test documents
    base = Path(__file__).parent.parent.parent / "tests" / "ocr" / "documents"
    return base


@pytest.fixture
def pdf_processor():
    return PDFProcessor()


@pytest.fixture
def mock_tesseract():
    mock = MagicMock(spec=TesseractEngine)
    mock.is_available.return_value = True
    mock.extract_text_and_confidence.return_value = (
        "MOCK SCANNED DOCUMENT TEXT\nPAN: AABCA1234F\nName: APEX INFOTECH",
        0.92,
        8,
    )
    return mock


@pytest.fixture
def ocr_service(mock_tesseract, pdf_processor):
    return OCRService(tesseract_engine=mock_tesseract, pdf_processor=pdf_processor)


# ===========================================================================
# PDFProcessor Unit Tests
# ===========================================================================

def test_pdf_processor_text_normalization(pdf_processor):
    raw = "Line 1   \r\nLine 2\r\n\r\n\r\n\r\nLine 3  "
    normalized = pdf_processor.normalize_text(raw)
    assert normalized == "Line 1\nLine 2\n\nLine 3"


def test_pdf_processor_preserves_identifiers(pdf_processor):
    raw = "GSTIN: 27AABCA1234F1Z8\nPAN: AABCA1234F\nDate: 15/07/2017\nAmount: Rs. 7,50,000"
    normalized = pdf_processor.normalize_text(raw)
    assert "27AABCA1234F1Z8" in normalized
    assert "AABCA1234F" in normalized
    assert "15/07/2017" in normalized
    assert "Rs. 7,50,000" in normalized


def test_pdf_processor_detects_usable_embedded_text(pdf_processor, ocr_docs_dir):
    gst_path = ocr_docs_dir / "01_gst_clear_text.pdf"
    assert gst_path.exists(), "01_gst_clear_text.pdf must exist"

    doc = pdf_processor.open_document(str(gst_path))
    assert len(doc) == 2

    # Page 1 has clear digital text
    assert pdf_processor.has_usable_text(doc[0]) is True
    # Page 2 has clear digital text
    assert pdf_processor.has_usable_text(doc[1]) is True
    doc.close()


def test_pdf_processor_detects_scanned_raster_page(pdf_processor, ocr_docs_dir):
    pan_scanned = ocr_docs_dir / "02_pan_scanned_image.pdf"
    assert pan_scanned.exists(), "02_pan_scanned_image.pdf must exist"

    doc = pdf_processor.open_document(str(pan_scanned))
    assert len(doc) == 1
    # Pure raster page has no text stream
    assert pdf_processor.has_usable_text(doc[0]) is False
    doc.close()


def test_pdf_processor_detects_empty_page(pdf_processor, ocr_docs_dir):
    empty_path = ocr_docs_dir / "06_empty.pdf"
    assert empty_path.exists()

    doc = pdf_processor.open_document(str(empty_path))
    assert len(doc) == 1
    assert pdf_processor.has_usable_text(doc[0]) is False
    doc.close()


# ===========================================================================
# OCRService Integration Tests
# ===========================================================================

def test_direct_text_extraction_on_clear_pdf(ocr_service, ocr_docs_dir):
    gst_path = str(ocr_docs_dir / "01_gst_clear_text.pdf")

    result = ocr_service.process_document(
        document_id="DOC-GST-001",
        file_path=gst_path,
        bid_id="BID-001",
    )

    assert result.document_id == "DOC-GST-001"
    assert result.bid_id == "BID-001"
    assert result.processing_status == "PROCESSED"
    assert result.page_count == 2
    assert len(result.pages) == 2

    # Page 1 Verification
    p1 = result.pages[0]
    assert p1.page_number == 1
    assert p1.confidence == 1.0
    assert p1.extraction_method == PageExtractionMethod.EMBEDDED_TEXT
    assert "27AABCA1234F1Z8" in p1.text
    assert "Apex Infotech" in p1.text

    # Page 2 Verification
    p2 = result.pages[1]
    assert p2.page_number == 2
    assert p2.confidence == 1.0
    assert p2.extraction_method == PageExtractionMethod.EMBEDDED_TEXT
    assert "AABCA1234F" in p2.text

    # Total & Aggregated
    assert result.average_confidence == 1.0
    assert "27AABCA1234F1Z8" in result.raw_text
    assert "AABCA1234F" in result.raw_text


def test_multipage_pdf_page_aware_isolation(ocr_service, ocr_docs_dir):
    oem_path = str(ocr_docs_dir / "03_oem_multipage.pdf")

    result = ocr_service.process_document(
        document_id="DOC-OEM-003",
        file_path=oem_path,
    )

    assert result.processing_status == "PROCESSED"
    assert result.page_count == 3
    assert len(result.pages) == 3

    # Check that pages are sequentially indexed
    for idx, page in enumerate(result.pages):
        assert page.page_number == idx + 1
        assert page.confidence == 1.0

    # Ensure page content is isolated
    assert "OEM-AUTH-2026-089" in result.pages[0].text
    assert "OEM-AUTH-2026-089" not in result.pages[1].text
    assert "Catalyst 9300" in result.pages[1].text
    assert "Non-Blacklisting" in result.pages[2].text


def test_scanned_pdf_routes_to_ocr_engine(ocr_service, mock_tesseract, ocr_docs_dir):
    pan_path = str(ocr_docs_dir / "02_pan_scanned_image.pdf")

    result = ocr_service.process_document(
        document_id="DOC-PAN-002",
        file_path=pan_path,
    )

    assert result.processing_status == "PROCESSED"
    assert result.page_count == 1
    p1 = result.pages[0]
    assert p1.extraction_method == PageExtractionMethod.OCR
    assert p1.confidence == 0.92
    assert "PAN: AABCA1234F" in p1.text

    # Verify mock_tesseract was called
    mock_tesseract.extract_text_and_confidence.assert_called_once()


def test_empty_pdf_returns_unreadable_status(ocr_service, ocr_docs_dir):
    empty_path = str(ocr_docs_dir / "06_empty.pdf")

    # Empty PDF with a mock returning empty text
    empty_mock = MagicMock(spec=TesseractEngine)
    empty_mock.is_available.return_value = True
    empty_mock.extract_text_and_confidence.return_value = ("", 0.0, 0)

    svc = OCRService(tesseract_engine=empty_mock)
    result = svc.process_document(
        document_id="DOC-EMPTY-001",
        file_path=empty_path,
    )

    assert result.processing_status == "UNREADABLE"
    assert result.page_count == 1
    assert result.pages[0].word_count == 0


def test_corrupted_pdf_returns_processing_failed(ocr_service, tmp_path):
    corrupt_file = tmp_path / "corrupt.pdf"
    corrupt_file.write_bytes(b"%PDF-1.4\nCorrupted content non-parsable %%%EOF")

    result = ocr_service.process_document(
        document_id="DOC-CORRUPT",
        file_path=str(corrupt_file),
    )

    assert result.processing_status == "PROCESSING_FAILED"
    assert result.error_code in ("CORRUPT_DOCUMENT", "PDF_PROCESSING_ERROR")
    assert result.error_message is not None


def test_missing_file_returns_processing_failed(ocr_service):
    result = ocr_service.process_document(
        document_id="DOC-MISSING",
        file_path="non_existent_file_path.pdf",
    )

    assert result.processing_status == "PROCESSING_FAILED"
    assert result.error_code == "FILE_NOT_FOUND"


def test_standalone_image_processing(ocr_service, mock_tesseract, ocr_docs_dir):
    img_path = str(ocr_docs_dir / "07_scanned_pan.png")
    assert Path(img_path).exists()

    result = ocr_service.process_document(
        document_id="DOC-IMG-001",
        file_path=img_path,
    )

    assert result.processing_status == "PROCESSED"
    assert result.page_count == 1
    assert result.pages[0].extraction_method == PageExtractionMethod.OCR
    assert result.pages[0].confidence == 0.92


def test_tesseract_engine_not_found_handling():
    with patch("shutil.which", return_value=None):
        with patch.dict(os.environ, {}, clear=True):
            engine = TesseractEngine(custom_cmd="non_existent_tesseract.exe")
            # When probing is_available
            assert engine.is_available() is False

            # When extract is called
            with pytest.raises(TesseractNotFoundError) as exc_info:
                from PIL import Image
                dummy_img = Image.new("RGB", (100, 100))
                engine.extract_text_and_confidence(dummy_img)

            assert exc_info.value.code == "TESSERACT_NOT_FOUND"
