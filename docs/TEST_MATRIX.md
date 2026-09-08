# BidSure AI — Cycle 2 Test Matrix & Quality Gate

This test matrix defines the verification steps required to validate the foundation established in Cycle 2.

---

## 🧪 Cycle 2 Verification Test Matrix

| ID | Test Scenario | Description | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TM-01** | Backend App Startup | Instantiate Flask application factory `create_app('testing')` | Starts without errors | **PASS** |
| **TM-02** | Database Connection | Connect SQLAlchemy to database / test database | Successful connection & model binding | **PASS** |
| **TM-03** | Health API Check | Perform `GET /api/v1/health` | Returns `200 OK` with `success: true` and `request_id` | **PASS** |
| **TM-04** | API Envelope Standard | Verify JSON structure for success responses | Response contains `{ "success": true, "data": {...}, "request_id": "..." }` | **PASS** |
| **TM-05** | Error Response Envelope | Perform request triggering error handler | Returns `{ "success": false, "error": { "code": "...", "message": "..." }, "request_id": "..." }` | **PASS** |
| **TM-06** | Database Models Import | Import all 8 core models (`Organization`, `User`, `Tender`, `TenderVersion`, `Requirement`, `Bidder`, `Bid`, `Document`) | All models import cleanly with defined tables & foreign keys | **PASS** |
| **TM-07** | Domain Schemas Validation | Validate Pydantic domain models (`tender`, `requirement`, `document`, `evidence`, `verification`, `compliance`, `risk`, `recommendation`) | All schemas validate strict contracts with zero warnings | **PASS** |
| **TM-08** | Synthetic Data Integrity | Validate all 7 datasets in `mock-data/` (`organizations`, `tenders`, `requirements`, `bidders`, `gst`, `udyam`, `pan`) | All datasets match schema types and golden demo conditions | **PASS** |
| **TM-09** | End-to-End Integration | Full relational traversal across Flask + SQLAlchemy + Domain Schemas + Mock Data | Queries, relationships, and document bindings pass | **PASS** |
| **TM-10** | Frontend Build & Typecheck | Build React + TypeScript app (`tsc && vite build`) | Type check passes, zero compile errors, bundle produced | **PASS** |
| **TM-11** | Postman Collection | Import `postman/BidSure.postman_collection.json` into Postman | Collection imports validly with pre-configured endpoints | **PASS** |
| **TM-12** | Secret Protection | Audit `.gitignore` and git staged files | No `.env` or credential files committed | **PASS** |

---

## 🏃 Execution Instructions

Run automated verification:

```powershell
pytest backend/tests
```

Run Flask health check test:

```powershell
python -c "from app import create_app; app = create_app('testing'); client = app.test_client(); res = client.get('/api/v1/health'); print(res.status_code); print(res.json)"
```
