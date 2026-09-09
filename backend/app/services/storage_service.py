import os
from abc import ABC, abstractmethod
from typing import Optional
from flask import current_app

class BaseStorageService(ABC):
    """Abstract storage service interface for document binaries."""

    @abstractmethod
    def upload(self, file_bytes: bytes, storage_key: str, mime_type: str = "application/pdf") -> str:
        """Store binary file data under storage_key."""
        pass

    @abstractmethod
    def get(self, storage_key: str) -> Optional[bytes]:
        """Retrieve binary file data by storage_key."""
        pass

    @abstractmethod
    def delete(self, storage_key: str) -> bool:
        """Delete file by storage_key."""
        pass

    @abstractmethod
    def get_url(self, storage_key: str) -> str:
        """Get accessible URL or key path."""
        pass

class LocalStorageService(BaseStorageService):
    """Local filesystem storage implementation."""

    def __init__(self, base_folder: Optional[str] = None):
        self._base_folder = base_folder

    @property
    def base_folder(self) -> str:
        if self._base_folder:
            return self._base_folder
        if current_app and "UPLOAD_FOLDER" in current_app.config:
            return current_app.config["UPLOAD_FOLDER"]
        # Fallback to local uploads directory
        return os.path.join(os.getcwd(), "uploads")

    def _get_full_path(self, storage_key: str) -> str:
        # Sanitize storage_key to prevent directory traversal
        normalized_key = storage_key.lstrip("/").replace("\\", "/")
        return os.path.join(self.base_folder, *normalized_key.split("/"))

    def upload(self, file_bytes: bytes, storage_key: str, mime_type: str = "application/pdf") -> str:
        full_path = self._get_full_path(storage_key)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(file_bytes)
        return storage_key

    def get(self, storage_key: str) -> Optional[bytes]:
        full_path = self._get_full_path(storage_key)
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return None
        with open(full_path, "rb") as f:
            return f.read()

    def delete(self, storage_key: str) -> bool:
        full_path = self._get_full_path(storage_key)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            os.remove(full_path)
            return True
        return False

    def get_url(self, storage_key: str) -> str:
        return f"/api/v1/documents/raw/{storage_key}"

def get_storage_service() -> BaseStorageService:
    """Factory getter for current storage service implementation."""
    return LocalStorageService()
