# BidSure AI — Cycle 8 OCR Test Dataset

Prepared by **Partial Developer 2 (Data / AI Support)**.

This dataset provides deterministic, reproducible test documents to validate the **Cycle 8 OCR Pipeline** across all real-world bidder document variants.

## Directory Structure
```
tests/ocr/
├── documents/
│   ├── 01_gst_clear_text.pdf     # 2 Pages - Clean digital vector PDF (uses direct text extraction)
│   ├── 02_pan_scanned_image.pdf   # 1 Page - Pure raster scan inside PDF (forces OCR)
│   ├── 03_oem_multipage.pdf       # 3 Pages - Multi-page clear document (tests page separation)
│   ├── 04_udyam_low_quality.pdf   # 1 Page - Low-resolution scan (tests confidence calculation)
│   ├── 05_rotated_page.pdf        # 1 Page - 90-degree rotated document
│   ├── 06_empty.pdf               # 1 Page - Completely blank page (tests UNREADABLE handling)
│   ├── 07_scanned_pan.png         # Standalone PNG image upload
│   └── 08_scanned_pan.jpg         # Standalone JPG image upload
├── expected/
│   ├── gst_page_1.txt             # Ground truth text for GST Page 1
│   ├── gst_page_2.txt             # Ground truth text for GST Page 2
│   ├── pan_page_1.txt             # Ground truth text for PAN Card
│   ├── oem_page_1.txt             # Ground truth text for OEM Page 1
│   ├── oem_page_2.txt             # Ground truth text for OEM Page 2
│   ├── oem_page_3.txt             # Ground truth text for OEM Page 3
│   ├── udyam_page_1.txt           # Ground truth text for Udyam
│   └── scanned_pan.txt            # Ground truth text for Image scan
└── README.md
```

## Test Objectives & Expected Behavior

| Document | Target Pipeline Behavior | Expected OCR Output |
| :--- | :--- | :--- |
| `01_gst_clear_text.pdf` | Direct extraction via PyMuPDF. | `confidence = 1.0`, 2 separate pages, exact GSTIN. |
| `02_pan_scanned_image.pdf` | Image detection -> Raster OCR. | OCR executed, PAN token `AABCA1234F` extracted. |
| `03_oem_multipage.pdf` | Page-aware multi-page separation. | 3 pages in order, distinct text per page. |
| `04_udyam_low_quality.pdf` | Low-resolution OCR. | Extracted text with lower confidence (< 0.85). |
| `05_rotated_page.pdf` | Orientation handling. | OCR attempts extraction without crash. |
| `06_empty.pdf` | No extractable text. | Controlled status `UNREADABLE` (no server 500). |
| `07_scanned_pan.png` | Direct image OCR. | Treated as Page 1, confidence recorded. |
| `08_scanned_pan.jpg` | Direct image OCR. | Treated as Page 1, confidence recorded. |

## Regenerating the Dataset
Run the generator script at any time:
```bash
python mock-data/documents/generate_ocr_test_dataset.py
```
