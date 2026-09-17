import type { Request, Response, NextFunction } from "express";
import { bidService, BidService } from "./bid.service.js";
import { getBidsQuerySchema, bidIdParamSchema } from "./bid.schemas.js";
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

      const { page, pageSize, tenderId } = queryParse.data;
      const result = await this.service.listBids({ page, pageSize, tenderId }, req.tenant);

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
}

export const bidController = new BidController();

