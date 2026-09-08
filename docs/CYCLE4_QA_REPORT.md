# Cycle 4 QA Report

## Scope

Cycle 4 covers tender PDF ingestion, page-aware text extraction, structured tender requirement extraction, persistence, and officer-facing display. It does not evaluate bidder compliance or call government verification systems.

## Automated coverage

- `backend/tests/test_cycle4_extraction.py`: page preservation, thresholds, optional clauses, and empty extraction.
- Upload API coverage should exercise valid PDF, multi-page PDF, empty file, non-PDF, renamed executable, and oversize file cases.
- Frontend production build validates the upload and requirement UI TypeScript contract.

## File validation matrix

| Case | Expected result |
| --- | --- |
| Text-based PDF | Accepted, hashed, stored, processed |
| Multi-page PDF | Accepted; every extracted requirement retains `source_page` |
| PNG/TXT | Rejected with `VALIDATION_ERROR` |
| Executable renamed `.pdf` | Rejected by PDF signature validation |
| Empty file | Rejected with `VALIDATION_ERROR` |
| File over configured limit | Rejected with `VALIDATION_ERROR`/`413` |

## Extraction assertions

- Requirements are validated through the existing Pydantic requirement contract.
- Extraction retains category, mandatory/optional state, threshold/operator, unit, evaluation period, source clause, source page, and confidence.
- Extraction produces requirements only; it does not produce compliance, risk, or recommendation decisions.
- Low-confidence output is represented as review metadata rather than silently marked compliant.

## Known environment note

The repository pins packages that do not all provide Python 3.14 wheels. Run backend verification with the supported Python version from the project prerequisites (Python 3.11+) or a development container before declaring the PostgreSQL end-to-end gate passed.
