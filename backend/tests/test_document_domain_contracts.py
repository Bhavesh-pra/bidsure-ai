"""
Unit tests for Main Developer 1 Document Domain Contracts & Protocols,
and verification of Partial Developer 2 Synthetic Data assets.
"""

import json
import os
from pathlib import Path
import pytest
from pydantic import ValidationError

from app.domain.document.schemas import (
    DocumentSchema,
    DocumentType,
    DocumentProcessingStatus,
)
from app.domain.document.contracts import (
    DocumentProcessingStage,
    DocumentLifecycleState,
    ALLOWED_DOCUMENT_EXTENSIONS,
    ALLOWED_DOCUMENT_MIME_TYPES,
    MAX_DOCUMENT_SIZE_BYTES,
    DocumentValidationContract,
    DocumentIngestionInput,
    DocumentIngestionResult,
    ExtractedPageText,
    DocumentProcessingResult,
    DocumentProcessingProtocol,
)


# ===========================================================================
# 1. Main Dev 1 — DocumentType & Canonical Enforcement Tests
# ===========================================================================

class TestDocumentTypeEnforcement:

    def test_canonical_document_types_exist(self):
        """Verify all 10 canonical document types exist."""
        expected_types = {
            "GST_CERTIFICATE",
            "PAN_CARD",
            "UDYAM_CERTIFICATE",
            "OEM_AUTHORIZATION",
            "FINANCIAL_STATEMENT",
            "TURNOVER_CERTIFICATE",
            "TECHNICAL_SPECIFICATION",
            "MAKE_IN_INDIA_DECLARATION",
            "EXPERIENCE_CERTIFICATE",
            "OTHER",
        }
        actual_types = {t.value for t in DocumentType}
        assert expected_types.issubset(actual_types)

    @pytest.mark.parametrize(
        "invalid_type",
        ["gst", "GST", "gstcertificate", "GST Certificate", "pan", "invoice", "random_string"],
    )
    def test_arbitrary_strings_rejected_by_schema(self, invalid_type):
        """Verify arbitrary strings cannot be passed as document_type."""
        with pytest.raises(ValidationError) as exc:
            DocumentSchema(
                id="DOC-001",
                document_type=invalid_type,
                original_filename="sample.pdf",
                storage_key="org/1/bids/1/documents/DOC-001",
                mime_type="application/pdf",
                size_bytes=1024,
                sha256="a" * 64,
            )
        assert "Invalid document_type" in str(exc.value)

    def test_valid_document_schema_succeeds(self):
        doc = DocumentSchema(
            id="DOC-001",
            document_type=DocumentType.GST_CERTIFICATE,
            original_filename="sample.pdf",
            storage_key="org/1/bids/1/documents/DOC-001",
            mime_type="application/pdf",
            size_bytes=1024,
            sha256="a" * 64,
            processing_status=DocumentProcessingStatus.UPLOADED,
        )
        assert doc.document_type == "GST_CERTIFICATE"
        assert doc.processing_status == "UPLOADED"


# ===========================================================================
# 2. Main Dev 1 — Lifecycle States & Stages Tests
# ===========================================================================

class TestDocumentLifecycleContracts:

    def test_lifecycle_states(self):
        assert DocumentLifecycleState.UPLOADED.value == "UPLOADED"
        assert DocumentLifecycleState.PROCESSING.value == "PROCESSING"
        assert DocumentLifecycleState.PROCESSED.value == "PROCESSED"
        assert DocumentLifecycleState.INVALID_DOCUMENT.value == "INVALID_DOCUMENT"
        assert DocumentLifecycleState.UNREADABLE.value == "UNREADABLE"
        assert DocumentLifecycleState.SUSPICIOUS.value == "SUSPICIOUS"

    def test_processing_stages(self):
        assert DocumentProcessingStage.INGESTION.value == "INGESTION"
        assert DocumentProcessingStage.OCR_EXTRACTION.value == "OCR_EXTRACTION"
        assert DocumentProcessingStage.CLASSIFICATION.value == "CLASSIFICATION"
        assert DocumentProcessingStage.EVIDENCE_EXTRACTION.value == "EVIDENCE_EXTRACTION"


# ===========================================================================
# 3. Main Dev 1 — Validation & Ingestion Contract Tests
# ===========================================================================

class TestValidationAndIngestionContracts:

    def test_valid_validation_contract(self):
        contract = DocumentValidationContract(
            filename="gst_cert.pdf",
            size_bytes=245812,
            mime_type="application/pdf",
            sha256="8ac7bfe4468ea7d2414844ef70557924e10e3d0413e0c86c2f75d8f0b9a144ca",
            extension=".pdf",
        )
        assert contract.filename == "gst_cert.pdf"
        assert contract.size_bytes == 245812

    def test_validation_contract_rejects_oversized_file(self):
        with pytest.raises(ValidationError):
            DocumentValidationContract(
                filename="large.pdf",
                size_bytes=MAX_DOCUMENT_SIZE_BYTES + 1,
                mime_type="application/pdf",
                sha256="a" * 64,
                extension=".pdf",
            )

    def test_validation_contract_rejects_disallowed_extension(self):
        with pytest.raises(ValidationError):
            DocumentValidationContract(
                filename="script.sh",
                size_bytes=500,
                mime_type="application/x-sh",
                sha256="a" * 64,
                extension=".sh",
            )

    def test_document_ingestion_input_validation(self):
        inp = DocumentIngestionInput(
            bid_id="BID-001",
            document_type=DocumentType.UDYAM_CERTIFICATE,
            original_filename="udyam.pdf",
            file_content=b"%PDF-1.4...",
            description="MSME certificate",
        )
        assert inp.document_type == "UDYAM_CERTIFICATE"

    def test_document_ingestion_result_serialization(self):
        res = DocumentIngestionResult(
            id="DOC-999",
            bid_id="BID-001",
            document_type="PAN_CARD",
            original_filename="pan.jpg",
            mime_type="image/jpeg",
            size_bytes=4500,
            sha256="b" * 64,
        )
        data = res.model_dump()
        assert data["id"] == "DOC-999"
        assert data["processing_status"] == "UPLOADED"
        assert "storage_key" not in data  # Path protection


# ===========================================================================
# 4. Main Dev 1 — Future Processing Protocol Adherence (Cycle 8 Preview)
# ===========================================================================

class DummyCycle8OcrProcessor:
    """Mock processor implementing the formal DocumentProcessingProtocol."""
    def process_document(
        self,
        document_id: str,
        bid_id: str,
        file_path: str,
        document_type: str,
        **kwargs,
    ) -> DocumentProcessingResult:
        page = ExtractedPageText(
            page_number=1,
            text="Synthetic text extracted via OCR",
            confidence=0.98,
            word_count=5,
        )
        return DocumentProcessingResult(
            document_id=document_id,
            bid_id=bid_id,
            stage=DocumentProcessingStage.OCR_EXTRACTION,
            status=DocumentLifecycleState.PROCESSED,
            page_count=1,
            pages=[page],
            raw_text="Synthetic text extracted via OCR",
            processing_time_ms=120,
        )


class TestFutureProcessingProtocol:

    def test_processor_implements_protocol(self):
        processor = DummyCycle8OcrProcessor()
        assert isinstance(processor, DocumentProcessingProtocol)

        result = processor.process_document(
            document_id="DOC-001",
            bid_id="BID-001",
            file_path="/path/to/file.pdf",
            document_type="GST_CERTIFICATE",
        )
        assert result.stage == "OCR_EXTRACTION"
        assert result.status == "PROCESSED"
        assert len(result.pages) == 1
        assert result.pages[0].confidence == 0.98


# ===========================================================================
# 5. Partial Dev 2 — Synthetic Data & Test Matrix Integrity Tests
# ===========================================================================

class TestSyntheticDataAndMetadataDataset:

    @pytest.fixture
    def mock_data_root(self):
        # Locate mock-data directory relative to repository root
        backend_dir = Path(__file__).resolve().parent.parent
        repo_root = backend_dir.parent
        return repo_root / "mock-data" / "documents"

    def test_metadata_dataset_json_exists_and_valid(self, mock_data_root):
        dataset_file = mock_data_root / "metadata_dataset.json"
        assert dataset_file.exists(), f"Missing dataset file: {dataset_file}"

        with open(dataset_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert data["cycle"] == 7
        assert "synthetic_documents" in data
        assert "test_matrix" in data

    def test_all_six_synthetic_documents_exist_with_valid_checksums(self, mock_data_root):
        expected_files = ["GST.pdf", "PAN.pdf", "Udyam.pdf", "OEM.pdf", "Financial.pdf", "Technical.pdf"]
        synthetic_dir = mock_data_root / "synthetic"

        dataset_file = mock_data_root / "metadata_dataset.json"
        with open(dataset_file, "r", encoding="utf-8") as f:
            dataset = json.load(f)

        import hashlib
        for fname in expected_files:
            fpath = synthetic_dir / fname
            assert fpath.exists(), f"Synthetic file {fname} not found"
            assert fpath.stat().st_size > 0, f"Synthetic file {fname} is empty"

            # Verify SHA-256 matches metadata dataset
            hasher = hashlib.sha256()
            hasher.update(fpath.read_bytes())
            actual_sha = hasher.hexdigest()

            expected_sha = dataset["synthetic_documents"][fname]["sha256"]
            assert actual_sha == expected_sha, f"SHA-256 mismatch for {fname}"

    def test_test_matrix_files_exist_and_match_specs(self, mock_data_root):
        matrix_dir = mock_data_root / "test-matrix"

        # 1. empty_pdf.pdf must be 0 bytes
        empty_f = matrix_dir / "empty_pdf.pdf"
        assert empty_f.exists() and empty_f.stat().st_size == 0

        # 2. large_pdf.pdf must exceed 10 MB
        large_f = matrix_dir / "large_pdf.pdf"
        assert large_f.exists() and large_f.stat().st_size > 10 * 1024 * 1024

        # 3. duplicate_pdf.pdf must match valid_pdf.pdf
        valid_f = matrix_dir / "valid_pdf.pdf"
        dup_f = matrix_dir / "duplicate_pdf.pdf"
        assert valid_f.exists() and dup_f.exists()
        assert valid_f.read_bytes() == dup_f.read_bytes()
