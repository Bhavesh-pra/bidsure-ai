-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BIDDER', 'PROCUREMENT_OFFICER', 'REVIEWER', 'AUDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TenderVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EVALUATED', 'REJECTED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROCUREMENT_OFFICER',
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "status" "TenderStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_versions" (
    "id" UUID NOT NULL,
    "tenderId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "status" "TenderVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" UUID NOT NULL,
    "tenderVersionId" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_versions" (
    "id" UUID NOT NULL,
    "requirementId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "evaluationCriteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidders" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bidders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "tenderId" UUID NOT NULL,
    "tenderVersionId" UUID NOT NULL,
    "bidderId" UUID NOT NULL,
    "bidReference" TEXT NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "processingStatus" "DocumentProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_documents" (
    "id" UUID NOT NULL,
    "bidId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "tenders_organizationId_idx" ON "tenders"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_organizationId_referenceNumber_key" ON "tenders"("organizationId", "referenceNumber");

-- CreateIndex
CREATE INDEX "tender_versions_tenderId_idx" ON "tender_versions"("tenderId");

-- CreateIndex
CREATE UNIQUE INDEX "tender_versions_tenderId_versionNumber_key" ON "tender_versions"("tenderId", "versionNumber");

-- CreateIndex
CREATE INDEX "requirements_tenderVersionId_idx" ON "requirements"("tenderVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_tenderVersionId_identifier_key" ON "requirements"("tenderVersionId", "identifier");

-- CreateIndex
CREATE INDEX "requirement_versions_requirementId_idx" ON "requirement_versions"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_versions_requirementId_versionNumber_key" ON "requirement_versions"("requirementId", "versionNumber");

-- CreateIndex
CREATE INDEX "bidders_organizationId_idx" ON "bidders"("organizationId");

-- CreateIndex
CREATE INDEX "bids_organizationId_idx" ON "bids"("organizationId");

-- CreateIndex
CREATE INDEX "bids_tenderId_idx" ON "bids"("tenderId");

-- CreateIndex
CREATE INDEX "bids_tenderVersionId_idx" ON "bids"("tenderVersionId");

-- CreateIndex
CREATE INDEX "bids_bidderId_idx" ON "bids"("bidderId");

-- CreateIndex
CREATE UNIQUE INDEX "bids_tenderId_bidderId_key" ON "bids"("tenderId", "bidderId");

-- CreateIndex
CREATE UNIQUE INDEX "bids_organizationId_bidReference_key" ON "bids"("organizationId", "bidReference");

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "bid_documents_bidId_idx" ON "bid_documents"("bidId");

-- CreateIndex
CREATE INDEX "bid_documents_documentId_idx" ON "bid_documents"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "bid_documents_bidId_documentId_key" ON "bid_documents"("bidId", "documentId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_versions" ADD CONSTRAINT "tender_versions_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_tenderVersionId_fkey" FOREIGN KEY ("tenderVersionId") REFERENCES "tender_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_versions" ADD CONSTRAINT "requirement_versions_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bidders" ADD CONSTRAINT "bidders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenderVersionId_fkey" FOREIGN KEY ("tenderVersionId") REFERENCES "tender_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "bidders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
