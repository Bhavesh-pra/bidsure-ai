import { prisma } from "../../infrastructure/database/prisma.js";

export class AuthRepository {
  /**
   * Find user by email with organization relation.
   * Includes passwordHash for server-side verification only.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        bidder: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
          },
        },
      },
    });
  }

  /**
   * Update user's last login timestamp.
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user
      .update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      })
      .catch(() => {});
  }
}

export const authRepository = new AuthRepository();
