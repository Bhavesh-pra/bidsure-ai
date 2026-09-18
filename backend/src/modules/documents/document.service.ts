import crypto from "node:crypto";
import { DocumentStatus, DocumentProcessingStatus, BidStatus, TenderStatus } from "@prisma/client";
import { documentRepository, DocumentRepository } from "./document.repository.js";
import { validateUploadedFile, type ValidatedDocumentFile } from "./document.validator.js";
import { assertValidDocumentTransition } from "./document.state-machine.js";
import { getStorageService, buildStorageKey } from "../../infrastructure/storage/storage.service.js";
import { getScannerAdapter } from "../../infrastructure/security/scanner.adapter.js";
import { getQueueService } from "../../infrastructure/queue/queue.service.js";
import { processDocumentJob } from "../../workers/document-processing.worker.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { runInTransaction } from "../../shared/database/transaction.helper.js";
import {
  DuplicateDocumentError,
  DocumentNotFoundError,
  DocumentNotDeletableError,
  DocumentNotRetryableError,
} from "./document.errors.js";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/app-error.js";
import { CrossTenantAccessDeniedError } from "../bids/bid.errors.js";
import { can } from "../../shared/auth/permissions.js";
import { logger } from "../../infrastructure/logging/logger.js";
import type { TenantContext } from "../../shared/auth/tenant-context.js";
import type { DocumentDTO, BidDocumentDTO, UploadDocumentInput } from "./document.types.js";

export class DocumentService {
  constructor(private readonly repository: DocumentRepository = documentRepository) {
    // Register worker with queue service
    getQueueService().registerWorker("processing.queue", processDocumentJob);
  }

  /**
   * Authoritative Ingestion Pipeline:
   *
   * HTTP upload -> Auth & Tenant -> Bid Ownership -> Multi-stage validation ->
   * SHA-256 -> Duplicate Check -> Quarantine Scanner -> Object Storage ->
   * Database Persistence -> Processing Job Enqueue.
   */
  async uploadBidDocument(
    input: UploadDocumentInput,
    tenant: TenantContext | undefined
  ): Promise<BidDocumentDTO> {
    if (!tenant) {
      throw new UnauthorizedError("Authentication is required to upload documents");
    }

    const { bidId, file, category = "TECHNICAL_PROPOSAL", supersedesDocumentId } = input;

    // 1. Authoritative Bid Resolution & Tenant Isolation
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        tender: { select: { id: true, status: true, referenceNumber: true } },
        tenderVersion: { select: { id: true, versionNumber: true } },
      },
    });

    if (!bid) {
      throw new NotFoundError(`Bid with ID '${bidId}' was not found`);
    }

    // Tenant isolation: Org A cannot upload into Org B bid
    if (bid.organizationId !== tenant.organizationId) {
      throw new CrossTenantAccessDeniedError("Cannot upload documents to a bid from a different organization");
    }

    // Bidder identity verification
    if (tenant.role === "BIDDER") {
      if (!tenant.bidderId || bid.bidderId !== tenant.bidderId) {
        throw new ForbiddenError("You do not have permission to upload documents to this bid proposal");
      }
    }

    // Check authorization policy
    const dummyUser = {
      id: tenant.userId,
      organizationId: tenant.organizationId,
      email: tenant.email || "user@bidsure.test",
      role: tenant.role,
      name: "",
      status: "ACTIVE" as const,
      bidderId: tenant.bidderId || null,
      organization: { id: tenant.organizationId, name: "", status: "ACTIVE" as const },
    };

    if (!can(dummyUser, "create", "document")) {
      throw new ForbiddenError("You do not have permission to upload documents");
    }

    // Immutable tenderVersion binding invariant (Phase 07 preservation)
    // The bid is strictly bound to its own immutable tenderVersionId
    const tenderVersionId = bid.tenderVersionId;

    // 2. Server-side File Validation Pipeline
    // (Non-empty, Size 10MB limit, Extension, MIME, Magic-bytes, SHA-256)
    const validated: ValidatedDocumentFile = validateUploadedFile(file);

    // 3. Authoritative Duplicate Policy:
    // SAME bid + SAME SHA-256 = Duplicate (HTTP 409)
    const duplicateInBid = await this.repository.findDuplicateInBid(bid.id, validated.sha256);
    if (duplicateInBid) {
      throw new DuplicateDocumentError("This document has already been uploaded to this bid.", {
        bidId: bid.id,
        sha256: validated.sha256,
      });
    }

    // Cross-bid reuse lookup (Permitted: same content in different bids by same organization is NOT rejected)
    const existingOrgDoc = await this.repository.findDuplicateInOrg(bid.organizationId, validated.sha256);
    if (existingOrgDoc) {
      logger.info(
        { sha256: validated.sha256, originalDocId: existingOrgDoc.id, bidId: bid.id },
        "Document content exists in organization (cross-bid reuse permitted)"
      );
    }

    // 4. Security Scanning & Quarantine Boundary
    const scanner = getScannerAdapter();
    const scanResult = await scanner.scanDocument(validated.buffer, validated.originalFilename);

    const documentId = crypto.randomUUID();
    const storageService = getStorageService();
    const storageKey = buildStorageKey(bid.organizationId, bid.id, documentId);

    // Handle Superseded Document Replacement (refinement #8)
    if (supersedesDocumentId) {
      const oldDoc = await prisma.document.findUnique({
        where: { id: supersedesDocumentId },
      });
      if (oldDoc && oldDoc.organizationId === bid.organizationId) {
        await prisma.document.update({
          where: { id: supersedesDocumentId },
          data: { status: DocumentStatus.REPLACEMENT_REQUIRED },
        });
        logger.info({ oldDocId: supersedesDocumentId, newDocId: documentId }, "Document marked REPLACEMENT_REQUIRED by replacement upload");
      }
    }

    // FAILURE BRANCH: Infected / Unsafe Document -> QUARANTINED
    if (!scanResult.isClean) {
      logger.warn(
        { documentId, bidId: bid.id, virusName: scanResult.virusName },
        "Uploaded document quarantined by security scanner"
      );

      // Persist quarantined record without regular storage or downstream processing
      const quarantined = await runInTransaction(async (tx) => {
        return this.repository.createWithBidAssociation(
          {
            organizationId: bid.organizationId,
            storageKey: `quarantine/${storageKey}`,
            fileName: validated.originalFilename,
            originalFilename: validated.originalFilename,
            mimeType: validated.canonicalMimeType,
            mediaType: validated.canonicalMimeType,
            extension: validated.extension,
            fileSize: validated.sizeBytes,
            sizeBytes: validated.sizeBytes,
            sha256: validated.sha256,
            status: DocumentStatus.QUARANTINED, // Explicit status assignment (refinement #1)
            processingStatus: DocumentProcessingStatus.FAILED,
            uploadedById: tenant.userId,
            scanStatus: scanResult.scanStatus,
            scanTimestamp: new Date(),
            failureCode: scanResult.failureCode || "SECURITY_SCAN_QUARANTINED",
            failureMessage: scanResult.failureMessage || "This document has been isolated by the security scan and cannot continue through normal processing.",
            supersedesDocumentId: supersedesDocumentId || null,
          },
          {
            bidId: bid.id,
            category,
            required: true,
          },
          tx
        );
      });

      return this.formatBidDocumentDTO(quarantined);
    }

    // SUCCESS BRANCH: Clean Document -> Store Object -> Persist -> Enqueue Processing Job
    await storageService.upload(storageKey, validated.buffer, validated.canonicalMimeType);

    const bidDocument = await runInTransaction(async (tx) => {
      return this.repository.createWithBidAssociation(
        {
          organizationId: bid.organizationId,
          storageKey,
          fileName: validated.originalFilename,
          originalFilename: validated.originalFilename,
          mimeType: validated.canonicalMimeType,
          mediaType: validated.canonicalMimeType,
          extension: validated.extension,
          fileSize: validated.sizeBytes,
          sizeBytes: validated.sizeBytes,
          sha256: validated.sha256,
          status: DocumentStatus.PROCESSING, // Explicit assignment (refinement #1)
          processingStatus: DocumentProcessingStatus.PENDING,
          uploadedById: tenant.userId,
          scanStatus: "CLEAN",
          scanTimestamp: new Date(),
          failureCode: null,
          failureMessage: null,
          supersedesDocumentId: supersedesDocumentId || null,
        },
        {
          bidId: bid.id,
          category,
          required: true,
        },
        tx
      );
    });

    // 5. Enqueue Asynchronous Processing Job (BullMQ / Queue)
    // Job idempotency using deterministic key: document-process:{documentId}
    const queueService = getQueueService();
    await queueService.enqueue(
      "processing.queue",
      "DOCUMENT_PROCESS",
      {
        type: "DOCUMENT_PROCESS",
        documentId: bidDocument.document.id,
        bidId: bid.id,
        organizationId: bid.organizationId,
        attempt: 1,
      },
      {
        jobId: `document-process:${bidDocument.document.id}`,
      }
    );

    logger.info(
      {
        event: "DOCUMENT_UPLOADED",
        documentId: bidDocument.document.id,
        bidId: bid.id,
        tenderVersionId,
        sha256: validated.sha256,
        sizeBytes: validated.sizeBytes,
        status: DocumentStatus.PROCESSING,
        queueMode: queueService.mode,
      },
      "Document uploaded, validated, stored and queued for ingestion processing"
    );

    return this.formatBidDocumentDTO(bidDocument);
  }

  /**
   * List all documents associated with a bid.
   */
  async listBidDocuments(bidId: string, tenant: TenantContext | undefined): Promise<BidDocumentDTO[]> {
    if (!tenant) throw new UnauthorizedError("Authentication is required");

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true, organizationId: true, bidderId: true },
    });

    if (!bid || bid.organizationId !== tenant.organizationId) {
      throw new NotFoundError(`Bid with ID '${bidId}' was not found`);
    }

    if (tenant.role === "BIDDER" && tenant.bidderId && bid.bidderId !== tenant.bidderId) {
      throw new ForbiddenError("You do not have permission to view documents for this bid");
    }

    const items = await this.repository.listByBid(bidId, tenant.organizationId);
    return items.map((bd) => this.formatBidDocumentDTO(bd));
  }

  /**
   * Get single document metadata with full diagnostics.
   */
  async getBidDocument(
    bidId: string,
    documentId: string,
    tenant: TenantContext | undefined
  ): Promise<BidDocumentDTO> {
    if (!tenant) throw new UnauthorizedError("Authentication is required");

    const bidDoc = await this.repository.findBidDocument(bidId, documentId, tenant.organizationId);
    if (!bidDoc) {
      throw new DocumentNotFoundError(documentId);
    }

    if (tenant.role === "BIDDER" && tenant.bidderId && bidDoc.bid.bidderId !== tenant.bidderId) {
      throw new ForbiddenError("You do not have permission to view this document");
    }

    return this.formatBidDocumentDTO(bidDoc);
  }

  /**
   * Delete Document (Protected Deletion Invariants — refinement #7).
   */
  async deleteBidDocument(
    bidId: string,
    documentId: string,
    tenant: TenantContext | undefined
  ): Promise<void> {
    if (!tenant) throw new UnauthorizedError("Authentication is required");

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true, organizationId: true, bidderId: true, status: true },
    });

    if (!bid || bid.organizationId !== tenant.organizationId) {
      throw new NotFoundError(`Bid with ID '${bidId}' was not found`);
    }

    if (tenant.role === "BIDDER" && tenant.bidderId && bid.bidderId !== tenant.bidderId) {
      throw new ForbiddenError("You do not have permission to delete documents from this bid");
    }

    // INVARIANT 1: Bid must be editable (DRAFT). Once SUBMITTED, deletion is locked!
    if (bid.status !== BidStatus.DRAFT) {
      throw new DocumentNotDeletableError("Documents cannot be deleted from a submitted or finalized bid proposal.");
    }

    const bidDoc = await this.repository.findBidDocument(bidId, documentId, tenant.organizationId);
    if (!bidDoc) {
      throw new DocumentNotFoundError(documentId);
    }

    // Delete object from storage and clean up database records
    const storageService = getStorageService();
    try {
      await storageService.delete(bidDoc.document.storageKey);
    } catch (err: any) {
      logger.warn({ storageKey: bidDoc.document.storageKey, err: err.message }, "Could not delete storage object");
    }

    await this.repository.deleteBidDocument(bidId, documentId);

    logger.info(
      { event: "DOCUMENT_DELETED", bidId, documentId, actorId: tenant.userId },
      "Document deleted from draft bid"
    );
  }

  /**
   * Retry processing for a FAILED document (refinement #1, #9).
   */
  async retryDocument(
    bidId: string,
    documentId: string,
    tenant: TenantContext | undefined
  ): Promise<BidDocumentDTO> {
    if (!tenant) throw new UnauthorizedError("Authentication is required");

    const bidDoc = await this.repository.findBidDocument(bidId, documentId, tenant.organizationId);
    if (!bidDoc) {
      throw new DocumentNotFoundError(documentId);
    }

    if (tenant.role === "BIDDER" && tenant.bidderId && bidDoc.bid.bidderId !== tenant.bidderId) {
      throw new ForbiddenError("You do not have permission to retry this document");
    }

    // Document must be in FAILED state to retry
    if (bidDoc.document.status !== DocumentStatus.FAILED) {
      throw new DocumentNotRetryableError(bidDoc.document.status);
    }

    assertValidDocumentTransition(bidDoc.document.status, DocumentStatus.PROCESSING);

    // Update status to PROCESSING and clear failure details
    const updatedDoc = await this.repository.updateStatus(documentId, DocumentStatus.PROCESSING, {
      processingStatus: DocumentProcessingStatus.PENDING,
      failureCode: null,
      failureMessage: null,
    });

    // Re-enqueue job
    const queueService = getQueueService();
    await queueService.enqueue(
      "processing.queue",
      "DOCUMENT_PROCESS",
      {
        type: "DOCUMENT_PROCESS",
        documentId: documentId,
        bidId: bidId,
        organizationId: tenant.organizationId,
        attempt: 2,
      },
      {
        jobId: `document-process-retry:${documentId}-${Date.now()}`,
      }
    );

    logger.info(
      { event: "DOCUMENT_RETRY_ENQUEUED", bidId, documentId },
      "Document retry initiated and enqueued"
    );

    return this.formatBidDocumentDTO({ ...bidDoc, document: updatedDoc });
  }

  /**
   * Format database record to API response DTO.
   */
  private formatBidDocumentDTO(bidDoc: any): BidDocumentDTO {
    const doc = bidDoc.document;
    return {
      id: bidDoc.id,
      bidId: bidDoc.bidId,
      documentId: bidDoc.documentId,
      category: bidDoc.category,
      required: bidDoc.required,
      createdAt: new Date(bidDoc.createdAt).toISOString(),
      updatedAt: new Date(bidDoc.updatedAt || bidDoc.createdAt).toISOString(),
      document: {
        id: doc.id,
        organizationId: doc.organizationId,
        fileName: doc.fileName,
        originalFilename: doc.originalFilename || doc.fileName,
        mimeType: doc.mimeType,
        mediaType: doc.mediaType || doc.mimeType,
        extension: doc.extension || "pdf",
        fileSize: doc.fileSize,
        sizeBytes: doc.sizeBytes || doc.fileSize,
        sha256: doc.sha256,
        storageKey: doc.storageKey,
        status: doc.status,
        processingStatus: doc.processingStatus,
        uploadedById: doc.uploadedById || null,
        scanStatus: doc.scanStatus || null,
        scanTimestamp: doc.scanTimestamp ? new Date(doc.scanTimestamp).toISOString() : null,
        failureCode: doc.failureCode || null,
        failureMessage: doc.failureMessage || null,
        supersedesDocumentId: doc.supersedesDocumentId || null,
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
      },
    };
  }
}

export const documentService = new DocumentService();
