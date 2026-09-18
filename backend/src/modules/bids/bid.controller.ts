import type { Request, Response, NextFunction } from "express";
import { bidService, BidService } from "./bid.service.js";
import {
  getBidsQuerySchema,
  bidIdParamSchema,
  createBidSchema,
  updateDraftBidSchema,
} from "./bid.schemas.js";
import { ValidationError } from "../../shared/errors/app-error.js";
import type { PaginatedResponse, ApiResponse } from "../../shared/types/api.types.js";
import type { BidDTO } from "./bid.types.js";

export class BidController {
  constructor(private readonly service: BidService = bidService) {}

  /** GET /api/v1/bids */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryParse = getBidsQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        throw new ValidationError(
          "Invalid query parameters",
          queryParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const { page, pageSize, tenderId, status } = queryParse.data;
      const result = await this.service.listBids(
        { page, pageSize, tenderId, status },
        req.tenant
      );

      const response: PaginatedResponse<BidDTO> = {
        success: true,
        data: result.items,
        meta: result.meta,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/bids/:id */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = bidIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid bid ID parameter",
          paramParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const bid = await this.service.getBidById(paramParse.data.id, req.tenant);

      const response: ApiResponse<BidDTO> = {
        success: true,
        data: bid,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/bids */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyParse = createBidSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid bid creation payload",
          bodyParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const created = await this.service.createBid(bodyParse.data, req.tenant);

      const response: ApiResponse<BidDTO> = {
        success: true,
        data: created,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /api/v1/bids/:id */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = bidIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid bid ID parameter",
          paramParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const bodyParse = updateDraftBidSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid draft update payload",
          bodyParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const updated = await this.service.updateDraftBid(
        paramParse.data.id,
        bodyParse.data,
        req.tenant
      );

      const response: ApiResponse<BidDTO> = {
        success: true,
        data: updated,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/bids/:id/submit */
  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = bidIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid bid ID parameter",
          paramParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const submitted = await this.service.submitBid(paramParse.data.id, req.tenant);

      const response: ApiResponse<BidDTO> = {
        success: true,
        data: submitted,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const bidController = new BidController();
