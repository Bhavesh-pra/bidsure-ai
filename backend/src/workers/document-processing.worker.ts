import { prisma } from "../infrastructure/database/prisma.js";
import { getStorageService } from "../infrastructure/storage/storage.service.js";
import { type DocumentProcessJobPayload } from "../infrastructure/queue/queue.service.js";
import { logger } from "../infrastructure/logging/logger.js";
import { DocumentStatus, DocumentProcessingStatus } from "@prisma/client";
import { intelligenceService } from "../modules/intelligence/intelligence.service.js";

/**
 * Phase 08 Document Processing Worker:
 * Consumes `DOCUMENT_PROCESS` jobs.
 *
 * CRITICAL ARCHITECTURAL BOUNDARY (Phase 08 Ingestion Contract):
 * DocumentStatus.READY strictly denotes:
 *   "Secure ingestion and storage processing completed."
 * It does NOT denote:
 *   - Document verified
 *   - Evidence accepted
 *   - Compliance PASS
 *
 * OCR, layout analysis, classification, and AI evidence extraction belong exclusively to Phase 09+.
 */
export async function processDocumentJob(payload: DocumentProcessJobPayload): Promise<void> {
  if (!payload || payload.type !== "DOCUMENT_PROCESS") {
    return;
  }
  const { documentId, bidId, organizationId } = payload;

  logger.info(
    { documentId, bidId, organizationId, attempt: payload.attempt },
    "Starting asynchronous document ingestion verification job"
  );

  try {
    // 1. Fetch document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      logger.error({ documentId }, "Document not found during worker execution");
      return;
    }

    // 2. State invariant: Document must be in PROCESSING or SCANNING
    if (document.status !== DocumentStatus.PROCESSING && document.status !== DocumentStatus.SCANNING) {
      logger.warn(
        { documentId, currentStatus: document.status },
        "Worker skipping job: Document is not in PROCESSING or SCANNING state"
      );
      return;
    }

    // 3. Verify object storage accessibility
    const storageService = getStorageService();
    const exists = await storageService.exists(document.storageKey);

    if (!exists) {
      logger.error(
        { documentId, storageKey: document.storageKey },
        "Object missing in storage during ingestion processing"
      );

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          processingStatus: DocumentProcessingStatus.FAILED,
          failureCode: "STORAGE_OBJECT_NOT_FOUND",
          failureMessage: "The uploaded file could not be verified in secure storage. Please retry upload.",
        },
      });
      return;
    }

    // 4. Ingestion successfully completed -> READY
    // (Establishing the clean seam for Phase 09 OCR/extraction)
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.READY,
        processingStatus: DocumentProcessingStatus.PROCESSED,
        failureCode: null,
        failureMessage: null,
      },
    });

    logger.info(
      {
        documentId,
        bidId,
        sha256: document.sha256,
        status: DocumentStatus.READY,
        meaning: "Secure ingestion and storage processing completed (Phase 08 boundary)",
      },
      "Document ingestion successfully reached READY state"
    );

    // 5. Phase 09 OCR, Classification & Structured Evidence Extraction
    try {
      await intelligenceService.processDocumentIntelligence(documentId);
    } catch (intelErr: any) {
      logger.error(
        { documentId, err: intelErr.message },
        "Document intelligence processing encountered an error"
      );
    }
  } catch (err: any) {
    logger.error(
      { documentId, err: err.message, stack: err.stack },
      "Document processing worker encountered unexpected error"
    );

    // Strictly sanitized failure reporting (no internal paths or stack traces)
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          processingStatus: DocumentProcessingStatus.FAILED,
          failureCode: "PROCESSING_FAILED",
          failureMessage: "An error occurred while processing the document. Please retry.",
        },
      });
    } catch {
      // Best-effort error state recording
    }
  }
}
