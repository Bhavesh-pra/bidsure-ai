"""
File validation service for BidSure document uploads.

Validates uploaded files through a strict pipeline:
  file exists → not empty → size check → extension check → MIME check → magic-byte check → SHA-256

Supports PDF, JPG/JPEG, and PNG.
"""

import hashlib
from dataclasses import dataclass
from flask import current_app
from werkzeug.utils import secure_filename


class FileValidationError(Exception):
    """Raised when a file fails validation."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class ValidatedFile:
    """Result of successful file validation."""
    filename: str
    content: bytes
    mime_type: str
    size_bytes: int
    sha256: str
    extension: str


# Magic byte signatures for each supported file type
_MAGIC_BYTES = {
    ".pdf": (b"%PDF-", 5),
    ".jpg": (b"\xff\xd8\xff", 3),
    ".jpeg": (b"\xff\xd8\xff", 3),
    ".png": (b"\x89PNG", 4),
}

# Map from extension to canonical MIME type
_EXTENSION_MIME = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}

# Acceptable MIME type strings the browser may send for each extension
_ALLOWED_MIMES = {
    ".pdf": {"application/pdf", "application/x-pdf"},
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
    ".png": {"image/png"},
}

ALLOWED_EXTENSIONS = frozenset(_EXTENSION_MIME.keys())


def validate_file(file_storage) -> ValidatedFile:
    """Run the full validation pipeline on a Werkzeug FileStorage object.

    Returns a ValidatedFile on success.
    Raises FileValidationError on any failure.
    """
    # 1. File exists
    if not file_storage or not file_storage.filename:
        raise FileValidationError("EMPTY_FILE", "No file was provided in the request.")

    filename = secure_filename(file_storage.filename)
    if not filename:
        raise FileValidationError("INVALID_FILE_TYPE", "The filename is invalid.")

    # 2. Extension check
    dot_index = filename.rfind(".")
    if dot_index == -1:
        raise FileValidationError(
            "INVALID_FILE_TYPE",
            "Only PDF, JPG, JPEG and PNG files are allowed.",
        )
    extension = filename[dot_index:].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            "INVALID_FILE_TYPE",
            "Only PDF, JPG, JPEG and PNG files are allowed.",
        )

    # 3. Read content
    content = file_storage.read()
    file_storage.stream.seek(0)

    # 4. Empty check
    if not content:
        raise FileValidationError("EMPTY_FILE", "The uploaded file is empty.")

    # 5. Size check
    max_size = current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)
    if len(content) > max_size:
        raise FileValidationError(
            "FILE_TOO_LARGE",
            f"File exceeds the maximum allowed size of {max_size // (1024 * 1024)} MB.",
        )

    # 6. MIME type check
    reported_mime = (file_storage.mimetype or "").lower().strip()
    allowed_mimes = _ALLOWED_MIMES.get(extension, set())
    # Allow empty MIME (some clients don't send it) but reject mismatches
    if reported_mime and reported_mime not in allowed_mimes:
        raise FileValidationError(
            "INVALID_FILE_TYPE",
            f"MIME type '{reported_mime}' is not valid for a {extension} file.",
        )

    # 7. Magic-byte (file signature) check
    signature, sig_length = _MAGIC_BYTES[extension]
    if len(content) < sig_length or not content[:sig_length].startswith(signature):
        raise FileValidationError(
            "INVALID_FILE_SIGNATURE",
            "The uploaded file content does not match the expected file format. "
            "The file may be corrupted or have an incorrect extension.",
        )

    # 8. SHA-256 hash
    digest = hashlib.sha256(content).hexdigest()

    # 9. Canonical MIME type (not the browser-reported one)
    canonical_mime = _EXTENSION_MIME[extension]

    return ValidatedFile(
        filename=filename,
        content=content,
        mime_type=canonical_mime,
        size_bytes=len(content),
        sha256=digest,
        extension=extension,
    )
