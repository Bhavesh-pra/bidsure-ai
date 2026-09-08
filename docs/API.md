# BidSure AI — API Contracts & Specifications

**Base Path**: `/api/v1`

All API requests and responses use JSON (`Content-Type: application/json`).

---

## 1. Standard API Envelope

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {},
  "request_id": "REQ-20260907-123456"
}
```

### Error Response (`400`, `401`, `403`, `404`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The provided tender ID is invalid or missing."
  },
  "request_id": "REQ-20260907-123456"
}
```

---

## 2. HTTP Status Code Conventions

| HTTP Status | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | Standard successful retrieval or execution |
| `201 Created` | Created | Resource successfully created |
| `400 Bad Request` | Invalid Request | Malformed JSON or invalid parameter syntax |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT token |
| `403 Forbidden` | Access Denied | Insufficient role or cross-organization access attempt |
| `404 Not Found` | Not Found | Requested entity ID does not exist |
| `409 Conflict` | State Conflict | Duplicate tender number or conflicting resource state |
| `422 Unprocessable Entity` | Validation Error | Valid JSON but failed domain validation |
| `500 Internal Error` | Server Error | Unhandled backend exception |

---

## 3. Endpoint Specifications

### Health & Monitoring
#### `GET /api/v1/health`
- **Description**: Public system health check.
- **Authentication**: None
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-09-07T23:30:00Z"
  },
  "request_id": "REQ-HEALTH-001"
}
```

---

### Authentication
#### `POST /api/v1/auth/login`
- **Description**: Authenticate user credentials and receive a JWT Bearer access token.
- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "email": "officer@bidsure.gov.in",
  "password": "officer123"
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "user": {
      "id": "USR-OFFICER-001",
      "email": "officer@bidsure.gov.in",
      "name": "Procurement Officer",
      "role": "PROCUREMENT_OFFICER",
      "organization_id": "ORG-001"
    }
  },
  "request_id": "REQ-001"
}
```

---

### Tender Management
#### `POST /api/v1/tenders`
- **Description**: Create a new tender record for the authenticated tenant.
- **Authentication**: Bearer JWT (`PROCUREMENT_OFFICER`, `ADMIN`)
- **Request Body**:
```json
{
  "tender_number": "GEM/2026/B/1234567",
  "title": "Supply of Industrial Equipment",
  "description": "Supply and installation of equipment",
  "category": "TECHNICAL",
  "tender_type": "OPEN",
  "submission_deadline": "2026-10-15T17:00:00Z"
}
```
- **Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "TND-001",
    "tender_number": "GEM/2026/B/1234567",
    "title": "Supply of Industrial Equipment",
    "status": "DRAFT"
  },
  "request_id": "REQ-001"
}
```

#### `GET /api/v1/tenders`
- **Description**: Retrieve all tenders scoped to the caller's organization.
- **Authentication**: Bearer JWT
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "TND-001",
      "tender_number": "GEM/2026/B/1234567",
      "title": "Supply of Industrial Equipment",
      "category": "TECHNICAL",
      "status": "DRAFT"
    }
  ],
  "request_id": "REQ-002"
}
```

#### `GET /api/v1/tenders/{id}`
- **Description**: Get full tender details with tenant isolation enforcement.
- **Authentication**: Bearer JWT
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "TND-001",
    "organization_id": "ORG-001",
    "tender_number": "GEM/2026/B/1234567",
    "title": "Supply of Industrial Equipment",
    "description": "Supply and installation of equipment",
    "category": "TECHNICAL",
    "tender_type": "OPEN",
    "submission_deadline": "2026-10-15T17:00:00+00:00",
    "status": "DRAFT",
    "created_at": "2026-09-08T22:00:00+00:00",
    "updated_at": "2026-09-08T22:00:00+00:00"
  },
  "request_id": "REQ-003"
}
```

---

### Bid Management
#### `POST /api/v1/tenders/{id}/bids`
- **Description**: Submit a new bid against a tender.
- **Request Body**:
```json
{
  "bidder_id": "BIDDER-001",
  "quoted_amount": 45000000.00,
  "proposed_completion_date": "2026-12-31"
}
```
- **Response**: `201 Created`

#### `GET /api/v1/tenders/{id}/bids`
- **Description**: List all bids submitted for a specific tender.
- **Response**: `200 OK`

### Tender Document Extraction

#### `POST /api/v1/tenders/{id}/documents`
- **Description**: Upload a tender PDF, extract page-aware text, and persist structured requirements for the authenticated organization.
- **Request**: `multipart/form-data` with a `file` field.
- **Validation**: PDF extension, PDF signature, MIME type, non-empty content, and configured maximum size.
- **Response**: `201 Created` with document ID, processing status, page count, and extracted requirement count.

#### `GET /api/v1/tenders/{id}/documents`
- **Description**: List tender documents and processing metadata.
- **Response**: `200 OK`

#### `GET /api/v1/tenders/{id}/requirements`
- **Description**: List requirements extracted from the latest tender version.
- **Response**: `200 OK`; includes category, mandatory state, thresholds, source page, and extraction confidence. These are not compliance results.

### Compliance Rules

#### `POST /api/v1/requirements/{id}/rules`
- **Description**: Create a deterministic rule from a requirement, optionally overriding generated fields.

#### `GET /api/v1/requirements/{id}/rules`
- **Description**: List rules associated with a requirement.

#### `POST /api/v1/tenders/{id}/rules/generate`
- **Description**: Generate rules for the latest extracted requirements of a tender.

#### `GET /api/v1/tenders/{id}/rules`
- **Description**: List all generated rules for a tender.

#### `POST /api/v1/rules/evaluate`
- **Description**: Development/testing endpoint for deterministic rule evaluation.
- **Request**:
```json
{
  "rule_id": "RULE-001",
  "evidence": {"actual_value": 75000000}
}
```
- **Response**: Rule status and explainable reason; no bidder compliance record is persisted in Cycle 5.

#### `GET /api/v1/bids/{id}`
- **Description**: Get full bid overview and status.
- **Response**: `200 OK`
