import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { config } from "../../config/env.js";
import type { ApiErrorResponse } from "../../shared/types/api.types.js";
import type { Request, Response } from "express";

export const authRoutes = Router();

// Stricter rate limiter specifically for authentication attempts (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,             // 15 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: (req: Request, res: Response) => {
    const requestId = req.requestId ?? "req_unknown";
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many login attempts. Please try again later.",
      },
      requestId,
    };
    res.status(429).json(payload);
  },
});

authRoutes.post("/login", authLimiter, authController.login);
authRoutes.get("/me", requireAuth, authController.me);
authRoutes.post("/logout", authController.logout);
