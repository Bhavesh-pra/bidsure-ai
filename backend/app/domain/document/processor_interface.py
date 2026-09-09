from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from .schemas import DocumentSchema, DocumentStatus

class BaseDocumentProcessor(ABC):
    """
    Abstract interface for downstream document processing pipelines (Cycle 8+).
    Defines architectural contract for OCR, text extraction, classification,
    and evidence extraction without executing heavy models in Cycle 7.
    """

    @abstractmethod
    def process_document(self, document: DocumentSchema) -> Dict[str, Any]:
        """
        Process a document and return processing results / extracted metadata.
        Subclasses in Cycle 8+ will implement actual OCR and text extraction.
        """
        raise NotImplementedError("Document processing contract is defined for Cycle 8+ implementation.")

    @abstractmethod
    def extract_text(self, storage_key: str, mime_type: str) -> Optional[str]:
        """
        Extract raw text content from stored document binary.
        """
        raise NotImplementedError("Text extraction contract is defined for Cycle 8+ implementation.")

    def get_target_status_on_success(self) -> DocumentStatus:
        return DocumentStatus.PROCESSED

    def get_target_status_on_failure(self) -> DocumentStatus:
        return DocumentStatus.INVALID
