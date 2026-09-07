# BidSure AI — PostgreSQL Data Model Documentation

This document defines the core relational database schema managed via SQLAlchemy ORM.

---

## 1. Entity Relationship Overview

```text
Organization (1) ────< (N) User
    │
    └────< (N) Tender (1) ────< (N) TenderVersion (1) ────< (N) Requirement
                   │
                   └────< (N) Bid (1) ────< (N) Document
                           │
                           └──── (1) Bidder
```

---

## 2. Core Tables Specification

### `organizations`
Stores tenant organizations.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique Organization ID |
| `name` | VARCHAR(255) | NOT NULL | Organization Name |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Short Code |
| `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | Status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

### `users`
System users with role-based access.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | User UUID |
| `organization_id` | VARCHAR(36) | FOREIGN KEY | Organization reference |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User Email |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(100) | NOT NULL | User full name |
| `role` | VARCHAR(50) | NOT NULL | Role: `ADMIN`, `PROCUREMENT_OFFICER`, `EVALUATOR`, `AUDITOR` |
| `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | Status |

### `tenders`
Main procurement tenders.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Tender UUID |
| `organization_id` | VARCHAR(36) | FOREIGN KEY | Owner organization |
| `tender_number` | VARCHAR(100) | UNIQUE, NOT NULL | Official Tender Reference Number |
| `title` | VARCHAR(500) | NOT NULL | Tender Title |
| `entity` | VARCHAR(255) | NOT NULL | Procurement Entity Name |
| `category` | VARCHAR(100) | NOT NULL | Goods/Services/Works category |
| `submission_deadline` | TIMESTAMP | NOT NULL | Deadline |
| `status` | VARCHAR(50) | DEFAULT 'DRAFT' | State machine status |

### `requirements`
Extracted qualification requirements from tender specifications.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Requirement UUID |
| `tender_version_id` | VARCHAR(36) | FOREIGN KEY | Tender Version reference |
| `category` | VARCHAR(50) | NOT NULL | `STATUTORY`, `FINANCIAL`, `TECHNICAL`, `REGISTRATION` |
| `title` | VARCHAR(255) | NOT NULL | Requirement Title |
| `description` | TEXT | NULL | Detailed description |
| `mandatory` | BOOLEAN | DEFAULT TRUE | Is mandatory? |
| `operator` | VARCHAR(20) | NULL | Comparison operator (`>=`, `==`, `CONTAINS`) |
| `expected_value` | VARCHAR(255) | NULL | Target value for evaluation |
| `source_clause` | VARCHAR(100) | NULL | Tender document clause reference |
| `source_page` | INTEGER | NULL | Page number in tender PDF |
| `confidence` | FLOAT | NULL | LLM extraction confidence (0.0 to 1.0) |

### `bidders`
Legal entity profiles of vendors submitting bids.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Bidder UUID |
| `legal_name` | VARCHAR(255) | NOT NULL | Official registered legal name |
| `pan` | VARCHAR(10) | NULL | Permanent Account Number |
| `gstin` | VARCHAR(15) | NULL | GST Identification Number |
| `udyam_number` | VARCHAR(50) | NULL | MSME Udyam Registration Number |

### `bids`
Submitted bidder proposals against a tender.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Bid UUID |
| `tender_id` | VARCHAR(36) | FOREIGN KEY | Target Tender ID |
| `bidder_id` | VARCHAR(36) | FOREIGN KEY | Submitting Bidder ID |
| `quoted_amount` | NUMERIC(15,2) | NOT NULL | Quoted tender price in INR |
| `status` | VARCHAR(50) | DEFAULT 'SUBMITTED' | Lifecycle status |

### `documents`
Uploaded binary documents (stored in S3/R2).
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Document UUID |
| `bid_id` | VARCHAR(36) | FOREIGN KEY | Target Bid ID |
| `document_type` | VARCHAR(50) | NOT NULL | `GST_CERTIFICATE`, `PAN_CARD`, `UDYAM`, `AUDIT_REPORT` |
| `original_filename` | VARCHAR(255) | NOT NULL | Original uploaded filename |
| `storage_key` | VARCHAR(500) | NOT NULL | S3 Object Key |
| `sha256` | VARCHAR(64) | NOT NULL | File SHA-256 checksum |
| `processing_status` | VARCHAR(50) | DEFAULT 'UPLOADED' | Processing state |
