import crypto from "node:crypto";
import { prisma } from "../../infrastructure/database/prisma.js";
import { UserStatus, OrganizationStatus, type Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  organizationId: string;
  bidderId?: string | null | undefined;
  organization: {
    id: string;
    name: string;
    status: OrganizationStatus;
  };
}

export interface ValidatedSession {
  sessionId: string;
  user: AuthenticatedUser;
}

export class SessionService {
  private static readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Hash a raw session token using SHA-256 before storing or querying the database.
   * Protects active sessions against database credential leakage.
   */
  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  /**
   * Create a new database-backed session for an authenticated user.
   * Returns the raw random token to send to the client (HttpOnly cookie).
   */
  async createSession(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SessionService.SESSION_TTL_MS);

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Validate a raw session token from client request.
   * Verifies expiration, active user status, and active organization status.
   */
  async validateSession(rawToken: string): Promise<ValidatedSession | null> {
    if (!rawToken || typeof rawToken !== "string") {
      return null;
    }

    const tokenHash = this.hashToken(rawToken);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check expiration
    if (session.expiresAt.getTime() <= Date.now()) {
      // Invalidate expired session in background
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Ensure account is ACTIVE (reject INACTIVE or SUSPENDED)
    if (session.user.status !== UserStatus.ACTIVE) {
      return null;
    }

    // Ensure organization is ACTIVE
    if (session.user.organization.status !== OrganizationStatus.ACTIVE) {
      return null;
    }

    return {
      sessionId: session.id,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
        organizationId: session.user.organizationId,
        bidderId: session.user.bidderId,
        organization: session.user.organization,
      },
    };
  }

  /**
   * Invalidate (delete) a session from the database on logout.
   * Safe to retry.
   */
  async invalidateSession(rawToken: string): Promise<void> {
    if (!rawToken || typeof rawToken !== "string") {
      return;
    }

    const tokenHash = this.hashToken(rawToken);
    await prisma.session.deleteMany({
      where: { tokenHash },
    });
  }

  /**
   * Invalidate all active sessions for a user (e.g. password change / account suspension).
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}

export const sessionService = new SessionService();
