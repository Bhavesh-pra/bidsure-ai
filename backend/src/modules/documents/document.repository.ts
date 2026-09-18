import { prisma } from "../../infrastructure/database/prisma.js";
import { Prisma, DocumentStatus, DocumentProcessingStatus } from "@prisma/client";
import { BaseRepository } from "../../shared/database/base.repository.js";

export interface CreateDocumentRecordInput {
  organizationId: string;
  storageKey: string;
  fileName: string;
  originalFilename: string;
  mimeType: string;
  mediaType: string;
  extension: string;
  fileSize: number;
  sizeBytes: number;
  sha256: string;
  status: DocumentStatus;
  processingStatus: DocumentProcessingStatus;
  uploadedById?: string | null | undefined;
  scanStatus?: string | null | undefined;
  scanTimestamp?: Date | null | undefined;
  failureCode?: string | null | undefined;
  failureMessage?: string | null | undefined;
  supersedesDocumentId?: string | null | undefined;
}

export interface CreateBidDocumentAssociationInput {
  bidId: string;
  category: string;
  required?: boolean | undefined;
}

export class DocumentRepository extends BaseRepository {
  /**
   * Check for duplicate content within the SAME bid (Authoritative Duplicate Policy).
   */
  async findDuplicateInBid(
    bidId: string,
    sha256: string,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.bidDocument.findFirst({
      where: {
        bidId,
        document: {
          sha256,
        },
      },
      include: {
        document: true,
      },
    });
  }

  /**
   * Check for existing content within the SAME organization (Cross-bid reuse candidate lookup).
   */
  async findDuplicateInOrg(
    organizationId: string,
    sha256: string,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.document.findFirst({
      where: {
        organizationId,
        sha256,
      },
    });
  }

  /**
   * Atomically insert Document and BidDocument association.
   */
  async createWithBidAssociation(
    docInput: CreateDocumentRecordInput,
    bidDocInput: CreateBidDocumentAssociationInput,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;

    const document = await db.document.create({
      data: {
        organizationId: docInput.organizationId,
        storageKey: docInput.storageKey,
        fileName: docInput.fileName,
        originalFilename: docInput.originalFilename,
        mimeType: docInput.mimeType,
        mediaType: docInput.mediaType,
        extension: docInput.extension,
        fileSize: docInput.fileSize,
        sizeBytes: docInput.sizeBytes,
        sha256: docInput.sha256,
        status: docInput.status,
        processingStatus: docInput.processingStatus,
        uploadedById: docInput.uploadedById ?? null,
        scanStatus: docInput.scanStatus ?? null,
        scanTimestamp: docInput.scanTimestamp ?? null,
        failureCode: docInput.failureCode ?? null,
        failureMessage: docInput.failureMessage ?? null,
        supersedesDocumentId: docInput.supersedesDocumentId ?? null,
      },
    });

    const bidDocument = await db.bidDocument.create({
      data: {
        bidId: bidDocInput.bidId,
        documentId: document.id,
        category: bidDocInput.category,
        required: bidDocInput.required ?? true,
      },
      include: {
        document: true,
      },
    });

    return bidDocument;
  }

  /**
   * Find Document by ID with optional tenant isolation.
   */
  async findById(id: string, organizationId?: string) {
    const where: Prisma.DocumentWhereInput = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return prisma.document.findFirst({
      where,
      include: {
        bidDocuments: {
          include: {
            bid: {
              select: {
                id: true,
                organizationId: true,
                tenderId: true,
                tenderVersionId: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find BidDocument association with full relation.
   */
  async findBidDocument(bidId: string, documentId: string, organizationId?: string) {
    const where: Prisma.BidDocumentWhereInput = {
      bidId,
      documentId,
    };
    if (organizationId) {
      where.bid = { organizationId };
    }
    return prisma.bidDocument.findFirst({
      where,
      include: {
        document: true,
        bid: true,
      },
    });
  }

  /**
   * List all documents associated with a bid.
   */
  async listByBid(bidId: string, organizationId?: string) {
    const where: Prisma.BidDocumentWhereInput = { bidId };
    if (organizationId) {
      where.bid = { organizationId };
    }
    return prisma.bidDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        document: true,
      },
    });
  }

  /**
   * Update Document status and diagnostics.
   */
  async updateStatus(
    documentId: string,
    status: DocumentStatus,
    extra?: {
      processingStatus?: DocumentProcessingStatus | undefined;
      scanStatus?: string | null | undefined;
      scanTimestamp?: Date | null | undefined;
      failureCode?: string | null | undefined;
      failureMessage?: string | null | undefined;
    },
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.document.update({
      where: { id: documentId },
      data: {
        status,
        ...(extra?.processingStatus !== undefined ? { processingStatus: extra.processingStatus } : {}),
        ...(extra?.scanStatus !== undefined ? { scanStatus: extra.scanStatus } : {}),
        ...(extra?.scanTimestamp !== undefined ? { scanTimestamp: extra.scanTimestamp } : {}),
        ...(extra?.failureCode !== undefined ? { failureCode: extra.failureCode } : {}),
        ...(extra?.failureMessage !== undefined ? { failureMessage: extra.failureMessage } : {}),
      },
    });
  }

  /**
   * Remove BidDocument association and clean up unreferenced Document record.
   */
  async deleteBidDocument(bidId: string, documentId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    await db.bidDocument.delete({
      where: {
        bidId_documentId: {
          bidId,
          documentId,
        },
      },
    });

    // Check if document is referenced by any other bid
    const remainingCount = await db.bidDocument.count({
      where: { documentId },
    });

    if (remainingCount === 0) {
      await db.extractedEvidence.deleteMany({ where: { documentId } });
      await db.documentClassification.deleteMany({ where: { documentId } });
      await db.oCRResult.deleteMany({ where: { documentId } });
      await db.document.delete({
        where: { id: documentId },
      });
    }
  }
}

export const documentRepository = new DocumentRepository();
