import type { Request, Response, NextFunction } from "express";
import { requirementService, RequirementService } from "./requirement.service.js";
import { CONTROLLED_RULE_CATALOG } from "./requirement.rule-catalog.js";
import {
  requirementIdParamSchema,
  tenderVersionParamSchema,
  extractRequirementsSchema,
  listRequirementsQuerySchema,
  updateRequirementSchema,
  approveRequirementSchema,
  rejectRequirementSchema,
  mapRuleSchema,
  createRequirementSchema,
} from "./requirement.schemas.js";
import { ValidationError } from "../../shared/errors/app-error.js";
import type { ApiResponse, PaginatedResponse } from "../../shared/types/api.types.js";
import type { RequirementDTO } from "./requirement.types.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class RequirementController {
  constructor(private readonly service: RequirementService = requirementService) {}

  /** GET /api/v1/requirements/rules/catalog */
  getRuleCatalog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response: ApiResponse<typeof CONTROLLED_RULE_CATALOG> = {
        success: true,
        data: CONTROLLED_RULE_CATALOG,
        requestId: req.requestId ?? "req_unknown",
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/tenders/:tenderId/versions/:versionId/requirements */
  listByTenderVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = tenderVersionParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid tender route parameters",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const queryParse = listRequirementsQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        throw new ValidationError(
          "Invalid query parameters",
          queryParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const { tenderId, versionId } = paramParse.data;
      const result = await this.service.listRequirements(tenderId, versionId, queryParse.data as any, req.tenant);

      const response: PaginatedResponse<RequirementDTO> = {
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

  /** POST /api/v1/tenders/:tenderId/versions/:versionId/requirements/extract */
  extractRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = tenderVersionParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid tender route parameters",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const bodyParse = extractRequirementsSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid extraction body payload",
          bodyParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const { tenderId, versionId } = paramParse.data;
      const result = await this.service.extractRequirements(tenderId, versionId, bodyParse.data, req.tenant);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(202).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/requirements or POST /api/v1/tenders/:tenderId/versions/:versionId/requirements */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyParse = createRequirementSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid requirement creation payload",
          bodyParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const tenderId = (req.params as any).tenderId || bodyParse.data.tenderId;
      const versionId = (req.params as any).versionId || bodyParse.data.tenderVersionId;

      if (!tenderId || !versionId) {
        throw new ValidationError("tenderId and tenderVersionId are required to create a requirement");
      }

      const created = await this.service.createRequirement(tenderId, versionId, bodyParse.data, req.tenant);

      const response: ApiResponse<RequirementDTO> = {
        success: true,
        data: created,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/requirements/:id */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = requirementIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid requirement ID parameter",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const reqRecord = await this.service.getRequirementById(paramParse.data.id, req.tenant);

      const response: ApiResponse<RequirementDTO> = {
        success: true,
        data: reqRecord,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/requirements/:id/versions */
  getVersionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = requirementIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid requirement ID parameter",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const history = await this.service.getVersionHistory(paramParse.data.id, req.tenant);

      const response: ApiResponse<typeof history> = {
        success: true,
        data: history,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /api/v1/requirements/:id */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = requirementIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid requirement ID parameter",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const bodyParse = updateRequirementSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid requirement update payload",
          bodyParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const result = await this.service.updateRequirement(paramParse.data.id, bodyParse.data, req.tenant);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/requirements/:id/approve */
  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = requirementIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid requirement ID parameter",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const bodyParse = approveRequirementSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid requirement approval payload",
          bodyParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const approved = await this.service.approveRequirement(paramParse.data.id, bodyParse.data, req.tenant);

      const response: ApiResponse<RequirementDTO> = {
        success: true,
        data: approved,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/v1/requirements/:id/reject */
  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = requirementIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid requirement ID parameter",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const bodyParse = rejectRequirementSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid requirement rejection payload",
          bodyParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const rejected = await this.service.rejectRequirement(paramParse.data.id, bodyParse.data, req.tenant);

      const response: ApiResponse<RequirementDTO> = {
        success: true,
        data: rejected,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** PUT/PATCH /api/v1/requirements/:id/rule-mapping */
  mapRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = requirementIdParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError(
          "Invalid requirement ID parameter",
          paramParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const bodyParse = mapRuleSchema.safeParse(req.body);
      if (!bodyParse.success) {
        throw new ValidationError(
          "Invalid rule mapping payload",
          bodyParse.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        );
      }

      const mapped = await this.service.mapRule(paramParse.data.id, bodyParse.data, req.tenant);

      const response: ApiResponse<RequirementDTO> = {
        success: true,
        data: mapped,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/tenders/:tenderId/versions/:versionId/documents */
  listTenderDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramParse = tenderVersionParamSchema.safeParse(req.params);
      if (!paramParse.success) {
        throw new ValidationError("Invalid route parameters");
      }

      const { tenderId, versionId } = paramParse.data;
      const tenderDocs = await prisma.tenderDocument.findMany({
        where: {
          tenderId,
          OR: [{ tenderVersionId: versionId }, { tenderVersionId: null }],
        },
        include: {
          document: {
            include: {
              ocrResults: { where: { isCurrent: true }, take: 1 },
            },
          },
        },
      });

      const response: ApiResponse<typeof tenderDocs> = {
        success: true,
        data: tenderDocs,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const requirementController = new RequirementController();
