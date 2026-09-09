from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

class DocumentType(str, Enum):
    GST_CERTIFICATE = "GST_CERTIFICATE"
    PAN_CARD = "PAN_CARD"
    UDYAM_CERTIFICATE = "UDYAM_CERTIFICATE"
    OEM_AUTHORIZATION = "OEM_AUTHORIZATION"
    FINANCIAL_STATEMENT = "FINANCIAL_STATEMENT"
    TURNOVER_CERTIFICATE = "TURNOVER_CERTIFICATE"
    TECHNICAL_SPECIFICATION = "TECHNICAL_SPECIFICATION"
    MAKE_IN_INDIA_DECLARATION = "MAKE_IN_INDIA_DECLARATION"
    EXPERIENCE_CERTIFICATE = "EXPERIENCE_CERTIFICATE"
    OTHER = "OTHER"

# Alias for backwards compatibility with earlier draft code
DocumentCategory = DocumentType

class DocumentStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    INVALID = "INVALID"
    UNREADABLE = "UNREADABLE"
    SUSPICIOUS = "SUSPICIOUS"

class DocumentSchema(BaseModel):
    id: str = Field(..., description="Document ID e.g. DOC001")
    bid_id: str = Field(..., description="Parent Bid ID e.g. BID001")
    document_type: DocumentType = Field(DocumentType.OTHER, description="Canonical Document Type")
    original_filename: str = Field(..., description="Original filename")
    storage_key: str = Field(..., description="Object storage path key e.g. org/ORG001/bids/BID001/documents/DOC001")
    mime_type: str = Field("application/pdf", description="MIME type")
    size_bytes: int = Field(..., description="File size in bytes")
    sha256: Optional[str] = Field(None, description="SHA-256 digest hex string")
    processing_status: DocumentStatus = Field(DocumentStatus.UPLOADED, description="Document processing status")
    page_count: Optional[int] = Field(None, description="Page count if applicable")
    uploaded_by: Optional[str] = Field(None, description="User ID or identifier who uploaded the document")
    description: Optional[str] = Field(None, description="Optional document description")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Backwards compatibility properties for older schemas
    @property
    def filename(self) -> str:
        return self.original_filename

    @property
    def category(self) -> DocumentType:
        return self.document_type

    @property
    def file_path(self) -> str:
        return self.storage_key

    @property
    def file_size_bytes(self) -> int:
        return self.size_bytes

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "DOC001",
                "bid_id": "BID001",
                "document_type": "GST_CERTIFICATE",
                "original_filename": "gst.pdf",
                "storage_key": "org/ORG001/bids/BID001/documents/DOC001",
                "mime_type": "application/pdf",
                "size_bytes": 245812,
                "sha256": "abc123def4567890abc123def4567890abc123def4567890abc123def4567890",
                "processing_status": "UPLOADED",
                "created_at": "2026-09-09T18:00:00Z",
                "updated_at": "2026-09-09T18:00:00Z"
            }
        }
    }
