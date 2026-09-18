import type { Request, Response, NextFunction } from "express";
import { intelligenceService, IntelligenceService } from "./intelligence.service.js";
import { ValidationError } from "../../shared/errors/app-error.js";
import { getQueueService } from "../../infrastructure/queue/queue.service.js";
import type { ApiResponse } from "../../shared/types/api.types.js";

function getParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export class IntelligenceController {
  constructor(private readonly service: IntelligenceService = intelligenceService) {}

  /**
   * GET /api/v1/bids/:bidId/evidence
   */
  getBidEvidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      if (!bidId) throw new ValidationError("bidId parameter is required");

      const result = await this.service.getBidEvidence(bidId, req.tenant);

      const responsePayload: ApiResponse<typeof result> = {
        success: true,
        data: result,
        meta: {
          total: result.totalEvidence,
          documentsCount: result.documentsCount,
          requestId: req.requestId ?? "req_unknown",
        },
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/bids/:bidId/documents/:documentId/intelligence
   */
  getDocumentIntelligence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      const documentId = getParam(req.params["documentId"]);

      if (!bidId) throw new ValidationError("bidId parameter is required");
      if (!documentId) throw new ValidationError("documentId parameter is required");

      const result = await this.service.getDocumentIntelligence(bidId, documentId, req.tenant);

      const responsePayload: ApiResponse<typeof result> = {
        success: true,
        data: result,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/bids/:bidId/documents/:documentId/process
   * Asynchronously triggers or retries document intelligence processing.
   */
  processDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      const documentId = getParam(req.params["documentId"]);

      if (!bidId) throw new ValidationError("bidId parameter is required");
      if (!documentId) throw new ValidationError("documentId parameter is required");

      // Verify permissions via intelligence service check first
      await this.service.getDocumentIntelligence(bidId, documentId, req.tenant);

      const jobId = `document-intelligence:${documentId}-${Date.now()}`;
      const queueService = getQueueService();

      await queueService.enqueue(
        "processing.queue",
        "DOCUMENT_PROCESS",
        {
          type: "DOCUMENT_PROCESS",
          documentId,
          bidId,
          organizationId: req.tenant?.organizationId || "",
          attempt: 1,
        },
        { jobId }
      );

      const responsePayload: ApiResponse<{ documentId: string; status: string; jobId: string }> = {
        success: true,
        data: {
          documentId,
          status: "PROCESSING",
          jobId,
        },
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(202).json(responsePayload);
    } catch (err) {
      next(err);
    }
  };
}

export const intelligenceController = new IntelligenceController();
