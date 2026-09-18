import { Router } from "express";
import { tenderController } from "./tender.controller.js";
import { requirementController } from "../requirements/requirement.controller.js";
import { validateBody, validateQuery, validateParams } from "../../shared/validation/zod.middleware.js";
import { requireIdempotency } from "../../shared/idempotency/idempotency.middleware.js";
import {
  getTendersQuerySchema,
  tenderIdParamSchema,
  tenderVersionParamSchema,
  createTenderSchema,
  updateTenderMetadataSchema,
  createTenderVersionSchema,
} from "./tender.schemas.js";

export const tenderRoutes = Router();

// ---------------------------------------------------------------------------
// Tender CRUD & Query
// ---------------------------------------------------------------------------

tenderRoutes.get(
  "/",
  validateQuery(getTendersQuerySchema),
  tenderController.list
);

tenderRoutes.post(
  "/",
  validateBody(createTenderSchema),
  requireIdempotency({ required: false }),
  tenderController.create
);

tenderRoutes.get(
  "/:id",
  validateParams(tenderIdParamSchema),
  tenderController.getById
);

tenderRoutes.patch(
  "/:id",
  validateParams(tenderIdParamSchema),
  validateBody(updateTenderMetadataSchema),
  tenderController.update
);

// ---------------------------------------------------------------------------
// Explicit Lifecycle Transitions (State Machine)
// ---------------------------------------------------------------------------

tenderRoutes.post(
  "/:id/publish",
  validateParams(tenderIdParamSchema),
  tenderController.publish
);

tenderRoutes.post(
  "/:id/close",
  validateParams(tenderIdParamSchema),
  tenderController.close
);

tenderRoutes.post(
  "/:id/archive",
  validateParams(tenderIdParamSchema),
  tenderController.archive
);

// ---------------------------------------------------------------------------
// Tender Versions (Historical Snapshots & Immutability)
// ---------------------------------------------------------------------------

tenderRoutes.get(
  "/:id/versions",
  validateParams(tenderIdParamSchema),
  tenderController.listVersions
);

tenderRoutes.post(
  "/:id/versions",
  validateParams(tenderIdParamSchema),
  validateBody(createTenderVersionSchema),
  requireIdempotency({ required: false }),
  tenderController.createVersion
);

tenderRoutes.get(
  "/:id/versions/:versionId",
  validateParams(tenderVersionParamSchema),
  tenderController.getVersionById
);

// ---------------------------------------------------------------------------
// Tender Requirements (Read-Only Specification Boundary)
// ---------------------------------------------------------------------------

tenderRoutes.get(
  "/:id/requirements",
  validateParams(tenderIdParamSchema),
  tenderController.getRequirements
);

// ---------------------------------------------------------------------------
// Phase 10 — Requirement Intelligence & Review
// ---------------------------------------------------------------------------

tenderRoutes.post(
  "/:tenderId/versions/:versionId/requirements/extract",
  requireIdempotency({ required: false }),
  requirementController.extractRequirements
);

tenderRoutes.get(
  "/:tenderId/versions/:versionId/requirements",
  requirementController.listByTenderVersion
);

tenderRoutes.post(
  "/:tenderId/versions/:versionId/requirements",
  requirementController.create
);

tenderRoutes.get(
  "/:tenderId/versions/:versionId/documents",
  requirementController.listTenderDocuments
);

