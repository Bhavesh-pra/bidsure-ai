-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADING', 'SCANNING', 'PROCESSING', 'READY', 'FAILED', 'QUARANTINED', 'REPLACEMENT_REQUIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable documents: add columns with safe backfill for existing records
ALTER TABLE "documents" 
ADD COLUMN IF NOT EXISTS "originalFilename" TEXT,
ADD COLUMN IF NOT EXISTS "mediaType" TEXT,
ADD COLUMN IF NOT EXISTS "extension" TEXT NOT NULL DEFAULT 'pdf',
ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "status" "DocumentStatus",
ADD COLUMN IF NOT EXISTS "uploadedById" UUID,
ADD COLUMN IF NOT EXISTS "scanStatus" TEXT,
ADD COLUMN IF NOT EXISTS "scanTimestamp" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failureCode" TEXT,
ADD COLUMN IF NOT EXISTS "failureMessage" TEXT,
ADD COLUMN IF NOT EXISTS "supersedesDocumentId" UUID;

-- Backfill status and sizeBytes for existing Phase 03/07 document rows
UPDATE "documents" 
SET 
  "status" = 'READY',
  "originalFilename" = COALESCE("originalFilename", "fileName"),
  "mediaType" = COALESCE("mediaType", "mimeType"),
  "sizeBytes" = COALESCE("fileSize", 0)
WHERE "status" IS NULL;

-- Make status NOT NULL now that existing rows have been populated
ALTER TABLE "documents" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable bid_documents: add updatedAt
ALTER TABLE "bid_documents" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" 
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_supersedesDocumentId_fkey" 
    FOREIGN KEY ("supersedesDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "documents_sha256_idx" ON "documents"("sha256");
CREATE INDEX IF NOT EXISTS "documents_organizationId_sha256_idx" ON "documents"("organizationId", "sha256");
CREATE INDEX IF NOT EXISTS "documents_uploadedById_idx" ON "documents"("uploadedById");
