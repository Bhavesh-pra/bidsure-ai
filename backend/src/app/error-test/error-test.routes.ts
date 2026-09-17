import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  InternalServerError,
  ValidationError,
  NotFoundError,
  RateLimitedError,
  ForbiddenError,
  UnauthorizedError,
} from "../../shared/errors/app-error.js";

// ---------------------------------------------------------------------------
// Error-test endpoint — Phase 02 integration testing only.
// This deliberately produces backend errors so the frontend can prove the
// real error-integration path works end-to-end.
//
// GET /api/v1/error-test?scenario=<name>
// ---------------------------------------------------------------------------

const SCENARIOS = {
  internal: () => new InternalServerError("Controlled internal error for integration testing"),
  validation: () =>
    new ValidationError("Controlled validation failure", [
      { field: "example", message: "This field is required" },
      { field: "another", message: "Must be a valid email" },
    ]),
  not_found: () => new NotFoundError("Controlled not-found error"),
  rate_limited: () => new RateLimitedError("Controlled rate-limit error"),
  forbidden: () => new ForbiddenError("Controlled forbidden error"),
  unauthorized: () => new UnauthorizedError("Controlled unauthorized error"),
} as const;

type Scenario = keyof typeof SCENARIOS;

export const errorTestRoutes = Router();

errorTestRoutes.get("/", (req: Request, _res: Response, next: NextFunction): void => {
  const scenario = (req.query["scenario"] as string | undefined) ?? "internal";

  if (!(scenario in SCENARIOS)) {
    const valid = Object.keys(SCENARIOS).join(", ");
    next(
      new ValidationError(`Unknown scenario '${scenario}'. Valid options: ${valid}`, [
        { field: "scenario", message: `Must be one of: ${valid}` },
      ])
    );
    return;
  }

  const error = SCENARIOS[scenario as Scenario]();
  next(error);
});
