import { Router } from "express";
import { healthRoutes } from "./health/health.routes.js";
import { errorTestRoutes } from "./error-test/error-test.routes.js";
import { tenderRoutes } from "../modules/tenders/tender.routes.js";
import { bidRoutes } from "../modules/bids/bid.routes.js";

export const routes = Router();

routes.use("/health", healthRoutes);

// Phase 02 — Integration testing endpoint (controlled error scenarios)
routes.use("/error-test", errorTestRoutes);

// Phase 03 — Persistent Domain APIs
routes.use("/tenders", tenderRoutes);
routes.use("/bids", bidRoutes);

