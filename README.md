# BidSure AI — SIH MVP

BidSure AI is an evidence-driven, explainable procurement evaluation and decision-support system built for high-stakes government and enterprise tendering.

---

## 🎯 Core Architectural Philosophy

> **AI interprets evidence; deterministic engines evaluate objective rules; external systems provide verification data; and the authorized Procurement Officer makes the final decision.**

Key principles:
1. **Compliance $\neq$ Feasibility $\neq$ Risk $\neq$ Officer Decision**: AI outputs are kept strictly distinct from objective rule compliance and human legal authority.
2. **Four Authority Layers (L0–L3)**:
   - **L0**: Source Systems (GSTN, MCA, Udyam, DigiLocker)
   - **L1**: Deterministic Rules (Math, Dates, Pass/Fail Criteria)
   - **L2**: BidSure AI (Extraction, Semantic Matching, Anomalies, Recommendations)
   - **L3**: Procurement Officer (Final Authority)
3. **Traceable Audit Chain**: Every decision navigates backward: `Officer Decision` $\rightarrow$ `Recommendation` $\rightarrow$ `Finding` $\rightarrow$ `Rule` $\rightarrow$ `Verification` $\rightarrow$ `Evidence` $\rightarrow$ `Document Page` $\rightarrow$ `Tender Requirement`.

---

## 🏗️ Repository Architecture

Modular Monolith Structure:

```text
bidsure/
├── frontend/               # React + TypeScript + Vite + Tailwind CSS
├── backend/                # Flask Modular Monolith API
│   ├── app/
│   │   ├── api/            # REST API Routes & Endpoints
│   │   ├── domain/         # Subsystem Schemas & Logic (Tender, Evidence, Compliance, Risk, Decision)
│   │   ├── models/         # PostgreSQL SQLAlchemy ORM Models
│   │   ├── security/       # JWT Auth, RBAC & Multi-tenant isolation helpers
│   │   └── utils/          # Standard response helpers & utilities
│   ├── tests/              # Pytest backend test suite
│   ├── Dockerfile          # Linux + Tesseract OCR container definition
│   └── run.py              # Application entry point
├── docs/                   # API, Data Model, Development Rules & Integration Checklist
├── postman/                # Postman Collection for API testing
├── docker-compose.yml      # Local dev stack (Flask + PostgreSQL 16)
├── .env.example            # Environment variables template
└── ARCHITECTURE.md         # Detailed architectural documentation
```

---

## 👥 Team Ownership Breakdown

| Ownership Area | Subsystem Lead | Core Responsibilities |
|---|---|---|
| **Intelligence** | Main Dev 1 (Python / AI) | Requirement Extraction, Document AI, OCR, Evidence, Verification & Risk Schemas |
| **Platform** | Main Dev 2 (MERN / API) | Flask API, PostgreSQL Models, SQLAlchemy, Auth, Tenant Security, Storage, REST Contracts |
| **Product** | Main Dev 3 (MERN / Frontend) | React UI Architecture, Route Skeleton, TypeScript Types, Evidence Viewer, Officer Dashboard |
| **UI Support** | Partial Dev 1 (Frontend) | Reusable React UI primitives (Buttons, Badges, Tables, Cards, Modals) |
| **Data Support** | Partial Dev 2 (Data/AI) | Synthetic tender/bidder datasets, evidence JSON, mock government adapter datasets |
| **DevOps / QA** | Partial Dev 3 (QA/DevOps) | Docker, Environment setup, README, Development guidelines, API docs & Postman |

---

## 🚀 Quickstart Guide

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js LTS (18+)

### 1. Clone & Set Up Environment Variables
```bash
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker compose up --build
```
The backend API will be available at `http://localhost:5000/api/v1/health`.

### 3. Run Backend Locally (Without Docker)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

---

## ⚠️ To be fixed (Cycle 10 — Entity Extraction & Structured Evidence)

### 1. Backend & Extraction Engine
- **Extraction Retry Blocker (HTTP 409)**: In [`backend/app/services/evidence_service.py`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/backend/app/services/evidence_service.py), `extract_document_evidence()` strictly requires `document.processing_status in ("CLASSIFIED", "REVIEW_REQUIRED")`. If a document extraction fails (`EXTRACTION_FAILED`) or needs to be re-run on an `EXTRACTED` document, the request is rejected with `409 DOCUMENT_NOT_CLASSIFIED`, preventing retry operations.
- **Multi-Page Field Duplication**: In [`backend/app/services/evidence_extraction/service.py`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/backend/app/services/evidence_extraction/service.py), if an identifier or label (e.g., GSTIN, PAN, legal name) appears across multiple pages of a multi-page document, duplicate `Evidence` rows are generated and persisted for each page without deduplication.
- **Missing Specific Normalization Functions**: `normalize_pan()`, `normalize_gstin()`, `normalize_udyam()`, and `normalize_amount()` were not individually implemented (a generic `normalize_identifier()` was used instead, and amount normalization is absent).
- **Incomplete PAN Extraction**: "Document number where applicable" is currently omitted from PAN extraction.
- **Competing Schemas**: [`backend/app/domain/evidence/schemas.py`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/backend/app/domain/evidence/schemas.py) retains the legacy `EvidenceSchema` alongside the new canonical `EvidenceField` and `StructuredEvidence` contracts.

### 2. Frontend & User Experience
- **Extraction Status Display Bug**: In [`frontend/src/pages/BidEvidence.tsx`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/frontend/src/pages/BidEvidence.tsx), documents in `UPLOADED`, `PROCESSED`, or `CLASSIFIED` status erroneously display as `"EXTRACTING"` due to a simplistic ternary fallback check.
- **Missing Desktop "View Source"**: [`FieldTable.tsx`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/frontend/src/components/documents/FieldTable.tsx) (desktop table) lacks the `View Source` action button to open `OCRPagePreview`. The functionality is currently only accessible on mobile viewport cards (`EvidenceFieldCard.tsx`).
- **Missing Retry UI**: When an extraction fails, there is no `[Retry]` button in `BidEvidence.tsx`, and [`DocumentCard.tsx`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/frontend/src/components/documents/DocumentCard.tsx) conditionally hides the `Extract Evidence` button when status is `EXTRACTION_FAILED`.
- **Confidence Badge Semantic Styling**: In [`ConfidenceLevelBadge.tsx`](file:///c:/Users/hp/OneDrive/Desktop/BidSure/frontend/src/components/documents/ConfidenceLevelBadge.tsx), `LOW` confidence maps to `variant="danger"` (red), which visually implies a compliance failure rather than an informational review signal.

### 3. Data & Synthetic Fixtures
- **Missing Synthetic Test Document Files**: No actual synthetic PDF or image documents for GST, PAN, or Udyam were created under `mock-data/extraction/` (only minimal expected JSON fixtures exist).
- **Missing Difficult / Edge-Case Suite**: No test documents covering scanned, blurred, rotated, multi-page, missing-field, conflicting-field, or low-quality OCR scenarios.
- **Missing Extraction Evaluation Benchmark**: No evaluation script or test suite comparing Expected vs. Actual extracted values with accuracy metrics and error categorization.

### 4. QA, Security & Documentation
- **Missing API Integration Tests**: No automated tests for `POST /api/v1/documents/{id}/extract`, `GET /api/v1/bids/{id}/evidence`, or `GET /api/v1/evidence/{id}`.
- **Missing Security & Multi-Tenant Tests**: No tests verifying 401 Unauthorized (missing/invalid JWT) or 403 Forbidden (cross-tenant organization isolation) on evidence endpoints.
- **Missing Evidence Integrity Tests**: No tests asserting document-bid scoping, isolation against cross-document evidence injection, or cascade deletions.
- **Outdated Documentation**: `README.md`, `ARCHITECTURE.md`, and `docs/API.md` were not updated with Cycle 10 contracts and endpoints; `docs/CYCLE10_QA_REPORT.md` contains only an unexecuted checklist template.
