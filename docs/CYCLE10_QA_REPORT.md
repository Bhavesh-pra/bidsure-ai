# Cycle 10 QA checklist

| Scenario | Expected result |
| --- | --- |
| Valid GST/PAN/Udyam OCR | Structured fields with page and confidence |
| Invalid identifier | Field omitted or review-required; no compliance failure |
| Empty OCR | Controlled extraction failure/review status |
| Missing field | Other fields preserved with provenance |
| Multi-page document | Each field retains its source page |
| Low-confidence extraction | `LOW` confidence/review signal |
| Malformed model output | Pydantic/API validation rejects it |
| Prompt-like document text | Treated as data; never executed as instructions |
| Missing JWT | `401 UNAUTHORIZED` |
| Wrong organization | `403 FORBIDDEN` or policy-equivalent `404` |
| Existing Cycle 8 OCR | Page text and processing remain available |

The extraction boundary ends at normalized structured evidence. Verification,
compliance, risk, and officer decisions are intentionally not part of Cycle 10.
