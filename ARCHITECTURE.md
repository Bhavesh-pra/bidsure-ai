# BidSure AI — Architecture Reference Document

## 1. System Topology

```text
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React + TypeScript + Vite                      │
│                    Tailwind + Recharts                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     FLASK MODULAR MONOLITH                 │
│                                                             │
│ Auth / RBAC / Tenant Security                              │
│ Tender Intelligence & Document Ingestion                   │
│ Bid Management & Document Storage                           │
│ OCR (Tesseract Engine) + Evidence Extraction               │
│ Compliance Engine + Verification Adapters                   │
│ Feasibility & Risk Engines                                 │
│ AI Recommendation & Officer Decision Engine                │
│ Immutable Audit Trail                                      │
└─────────────┬──────────────────────┬────────────────────────┘
              │                      │
              ▼                      ▼
     ┌─────────────────┐    ┌────────────────────┐
     │ PostgreSQL      │    │ S3-compatible      │
     │ + SQLAlchemy    │    │ Object Storage     │
     └─────────────────┘    └────────────────────┘
```

---

## 2. Verification Taxonomy (8 Domains)

1. **Identity & Evidence Authenticity**: PAN, GSTIN, Udyam, Legal Name, Document Hash Integrity.
2. **Statutory & Regulatory Compliance**: GST returns, EPFO, ESIC, Blacklisting status.
3. **Tender Eligibility**: Minimum Annual Turnover, Similar Experience Years, Bid Capacity.
4. **Technical Conformity**: Tender spec comparison against Bidder technical submission.
5. **Execution Feasibility**: Deterministic evaluation of schedule, capacity, manpower, materials, quality.
6. **Resource Capability**: Verified equipment list, key personnel certification.
7. **Financial Capability**: Audited balance sheets, financial liquidity ratios.
8. **Integrity & Risk**: Cross-document contradictions, expired documents, anomaly flags.

---

## 3. Status Models & Edge Case Handling

The system strictly avoids binary PASS/FAIL when evidence is incomplete or unverified.

### Verification Statuses
- `VERIFIED_PASS`: Document & external source match expected rule.
- `VERIFIED_FAIL`: Document or source definitively fails criteria.
- `PARTIAL`: Partially satisfied non-mandatory requirement.
- `REVIEW_REQUIRED`: Discrepancy requiring human intervention.
- `EVIDENCE_MISSING`: Required proof not submitted.
- `NOT_APPLICABLE`: Requirement exempt for bidder type (e.g. MSME exemption).
- `UNABLE_TO_VERIFY`: External API/source offline or unreadable.
- `CONFLICTING_EVIDENCE`: Contradiction across submitted documents.

### Fundamental Exception Handling Rule
```text
External API / Verification failure
        ↓
UNABLE_TO_VERIFY
        ↓
REVIEW_REQUIRED
```
*Never map external API failures to automated FAIL or PASS.*

---

## 4. Central Security & Multi-Tenancy

- **Authentication**: JWT token in memory; Refresh token in `httpOnly` secure cookie.
- **Tenant Scope**: Handled at `app/security/tenant.py`. All repository operations strictly filter by `organization_id`.
- **Prompt Injection Defense**: Untrusted PDF text is isolated using XML boundaries and strict schema enforcement.
