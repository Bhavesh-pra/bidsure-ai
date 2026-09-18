-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OCRStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ExtractionStatus" AS ENUM ('EXTRACTED', 'REVIEW_RECOMMENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable documents
ALTER TABLE "documents"
ADD COLUMN IF NOT EXISTS "documentType" TEXT,
ADD COLUMN IF NOT EXISTS "classificationConfidence" DOUBLE PRECISION;

-- CreateTable ocr_results
CREATE TABLE IF NOT EXISTS "ocr_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "runNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "OCRStatus" NOT NULL DEFAULT 'PENDING',
    "text" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "pages" JSONB,
    "extractionMethod" TEXT NOT NULL DEFAULT 'HYBRID_OCR',
    "engine" TEXT NOT NULL DEFAULT 'bidsure-ocr-engine',
    "engineVersion" TEXT DEFAULT '1.0.0',
    "language" TEXT DEFAULT 'eng',
    "confidence" DOUBLE PRECISION,
    "pipelineVersion" TEXT NOT NULL DEFAULT 'phase09-v1',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable document_classifications
CREATE TABLE IF NOT EXISTS "document_classifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "runNumber" INTEGER NOT NULL DEFAULT 1,
    "documentType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'RULE_BASED',
    "modelProvider" TEXT,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "pipelineVersion" TEXT NOT NULL DEFAULT 'phase09-v1',
    "classifierVersion" TEXT NOT NULL DEFAULT 'phase09-classifier-v1',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable extracted_evidence
CREATE TABLE IF NOT EXISTS "extracted_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "runNumber" INTEGER NOT NULL DEFAULT 1,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "page" INTEGER NOT NULL DEFAULT 1,
    "boundingBox" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "extractionSource" TEXT,
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'EXTRACTED',
    "modelProvider" TEXT,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "pipelineVersion" TEXT NOT NULL DEFAULT 'phase09-v1',
    "extractorVersion" TEXT NOT NULL DEFAULT 'phase09-extractor-v1',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracted_evidence_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints (ON DELETE RESTRICT to protect evidentiary history)
DO $$ BEGIN
    ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "document_classifications" ADD CONSTRAINT "document_classifications_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "extracted_evidence" ADD CONSTRAINT "extracted_evidence_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Standard Indexes
CREATE INDEX IF NOT EXISTS "ocr_results_documentId_idx" ON "ocr_results"("documentId");
CREATE INDEX IF NOT EXISTS "ocr_results_documentId_isCurrent_idx" ON "ocr_results"("documentId", "isCurrent");

CREATE INDEX IF NOT EXISTS "document_classifications_documentId_idx" ON "document_classifications"("documentId");
CREATE INDEX IF NOT EXISTS "document_classifications_documentId_isCurrent_idx" ON "document_classifications"("documentId", "isCurrent");

CREATE INDEX IF NOT EXISTS "extracted_evidence_documentId_idx" ON "extracted_evidence"("documentId");
CREATE INDEX IF NOT EXISTS "extracted_evidence_field_idx" ON "extracted_evidence"("field");
CREATE INDEX IF NOT EXISTS "extracted_evidence_documentId_isCurrent_idx" ON "extracted_evidence"("documentId", "isCurrent");

-- Partial Unique Indexes: At most one current active run per entity/field
CREATE UNIQUE INDEX IF NOT EXISTS "ocr_results_one_current_run"
ON "ocr_results" ("documentId")
WHERE "isCurrent" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "document_classification_one_current"
ON "document_classifications" ("documentId")
WHERE "isCurrent" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "extracted_evidence_one_current_run"
ON "extracted_evidence" ("documentId", "field")
WHERE "isCurrent" = true;
