import { prisma } from "../../infrastructure/database/prisma.js";
import { getStorageService } from "../../infrastructure/storage/storage.service.js";
import { getOcrProvider } from "./ocr/ocr.provider.js";
import { getDocumentIntelligenceProvider } from "./ai/ai.adapter.js";
import { PIPELINE_VERSION } from "./classification/classification.types.js";
import { logger } from "../../infrastructure/logging/logger.js";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/app-error.js";
import type { TenantContext } from "../../shared/auth/tenant-context.js";
import { DocumentStatus } from "@prisma/client";

export interface BidEvidenceItemDTO {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  field: string;
  value: string;
  normalizedValue: string | null;
  page: number;
  boundingBox: unknown | null;
  confidence: number;
  method: string;
  extractionStatus: "EXTRACTED" | "REVIEW_RECOMMENDED";
  pipelineVersion: string;
  createdAt: string;
}

export interface BidEvidenceResponseDTO {
  bidId: string;
  totalEvidence: number;
  documentsCount: number;
  evidence: BidEvidenceItemDTO[];
}

export interface DocumentIntelligenceDTO {
  document: {
    id: string;
    fileName: string;
    originalFilename: string | null;
    status: string;
    documentType: string | null;
    classificationConfidence: number | null;
    mimeType: string;
    fileSize: number;
    sha256: string;
  };
  ocr: {
    id: string;
    status: string;
    text: string | null;
    pageCount: number;
    pages: unknown | null;
    engine: string;
    engineVersion: string | null;
    extractionMethod: string;
    confidence: number | null;
    startedAt: string | null;
    completedAt: string | null;
    runNumber: number;
  } | null;
  classification: {
    id: string;
    documentType: string;
    confidence: number;
    method: string;
    runNumber: number;
    pipelineVersion: string;
    classifierVersion: string;
  } | null;
  evidence: Array<{
    id: string;
    field: string;
    value: string;
    normalizedValue: string | null;
    page: number;
    boundingBox: unknown | null;
    confidence: number;
    method: string;
    extractionStatus: "EXTRACTED" | "REVIEW_RECOMMENDED";
    pipelineVersion: string;
    createdAt: string;
  }>;
}

export class IntelligenceService {
  /**
   * Authoritative Intelligence Pipeline:
   * Document in storage -> OCR (PENDING -> PROCESSING -> COMPLETED) ->
   * Classification -> Field Extraction -> Zod Validation -> Versioned Persistence.
   */
  async processDocumentIntelligence(documentId: string): Promise<void> {
    const startTime = Date.now();
    logger.info({ documentId }, "Starting Phase 09 document intelligence processing");

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      logger.error({ documentId }, "Document not found for intelligence processing");
      return;
    }

    const storageService = getStorageService();
    const buffer = await storageService.download(document.storageKey);

    if (!buffer) {
      logger.error({ documentId, storageKey: document.storageKey }, "Storage buffer missing during OCR");
      return;
    }

    // 1. Calculate Run Number (Append-Only Versioning)
    const existingMaxRun = await prisma.oCRResult.aggregate({
      where: { documentId },
      _max: { runNumber: true },
    });
    const runNumber = (existingMaxRun._max.runNumber ?? 0) + 1;

    // 2. Initialize OCR record in PENDING state
    const startedAt = new Date();
    const ocrProvider = getOcrProvider();

    // 3. Execute OCR
    const ocrData = await ocrProvider.extractText(buffer, document.fileName, document.mimeType);
    const completedAt = new Date();

    // 4. Document Classification
    const aiProvider = getDocumentIntelligenceProvider();
    const classification = await aiProvider.classifyDocument(ocrData, runNumber);

    // 5. Field Extraction
    const extractionResult = await aiProvider.extractFields(ocrData, classification);

    // 6. Atomic Transaction: supersede old active records and persist Run N
    await prisma.$transaction(async (tx) => {
      // Mark previous runs as isCurrent: false
      await tx.oCRResult.updateMany({
        where: { documentId, isCurrent: true },
        data: { isCurrent: false },
      });

      await tx.documentClassification.updateMany({
        where: { documentId, isCurrent: true },
        data: { isCurrent: false },
      });

      await tx.extractedEvidence.updateMany({
        where: { documentId, isCurrent: true },
        data: { isCurrent: false },
      });

      // Persist current active OCRResult
      await tx.oCRResult.create({
        data: {
          documentId,
          runNumber,
          status: "COMPLETED",
          text: ocrData.text,
          pageCount: ocrData.pageCount,
          pages: ocrData.pages as any,
          extractionMethod: ocrData.extractionMethod,
          engine: ocrData.engine,
          engineVersion: ocrData.engineVersion || "1.0.0",
          language: ocrData.language || "eng",
          confidence: ocrData.confidence,
          pipelineVersion: PIPELINE_VERSION,
          isCurrent: true,
          startedAt,
          completedAt,
        },
      });

      // Persist current active DocumentClassification
      await tx.documentClassification.create({
        data: {
          documentId,
          runNumber,
          documentType: classification.documentType,
          confidence: classification.confidence,
          method: classification.method,
          modelProvider: "rule-based",
          pipelineVersion: classification.pipelineVersion,
          classifierVersion: classification.classifierVersion,
          isCurrent: true,
          metadata: classification.metadata as any,
        },
      });

      // Persist current active ExtractedEvidence items
      if (extractionResult.fields.length > 0) {
        for (const field of extractionResult.fields) {
          await tx.extractedEvidence.create({
            data: {
              documentId,
              runNumber,
              field: field.field,
              value: field.value,
              normalizedValue: field.normalizedValue ?? null,
              page: field.page,
              boundingBox: field.boundingBox ? (field.boundingBox as any) : null,
              confidence: field.confidence,
              method: field.method,
              extractionSource: field.extractionSource ?? null,
              extractionStatus: field.extractionStatus,
              modelProvider: extractionResult.modelProvider ?? "bidsure-deterministic-rules",
              modelName: extractionResult.modelName ?? "rule-extractor",
              modelVersion: extractionResult.modelVersion ?? "1.0.0",
              pipelineVersion: extractionResult.pipelineVersion,
              extractorVersion: extractionResult.extractorVersion,
              isCurrent: true,
            },
          });
        }
      }

      // Update document materialized classification
      await tx.document.update({
        where: { id: documentId },
        data: {
          documentType: classification.documentType,
          classificationConfidence: classification.confidence,
        },
      });
    });

    const durationMs = Date.now() - startTime;
    // Strictly sanitized logs: documentId, runNumber, durationMs, fields count (NO sensitive payload logging)
    logger.info(
      {
        documentId,
        runNumber,
        docType: classification.documentType,
        confidence: classification.confidence,
        fieldsExtracted: extractionResult.fields.length,
        durationMs,
      },
      "Phase 09 document intelligence extraction successfully completed"
    );
  }

  /**
   * Retrieve structured evidence for a bid proposal.
   */
  async getBidEvidence(bidId: string, tenant: TenantContext | undefined): Promise<BidEvidenceResponseDTO> {
    if (!tenant) throw new UnauthorizedError("Authentication is required");

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        bidDocuments: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                documentType: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (!bid || bid.organizationId !== tenant.organizationId) {
      throw new NotFoundError(`Bid with ID '${bidId}' was not found`);
    }

    if (tenant.role === "BIDDER" && tenant.bidderId && bid.bidderId !== tenant.bidderId) {
      throw new ForbiddenError("You do not have permission to view evidence for this bid proposal");
    }

    const documentIds = bid.bidDocuments.map((bd) => bd.document.id);
    const documentMap = new Map(bid.bidDocuments.map((bd) => [bd.document.id, bd.document]));

    const evidenceItems = await prisma.extractedEvidence.findMany({
      where: {
        documentId: { in: documentIds },
        isCurrent: true,
      },
      orderBy: [{ page: "asc" }, { createdAt: "desc" }],
    });

    const evidence: BidEvidenceItemDTO[] = evidenceItems.map((item) => {
      const doc = documentMap.get(item.documentId);
      return {
        id: item.id,
        documentId: item.documentId,
        documentName: doc?.fileName || "Unknown Document",
        documentType: doc?.documentType || "UNKNOWN",
        field: item.field,
        value: item.value,
        normalizedValue: item.normalizedValue,
        page: item.page,
        boundingBox: item.boundingBox,
        confidence: item.confidence,
        method: item.method,
        extractionStatus: item.extractionStatus as "EXTRACTED" | "REVIEW_RECOMMENDED",
        pipelineVersion: item.pipelineVersion,
        createdAt: item.createdAt.toISOString(),
      };
    });

    return {
      bidId,
      totalEvidence: evidence.length,
      documentsCount: documentIds.length,
      evidence,
    };
  }

  /**
   * Retrieve document intelligence (OCR, Classification, Extracted Evidence, Processing history).
   */
  async getDocumentIntelligence(
    bidId: string,
    documentId: string,
    tenant: TenantContext | undefined
  ): Promise<DocumentIntelligenceDTO> {
    if (!tenant) throw new UnauthorizedError("Authentication is required");

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true, organizationId: true, bidderId: true },
    });

    if (!bid || bid.organizationId !== tenant.organizationId) {
      throw new NotFoundError(`Bid with ID '${bidId}' was not found`);
    }

    if (tenant.role === "BIDDER" && tenant.bidderId && bid.bidderId !== tenant.bidderId) {
      throw new ForbiddenError("You do not have permission to view intelligence for this document");
    }

    const bidDoc = await prisma.bidDocument.findUnique({
      where: {
        bidId_documentId: { bidId, documentId },
      },
      include: {
        document: true,
      },
    });

    if (!bidDoc) {
      throw new NotFoundError(`Document with ID '${documentId}' not found in bid '${bidId}'`);
    }

    const doc = bidDoc.document;

    // Fetch latest active OCR, Classification, and Evidence
    const [ocr, classification, evidence] = await Promise.all([
      prisma.oCRResult.findFirst({
        where: { documentId, isCurrent: true },
      }),
      prisma.documentClassification.findFirst({
        where: { documentId, isCurrent: true },
      }),
      prisma.extractedEvidence.findMany({
        where: { documentId, isCurrent: true },
        orderBy: [{ page: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    return {
      document: {
        id: doc.id,
        fileName: doc.fileName,
        originalFilename: doc.originalFilename,
        status: doc.status,
        documentType: doc.documentType,
        classificationConfidence: doc.classificationConfidence,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        sha256: doc.sha256,
      },
      ocr: ocr
        ? {
            id: ocr.id,
            status: ocr.status,
            text: ocr.text,
            pageCount: ocr.pageCount,
            pages: ocr.pages,
            engine: ocr.engine,
            engineVersion: ocr.engineVersion,
            extractionMethod: ocr.extractionMethod,
            confidence: ocr.confidence,
            startedAt: ocr.startedAt ? ocr.startedAt.toISOString() : null,
            completedAt: ocr.completedAt ? ocr.completedAt.toISOString() : null,
            runNumber: ocr.runNumber,
          }
        : null,
      classification: classification
        ? {
            id: classification.id,
            documentType: classification.documentType,
            confidence: classification.confidence,
            method: classification.method,
            runNumber: classification.runNumber,
            pipelineVersion: classification.pipelineVersion,
            classifierVersion: classification.classifierVersion,
          }
        : null,
      evidence: evidence.map((ev) => ({
        id: ev.id,
        field: ev.field,
        value: ev.value,
        normalizedValue: ev.normalizedValue,
        page: ev.page,
        boundingBox: ev.boundingBox,
        confidence: ev.confidence,
        method: ev.method,
        extractionStatus: ev.extractionStatus as "EXTRACTED" | "REVIEW_RECOMMENDED",
        pipelineVersion: ev.pipelineVersion,
        createdAt: ev.createdAt.toISOString(),
      })),
    };
  }
}

export const intelligenceService = new IntelligenceService();

export function getIntelligenceService(): IntelligenceService {
  return intelligenceService;
}
