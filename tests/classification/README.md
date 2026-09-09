# BidSure AI — Cycle 9 Document Classification Dataset

Prepared by **Partial Developer 2 (Data / AI Support)** in collaboration with **Main Developer 1 (Python / AI / Compliance)**.

This dataset provides deterministic, reproducible synthetic documents and a ground truth benchmark to validate the **Cycle 9 Document Classification Pipeline** across all 10 canonical Indian public procurement document categories, as well as degraded and edge-case inputs.

---

## Directory Structure

```text
tests/classification/
├── dataset_manifest.json          # Ground truth labels, categories, and min confidence thresholds
├── rules_reference.json           # Controlled reference taxonomy (exact phrases, keywords, regex patterns)
├── generate_dataset.py            # Python generator to deterministically reproduce all test files
├── documents/                     # Benchmark test files (text and companion PDFs)
│   ├── gst/
│   │   ├── gst_reg06_clean.txt
│   │   ├── gst_reg06_clean.pdf
│   │   ├── gst_multipage_annexure.txt
│   │   └── gst_multipage_annexure.pdf
│   ├── pan/
│   │   ├── pan_card_clean.txt
│   │   ├── pan_card_clean.pdf
│   │   ├── pan_allotment_letter.txt
│   │   └── pan_allotment_letter.pdf
│   ├── udyam/
│   │   ├── udyam_registration_clean.txt
│   │   └── udyam_registration_clean.pdf
│   ├── oem/
│   │   ├── oem_maf_clean.txt
│   │   └── oem_maf_clean.pdf
│   ├── financial/
│   │   ├── balance_sheet_audited.txt
│   │   ├── balance_sheet_audited.pdf
│   │   ├── itr_v_acknowledgement.txt
│   │   └── itr_v_acknowledgement.pdf
│   ├── technical/
│   │   ├── technical_compliance_sheet.txt
│   │   └── technical_compliance_sheet.pdf
│   ├── make_in_india/
│   │   ├── mii_local_content_cert.txt
│   │   └── mii_local_content_cert.pdf
│   ├── startup/
│   │   ├── dpiit_startup_recognition.txt
│   │   └── dpiit_startup_recognition.pdf
│   ├── nsic/
│   │   ├── nsic_sprs_clean.txt
│   │   └── nsic_sprs_clean.pdf
│   └── unknown/
│       ├── empty_document.txt
│       ├── chocolate_cake_recipe.txt
│       ├── corrupted_noisy_ocr.txt
│       └── ambiguous_oem_spec.txt
└── README.md
```

---

## Canonical Document Types & Benchmark Coverage

| Canonical Type | Target Document | Expected Classification | Expected Status | Min Confidence |
| :--- | :--- | :--- | :--- | :--- |
| `GST_CERTIFICATE` | Form GST REG-06 Certificate | `GST_CERTIFICATE` | `CLASSIFIED` | `0.85` |
| `PAN_DOCUMENT` | Income Tax Permanent Account Card | `PAN_DOCUMENT` | `CLASSIFIED` | `0.85` |
| `UDYAM_CERTIFICATE` | MSME Udyam Registration Certificate | `UDYAM_CERTIFICATE` | `CLASSIFIED` | `0.85` |
| `OEM_AUTHORIZATION` | Manufacturer's Authorization Form (MAF) | `OEM_AUTHORIZATION` | `CLASSIFIED` | `0.85` |
| `INCOME_TAX_DOCUMENT` | Income Tax Return Acknowledgement (ITR-V) | `INCOME_TAX_DOCUMENT` | `CLASSIFIED` | `0.85` |
| `FINANCIAL_STATEMENT` | Audited Balance Sheet with CA UDIN | `FINANCIAL_STATEMENT` | `CLASSIFIED` | `0.85` |
| `TECHNICAL_SPECIFICATION` | Technical Compliance Sheet & Datasheet | `TECHNICAL_SPECIFICATION` | `CLASSIFIED` | `0.80` |
| `MAKE_IN_INDIA_DECLARATION` | Class-I Local Content Self-Declaration | `MAKE_IN_INDIA_DECLARATION` | `CLASSIFIED` | `0.80` |
| `STARTUP_CERTIFICATE` | DPIIT Startup India Certificate | `STARTUP_CERTIFICATE` | `CLASSIFIED` | `0.80` |
| `NSIC_CERTIFICATE` | Single Point Registration (SPRS) Certificate | `NSIC_CERTIFICATE` | `CLASSIFIED` | `0.80` |
| `UNKNOWN` (Empty) | 0-byte / whitespace file | `UNKNOWN` | `REVIEW_REQUIRED` | `0.00` |
| `UNKNOWN` (Irrelevant) | Cake recipe text | `UNKNOWN` | `REVIEW_REQUIRED` | `0.00` |
| `UNKNOWN` (Noisy) | Degraded OCR scan | `UNKNOWN` | `REVIEW_REQUIRED` | `0.00` |
| `UNKNOWN` (Ambiguous) | Conflicting OEM + Tech signals | `UNKNOWN` | `REVIEW_REQUIRED` | `0.00` |

---

## Cycle 8 OCR → Cycle 9 Classification Handoff

The benchmark verification tests (`backend/tests/test_classification_dataset.py`) also ingest real OCR ground truth outputs from Cycle 8 (`tests/ocr/expected/`):
- `gst_page_1.txt` ──► `GST_CERTIFICATE` (Confidence ≥ 0.85)
- `pan_page_1.txt` ──► `PAN_DOCUMENT` (Confidence ≥ 0.85)
- `oem_page_1.txt` ──► `OEM_AUTHORIZATION` (Confidence ≥ 0.85)
- `udyam_page_1.txt` ──► `UDYAM_CERTIFICATE` (Confidence ≥ 0.85)

---

## Regenerating the Dataset

To regenerate all text and PDF files:
```bash
python tests/classification/generate_dataset.py
```
