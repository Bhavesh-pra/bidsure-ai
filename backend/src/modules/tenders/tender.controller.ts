import type { Request, Response, NextFunction } from "express";
import { tenderService, TenderService } from "./tender.service.js";
import {
  getTendersQuerySchema,
  tenderIdParamSchema,
  tenderVersionParamSchema,
  createTenderSchema,
  updateTenderMetadataSchema,
  createTenderVersionSchema,
} from "./tender.schemas.js";
import { ValidationError } from "../../shared/errors/app-error.js";
import type { PaginatedResponse, ApiResponse } from "../../shared/types/api.types.js";
import type { TenderDTO, TenderVersionDTO, RequirementDTO } from "./tender.types.js";

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

      const result = await this.service.listTenders(queryParse.data, req.tenant);

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

      const tender = await this.service.getTenderById(paramParse.data.id, req.tenant);

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

      const created = await this.service.createTender(bodyParse.data, req.tenant);

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

  /** PATCH /api/v1/tenders/:id - Update mutable administrative metadata */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const bodyParse = updateTenderMetadataSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Validation failed for tender metadata update",
          bodyParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const updated = await this.service.updateMetadata(paramParse.data.id, bodyParse.data, req.tenant);

      const response: ApiResponse<TenderDTO> = {
        success: true,
        data: updated,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/tenders/:id/publish */
  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const updated = await this.service.transitionLifecycle(paramParse.data.id, "PUBLISHED", req.tenant);

      const response: ApiResponse<TenderDTO> = {
        success: true,
        data: updated,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/tenders/:id/close */
  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const updated = await this.service.transitionLifecycle(paramParse.data.id, "CLOSED", req.tenant);

      const response: ApiResponse<TenderDTO> = {
        success: true,
        data: updated,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/tenders/:id/archive */
  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const updated = await this.service.transitionLifecycle(paramParse.data.id, "ARCHIVED", req.tenant);

      const response: ApiResponse<TenderDTO> = {
        success: true,
        data: updated,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/tenders/:id/versions */
  listVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const versions = await this.service.listVersions(paramParse.data.id, req.tenant);

      const response: ApiResponse<TenderVersionDTO[]> = {
        success: true,
        data: versions,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/tenders/:id/versions */
  createVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const bodyParse = createTenderVersionSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Validation failed for tender version creation",
          bodyParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const result = await this.service.createVersion(paramParse.data.id, bodyParse.data, req.tenant);

      const response: ApiResponse<{ tender: TenderDTO; version: TenderVersionDTO }> = {
        success: true,
        data: result,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/tenders/:id/versions/:versionId */
  getVersionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = tenderVersionParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid route parameters",
          paramParse.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const version = await this.service.getVersionById(paramParse.data.id, paramParse.data.versionId, req.tenant);

      const response: ApiResponse<TenderVersionDTO> = {
        success: true,
        data: version,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/tenders/:id/requirements */
  getRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const versionId = typeof req.query.versionId === "string" ? req.query.versionId : undefined;
      const requirements = await this.service.getRequirements(paramParse.data.id, versionId, req.tenant);

      const response: ApiResponse<RequirementDTO[]> = {
        success: true,
        data: requirements,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const tenderController = new TenderController();
