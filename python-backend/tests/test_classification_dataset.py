"""
Tests for Partial Developer 2 — Classification Dataset & Ground Truth Benchmark (Cycle 9).

Validates:
  - Dataset manifest integrity and file existence
  - Rules reference taxonomy completeness
  - 100% benchmark classification accuracy against all synthetic test documents
  - Seamless handoff from Cycle 8 OCR ground truth texts to Cycle 9 Classifier
"""

import json
from pathlib import Path
import pytest

from app.services.classification import (
    ClassificationStatus,
    DocumentClassifier,
    DocumentType,
)


@pytest.fixture
def classification_dir():
    return Path(__file__).parent.parent.parent / "tests" / "classification"


@pytest.fixture
def manifest_data(classification_dir):
    manifest_path = classification_dir / "dataset_manifest.json"
    assert manifest_path.exists(), "dataset_manifest.json must exist"
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def classifier():
    return DocumentClassifier()


# ===========================================================================
# 1. Dataset Manifest and Taxonomy Verification
# ===========================================================================

def test_manifest_structure_and_file_existence(classification_dir, manifest_data):
    """Verifies that all entries in the manifest point to existing, valid files."""
    assert len(manifest_data) >= 14, "Manifest must contain at least 14 benchmark samples"

    canonical_types = {t.value for t in DocumentType}
    canonical_statuses = {s.value for s in ClassificationStatus}

    for item in manifest_data:
        assert "id" in item
        assert "text_file" in item
        assert "expected_type" in item
        assert item["expected_type"] in canonical_types, f"Invalid expected_type: {item['expected_type']}"
        assert item["expected_status"] in canonical_statuses, f"Invalid expected_status: {item['expected_status']}"
        assert 0.0 <= item["min_confidence"] <= 1.0

        txt_path = classification_dir / item["text_file"]
        assert txt_path.exists(), f"Missing text file: {item['text_file']}"

        # If PDF was generated, verify existence
        if item.get("pdf_file"):
            pdf_path = classification_dir / item["pdf_file"]
            assert pdf_path.exists(), f"Missing PDF file: {item['pdf_file']}"


def test_rules_reference_taxonomy(classification_dir):
    """Verifies that rules_reference.json contains definitions for all 10 document types."""
    rules_path = classification_dir / "rules_reference.json"
    assert rules_path.exists(), "rules_reference.json must exist"

    with open(rules_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    doc_types = data.get("document_types", {})
    expected_types = [t.value for t in DocumentType if t != DocumentType.UNKNOWN]

    for expected in expected_types:
        assert expected in doc_types, f"Missing rules reference for {expected}"
        entry = doc_types[expected]
        assert len(entry["exact_phrases"]) > 0
        assert len(entry["strong_keywords"]) > 0
        assert len(entry["supporting_keywords"]) > 0


# ===========================================================================
# 2. Benchmark Accuracy Evaluation (100% Pass Required)
# ===========================================================================

def test_benchmark_accuracy_against_classifier(classification_dir, manifest_data, classifier):
    """
    Evaluates every sample in the synthetic benchmark dataset against the classifier.
    Asserts exact matching of expected document type, status, and minimum confidence.
    """
    for item in manifest_data:
        txt_path = classification_dir / item["text_file"]
        content = txt_path.read_text(encoding="utf-8")

        res = classifier.classify(content, document_id=item["id"])
        doc_type_val = res.document_type.value if hasattr(res.document_type, "value") else str(res.document_type)
        status_val = res.status.value if hasattr(res.status, "value") else str(res.status)

        assert doc_type_val == item["expected_type"], (
            f"Sample {item['id']} failed classification: "
            f"expected {item['expected_type']}, got {doc_type_val} "
            f"(confidence={res.confidence}, status={status_val})"
        )
        assert status_val == item["expected_status"], (
            f"Sample {item['id']} status mismatch: "
            f"expected {item['expected_status']}, got {status_val}"
        )
        assert res.confidence >= item["min_confidence"], (
            f"Sample {item['id']} confidence below threshold: "
            f"expected >= {item['min_confidence']}, got {res.confidence}"
        )


# ===========================================================================
# 3. Cycle 8 OCR Ground Truth Integration Verification
# ===========================================================================

def test_cycle8_ocr_ground_truth_handoff(classifier):
    """
    Ensures that ground truth text outputs from the Cycle 8 OCR pipeline
    correctly classify into their respective categories under Cycle 9.
    """
    ocr_expected_dir = Path(__file__).parent.parent.parent / "tests" / "ocr" / "expected"
    assert ocr_expected_dir.exists(), "tests/ocr/expected directory must exist from Cycle 8"

    # 1. GST OCR Ground Truth
    gst_txt = (ocr_expected_dir / "gst_page_1.txt").read_text(encoding="utf-8")
    res_gst = classifier.classify(gst_txt, document_id="DOC-OCR-GST")
    assert res_gst.document_type == DocumentType.GST_CERTIFICATE
    assert res_gst.status == ClassificationStatus.CLASSIFIED
    assert res_gst.confidence >= 0.85

    # 2. PAN OCR Ground Truth
    pan_txt = (ocr_expected_dir / "pan_page_1.txt").read_text(encoding="utf-8")
    res_pan = classifier.classify(pan_txt, document_id="DOC-OCR-PAN")
    assert res_pan.document_type == DocumentType.PAN_DOCUMENT
    assert res_pan.status == ClassificationStatus.CLASSIFIED
    assert res_pan.confidence >= 0.85

    # 3. OEM OCR Ground Truth
    oem_txt = (ocr_expected_dir / "oem_page_1.txt").read_text(encoding="utf-8")
    res_oem = classifier.classify(oem_txt, document_id="DOC-OCR-OEM")
    assert res_oem.document_type == DocumentType.OEM_AUTHORIZATION
    assert res_oem.status == ClassificationStatus.CLASSIFIED
    assert res_oem.confidence >= 0.85

    # 4. Udyam OCR Ground Truth
    udyam_txt = (ocr_expected_dir / "udyam_page_1.txt").read_text(encoding="utf-8")
    res_udyam = classifier.classify(udyam_txt, document_id="DOC-OCR-UDYAM")
    assert res_udyam.document_type == DocumentType.UDYAM_CERTIFICATE
    assert res_udyam.status == ClassificationStatus.CLASSIFIED
    assert res_udyam.confidence >= 0.85
