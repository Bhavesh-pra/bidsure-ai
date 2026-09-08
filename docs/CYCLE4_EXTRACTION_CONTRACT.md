# Cycle 4 Contract: Tender Requirement Extraction Service

This document defines the architectural and interface contract between **Cycle 3 (Tender Creation)** and **Cycle 4 (Tender Upload + Requirement Extraction)**.

---

## 1. Pipeline Architecture

```text
       CYCLE 3
┌────────────────────┐
│   Tender Entity    │  (persisted in PostgreSQL)
└─────────┬──────────┘
          │
          ▼
       CYCLE 4
┌────────────────────┐
│  Tender Document   │  (PDF uploaded to storage, e.g. S3/local)
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Extraction Service │  (PyMuPDF / OCR / LLM Engine)
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    Requirements    │  (Structured Pydantic Requirements)
└────────────────────┘
```

---

## 2. Callable Service Interface

The Cycle 4 extraction service must implement the callable protocol defined in `app.domain.tender.contracts.RequirementExtractionProtocol`:

```python
def extract_requirements(
    tender_id: str,
    document_id: str,
    **kwargs
) -> ExtractionResult:
    """
    Extract structured qualification requirements from an uploaded tender document.

    :param tender_id: UUID of the existing parent Tender
    :param document_id: UUID of the uploaded tender document
    :param kwargs: Optional parameters (e.g. file_path, ocr_enabled, max_pages)
    :return: ExtractionResult containing structured requirements and clauses
    """
```

---

## 3. Data Transfer Objects (DTOs)

### 3.1 `ExtractionInput`
The payload passed into the extraction pipeline:

```json
{
  "tender_id": "TND-001",
  "document_id": "DOC-TND-001",
  "file_path": "storage/tenders/TND-001/rfp_document.pdf",
  "file_url": null,
  "mime_type": "application/pdf",
  "options": {
    "ocr_fallback": true,
    "max_pages": 50,
    "confidence_threshold": 0.70
  }
}
```

### 3.2 `ExtractedRequirement`
Each requirement extracted from clauses:

```json
{
  "id": "REQ-001",
  "title": "Minimum Annual Turnover",
  "description": "Bidder must possess an average annual turnover of at least ₹5 Crore in last 3 FYs.",
  "category": "FINANCIAL",
  "mandatory": true,
  "mandatory_level": "MANDATORY",
  "review_status": "REQUIRED",
  "applicability": "ALL_BIDDERS",
  "operator": ">=",
  "expected_value": 50000000,
  "unit": "INR",
  "evaluation_period": "3 FY (2022-2025)",
  "source_clause": "Clause 5.1",
  "source_page": 8,
  "confidence": 0.95
}
```

### 3.3 `ExtractionResult`
The complete response returned by the extraction engine:

```json
{
  "tender_id": "TND-001",
  "document_id": "DOC-TND-001",
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Minimum Annual Turnover",
      "category": "FINANCIAL",
      "mandatory": true,
      "operator": ">=",
      "expected_value": 50000000,
      "unit": "INR",
      "source_clause": "Clause 5.1",
      "source_page": 8,
      "confidence": 0.95
    }
  ],
  "raw_clauses": [
    {
      "clause_id": "Clause 5.1",
      "text": "The bidder must have an average annual turnover of at least Rs. 5 crore during the previous three financial years.",
      "page_number": 8,
      "section": "Financial Criteria"
    }
  ],
  "total_requirements": 1,
  "avg_confidence": 0.95,
  "extracted_at": "2026-09-08T22:30:00Z",
  "model_name": "gemini-1.5-pro",
  "processing_time_ms": 1420
}
```

---

## 4. Frozen Enums for Cycle 4

### 4.1 Requirement Categories
```text
STATUTORY
FINANCIAL
TECHNICAL
REGISTRATION
DOCUMENT
ELIGIBILITY
OPERATIONAL
```

### 4.2 Mandatory Levels
```text
MANDATORY
OPTIONAL
```

### 4.3 Review Statuses
```text
REQUIRED
NOT_REQUIRED
REVIEW
```

### 4.4 Comparison Operators
```text
EQUALS (==)
NOT_EQUALS (!=)
GREATER_THAN_EQUAL (>=)
LESS_THAN_EQUAL (<=)
GREATER_THAN (>)
LESS_THAN (<)
CONTAINS
EXISTS
```
