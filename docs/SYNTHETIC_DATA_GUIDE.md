# BidSure AI — Synthetic Data Specification & Testing Guide

This guide documents the synthetic datasets created for **Cycle 3 (Tender Creation)** and **Cycle 4 (Tender Upload + Requirement Extraction)**.

---

## 1. Compliance and PII Notice

All data in `mock-data/` is **100% synthetic**.
- No confidential government data is used.
- All GSTINs, PANs, Udyam registration IDs, and organization names are fictitious mock values conforming strictly to official syntax checksums for deterministic testing.

---

## 2. Directory Structure

```text
mock-data/
├── tenders/
│   ├── tender-001.json           # High-Performance Server Infrastructure (IT / Equipment)
│   ├── tender-002.json           # Advanced Diagnostic Imaging Systems (Healthcare / Medical)
│   └── tender-003.json           # Rural Primary Health Centres (Civil Works & Solar PV)
├── clauses/
│   ├── synthetic_clauses.json    # 10 realistic Indian procurement clauses (GeM/CPPP style)
│   └── expected_requirements.json # 10 ground-truth structured requirements for extraction testing
└── edge-cases/
    ├── tender_negative_cases.json # 12 negative test scenarios for validation testing
    └── api-timeout.json          # Network timeout simulation dataset
```

---

## 3. Synthetic Tenders Catalog

| File | Tender Number | Title | Category | Type | Deadline |
|---|---|---|---|---|---|
| `tender-001.json` | `GEM/2026/B/1001` | Supply and Maintenance of High-Performance Server Infrastructure | `TECHNICAL` | `OPEN` | 15 Oct 2026 |
| `tender-002.json` | `GEM/2026/B/2045678` | Procurement of Advanced Diagnostic Imaging Systems | `TECHNICAL` | `OPEN` | 20 Nov 2026 |
| `tender-003.json` | `GEM/2026/B/3098124` | Construction and Solar Electrification of Rural PHCs | `ELIGIBILITY` | `LIMITED` | 05 Dec 2026 |

All 3 tenders validate against `app.domain.tender.schemas.TenderSchema` and can be directly ingested by `POST /api/v1/tenders`.

---

## 4. Tender Clauses & Extraction Benchmarks

The `mock-data/clauses/synthetic_clauses.json` and `mock-data/clauses/expected_requirements.json` files establish the benchmark ground truth for Cycle 4 requirement extraction.

| Clause ID | Domain Category | Rule / Target Value | Operator | Unit |
|---|---|---|---|---|
| `CLAUSE-001` | `STATUTORY` | Active GSTIN registration | `==` | `STATUS` |
| `CLAUSE-002` | `STATUTORY` | Valid Udyam MSE Certificate | `EXISTS` | `BOOLEAN` |
| `CLAUSE-003` | `FINANCIAL` | Average annual turnover >= ₹5 Cr | `>=` | `INR` |
| `CLAUSE-004` | `ELIGIBILITY` | Minimum 3 similar executed projects | `>=` | `Projects` |
| `CLAUSE-005` | `TECHNICAL` | Manufacturer Authorization Form (MAF) | `EXISTS` | `BOOLEAN` |
| `CLAUSE-006` | `FINANCIAL` | Bank solvency certificate >= ₹1.5 Cr | `>=` | `INR` |
| `CLAUSE-007` | `DOCUMENT` | Notarized Non-Blacklisting Affidavit | `EXISTS` | `BOOLEAN` |
| `CLAUSE-008` | `STATUTORY` | Class-I Local Content (MII) >= 50% | `>=` | `%` |
| `CLAUSE-009` | `TECHNICAL` | ISO 9001 and ISO 27001 certifications | `EXISTS` | `BOOLEAN` |
| `CLAUSE-010` | `OPERATIONAL` | Dedicated service center within 100 km | `<=` | `KM` |

---

## 5. Negative Test Scenarios (`tender_negative_cases.json`)

QA engineers and API testers can execute the 12 negative cases against `POST /api/v1/tenders`:

1. `NEG-001`: Missing tender number (expects 400 `VALIDATION_ERROR`)
2. `NEG-002`: Blank/whitespace tender number (expects 400 `VALIDATION_ERROR`)
3. `NEG-003`: Missing title (expects 400 `VALIDATION_ERROR`)
4. `NEG-004`: Blank/whitespace title (expects 400 `VALIDATION_ERROR`)
5. `NEG-005`: Missing category (expects 400 `VALIDATION_ERROR`)
6. `NEG-006`: Invalid category (expects 400 `VALIDATION_ERROR`)
7. `NEG-007`: Invalid tender type (expects 400 `VALIDATION_ERROR`)
8. `NEG-008`: Missing submission deadline (expects 400 `VALIDATION_ERROR`)
9. `NEG-009`: Past submission deadline (expects 400 `VALIDATION_ERROR`)
10. `NEG-010`: Malformed date string (expects 400 `VALIDATION_ERROR`)
11. `NEG-011`: Excessive title length > 500 chars (expects 400 `VALIDATION_ERROR`)
12. `NEG-012`: Duplicate tender number within tenant (expects 409 `DUPLICATE_TENDER_NUMBER`)
