# Cycle 8 OCR UI/QA Report

Scope: Main Developer 3, Partial Developer 1, and Partial Developer 3 only.
This change covers the processing experience and QA contract; OCR execution and
Flask persistence remain owned by the other Cycle 8 workstreams.

## UI acceptance matrix

| Scenario | Expected UI behavior |
| --- | --- |
| Uploaded document | `Uploaded` status and a `Process OCR` action are visible. |
| Processing document | `Processing OCR` badge, spinner, progress indicator, and page progress are shown. |
| Processed document | `Ready` status and `View OCR` are available. |
| Multi-page result | OCR text is displayed in separate Page 1, Page 2, etc. panels. |
| Low confidence page | Raw text remains visible with the confidence value; it is not treated as compliance failure. |
| Processing failure | `Processing failed` state and a retry/error message are shown. |
| Invalid document | `Invalid document` state is shown without crashing the bid screen. |
| API failure | A dismissible error is shown and the rest of the bid page remains usable. |

## Pipeline test matrix

These cases are the QA handoff for the OCR/API owners:

| Input | Expected result |
| --- | --- |
| Text PDF | Page-aware text is returned without unnecessary OCR. |
| Scanned PDF | Each page is processed through OCR. |
| Three-to-five page PDF | One raw-text result per page, in page order. |
| JPG/PNG (if enabled by the API) | OCR is attempted and status is controlled. |
| Empty PDF | Controlled failure or invalid status; no server exception leaks. |
| Corrupt PDF | `PROCESSING_FAILED`/`FAILED` response and visible retry path. |
| Large document | Bounded request and controlled failure, never a browser hang. |
| Poor-quality/rotated scan | Raw text and confidence are preserved for later review. |
| Multiple documents | Processing state and OCR pages remain isolated by document ID. |
| Duplicate upload | Existing Cycle 7 duplicate behavior remains unchanged. |

## Manual demonstration

1. Log in and open a bid.
2. Upload `GST.pdf` from the Documents section.
3. Select **Process OCR**.
4. Confirm the state changes from Uploaded to Processing to Ready.
5. Select **View OCR** and verify each page has its own raw-text panel.
6. Force an API failure and confirm the error message and retry action appear.

OCR output is intentionally displayed as raw text only. Classification,
structured field extraction, verification, and compliance decisions are out of
scope for Cycle 8.
