import type { Request, Response, NextFunction } from "express";
import { tenderService, TenderService } from "./tender.service.js";
import {
  getTendersQuerySchema,
  tenderIdParamSchema,
  createTenderSchema,
} from "./tender.schemas.js";
import { ValidationError } from "../../shared/errors/app-error.js";
import type { PaginatedResponse, ApiResponse } from "../../shared/types/api.types.js";
import type { TenderDTO } from "./tender.types.js";

export class TenderController {
  constructor(private readonly service: TenderService = tenderService) {}

  /** GET /api/v1/tenders */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryParse = getTendersQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        throw new ValidationError(
          "Invalid query parameters",
          queryParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const { page, pageSize } = queryParse.data;
      const result = await this.service.listTenders({ page, pageSize });

      const response: PaginatedResponse<TenderDTO> = {
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

  /** GET /api/v1/tenders/:id */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = tenderIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid tender ID parameter",
          paramParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const tender = await this.service.getTenderById(paramParse.data.id);

      const response: ApiResponse<TenderDTO> = {
        success: true,
        data: tender,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/tenders */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyParse = createTenderSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Validation failed for tender creation",
          bodyParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const created = await this.service.createTender(bodyParse.data);

      const response: ApiResponse<TenderDTO> = {
        success: true,
        data: created,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const tenderController = new TenderController();

