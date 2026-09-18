import type { Request, Response, NextFunction } from "express";
import { documentService, DocumentService } from "./document.service.js";
import { idempotencyService, IdempotencyService } from "../../shared/idempotency/idempotency.service.js";
import { ValidationError } from "../../shared/errors/app-error.js";
import type { ApiResponse } from "../../shared/types/api.types.js";
import type { BidDocumentDTO } from "./document.types.js";

function getParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export class DocumentController {
  constructor(
    private readonly service: DocumentService = documentService,
    private readonly idempService: IdempotencyService = idempotencyService
  ) {}

  /**
   * POST /api/v1/bids/:bidId/documents
   * Multipart/form-data upload.
   */
  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      if (!bidId) {
        throw new ValidationError("bidId parameter is required");
      }

      if (!req.file) {
        throw new ValidationError("No file uploaded. Please attach a document file with key 'file'.");
      }

      const rawKey = req.headers["idempotency-key"] || req.body["idempotencyKey"];
      const key = typeof rawKey === "string" ? rawKey.trim() : undefined;

      const organizationId = req.tenant?.organizationId;
      const userId = req.user?.id;

      // Handle Idempotency Replay Check
      if (key && organizationId && userId) {
        const method = req.method;
        const endpoint = req.baseUrl + req.path;
        const requestHash = this.idempService.computeRequestHash(method, endpoint, {
          bidId,
          originalname: req.file.originalname,
          size: req.file.size,
          category: req.body["category"] || "TECHNICAL_PROPOSAL",
        });

        const lock = await this.idempService.acquireLock({
          organizationId,
          userId,
          key,
          method,
          endpoint,
          requestHash,
        });

        if (lock.isReplay) {
          res.setHeader("x-idempotent-replay", "true");
          const status = lock.statusCode ?? 201;
          res.status(status).json(lock.responseBody);
          return;
        }

        try {
          const result = await this.service.uploadBidDocument(
            {
              bidId,
              file: {
                buffer: req.file.buffer,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
              },
              category: req.body["category"],
              idempotencyKey: key,
              supersedesDocumentId: req.body["supersedesDocumentId"],
            },
            req.tenant
          );

          const responsePayload: ApiResponse<BidDocumentDTO> = {
            success: true,
            data: result,
            meta: {
              requestId: req.requestId ?? "req_unknown",
              status: result.document.status,
            },
            requestId: req.requestId ?? "req_unknown",
          };

          await this.idempService.completeLock({
            organizationId,
            key,
            statusCode: 201,
            responseBody: responsePayload,
          });

          res.status(201).json(responsePayload);
          return;
        } catch (uploadErr) {
          await this.idempService.releaseLockOnError(organizationId, key);
          throw uploadErr;
        }
      }

      // Standard Non-Idempotent Upload
      const result = await this.service.uploadBidDocument(
        {
          bidId,
          file: {
            buffer: req.file.buffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
          category: req.body["category"],
          supersedesDocumentId: req.body["supersedesDocumentId"],
        },
        req.tenant
      );

      const responsePayload: ApiResponse<BidDocumentDTO> = {
        success: true,
        data: result,
        meta: {
          requestId: req.requestId ?? "req_unknown",
          status: result.document.status,
        },
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(201).json(responsePayload);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/bids/:bidId/documents
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      const items = await this.service.listBidDocuments(bidId, req.tenant);

      const responsePayload: ApiResponse<BidDocumentDTO[]> = {
        success: true,
        data: items,
        meta: {
          total: items.length,
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
   * GET /api/v1/bids/:bidId/documents/:documentId
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      const documentId = getParam(req.params["documentId"]);
      const item = await this.service.getBidDocument(bidId, documentId, req.tenant);

      const responsePayload: ApiResponse<BidDocumentDTO> = {
        success: true,
        data: item,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/bids/:bidId/documents/:documentId
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      const documentId = getParam(req.params["documentId"]);
      await this.service.deleteBidDocument(bidId, documentId, req.tenant);

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/bids/:bidId/documents/:documentId/retry
   */
  retry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bidId = getParam(req.params["bidId"]);
      const documentId = getParam(req.params["documentId"]);
      const result = await this.service.retryDocument(bidId, documentId, req.tenant);

      const responsePayload: ApiResponse<BidDocumentDTO> = {
        success: true,
        data: result,
        meta: {
          requestId: req.requestId ?? "req_unknown",
          status: result.document.status,
        },
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(responsePayload);
    } catch (err) {
      next(err);
    }
  };
}

export const documentController = new DocumentController();
