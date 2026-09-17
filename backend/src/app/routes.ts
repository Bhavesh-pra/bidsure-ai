import { Router } from "express";
import { healthRoutes } from "./health/health.routes.js";
import { errorTestRoutes } from "./error-test/error-test.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { tenderRoutes } from "../modules/tenders/tender.routes.js";
import { bidRoutes } from "../modules/bids/bid.routes.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const routes = Router();

routes.use("/health", healthRoutes);

// Phase 02 — Integration testing endpoint (controlled error scenarios)
routes.use("/error-test", errorTestRoutes);

// Phase 04 — Authentication & Identity APIs
routes.use("/auth", authRoutes);

// Phase 03 & 04 — Protected Domain APIs
routes.use("/tenders", requireAuth, tenderRoutes);
routes.use("/bids", requireAuth, bidRoutes);


