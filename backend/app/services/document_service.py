import hashlib
import uuid
from typing import List, Dict, Any, Tuple, Optional
from flask import current_app

from app.models import db, Bid, Tender, Document
from app.domain.document import (
    DocumentType,
    DocumentStatus,
    DocumentValidationRules,
    DocumentValidationError,
    InvalidFileTypeError,
    FileTooLargeError,
    CorruptFileError
)
from app.services.storage_service import get_storage_service, BaseStorageService

class DocumentDuplicateError(DocumentValidationError):
    """Raised when an identical file (by SHA-256 hash) is uploaded to the same bid."""
    def __init__(self, message: str = "This document has already been uploaded for this bid."):
        super().__init__("DOCUMENT_DUPLICATE", message)

class BidNotFoundError(DocumentValidationError):
    """Raised when a bid ID cannot be found."""
    def __init__(self, bid_id: str):
        super().__init__("BID_NOT_FOUND", f"Bid '{bid_id}' was not found.")

class UnauthorizedDocumentAccessError(DocumentValidationError):
    """Raised when an organization tries to access a bid/document belonging to another org."""
    def __init__(self, message: str = "Unauthorized access to bid or document."):
        super().__init__("UNAUTHORIZED_ACCESS", message)

class DocumentNotFoundError(DocumentValidationError):
    """Raised when a document ID cannot be found."""
    def __init__(self, document_id: str):
        super().__init__("DOCUMENT_NOT_FOUND", f"Document '{document_id}' was not found.")

class DocumentService:

    def __init__(self, storage_service: Optional[BaseStorageService] = None):
        self.storage = storage_service or get_storage_service()

    def _authorize_bid_access(self, bid: Bid, org_id: Optional[str] = None) -> str:
        """Verifies bid ownership and returns the organization ID."""
        if not bid or not bid.tender:
            raise BidNotFoundError(bid.id if bid else "unknown")
        
        bid_org_id = bid.tender.organization_id
        if org_id and org_id != bid_org_id:
            raise UnauthorizedDocumentAccessError("Bid does not belong to the authenticated organization.")
        
        return bid_org_id

    def upload_document(
        self,
        bid_id: str,
        file_obj,
        document_type_str: str,
        user_id: Optional[str] = None,
        org_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates, computes SHA-256, checks duplicates, stores binary payload, and records metadata.
        """
        # 1. Fetch Bid and authorize access
        bid = Bid.query.get(bid_id)
        if not bid:
            raise BidNotFoundError(bid_id)
        
        resolved_org_id = self._authorize_bid_access(bid, org_id)

        # 2. Validate Document Type enum
        try:
            doc_type = DocumentType(document_type_str)
        except ValueError:
            raise InvalidFileTypeError(
                f"Invalid document_type '{document_type_str}'. Must be one of canonical types e.g. GST_CERTIFICATE."
            )

        # 3. Extract file payload & metadata
        if not file_obj or not hasattr(file_obj, "filename") or not file_obj.filename:
            raise InvalidFileTypeError("No valid file uploaded.")

        filename = file_obj.filename
        content_type = getattr(file_obj, "content_type", None) or getattr(file_obj, "mimetype", "application/pdf")

        # Read binary data
        file_bytes = file_obj.read()
        file_size = len(file_bytes)

        # 4. Validate metadata rules (extension, mime, size)
        DocumentValidationRules.validate_document_metadata(filename, content_type, file_size)

        # 5. Magic byte signature check
        header = file_bytes[:16]
        if not DocumentValidationRules.validate_magic_bytes(header, content_type):
            raise CorruptFileError(f"File magic byte signature does not match expected format for {content_type}.")

        # 6. Compute SHA-256 digest
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # 7. Duplicate Detection per Bid
        existing_doc = Document.query.filter_by(bid_id=bid_id, sha256=sha256_hash).first()
        if existing_doc:
            raise DocumentDuplicateError("This document has already been uploaded for this bid.")

        # 8. Generate Document ID & predictable Storage Key
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        storage_key = f"org/{resolved_org_id}/bids/{bid_id}/documents/{doc_id}"

        # 9. Save file binary in storage service
        self.storage.upload(file_bytes, storage_key, mime_type=content_type)

        # 10. Persist metadata record in DB
        doc = Document(
            id=doc_id,
            bid_id=bid_id,
            document_type=doc_type.value,
            original_filename=filename,
            storage_key=storage_key,
            mime_type=content_type,
            size_bytes=file_size,
            sha256=sha256_hash,
            page_count=None,
            uploaded_by=user_id,
            processing_status=DocumentStatus.UPLOADED.value
        )
        db.session.add(doc)
        db.session.commit()

        return doc.to_dict()

    def list_documents_for_bid(self, bid_id: str, org_id: Optional[str] = None) -> List[Dict[str, Any]]:
        bid = Bid.query.get(bid_id)
        if not bid:
            raise BidNotFoundError(bid_id)
        
        self._authorize_bid_access(bid, org_id)

        docs = Document.query.filter_by(bid_id=bid_id).all()
        return [d.to_dict() for d in docs]

    def get_document_details(self, document_id: str, org_id: Optional[str] = None) -> Dict[str, Any]:
        doc = Document.query.get(document_id)
        if not doc:
            raise DocumentNotFoundError(document_id)

        self._authorize_bid_access(doc.bid, org_id)
        return doc.to_dict()

    def get_document_file_content(self, document_id: str, org_id: Optional[str] = None) -> Tuple[bytes, str, str]:
        doc = Document.query.get(document_id)
        if not doc:
            raise DocumentNotFoundError(document_id)

        self._authorize_bid_access(doc.bid, org_id)

        file_bytes = self.storage.get(doc.storage_key)
        if file_bytes is None:
            raise CorruptFileError(f"Binary file for document '{document_id}' not found in storage.")

        return file_bytes, doc.mime_type, doc.original_filename
