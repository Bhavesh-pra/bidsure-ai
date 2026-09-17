-- BidSure AI Migration: 001_create_tenders_table.sql
-- Description: PostgreSQL schema definition for tenders table with tenant-isolated uniqueness

CREATE TABLE IF NOT EXISTS tenders (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    tender_number VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    entity VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    tender_type VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    submission_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    current_version_id VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT uq_org_tender_number UNIQUE (organization_id, tender_number)
);

CREATE INDEX IF NOT EXISTS idx_tenders_organization_id ON tenders(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
