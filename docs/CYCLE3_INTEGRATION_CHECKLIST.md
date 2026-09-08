# Cycle 3 Integration Checklist — Tender Creation

Use this checklist during the final two-day integration and demo. It is intentionally separate from the historical Cycle 1 checklist.

## Authentication

- [ ] Login succeeds as a Procurement Officer.
- [ ] Access token is stored by the frontend.
- [ ] Missing JWT returns `401`.
- [ ] Expired JWT returns `401`.
- [ ] Invalid JWT returns `401`.

## Tender workflow

- [ ] Open `/tenders` after login.
- [ ] Tender dashboard loads from `GET /api/v1/tenders`.
- [ ] Empty, loading, retry, and API-error states render correctly.
- [ ] Open `/tenders/new`.
- [ ] Required-field validation is shown before submission.
- [ ] Invalid category, tender type, and deadline are rejected by the API.
- [ ] Submit a valid tender.
- [ ] `POST /api/v1/tenders` returns `201` and a request ID.
- [ ] Created tender appears in the list.
- [ ] Refresh the browser; the tender is still present.
- [ ] Open `/tenders/:id` and verify complete metadata.
- [ ] Detail page shows Cycle 4 sections as unavailable/empty, without fake functionality.

## Persistence and authorization

- [ ] Tender is persisted in PostgreSQL.
- [ ] Duplicate tender number within one organization returns `409`.
- [ ] Organization A can read its own tender.
- [ ] Organization B cannot read Organization A's tender and receives `403`.
- [ ] List results are scoped to the authenticated organization.

## Regression and release gate

- [ ] `pytest backend/tests` passes.
- [ ] Frontend `npm run build` passes.
- [ ] Postman collection imports without errors.
- [ ] Postman Login request stores the access token.
- [ ] Postman Tenders requests use the stored bearer token.
- [ ] No Cycle 4 work (OCR, LLM, upload, extraction, compliance) is included.
