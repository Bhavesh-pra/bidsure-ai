-- AlterEnum
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'CLARIFICATION_REQUIRED';
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_DECISION';
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'DECIDED';
ALTER TYPE "BidStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- AlterTable
ALTER TABLE "tender_versions" ADD CONSTRAINT "tender_versions_id_tenderId_key" UNIQUE ("id", "tenderId");

-- AlterTable
ALTER TABLE "bids" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "metadata" JSONB;

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT IF EXISTS "bids_tenderVersionId_fkey";

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenderVersionId_tenderId_fkey" FOREIGN KEY ("tenderVersionId", "tenderId") REFERENCES "tender_versions"("id", "tenderId") ON DELETE RESTRICT ON UPDATE CASCADE;
