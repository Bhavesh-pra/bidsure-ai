from pathlib import Path
from typing import Dict, List


class PdfExtractionError(ValueError):
    pass


def extract_pdf_pages(file_path: str) -> List[Dict[str, object]]:
    """Extract normalized text while retaining the source page number."""
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:  # pragma: no cover - environment dependency guard
        raise PdfExtractionError("PyMuPDF is required for PDF text extraction") from exc

    path = Path(file_path)
    if not path.exists() or path.stat().st_size == 0:
        raise PdfExtractionError("PDF is empty or does not exist")

    try:
        document = fitz.open(str(path))
        pages = []
        for index, page in enumerate(document):
            text = " ".join(page.get_text("text").split())
            pages.append({"page": index + 1, "text": text})
        document.close()
    except Exception as exc:
        raise PdfExtractionError("Unable to read PDF content") from exc

    if not pages or not any(page["text"] for page in pages):
        raise PdfExtractionError("PDF contains no extractable text")
    return pages
