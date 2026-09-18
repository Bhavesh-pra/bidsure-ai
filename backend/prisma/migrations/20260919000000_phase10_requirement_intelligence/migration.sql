-- Phase 10 Migration: Requirement Intelligence & Human Review

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "RequirementStatus" AS ENUM ('PROPOSED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RequirementCategory" AS ENUM (
        'IDENTITY', 'LEGAL_ENTITY', 'GST_REGISTRATION', 'UDYAM_REGISTRATION',
        'PAN', 'MCA_REGISTRATION', 'TURNOVER', 'EXPERIENCE', 'FINANCIAL_CAPACITY',
        'TECHNICAL_CAPACITY', 'OEM_AUTHORIZATION', 'EMD', 'DECLARATION',
        'CERTIFICATION', 'LOCAL_CONTENT', 'MSME_ELIGIBILITY', 'STARTUP_ELIGIBILITY',
        'STATUTORY_COMPLIANCE', 'OTHER', 'REVIEW_REQUIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RequirementOperator" AS ENUM (
        'EQUALS', 'NOT_EQUALS', 'STATUS_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL',
        'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'CONTAINS', 'EXISTS', 'DATE_BEFORE',
        'DATE_AFTER', 'DATE_ON_OR_BEFORE', 'DATE_ON_OR_AFTER', 'BOOLEAN_TRUE',
        'BOOLEAN_FALSE', 'MATCHES', 'ONE_OF'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter requirements table
ALTER TABLE "requirements"
ADD COLUMN IF NOT EXISTS "organizationId" UUID,
ADD COLUMN IF NOT EXISTS "tenderId" UUID,
ADD COLUMN IF NOT EXISTS "currentVersionId" UUID;

-- Backfill organizationId and tenderId from tender_versions where possible
UPDATE "requirements" r
SET "tenderId" = tv."tenderId",
    "organizationId" = t."organizationId"
FROM "tender_versions" tv
JOIN "tenders" t ON tv."tenderId" = t."id"
WHERE r."tenderVersionId" = tv."id"
  AND r."organizationId" IS NULL;

-- 3. Alter requirement_versions table
ALTER TABLE "requirement_versions"
ADD COLUMN IF NOT EXISTS "tenderVersionId" UUID,
ADD COLUMN IF NOT EXISTS "status" "RequirementStatus" NOT NULL DEFAULT 'PROPOSED',
ADD COLUMN IF NOT EXISTS "category" "RequirementCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "condition" TEXT,
ADD COLUMN IF NOT EXISTS "operator" "RequirementOperator",
ADD COLUMN IF NOT EXISTS "threshold" JSONB,
ADD COLUMN IF NOT EXISTS "expectedValue" TEXT,
ADD COLUMN IF NOT EXISTS "requiredEvidenceType" TEXT,
ADD COLUMN IF NOT EXISTS "sourceClause" TEXT,
ADD COLUMN IF NOT EXISTS "sourcePage" INTEGER,
ADD COLUMN IF NOT EXISTS "sourceText" TEXT,
ADD COLUMN IF NOT EXISTS "sourceDocumentId" UUID,
ADD COLUMN IF NOT EXISTS "sourceLocation" JSONB,
ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "effectiveTo" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "aiModel" TEXT,
ADD COLUMN IF NOT EXISTS "aiModelVersion" TEXT,
ADD COLUMN IF NOT EXISTS "aiConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "createdBy" UUID,
ADD COLUMN IF NOT EXISTS "approvedBy" UUID,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "supersedesVersionId" UUID;

-- Backfill tenderVersionId on requirement_versions
UPDATE "requirement_versions" rv
SET "tenderVersionId" = r."tenderVersionId"
FROM "requirements" r
WHERE rv."requirementId" = r."id"
  AND rv."tenderVersionId" IS NULL;

-- 4. Create compliance_rules table (Phase 12 Foundation)
CREATE TABLE IF NOT EXISTS "compliance_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requirementId" UUID NOT NULL,
    "requirementVersionId" UUID,
    "ruleType" TEXT NOT NULL,
    "operator" "RequirementOperator",
    "expectedValue" TEXT,
    "parameters" JSONB DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_rules_pkey" PRIMARY KEY ("id")
);

-- 5. Create tender_documents table
CREATE TABLE IF NOT EXISTS "tender_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenderId" UUID NOT NULL,
    "tenderVersionId" UUID,
    "documentId" UUID NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TENDER_SPECIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_documents_pkey" PRIMARY KEY ("id")
);

-- 6. Create audit_events table
CREATE TABLE IF NOT EXISTS "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "metadata" JSONB DEFAULT '{}',
    "correlationId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- 7. Add foreign keys and indexes
CREATE INDEX IF NOT EXISTS "requirements_organizationId_idx" ON "requirements"("organizationId");
CREATE INDEX IF NOT EXISTS "requirements_tenderId_idx" ON "requirements"("tenderId");
CREATE INDEX IF NOT EXISTS "requirements_tenderVersionId_idx" ON "requirements"("tenderVersionId");

CREATE INDEX IF NOT EXISTS "requirement_versions_requirementId_idx" ON "requirement_versions"("requirementId");
CREATE INDEX IF NOT EXISTS "requirement_versions_tenderVersionId_idx" ON "requirement_versions"("tenderVersionId");
CREATE INDEX IF NOT EXISTS "requirement_versions_status_idx" ON "requirement_versions"("status");

CREATE INDEX IF NOT EXISTS "compliance_rules_requirementId_idx" ON "compliance_rules"("requirementId");
CREATE INDEX IF NOT EXISTS "compliance_rules_requirementVersionId_idx" ON "compliance_rules"("requirementVersionId");
CREATE INDEX IF NOT EXISTS "compliance_rules_ruleType_idx" ON "compliance_rules"("ruleType");

CREATE UNIQUE INDEX IF NOT EXISTS "tender_documents_tenderId_documentId_key" ON "tender_documents"("tenderId", "documentId");
CREATE INDEX IF NOT EXISTS "tender_documents_tenderId_idx" ON "tender_documents"("tenderId");
CREATE INDEX IF NOT EXISTS "tender_documents_tenderVersionId_idx" ON "tender_documents"("tenderVersionId");
CREATE INDEX IF NOT EXISTS "tender_documents_documentId_idx" ON "tender_documents"("documentId");

CREATE INDEX IF NOT EXISTS "audit_events_organizationId_idx" ON "audit_events"("organizationId");
CREATE INDEX IF NOT EXISTS "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_events_timestamp_idx" ON "audit_events"("timestamp");
