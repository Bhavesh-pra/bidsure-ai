import { Router } from "express";
import { requirementController } from "./requirement.controller.js";
import { validateParams, validateBody, validateQuery } from "../../shared/validation/zod.middleware.js";
import {
  requirementIdParamSchema,
  updateRequirementSchema,
  approveRequirementSchema,
  rejectRequirementSchema,
  mapRuleSchema,
  createRequirementSchema,
} from "./requirement.schemas.js";

export const requirementRoutes = Router();

// ---------------------------------------------------------------------------
// Controlled Compliance Rule Catalog
// ---------------------------------------------------------------------------
requirementRoutes.get("/rules/catalog", requirementController.getRuleCatalog);

// ---------------------------------------------------------------------------
// Create Requirement
// ---------------------------------------------------------------------------
requirementRoutes.post(
  "/",
  validateBody(createRequirementSchema),
  requirementController.create
);

// ---------------------------------------------------------------------------
// Requirement Specific Endpoints
// ---------------------------------------------------------------------------
requirementRoutes.get(
  "/:id",
  validateParams(requirementIdParamSchema),
  requirementController.getById
);

requirementRoutes.get(
  "/:id/versions",
  validateParams(requirementIdParamSchema),
  requirementController.getVersionHistory
);

requirementRoutes.patch(
  "/:id",
  validateParams(requirementIdParamSchema),
  validateBody(updateRequirementSchema),
  requirementController.update
);

requirementRoutes.post(
  "/:id/approve",
  validateParams(requirementIdParamSchema),
  validateBody(approveRequirementSchema),
  requirementController.approve
);

requirementRoutes.post(
  "/:id/reject",
  validateParams(requirementIdParamSchema),
  validateBody(rejectRequirementSchema),
  requirementController.reject
);

requirementRoutes.put(
  "/:id/rule-mapping",
  validateParams(requirementIdParamSchema),
  validateBody(mapRuleSchema),
  requirementController.mapRule
);

requirementRoutes.put(
  "/:id/rule",
  validateParams(requirementIdParamSchema),
  validateBody(mapRuleSchema),
  requirementController.mapRule
);

requirementRoutes.patch(
  "/:id/rule-mapping",
  validateParams(requirementIdParamSchema),
  validateBody(mapRuleSchema),
  requirementController.mapRule
);
