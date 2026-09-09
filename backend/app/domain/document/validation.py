import os
import re
from typing import Dict, Any, Optional, Tuple

class DocumentValidationError(ValueError):
    """Base exception for document validation failures."""
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

class InvalidFileTypeError(DocumentValidationError):
    def __init__(self, message: str = "Only PDF, JPG, JPEG and PNG files are allowed."):
        super().__init__("INVALID_FILE_TYPE", message)

class FileTooLargeError(DocumentValidationError):
    def __init__(self, message: str = "File exceeds the maximum allowed size of 10 MB."):
        super().__init__("FILE_TOO_LARGE", message)

class CorruptFileError(DocumentValidationError):
    def __init__(self, message: str = "File signature or content appears corrupted or unreadable."):
        super().__init__("CORRUPT_FILE", message)

class DocumentValidationRules:
    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
    ALLOWED_MIME_TYPES = {
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png"
    }
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    MAGIC_NUMBERS: Dict[str, Tuple[bytes, ...]] = {
        "application/pdf": (b"%PDF-",),
        "image/jpeg": (b"\xff\xd8\xff",),
        "image/jpg": (b"\xff\xd8\xff",),
        "image/png": (b"\x89PNG\r\n\x1a\n",)
    }

    @classmethod
    def validate_extension(cls, filename: str) -> bool:
        if not filename or "." not in filename:
            return False
        ext = os.path.splitext(filename)[1].lower()
        return ext in cls.ALLOWED_EXTENSIONS

    @classmethod
    def validate_mime_type(cls, mime_type: str) -> bool:
        if not mime_type:
            return False
        return mime_type.lower() in cls.ALLOWED_MIME_TYPES

    @classmethod
    def validate_size(cls, size_bytes: int) -> bool:
        if size_bytes is None or size_bytes <= 0:
            return False
        return size_bytes <= cls.MAX_FILE_SIZE_BYTES

    @classmethod
    def validate_sha256(cls, sha256_hex: str) -> bool:
        if not sha256_hex or not isinstance(sha256_hex, str):
            return False
        return bool(re.fullmatch(r"[a-fA-F0-9]{64}", sha256_hex))

    @classmethod
    def validate_magic_bytes(cls, header_bytes: bytes, mime_type: str) -> bool:
        if not header_bytes or not mime_type:
            return False
        mime_clean = mime_type.lower()
        signatures = cls.MAGIC_NUMBERS.get(mime_clean, ())
        return any(header_bytes.startswith(sig) for sig in signatures)

    @classmethod
    def validate_document_metadata(cls, filename: str, mime_type: str, size_bytes: int) -> Dict[str, Any]:
        """
        Validates basic file metadata before upload/storage.
        Raises DocumentValidationError subclasses on invalid inputs.
        """
        if not cls.validate_extension(filename):
            raise InvalidFileTypeError(f"File extension for '{filename}' is not supported. Allowed: PDF, JPG, JPEG, PNG.")

        if not cls.validate_mime_type(mime_type):
            raise InvalidFileTypeError(f"MIME type '{mime_type}' is not supported.")

        if size_bytes is not None and size_bytes > cls.MAX_FILE_SIZE_BYTES:
            raise FileTooLargeError(f"File size ({size_bytes} bytes) exceeds maximum limit of 10 MB ({cls.MAX_FILE_SIZE_BYTES} bytes).")

        if size_bytes is not None and size_bytes <= 0:
            raise CorruptFileError("File is empty (0 bytes).")

        return {
            "valid": True,
            "filename": filename,
            "mime_type": mime_type,
            "size_bytes": size_bytes
        }
