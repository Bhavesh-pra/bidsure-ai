# Cycle 9 Classification UI/QA Report

Scope: Main Developer 3, Partial Developer 1, and Partial Developer 3.
The classifier implementation and persistence API remain owned by the backend
and AI workstreams.

## Classification matrix

| Input | Expected UI result |
| --- | --- |
| GST certificate | `GST CERTIFICATE`, confidence shown, Classified |
| PAN document | `PAN DOCUMENT`, confidence shown, Classified |
| Udyam certificate | `UDYAM CERTIFICATE`, confidence shown, Classified |
| OEM authorization | `OEM AUTHORIZATION`, confidence shown, Classified |
| Financial statement | `FINANCIAL STATEMENT`, confidence shown, Classified |
| Random or empty OCR | `UNKNOWN`, Review Required |
| Low-confidence result | Confidence badge plus Manual review required warning |
| Mixed/ambiguous document | Unknown or Review Required; never silently presented as a known type |
| Classification API failure | Failed state and visible error/retry path |

## Regression matrix

- Uploaded documents still show their existing OCR processing state.
- Processed documents retain the View OCR page-by-page raw-text screen.
- Document deletion and duplicate-upload behavior remain unchanged.
- Classification fields are additive and do not replace raw OCR text.
- No entity extraction, compliance result, verification, or recommendation is displayed.

## Manual flow

1. Log in and open a bid.
2. Upload a bidder document and process OCR.
3. Confirm the document reaches `PROCESSED`.
4. Select **Classify**.
5. Confirm the document type, confidence, and classification status appear.
6. Use a low-confidence or unknown result and confirm the Review Required warning.
7. Open document details and verify OCR status and classification metadata are both visible.

The UI intentionally treats classification as a category plus confidence only.
Fields such as GSTIN, PAN, legal name, or compliance status remain out of scope
for Cycle 9 and belong to Cycle 10.
