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
