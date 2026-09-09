from datetime import datetime
from . import db

class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String(64), primary_key=True)
    bid_id = db.Column(db.String(64), db.ForeignKey("bids.id"), nullable=False)
    document_type = db.Column(db.String(100), nullable=False, default="OTHER")
    original_filename = db.Column(db.String(255), nullable=False)
    storage_key = db.Column(db.String(512), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False, default="application/pdf")
    size_bytes = db.Column(db.Integer, nullable=False, default=0)
    sha256 = db.Column(db.String(64), nullable=False, index=True)
    page_count = db.Column(db.Integer, nullable=True)
    uploaded_by = db.Column(db.String(64), nullable=True)
    processing_status = db.Column(db.String(50), nullable=False, default="UPLOADED")
    description = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    bid = db.relationship("Bid", back_populates="documents")

    # Backwards compatibility properties
    @property
    def filename(self) -> str:
        return self.original_filename

    @property
    def category(self) -> str:
        return self.document_type

    @property
    def file_path(self) -> str:
        return self.storage_key

    @property
    def file_size_bytes(self) -> int:
        return self.size_bytes

    def to_dict(self):
        return {
            "id": self.id,
            "bid_id": self.bid_id,
            "document_type": self.document_type,
            "original_filename": self.original_filename,
            "mime_type": self.mime_type,
            "size_bytes": self.size_bytes,
            "sha256": self.sha256,
            "page_count": self.page_count,
            "uploaded_by": self.uploaded_by,
            "processing_status": self.processing_status,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
