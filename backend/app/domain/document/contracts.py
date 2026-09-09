"""
Document Domain Contracts & Processing Interfaces for BidSure AI.

Main Developer 1 Deliverables (Cycle 7):
  - DocumentType validation rules
  - DocumentLifecycleState formalization
  - DocumentValidationContract & DocumentIngestionInput/Result
  - Future DocumentProcessingProtocol for Cycle 8 (OCR), Cycle 9 (Classification),
    and Cycle 10 (Evidence Extraction)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Protocol, Set, runtime_checkable
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.document.schemas import DocumentType, DocumentProcessingStatus


class DocumentProcessingStage(str, Enum):
    """Lifecycle stages across the document processing pipeline."""
    INGESTION = "INGESTION"                  # Cycle 7: upload, validation, storage, metadata
    OCR_EXTRACTION = "OCR_EXTRACTION"        # Cycle 8: PDF/image text and page extraction
    CLASSIFICATION = "CLASSIFICATION"        # Cycle 9: document type classification
    EVIDENCE_EXTRACTION = "EVIDENCE_EXTRACTION"  # Cycle 10: structured entities & evidence


class DocumentLifecycleState(str, Enum):
    """
    Formal document processing states.
    For Cycle 7: initial upload sets UPLOADED.
    Future cycles transition to PROCESSING -> PROCESSED, or error states.
    """
    UPLOADED = "UPLOADED"                    # Stored securely, awaiting extraction (Cycle 7 resting state)
    PROCESSING = "PROCESSING"                # Ingestion/OCR/extraction in progress
    PROCESSED = "PROCESSED"                  # All pipeline stages completed successfully
    INVALID_DOCUMENT = "INVALID_DOCUMENT"    # Format, signature, or structure invalid
    UNREADABLE = "UNREADABLE"                # OCR failed to extract meaningful text
    SUSPICIOUS = "SUSPICIOUS"                # Integrity check, tampering, or mismatch detected


# Supported formats for Cycle 7 ingestion
ALLOWED_DOCUMENT_EXTENSIONS: Set[str] = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_DOCUMENT_MIME_TYPES: Set[str] = {
    "application/pdf",
    "application/x-pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}
MAX_DOCUMENT_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB per file


class DocumentValidationContract(BaseModel):
    """
    Contract for validating an uploaded file before storage.
    Enforces maximum size, allowed extensions, and MIME types.
    """
    filename: str = Field(..., min_length=1, max_length=255, description="Sanitized original filename")
    size_bytes: int = Field(..., gt=0, le=MAX_DOCUMENT_SIZE_BYTES, description="File size in bytes (max 10 MB)")
    mime_type: str = Field(..., description="Canonical MIME content type")
    sha256: str = Field(..., min_length=64, max_length=64, description="Cryptographic SHA-256 hex digest")
    extension: str = Field(..., description="File extension including dot")

    model_config = ConfigDict(use_enum_values=True)

    @field_validator("extension")
    @classmethod
    def validate_extension(cls, v: str) -> str:
        norm = v.lower().strip()
        if norm not in ALLOWED_DOCUMENT_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))
            raise ValueError(f"Extension '{v}' not allowed. Must be one of: {allowed}")
        return norm

    @field_validator("mime_type")
    @classmethod
    def validate_mime(cls, v: str) -> str:
        norm = v.lower().strip()
        if norm not in ALLOWED_DOCUMENT_MIME_TYPES:
            raise ValueError(f"MIME type '{v}' not allowed for bidder documents.")
        return norm

    @field_validator("sha256")
    @classmethod
    def validate_sha256(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) != 64 or not all(c in "0123456789abcdef" for c in v):
            raise ValueError("SHA-256 must be a 64-character lowercase hex string.")
        return v


class DocumentIngestionInput(BaseModel):
    """
    Typed input contract for ingesting a document against a specific bid in Cycle 7.
    """
    bid_id: str = Field(..., min_length=1, description="Associated bid identifier")
    document_type: DocumentType = Field(..., description="Canonical document type enum")
    original_filename: str = Field(..., min_length=1, max_length=255)
    file_content: bytes = Field(..., description="Raw file binary content")
    description: Optional[str] = Field(None, max_length=500, description="Optional officer notes")

    model_config = ConfigDict(use_enum_values=True)

    @field_validator("document_type")
    @classmethod
    def validate_canonical_type(cls, v: Any) -> DocumentType:
        if isinstance(v, DocumentType):
            return v
        try:
            return DocumentType(v)
        except ValueError:
            valid_types = ", ".join(t.value for t in DocumentType)
            raise ValueError(f"Invalid document_type '{v}'. Must be canonical: {valid_types}")


class DocumentIngestionResult(BaseModel):
    """
    Typed output contract returned after document ingestion in Cycle 7.
    Note: storage_key is explicitly excluded from public client representations.
    """
    id: str = Field(..., description="Assigned document identifier, e.g. DOC-001")
    bid_id: str = Field(..., description="Parent bid identifier")
    document_type: str = Field(..., description="Canonical document type")
    original_filename: str = Field(..., description="Original filename")
    mime_type: str = Field(..., description="Canonical MIME type")
    size_bytes: int = Field(..., description="File size in bytes")
    sha256: str = Field(..., description="SHA-256 checksum")
    processing_status: str = Field(DocumentLifecycleState.UPLOADED.value, description="Initial status UPLOADED")
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(use_enum_values=True)


# ---------------------------------------------------------------------------
# Future Processing Interfaces (Cycle 8 OCR, Cycle 9 Classification, Cycle 10 Evidence)
# ---------------------------------------------------------------------------

class ExtractedPageText(BaseModel):
    """Future Cycle 8 contract: text extracted from a single page via OCR."""
    page_number: int = Field(..., ge=1, description="1-based page index")
    text: str = Field(..., description="Raw text extracted from this page")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="OCR confidence score")
    word_count: int = Field(0, ge=0, description="Total words detected")

    model_config = ConfigDict(use_enum_values=True)


class DocumentProcessingResult(BaseModel):
    """
    Future Cycle 8 contract: output returned by document extraction / OCR.
    """
    document_id: str = Field(..., description="Document identifier")
    bid_id: str = Field(..., description="Parent bid identifier")
    stage: DocumentProcessingStage = Field(..., description="Current processing stage")
    status: DocumentLifecycleState = Field(..., description="Updated lifecycle state")
    page_count: int = Field(0, ge=0, description="Total pages processed")
    pages: List[ExtractedPageText] = Field(default_factory=list, description="Per-page extracted text")
    raw_text: Optional[str] = Field(None, description="Concatenated document text")
    processing_time_ms: Optional[int] = Field(None, ge=0, description="Execution duration in ms")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Engine specific metadata")

    model_config = ConfigDict(use_enum_values=True)


@runtime_checkable
class DocumentProcessingProtocol(Protocol):
    """
    Formal interface for the future Cycle 8 OCR and document processing engine.
    Cycle 8 implementations must adhere to this interface.
    """
    def process_document(
        self,
        document_id: str,
        bid_id: str,
        file_path: str,
        document_type: str,
        **kwargs: Any,
    ) -> DocumentProcessingResult:
        """
        Process an uploaded document (OCR, page extraction).
        :param document_id: Unique document ID
        :param bid_id: Parent Bid ID
        :param file_path: Local filesystem or object storage path to file
        :param document_type: Canonical document type
        :return: DocumentProcessingResult with extracted text and lifecycle state
        """
        ...


__all__ = [
    "DocumentProcessingStage",
    "DocumentLifecycleState",
    "ALLOWED_DOCUMENT_EXTENSIONS",
    "ALLOWED_DOCUMENT_MIME_TYPES",
    "MAX_DOCUMENT_SIZE_BYTES",
    "DocumentValidationContract",
    "DocumentIngestionInput",
    "DocumentIngestionResult",
    "ExtractedPageText",
    "DocumentProcessingResult",
    "DocumentProcessingProtocol",
]
