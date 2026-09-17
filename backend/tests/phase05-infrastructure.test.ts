import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { idempotencyService } from "../src/shared/idempotency/idempotency.service.js";
import { runInTransaction } from "../src/shared/database/transaction.helper.js";
import { ConcurrentRequestError } from "../src/shared/errors/app-error.js";
import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from "../src/shared/types/api.types.js";
import type { TenderDTO } from "../src/modules/tenders/tender.types.js";

describe("Phase 05 — API Infrastructure & Reliability Tests", () => {
  let server: Server;
  let baseUrl: string;
  let authCookieOrgA: string;
  let authCookieOrgB: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Authenticate as Org A Officer (NHAI)
    const loginResA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });
    const setCookieA = loginResA.headers.get("set-cookie");
    authCookieOrgA = setCookieA ? setCookieA.split(";")[0]! : "";

    // Authenticate as Org B Officer (DFCCIL)
    const loginResB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@dfccil.bidsure.test",
        password: "Officer@123",
      }),
    });
    const setCookieB = loginResB.headers.get("set-cookie");
    authCookieOrgB = setCookieB ? setCookieB.split(";")[0]! : "";
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe("1. Canonical Request ID", () => {
    it("preserves client provided req_ prefixed canonical uuid x-request-id", async () => {
      const customId = "req_a1b2c3d4-e5f6-4a1b-8c2d-e3f4a5b6c7d8";
      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        headers: {
          Cookie: authCookieOrgA,
          "x-request-id": customId,
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-request-id"), customId);
      const json = (await res.json()) as PaginatedResponse<TenderDTO>;
      assert.equal(json.requestId, customId);
    });

    it("canonicalizes non-prefixed uuid into req_<uuid>", async () => {
      const rawUuid = "7b36f734-7a2e-4df7-80be-896c342f0e9d";
      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        headers: {
          Cookie: authCookieOrgA,
          "x-request-id": rawUuid,
        },
      });
      assert.equal(res.status, 200);
      const expected = `req_${rawUuid}`;
      assert.equal(res.headers.get("x-request-id"), expected);
      const json = (await res.json()) as PaginatedResponse<TenderDTO>;
      assert.equal(json.requestId, expected);
    });

    it("attaches canonical requestId to error responses", async () => {
      const customId = "req_f1e2d3c4-b5a6-4987-8123-456789abcdef";
      const res = await fetch(`${baseUrl}/api/v1/tenders/invalid-uuid-id`, {
        headers: {
          Cookie: authCookieOrgA,
          "x-request-id": customId,
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.headers.get("x-request-id"), customId);
      const json = (await res.json()) as ApiErrorResponse;
      assert.equal(json.requestId, customId);
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
    });

    it("generates fresh req_<uuid> when invalid x-request-id format is provided", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        headers: {
          Cookie: authCookieOrgA,
          "x-request-id": "invalid-malformed-request-id",
        },
      });
      assert.equal(res.status, 200);
      const headerId = res.headers.get("x-request-id");
      assert.ok(headerId?.startsWith("req_"));
      assert.notEqual(headerId, "invalid-malformed-request-id");
    });
  });

  describe("2. Response Envelope & Pagination Standards", () => {
    it("returns standardized paginated envelope with meta.pagination and backwards compatibility", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders?page=1&pageSize=2`, {
        headers: { Cookie: authCookieOrgA },
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as PaginatedResponse<TenderDTO>;

      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta.timestamp);
      // Detailed pagination meta
      assert.ok(body.meta.pagination);
      assert.equal(body.meta.pagination.page, 1);
      assert.equal(body.meta.pagination.pageSize, 2);
      assert.ok(typeof body.meta.pagination.total === "number");
      assert.ok(typeof body.meta.pagination.totalPages === "number");
      assert.equal(body.meta.pagination.hasPrev, false);
      // Backwards compatible top-level meta properties
      assert.equal(body.meta.page, 1);
      assert.equal(body.meta.pageSize, 2);
      assert.equal(body.meta.total, body.meta.pagination.total);
      assert.equal(body.meta.totalPages, body.meta.pagination.totalPages);
    });

    it("rejects invalid pagination queries with 400 VALIDATION_ERROR", async () => {
      // Negative page
      const res1 = await fetch(`${baseUrl}/api/v1/tenders?page=-1`, {
        headers: { Cookie: authCookieOrgA },
      });
      assert.equal(res1.status, 400);
      const body1 = (await res1.json()) as ApiErrorResponse;
      assert.equal(body1.error.code, "VALIDATION_ERROR");

      // Zero pageSize
      const res2 = await fetch(`${baseUrl}/api/v1/tenders?pageSize=0`, {
        headers: { Cookie: authCookieOrgA },
      });
      assert.equal(res2.status, 400);
      const body2 = (await res2.json()) as ApiErrorResponse;
      assert.equal(body2.error.code, "VALIDATION_ERROR");

      // Excessive pageSize (> 100)
      const res3 = await fetch(`${baseUrl}/api/v1/tenders?pageSize=150`, {
        headers: { Cookie: authCookieOrgA },
      });
      assert.equal(res3.status, 400);
      const body3 = (await res3.json()) as ApiErrorResponse;
      assert.equal(body3.error.code, "VALIDATION_ERROR");
    });
  });

  describe("3. Zod Validation Middleware", () => {
    it("validates request body and provides structured issue details", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify({
          // missing title
          referenceNumber: "INVALID-TDR-###",
        }),
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as ApiErrorResponse;
      assert.equal(body.success, false);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(Array.isArray(body.error.details));
      const paths = (body.error.details as Array<{ path?: string; field?: string }>).map(
        (d) => d.path ?? d.field ?? ""
      );
      assert.ok(paths.some((p) => p.includes("title")));
    });

    it("validates path parameters using createUuidParamSchema", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders/not-a-valid-uuid`, {
        headers: { Cookie: authCookieOrgA },
      });
      assert.equal(res.status, 400);
      const body = (await res.json()) as ApiErrorResponse;
      assert.equal(body.error.code, "VALIDATION_ERROR");
      const details = body.error.details as Array<{ path?: string; field?: string }>;
      assert.ok(details.some((d) => (d.path ?? d.field)?.includes("id")));
    });
  });

  describe("4. Idempotency Execution & Replay", () => {
    it("executes initial request and returns 201 without replay header", async () => {
      const testKey = `idemp-key-${Date.now()}-initial`;
      const payload = {
        title: "Idempotent Highway Expansion Project",
        referenceNumber: `TDR-IDEMP-${Date.now()}-A`,
        description: "Initial request for idempotency test",
      };

      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": testKey,
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify(payload),
      });

      assert.equal(res.status, 201);
      assert.equal(res.headers.get("x-idempotent-replay"), null);
      const body = (await res.json()) as ApiResponse<TenderDTO>;
      assert.equal(body.success, true);
      assert.equal(body.data.title, payload.title);
    });

    it("replays response when identical request with same Idempotency-Key is sent", async () => {
      const testKey = `idemp-key-${Date.now()}-replay`;
      const payload = {
        title: "Replay Test Project",
        referenceNumber: `TDR-IDEMP-${Date.now()}-B`,
        description: "Replay verification payload",
      };

      // First call
      const res1 = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": testKey,
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res1.status, 201);
      const body1 = (await res1.json()) as ApiResponse<TenderDTO>;

      // Second call (replay)
      const res2 = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": testKey,
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res2.status, 201);
      assert.equal(res2.headers.get("x-idempotent-replay"), "true");
      const body2 = (await res2.json()) as ApiResponse<TenderDTO>;
      assert.equal(body2.data.id, body1.data.id);
      assert.equal(body2.data.referenceNumber, body1.data.referenceNumber);
    });

    it("rejects request with 409 IDEMPOTENCY_CONFLICT when payload differs for same key", async () => {
      const testKey = `idemp-key-${Date.now()}-conflict`;
      const payload1 = {
        title: "Original Conflict Project",
        referenceNumber: `TDR-IDEMP-${Date.now()}-C`,
      };
      const payload2 = {
        title: "Different Conflict Project",
        referenceNumber: `TDR-IDEMP-${Date.now()}-D`,
      };

      // First call
      const res1 = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": testKey,
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify(payload1),
      });
      assert.equal(res1.status, 201);

      // Second call with different payload
      const res2 = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": testKey,
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify(payload2),
      });
      assert.equal(res2.status, 409);
      const body2 = (await res2.json()) as ApiErrorResponse;
      assert.equal(body2.success, false);
      assert.equal(body2.error.code, "IDEMPOTENCY_CONFLICT");
    });

    it("preserves tenant isolation: same Idempotency-Key across different orgs does not conflict", async () => {
      const sharedKey = `shared-idemp-key-${Date.now()}`;
      const payloadA = {
        title: "Org A Tender Project",
        referenceNumber: `TDR-ORG-A-${Date.now()}`,
      };
      const payloadB = {
        title: "Org B Tender Project",
        referenceNumber: `TDR-ORG-B-${Date.now()}`,
      };

      // Org A request
      const resA = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": sharedKey,
          Cookie: authCookieOrgA,
        },
        body: JSON.stringify(payloadA),
      });
      assert.equal(resA.status, 201);

      // Org B request with the same Idempotency-Key
      const resB = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": sharedKey,
          Cookie: authCookieOrgB,
        },
        body: JSON.stringify(payloadB),
      });
      assert.equal(resB.status, 201);

      const bodyA = (await resA.json()) as ApiResponse<TenderDTO>;
      const bodyB = (await resB.json()) as ApiResponse<TenderDTO>;
      assert.notEqual(bodyA.data.id, bodyB.data.id);
      assert.notEqual(bodyA.data.organizationId, bodyB.data.organizationId);
    });
  });

  describe("5. Idempotency Concurrency & Failure Recovery (Unit Integration)", () => {
    it("throws ConcurrentRequestError when lock is IN_PROGRESS", async () => {
      const testKey = `unit-concurrency-${Date.now()}`;
      const orgId = "00000000-0000-4000-a000-000000000001";
      const userId = "00000000-0000-4000-a000-000000000011";

      const lock1 = await idempotencyService.acquireLock({
        key: testKey,
        organizationId: orgId,
        userId,
        method: "POST",
        endpoint: "/test",
        body: { test: 1 },
      });
      assert.equal(lock1.isReplay, false);

      // Second acquire while lock is still IN_PROGRESS
      await assert.rejects(
        async () => {
          await idempotencyService.acquireLock({
            key: testKey,
            organizationId: orgId,
            userId,
            method: "POST",
            endpoint: "/test",
            body: { test: 1 },
          });
        },
        (err: unknown) => {
          return err instanceof ConcurrentRequestError && err.code === "CONCURRENT_REQUEST";
        }
      );
    });

    it("allows re-acquisition after transient failure (status FAILED)", async () => {
      const testKey = `unit-failure-${Date.now()}`;
      const orgId = "00000000-0000-4000-a000-000000000001";
      const userId = "00000000-0000-4000-a000-000000000011";

      // 1. Acquire initial lock
      const lock1 = await idempotencyService.acquireLock({
        key: testKey,
        organizationId: orgId,
        userId,
        method: "POST",
        endpoint: "/test",
        body: { fail: true },
      });
      assert.equal(lock1.isReplay, false);

      // 2. Mark as failed due to transient 5xx error
      await idempotencyService.markFailed(testKey, orgId);

      // 3. Retry acquisition should succeed (stale/failed lock reclaimed)
      const lock2 = await idempotencyService.acquireLock({
        key: testKey,
        organizationId: orgId,
        userId,
        method: "POST",
        endpoint: "/test",
        body: { fail: true },
      });
      assert.equal(lock2.isReplay, false);

      // Complete it
      await idempotencyService.markCompleted(testKey, orgId, 200, { ok: true });
    });
  });

  describe("6. Database Transaction Helper", () => {
    it("commits operations on successful transaction execution", async () => {
      const refNumber = `TX-COMMIT-${Date.now()}`;
      const orgId = "00000000-0000-4000-a000-000000000001";
      const userId = "00000000-0000-4000-a000-000000000011";

      const created = await runInTransaction(prisma, async (tx) => {
        return tx.tender.create({
          data: {
            organizationId: orgId,
            title: "Transaction Commit Test Tender",
            referenceNumber: refNumber,
            status: "DRAFT",
          },
        });
      });

      assert.ok(created.id);
      const found = await prisma.tender.findUnique({ where: { id: created.id } });
      assert.ok(found);
      assert.equal(found.referenceNumber, refNumber);
    });

    it("rolls back all operations when error occurs inside transaction", async () => {
      const refNumber = `TX-ROLLBACK-${Date.now()}`;
      const orgId = "00000000-0000-4000-a000-000000000001";

      await assert.rejects(
        async () => {
          await runInTransaction(prisma, async (tx) => {
            await tx.tender.create({
              data: {
                organizationId: orgId,
                title: "Rollback Test Tender",
                referenceNumber: refNumber,
                status: "DRAFT",
              },
            });
            throw new Error("Simulated downstream failure inside transaction");
          });
        },
        /Simulated downstream failure inside transaction/
      );

      // Ensure record was rolled back and does not exist in DB
      const found = await prisma.tender.findFirst({
        where: { referenceNumber: refNumber },
      });
      assert.equal(found, null);
    });
  });
});
