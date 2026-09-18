import { Router } from "express";
import { bidController } from "./bid.controller.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../shared/validation/zod.middleware.js";
import { requireIdempotency } from "../../shared/idempotency/idempotency.middleware.js";
import {
  getBidsQuerySchema,
  bidIdParamSchema,
  createBidSchema,
  updateDraftBidSchema,
} from "./bid.schemas.js";
import { documentRoutes } from "../documents/document.routes.js";
import { intelligenceController } from "../intelligence/intelligence.controller.js";

export const bidRoutes = Router();

// ---------------------------------------------------------------------------
// Bid CRUD & Query
// ---------------------------------------------------------------------------

bidRoutes.get(
  "/",
  validateQuery(getBidsQuerySchema),
  bidController.list
);

bidRoutes.post(
  "/",
  validateBody(createBidSchema),
  requireIdempotency({ required: false }),
  bidController.create
);

bidRoutes.get(
  "/:id",
  validateParams(bidIdParamSchema),
  bidController.getById
);

bidRoutes.patch(
  "/:id",
  validateParams(bidIdParamSchema),
  validateBody(updateDraftBidSchema),
  bidController.update
);

// ---------------------------------------------------------------------------
// Explicit Lifecycle Transitions (State Machine & Idempotent Submission)
// ---------------------------------------------------------------------------

bidRoutes.post(
  "/:id/submit",
  validateParams(bidIdParamSchema),
  requireIdempotency({ required: false }),
  bidController.submit
);

// ---------------------------------------------------------------------------
// Phase 08 — Secure Document Ingestion Sub-routes
// ---------------------------------------------------------------------------

bidRoutes.use("/:bidId/documents", documentRoutes);

// ---------------------------------------------------------------------------
// Phase 09 — Structured Evidence Retrieval
// ---------------------------------------------------------------------------

bidRoutes.get(
  "/:bidId/evidence",
  intelligenceController.getBidEvidence
);

