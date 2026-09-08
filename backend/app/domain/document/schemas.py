from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class DocumentType(str, Enum):
    GST_CERTIFICATE = "GST_CERTIFICATE"
    PAN_CARD = "PAN_CARD"
    UDYAM_CERTIFICATE = "UDYAM_CERTIFICATE"
    FINANCIAL_AUDIT = "FINANCIAL_AUDIT"
    OEM_AUTHORIZATION = "OEM_AUTHORIZATION"
    LOCAL_CONTENT_DECLARATION = "LOCAL_CONTENT_DECLARATION"
    TECHNICAL_SPECIFICATION = "TECHNICAL_SPECIFICATION"
    DELIVERY_SCHEDULE = "DELIVERY_SCHEDULE"
    PAST_EXPERIENCE = "PAST_EXPERIENCE"
    OTHER = "OTHER"

class DocumentProcessingStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    PARSED = "PARSED"
    FAILED = "FAILED"

class DocumentSchema(BaseModel):
    id: str = Field(..., description="Unique document ID, e.g. DOC-001")
    bid_id: Optional[str] = Field(None, description="Associated Bid ID")
    document_type: str = Field(..., description="Classification of document")
    original_filename: str = Field(..., description="Original uploaded filename")
    storage_key: str = Field(..., description="S3 / Object storage object key")
    mime_type: str = Field("application/pdf", description="MIME content type")
    size_bytes: int = Field(0, description="File size in bytes")
    sha256: str = Field(..., description="Cryptographic SHA-256 hash of file content")
    page_count: Optional[int] = Field(None, description="Total pages detected")
    processing_status: DocumentProcessingStatus = Field(
        DocumentProcessingStatus.UPLOADED, description="Current ingestion status"
    )

    model_config = ConfigDict(use_enum_values=True)
