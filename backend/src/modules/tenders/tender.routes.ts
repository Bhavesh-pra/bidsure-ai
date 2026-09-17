import { Router } from "express";
import { tenderController } from "./tender.controller.js";
import { validateBody, validateQuery, validateParams } from "../../shared/validation/zod.middleware.js";
import { requireIdempotency } from "../../shared/idempotency/idempotency.middleware.js";
import {
  getTendersQuerySchema,
  tenderIdParamSchema,
  createTenderSchema,
} from "./tender.schemas.js";

export const tenderRoutes = Router();

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
