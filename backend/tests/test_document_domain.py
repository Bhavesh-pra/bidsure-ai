import pytest
from datetime import datetime
from pydantic import ValidationError

from app.domain.document import (
    DocumentType,
    DocumentStatus,
    DocumentSchema,
    DocumentValidationRules,
    InvalidFileTypeError,
    FileTooLargeError,
    CorruptFileError,
    BaseDocumentProcessor
)

def test_document_type_enum():
    """Verify canonical DocumentType enumeration values."""
    assert DocumentType.GST_CERTIFICATE == "GST_CERTIFICATE"
    assert DocumentType.PAN_CARD == "PAN_CARD"
    assert DocumentType.UDYAM_CERTIFICATE == "UDYAM_CERTIFICATE"
    assert DocumentType.OEM_AUTHORIZATION == "OEM_AUTHORIZATION"
    assert DocumentType.FINANCIAL_STATEMENT == "FINANCIAL_STATEMENT"
    assert DocumentType.TURNOVER_CERTIFICATE == "TURNOVER_CERTIFICATE"
    assert DocumentType.TECHNICAL_SPECIFICATION == "TECHNICAL_SPECIFICATION"
    assert DocumentType.MAKE_IN_INDIA_DECLARATION == "MAKE_IN_INDIA_DECLARATION"
    assert DocumentType.EXPERIENCE_CERTIFICATE == "EXPERIENCE_CERTIFICATE"
    assert DocumentType.OTHER == "OTHER"

    # Enforce exact enum validation
    with pytest.raises(ValueError):
        DocumentType("gst")

    with pytest.raises(ValueError):
        DocumentType("GST Certificate")

def test_document_status_enum():
    """Verify DocumentStatus enumeration values."""
    assert DocumentStatus.UPLOADED == "UPLOADED"
    assert DocumentStatus.PROCESSING == "PROCESSING"
    assert DocumentStatus.PROCESSED == "PROCESSED"
    assert DocumentStatus.INVALID == "INVALID"
    assert DocumentStatus.UNREADABLE == "UNREADABLE"
    assert DocumentStatus.SUSPICIOUS == "SUSPICIOUS"

def test_document_schema_validation():
    """Verify DocumentSchema instantiation and defaults."""
    doc = DocumentSchema(
        id="DOC001",
        bid_id="BID001",
        document_type=DocumentType.GST_CERTIFICATE,
        original_filename="gst.pdf",
        storage_key="org/ORG001/bids/BID001/documents/DOC001",
        mime_type="application/pdf",
        size_bytes=245812,
        sha256="a"*64
    )
    assert doc.id == "DOC001"
    assert doc.document_type == DocumentType.GST_CERTIFICATE
    assert doc.processing_status == DocumentStatus.UPLOADED
    assert doc.filename == "gst.pdf"
    assert doc.file_path == "org/ORG001/bids/BID001/documents/DOC001"

def test_document_validation_rules_extension():
    assert DocumentValidationRules.validate_extension("tax_file.pdf") is True
    assert DocumentValidationRules.validate_extension("photo.jpg") is True
    assert DocumentValidationRules.validate_extension("photo.jpeg") is True
    assert DocumentValidationRules.validate_extension("scan.png") is True
    assert DocumentValidationRules.validate_extension("executable.exe") is False
    assert DocumentValidationRules.validate_extension("archive.zip") is False
    assert DocumentValidationRules.validate_extension("noextension") is False

def test_document_validation_rules_size():
    assert DocumentValidationRules.validate_size(1000) is True
    assert DocumentValidationRules.validate_size(10 * 1024 * 1024) is True  # 10 MB
    assert DocumentValidationRules.validate_size(10 * 1024 * 1024 + 1) is False  # > 10 MB
    assert DocumentValidationRules.validate_size(0) is False

def test_document_validation_rules_mime():
    assert DocumentValidationRules.validate_mime_type("application/pdf") is True
    assert DocumentValidationRules.validate_mime_type("image/jpeg") is True
    assert DocumentValidationRules.validate_mime_type("image/png") is True
    assert DocumentValidationRules.validate_mime_type("application/zip") is False

def test_document_validation_rules_sha256():
    valid_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    invalid_hash = "not_a_hash"
    assert DocumentValidationRules.validate_sha256(valid_hash) is True
    assert DocumentValidationRules.validate_sha256(invalid_hash) is False

def test_document_validation_rules_magic_bytes():
    assert DocumentValidationRules.validate_magic_bytes(b"%PDF-1.4...", "application/pdf") is True
    assert DocumentValidationRules.validate_magic_bytes(b"\x89PNG\r\n\x1a\n...", "image/png") is True
    assert DocumentValidationRules.validate_magic_bytes(b"\xff\xd8\xff...", "image/jpeg") is True
    assert DocumentValidationRules.validate_magic_bytes(b"INVALID", "application/pdf") is False

def test_validate_document_metadata_exceptions():
    # Invalid extension
    with pytest.raises(InvalidFileTypeError):
        DocumentValidationRules.validate_document_metadata("bad.exe", "application/pdf", 1000)

    # Invalid MIME type
    with pytest.raises(InvalidFileTypeError):
        DocumentValidationRules.validate_document_metadata("file.pdf", "application/x-executable", 1000)

    # File too large (> 10MB)
    with pytest.raises(FileTooLargeError):
        DocumentValidationRules.validate_document_metadata("file.pdf", "application/pdf", 15 * 1024 * 1024)

    # Corrupt / 0 bytes file
    with pytest.raises(CorruptFileError):
        DocumentValidationRules.validate_document_metadata("file.pdf", "application/pdf", 0)

def test_base_document_processor_abstract():
    with pytest.raises(TypeError):
        BaseDocumentProcessor()
