-- AlterTable
ALTER TABLE "tenders" ADD COLUMN "category" TEXT,
ADD COLUMN "department" TEXT;

-- AlterTable
ALTER TABLE "tender_versions" ADD COLUMN "changeSummary" TEXT;
