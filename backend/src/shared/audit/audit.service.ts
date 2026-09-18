import { prisma } from "../../infrastructure/database/prisma.js";
import { logger } from "../../infrastructure/logging/logger.js";

export interface LogAuditParams {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: unknown;
  newState?: unknown;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export class AuditService {
  /**
   * Log an immutable audit event to PostgreSQL.
   */
  async logEvent(params: LogAuditParams): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          previousState: (params.previousState as any) ?? null,
          newState: (params.newState as any) ?? null,
          metadata: (params.metadata as any) ?? {},
          correlationId: params.correlationId ?? null,
        },
      });

      logger.debug(
        {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          organizationId: params.organizationId,
          userId: params.userId,
        },
        "Audit event logged"
      );
    } catch (err: any) {
      // Never crash the primary transaction on audit logging failure, but log critical warning
      logger.error(
        { err: err.message, action: params.action, entityId: params.entityId },
        "Failed to write audit event"
      );
    }
  }

  /**
   * Query audit history for an entity within tenant boundary.
   */
  async getEventsForEntity(entityType: string, entityId: string, organizationId: string) {
    return prisma.auditEvent.findMany({
      where: {
        entityType,
        entityId,
        organizationId,
      },
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}

export const auditService = new AuditService();
