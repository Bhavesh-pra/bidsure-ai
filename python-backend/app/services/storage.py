"""
Storage service abstraction for BidSure document storage.

Provides a pluggable interface so the application can switch between
local filesystem storage (development) and S3/R2 (production) without
changing any calling code.
"""

import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from flask import current_app


class StorageService(ABC):
    """Abstract base class for object storage backends."""

    @abstractmethod
    def upload(self, storage_key: str, content: bytes, content_type: str) -> str:
        """Store content and return the storage key."""

    @abstractmethod
    def delete(self, storage_key: str) -> bool:
        """Delete an object by key. Returns True if deleted, False if not found."""

    @abstractmethod
    def get_url(self, storage_key: str) -> str:
        """Return a URL or path for retrieving the stored object."""

    @abstractmethod
    def exists(self, storage_key: str) -> bool:
        """Check whether an object exists at the given key."""


class LocalStorage(StorageService):
    """Filesystem-based storage for local development."""

    def __init__(self, root_dir: str):
        self._root = Path(root_dir)
        self._root.mkdir(parents=True, exist_ok=True)

    def _resolve(self, storage_key: str) -> Path:
        return self._root / storage_key

    def upload(self, storage_key: str, content: bytes, content_type: str) -> str:
        target = self._resolve(storage_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return storage_key

    def delete(self, storage_key: str) -> bool:
        target = self._resolve(storage_key)
        if target.exists():
            target.unlink()
            # Clean up empty parent directories
            try:
                parent = target.parent
                while parent != self._root and not any(parent.iterdir()):
                    parent.rmdir()
                    parent = parent.parent
            except OSError:
                pass
            return True
        return False

    def get_url(self, storage_key: str) -> str:
        return str(self._resolve(storage_key))

    def exists(self, storage_key: str) -> bool:
        return self._resolve(storage_key).exists()


def get_storage_service() -> StorageService:
    """Factory: returns the appropriate storage backend based on app config."""
    # Future: check for S3 config and return S3Storage if available
    upload_folder = current_app.config.get(
        "UPLOAD_FOLDER",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage"),
    )
    return LocalStorage(upload_folder)


def build_storage_key(org_id: str, bid_id: str, document_id: str) -> str:
    """Build a deterministic, non-user-controlled storage key.

    Format: org/{org_id}/bids/{bid_id}/documents/{document_id}
    """
    return f"org/{org_id}/bids/{bid_id}/documents/{document_id}"
