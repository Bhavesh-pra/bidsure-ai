"""
Tests for Partial Developer 2 — OCR Test Dataset & Ground Truth Verification (Cycle 8).
"""

import os
import sys
from pathlib import Path
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ocr import OCRService, PDFProcessor


@pytest.fixture
def ocr_dataset_dirs():
    root = Path(__file__).parent.parent.parent / "tests" / "ocr"
    docs_dir = root / "documents"
    expected_dir = root / "expected"
    readme_path = root / "README.md"
    return docs_dir, expected_dir, readme_path


def test_ocr_test_dataset_structure(ocr_dataset_dirs):
    docs_dir, expected_dir, readme_path = ocr_dataset_dirs

    assert docs_dir.exists() and docs_dir.is_dir()
    assert expected_dir.exists() and expected_dir.is_dir()
    assert readme_path.exists()

    required_documents = [
        "01_gst_clear_text.pdf",
        "02_pan_scanned_image.pdf",
        "03_oem_multipage.pdf",
        "04_udyam_low_quality.pdf",
        "05_rotated_page.pdf",
        "06_empty.pdf",
        "07_scanned_pan.png",
        "08_scanned_pan.jpg",
    ]
    for doc_name in required_documents:
        doc_file = docs_dir / doc_name
        assert doc_file.exists(), f"Missing required test document: {doc_name}"
        assert doc_file.stat().st_size > 0, f"Test document is 0 bytes: {doc_name}"

    required_expected = [
        "gst_page_1.txt",
        "gst_page_2.txt",
        "pan_page_1.txt",
        "oem_page_1.txt",
        "oem_page_2.txt",
        "oem_page_3.txt",
        "udyam_page_1.txt",
        "scanned_pan.txt",
    ]
    for exp_name in required_expected:
        exp_file = expected_dir / exp_name
        assert exp_file.exists(), f"Missing expected text file: {exp_name}"
        assert len(exp_file.read_text(encoding="utf-8").strip()) > 0


def test_gst_clear_text_matches_expected_ground_truth(ocr_dataset_dirs):
    docs_dir, expected_dir, _ = ocr_dataset_dirs
    gst_pdf = docs_dir / "01_gst_clear_text.pdf"

    svc = OCRService()
    result = svc.process_document(document_id="DOC-TEST-GST", file_path=str(gst_pdf))

    assert result.processing_status == "PROCESSED"
    assert result.page_count == 2

    # Verify Page 1 key tokens against ground truth
    exp_p1 = (expected_dir / "gst_page_1.txt").read_text(encoding="utf-8")
    actual_p1 = result.pages[0].text

    assert "27AABCA1234F1Z8" in actual_p1
    assert "Apex Infotech Systems Private Limited" in actual_p1
    assert "Standard Regular Taxpayer" in actual_p1

    # Verify Page 2 key tokens
    exp_p2 = (expected_dir / "gst_page_2.txt").read_text(encoding="utf-8")
    actual_p2 = result.pages[1].text

    assert "Rajesh Sharma" in actual_p2
    assert "AABCA1234F" in actual_p2


def test_oem_multipage_matches_expected_ground_truth(ocr_dataset_dirs):
    docs_dir, expected_dir, _ = ocr_dataset_dirs
    oem_pdf = docs_dir / "03_oem_multipage.pdf"

    svc = OCRService()
    result = svc.process_document(document_id="DOC-TEST-OEM", file_path=str(oem_pdf))

    assert result.processing_status == "PROCESSED"
    assert result.page_count == 3

    assert "OEM-AUTH-2026-089" in result.pages[0].text
    assert "Cisco Systems India Pvt Ltd" in result.pages[0].text
    assert "Catalyst 9300" in result.pages[1].text
    assert "Genuine Spares Certificate" in result.pages[2].text
