import { createHash, randomUUID } from "node:crypto";
import { prisma } from "../../infrastructure/database/prisma.js";
import {
  IdempotencyConflictError,
  ConcurrentRequestError,
} from "../errors/app-error.js";
import { Prisma, type IdempotencyStatus } from "@prisma/client";

export interface IdempotencyLockResult {
  isReplay: boolean;
  statusCode?: number;
  responseBody?: unknown;
  recordId?: string;
}

export interface StoreIdempotencyResultInput {
  organizationId: string;
  key: string;
  statusCode: number;
  responseBody: unknown;
}

export class IdempotencyService {
  /** Lock timeout in milliseconds before an IN_PROGRESS lock is considered stale */
  private readonly lockTimeoutMs: number;
  /** TTL for completed idempotency records (default: 24 hours) */
  private readonly ttlMs: number;

  constructor(options?: { lockTimeoutMs?: number; ttlMs?: number }) {
    this.lockTimeoutMs = options?.lockTimeoutMs ?? 30000; // 30 seconds
    this.ttlMs = options?.ttlMs ?? 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Generates a deterministic SHA-256 hash of the request method, endpoint, and payload.
   */
  public computeRequestHash(method: string, endpoint: string, body: unknown): string {
    const normalizedBody = this.canonicalStringify(body ?? {});
    return createHash("sha256")
      .update(`${method.toUpperCase()}:${endpoint}:${normalizedBody}`)
      .digest("hex");
  }

  /**
   * Sorts object keys recursively to produce a canonical deterministic JSON string.
   */
  private canonicalStringify(obj: unknown): string {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj) ?? "";
    }
    if (Array.isArray(obj)) {
      return `[${obj.map((item) => this.canonicalStringify(item)).join(",")}]`;
    }
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const parts = keys.map(
      (k) => `${JSON.stringify(k)}:${this.canonicalStringify((obj as Record<string, unknown>)[k])}`
    );
    return `{${parts.join(",")}}`;
  }

  /**
   * Attempts to acquire an idempotency lock for an incoming request.
   *
   * Flow:
   * 1. Try to INSERT new record with status = IN_PROGRESS.
   * 2. If insert succeeds: lock acquired! Returns { isReplay: false, recordId }.
   * 3. If insert fails with unique violation (organizationId, key):
   *    Fetch the existing record:
   *    - Verify requestHash. If different: throw IdempotencyConflictError (409).
   *    - If COMPLETED:
   *      - If expired (expiresAt < now): reclaim lock atomically or re-execute.
   *      - If active: return { isReplay: true, statusCode, responseBody }.
   *    - If IN_PROGRESS:
   *      - If not stale (now - lockedAt < lockTimeout): throw ConcurrentRequestError (409).
   *      - If stale: attempt atomic conditional update to reclaim the lock.
   *    - If FAILED:
   *      - Attempt atomic conditional update to reclaim the lock for retry.
   */
  public async acquireLock(params: {
    organizationId: string;
    userId: string;
    key: string;
    method: string;
    endpoint: string;
    requestHash?: string;
    body?: unknown;
  }): Promise<IdempotencyLockResult> {
    const { organizationId, userId, key, method, endpoint } = params;
    const requestHash =
      params.requestHash ?? this.computeRequestHash(method, endpoint, params.body ?? {});
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlMs);
    const staleThreshold = new Date(now.getTime() - this.lockTimeoutMs);

    // 1. Try initial INSERT
    try {
      const record = await prisma.idempotencyRecord.create({
        data: {
          id: randomUUID(),
          key,
          organizationId,
          userId,
          method,
          endpoint,
          requestHash,
          status: "IN_PROGRESS",
          lockedAt: now,
          expiresAt,
        },
      });

      return {
        isReplay: false,
        recordId: record.id,
      };
    } catch (err: unknown) {
      // Check for Prisma unique constraint violation (P2002 on organizationId, key)
      const isUniqueViolation =
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "P2002";

      if (!isUniqueViolation) {
        throw err;
      }
    }

    // 2. Unique constraint conflict: inspect existing record for this tenant
    const existing = await prisma.idempotencyRecord.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
    });

    if (!existing) {
      // Record was deleted between insert and find; retry once recursively
      return this.acquireLock(params);
    }

    // 3. Payload integrity check: same key cannot be used with different payload
    if (existing.requestHash !== requestHash) {
      throw new IdempotencyConflictError(
        "Idempotency key was previously used with a different request payload"
      );
    }

    // 4. Check if record has expired
    if (existing.expiresAt < now) {
      // Expired record: atomically reclaim lock
      const reclaimed = await prisma.idempotencyRecord.updateMany({
        where: {
          organizationId,
          key,
          expiresAt: { lt: now },
        },
        data: {
          status: "IN_PROGRESS",
          requestHash,
          userId,
          lockedAt: now,
          expiresAt,
          statusCode: null,
          responseBody: Prisma.JsonNull,
          completedAt: null,
        },
      });

      if (reclaimed.count === 1) {
        return { isReplay: false, recordId: existing.id };
      }
      // Lost race to reclaim: re-check
      return this.acquireLock(params);
    }

    // 5. If COMPLETED: return stored response for safe replay
    if (existing.status === "COMPLETED") {
      return {
        isReplay: true,
        statusCode: existing.statusCode ?? 200,
        responseBody: existing.responseBody ?? undefined,
        recordId: existing.id,
      };
    }

    // 6. If IN_PROGRESS:
    if (existing.status === "IN_PROGRESS") {
      if (existing.lockedAt >= staleThreshold) {
        // Active in-progress lock held by another concurrent request
        throw new ConcurrentRequestError(
          "A request with this idempotency key is currently processing. Please retry shortly."
        );
      }

      // Stale lock: atomically reclaim using conditional update
      const reclaimed = await prisma.idempotencyRecord.updateMany({
        where: {
          organizationId,
          key,
          status: "IN_PROGRESS",
          lockedAt: { lt: staleThreshold },
        },
        data: {
          status: "IN_PROGRESS",
          lockedAt: now,
          expiresAt,
          userId,
          requestHash,
        },
      });

      if (reclaimed.count === 1) {
        return { isReplay: false, recordId: existing.id };
      }

      // Lost race to another concurrent request reclaiming the stale lock
      throw new ConcurrentRequestError(
        "A request with this idempotency key is currently processing. Please retry shortly."
      );
    }

    // 7. If FAILED: allow retry by atomically reclaiming the lock
    if (existing.status === "FAILED") {
      const reclaimed = await prisma.idempotencyRecord.updateMany({
        where: {
          organizationId,
          key,
          status: "FAILED",
        },
        data: {
          status: "IN_PROGRESS",
          lockedAt: now,
          expiresAt,
          userId,
          requestHash,
          statusCode: null,
          responseBody: Prisma.JsonNull,
          completedAt: null,
        },
      });

      if (reclaimed.count === 1) {
        return { isReplay: false, recordId: existing.id };
      }

      // Lost race to another retry
      throw new ConcurrentRequestError(
        "A request with this idempotency key is currently processing. Please retry shortly."
      );
    }

    // Fallback: throw conflict
    throw new ConcurrentRequestError(
      "A request with this idempotency key is currently processing. Please retry shortly."
    );
  }

  /**
   * Persists a completed response for an idempotency record.
   * Only stores 2xx status codes (200, 201, 204).
   * Never permanently stores 5xx server errors as COMPLETED.
   */
  public async completeLock(params: StoreIdempotencyResultInput): Promise<void> {
    const { organizationId, key, statusCode, responseBody } = params;
    const now = new Date();

    if (statusCode >= 200 && statusCode < 300) {
      // 204 No Content: responseBody is null / empty
      const bodyToStore =
        statusCode === 204 || responseBody === undefined ? null : responseBody;

      await prisma.idempotencyRecord.updateMany({
        where: {
          organizationId,
          key,
          status: "IN_PROGRESS",
        },
        data: {
          status: "COMPLETED",
          statusCode,
          responseBody: bodyToStore as unknown as object,
          completedAt: now,
        },
      });
    } else {
      // 4xx or 5xx: mark as FAILED so it does not replay a failure forever
      await prisma.idempotencyRecord.updateMany({
        where: {
          organizationId,
          key,
          status: "IN_PROGRESS",
        },
        data: {
          status: "FAILED",
          completedAt: now,
        },
      });
    }
  }

  /**
   * Releases or marks a lock as failed when an unhandled exception occurs.
   */
  public async releaseLockOnError(organizationId: string, key: string): Promise<void> {
    try {
      await prisma.idempotencyRecord.updateMany({
        where: {
          organizationId,
          key,
          status: "IN_PROGRESS",
        },
        data: {
          status: "FAILED",
          completedAt: new Date(),
        },
      });
    } catch {
      // Best-effort release on error
    }
  }

  /**
   * Helper alias for marking lock as failed
   */
  public async markFailed(key: string, organizationId: string): Promise<void> {
    return this.releaseLockOnError(organizationId, key);
  }

  /**
   * Helper alias for completing lock
   */
  public async markCompleted(
    key: string,
    organizationId: string,
    statusCode: number,
    responseBody?: unknown
  ): Promise<void> {
    return this.completeLock({ key, organizationId, statusCode, responseBody });
  }

  /**
   * Cleanup utility to delete expired idempotency records.
   */
  public async cleanupExpiredRecords(referenceDate: Date = new Date()): Promise<number> {
    const result = await prisma.idempotencyRecord.deleteMany({
      where: {
        expiresAt: {
          lt: referenceDate,
        },
      },
    });
    return result.count;
  }
}

export const idempotencyService = new IdempotencyService();
