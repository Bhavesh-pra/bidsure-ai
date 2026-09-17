import { authRepository, AuthRepository } from "./auth.repository.js";
import { passwordService, PasswordService } from "../../shared/auth/password.service.js";
import { sessionService, SessionService, type AuthenticatedUser } from "../../shared/auth/session.service.js";
import { UnauthorizedError } from "../../shared/errors/app-error.js";
import { UserStatus, OrganizationStatus } from "@prisma/client";
import type { LoginInput } from "./auth.schemas.js";
import type { UserDTO } from "./auth.types.js";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository = authRepository,
    private readonly passwords: PasswordService = passwordService,
    private readonly sessions: SessionService = sessionService
  ) {}

  /**
   * Authenticate user credentials, establish server-side session, and return sanitized profile.
   *
   * SECURITY RULES:
   * 1. Generic error messages prevent user enumeration.
   * 2. passwordHash is never returned.
   * 3. INACTIVE / SUSPENDED accounts are rejected.
   */
  async login(input: LoginInput): Promise<{ sessionToken: string; user: UserDTO }> {
    const user = await this.repository.findByEmail(input.email);

    // Constant-time generic rejection if user not found or has no password
    if (!user || !user.passwordHash) {
      // Perform a dummy scrypt computation to mitigate timing enumeration attacks
      await this.passwords.verifyPassword(
        input.password,
        "$scrypt$N=16384,r=8,p=1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await this.passwords.verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Account status validation
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Account is not active. Please contact your administrator.");
    }

    // Organization status validation
    if (user.organization.status !== OrganizationStatus.ACTIVE) {
      throw new UnauthorizedError("Organization is currently suspended.");
    }

    // Create database session (hashed token stored)
    const sessionToken = await this.sessions.createSession(user.id);

    // Update last login timestamp asynchronously
    this.repository.updateLastLogin(user.id).catch(() => {});

    const sanitizedUser: UserDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      bidderId: user.bidderId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        status: user.organization.status,
      },
    };

    return {
      sessionToken,
      user: sanitizedUser,
    };
  }

  /**
   * Terminate active session in database.
   */
  async logout(sessionToken?: string | null): Promise<void> {
    if (sessionToken) {
      await this.sessions.invalidateSession(sessionToken);
    }
  }

  /**
   * Format authenticated user into public UserDTO.
   */
  formatUser(user: AuthenticatedUser): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      bidderId: user.bidderId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        status: user.organization.status,
      },
    };
  }
}

export const authService = new AuthService();
