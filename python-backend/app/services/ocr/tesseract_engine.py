"""
Tesseract OCR Engine wrapper for BidSure AI — Cycle 8.

Handles Tesseract executable discovery, execution, confidence scoring,
and controlled error handling.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image

logger = logging.getLogger(__name__)


class OCREngineError(Exception):
    """Base exception for OCR engine failures."""
    def __init__(self, message: str, code: str = "OCR_ENGINE_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class TesseractNotFoundError(OCREngineError):
    """Raised when tesseract binary is not installed or discoverable."""
    def __init__(self, message: str = "Tesseract binary not found on host system"):
        super().__init__(message, code="TESSERACT_NOT_FOUND")


class TesseractEngine:
    """
    Encapsulates pytesseract interactions, discovery, and confidence extraction.
    """

    KNOWN_WINDOWS_PATHS = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\ProgramData\chocolatey\bin\tesseract.exe",
        r"C:\Users\hp\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
    ]

    def __init__(self, custom_cmd: Optional[str] = None):
        self._cmd_path: Optional[str] = None
        self._pytesseract_available: bool = False
        self._initialize_engine(custom_cmd)

    def _initialize_engine(self, custom_cmd: Optional[str] = None):
        try:
            import pytesseract
            self._pytesseract = pytesseract
            self._pytesseract_available = True
        except ImportError:
            self._pytesseract = None
            self._pytesseract_available = False
            logger.warning("pytesseract library is not installed.")
            return

        # 1. Custom command passed
        if custom_cmd and os.path.exists(custom_cmd):
            self._cmd_path = custom_cmd
            self._pytesseract.pytesseract.tesseract_cmd = custom_cmd
            return

        # 2. Environment variable
        env_cmd = os.getenv("TESSERACT_CMD")
        if env_cmd and os.path.exists(env_cmd):
            self._cmd_path = env_cmd
            self._pytesseract.pytesseract.tesseract_cmd = env_cmd
            return

        # 3. System PATH
        which_path = shutil.which("tesseract")
        if which_path:
            self._cmd_path = which_path
            return

        # 4. Standard Windows install locations
        for win_path in self.KNOWN_WINDOWS_PATHS:
            if os.path.exists(win_path):
                self._cmd_path = win_path
                self._pytesseract.pytesseract.tesseract_cmd = win_path
                return

    def is_available(self) -> bool:
        """Checks whether the Tesseract OCR engine is installed and operational."""
        if not self._pytesseract_available or not self._pytesseract:
            return False
        try:
            # Probe version
            _ = self._pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def extract_text_and_confidence(self, image: Image.Image) -> Tuple[str, float, int]:
        """
        Executes OCR on a PIL Image and computes token-weighted confidence.

        Returns:
            Tuple of (extracted_text, average_confidence, word_count)
            where average_confidence is between 0.0 and 1.0.
        """
        if not self.is_available():
            raise TesseractNotFoundError(
                "Tesseract executable is not installed or available on PATH. "
                "Install Tesseract OCR (e.g. 'choco install tesseract') or provide TESSERACT_CMD."
            )

        try:
            # 1. Extract detailed word data with confidence scores
            data = self._pytesseract.image_to_data(image, output_type=self._pytesseract.Output.DICT)

            words: list[str] = []
            confidences: list[float] = []

            for i, text_val in enumerate(data.get("text", [])):
                cleaned = str(text_val).strip()
                conf_val = data.get("conf", [])[i]

                # Tesseract returns -1 for whitespace, blocks, and non-word items
                try:
                    conf_float = float(conf_val)
                except (ValueError, TypeError):
                    conf_float = -1.0

                if cleaned and conf_float >= 0:
                    words.append(cleaned)
                    confidences.append(conf_float)

            # Compute normalized confidence (Tesseract returns 0-100)
            if confidences:
                avg_confidence = round(sum(confidences) / (len(confidences) * 100.0), 4)
                avg_confidence = min(max(avg_confidence, 0.0), 1.0)
            else:
                avg_confidence = 0.0

            # 2. Extract full layout-preserving text
            full_text = self._pytesseract.image_to_string(image)
            word_count = len(words)

            return full_text, avg_confidence, word_count

        except TesseractNotFoundError:
            raise
        except Exception as exc:
            logger.error("OCR execution error: %s", exc)
            raise OCREngineError(f"Failed to execute OCR on image: {str(exc)}") from exc
