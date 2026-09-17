import type { Request, Response, NextFunction } from "express";
import { authService, AuthService } from "./auth.service.js";
import { loginSchema } from "./auth.schemas.js";
import { setSessionCookie, clearSessionCookie, getSessionTokenFromRequest } from "../../shared/auth/cookie.helper.js";
import { ValidationError, UnauthorizedError } from "../../shared/errors/app-error.js";
import { config } from "../../config/env.js";
import type { ApiResponse } from "../../shared/types/api.types.js";
import type { LoginResponseData, LogoutResponseData, UserDTO } from "./auth.types.js";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  /**
   * POST /api/v1/auth/login
   * Authenticates user, sets HttpOnly session cookie, and returns sanitized profile.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          "Validation failed for login credentials",
          parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          }))
        );
      }

      const { sessionToken, user } = await this.service.login(parsed.data);

      // Set authoritative HttpOnly session cookie
      setSessionCookie(res, sessionToken);

      const responseData: LoginResponseData = {
        user,
        // In non-production/testing, provide sessionToken in payload for automated test runners
        ...(config.isProd ? {} : { sessionToken }),
      };

      const response: ApiResponse<LoginResponseData> = {
        success: true,
        data: responseData,
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Authoritative identity endpoint for session restoration.
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required");
      }

      const user = this.service.formatUser(req.user);

      const response: ApiResponse<{ user: UserDTO }> = {
        success: true,
        data: { user },
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Invalidates active session record in database and clears HttpOnly cookie.
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = getSessionTokenFromRequest(req);
      await this.service.logout(token);
      clearSessionCookie(res);

      const response: ApiResponse<LogoutResponseData> = {
        success: true,
        data: { loggedOut: true },
        requestId: req.requestId ?? "req_unknown",
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
