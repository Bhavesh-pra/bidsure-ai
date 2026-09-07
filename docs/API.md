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

### Tender Management
#### `POST /api/v1/tenders`
- **Description**: Create a new tender record.
- **Request Body**:
```json
{
  "tender_number": "GEM/2026/B/1001",
  "title": "Supply of High-Performance Server Infrastructure",
  "entity": "Ministry of Electronics & IT",
  "category": "EQUIPMENT",
  "submission_deadline": "2026-10-15T17:00:00Z"
}
```
- **Response**: `201 Created`

#### `GET /api/v1/tenders`
- **Description**: Retrieve all tenders scoped to current user organization.
- **Response**: `200 OK`

#### `GET /api/v1/tenders/{id}`
- **Description**: Get tender details including current requirements.
- **Response**: `200 OK`

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

#### `GET /api/v1/bids/{id}`
- **Description**: Get full bid overview and status.
- **Response**: `200 OK`
