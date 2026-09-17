import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import type { ApiResponse, HealthData, ApiErrorResponse } from "../src/shared/types/api.types.js";

describe("Phase 02 — Security Foundation", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  // ─── Health endpoint still works (Phase 01 regression) ──────────────────

  it("Phase 01 regression: health endpoint returns 200 with standard envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as ApiResponse<HealthData>;
    assert.equal(body.success, true);
    assert.equal(body.data.status, "ok");
    assert.equal(body.data.service, "bidsure-api");
    assert.ok(body.requestId?.startsWith("req_"), "requestId must be present");
  });

  // ─── Request ID ──────────────────────────────────────────────────────────

  it("generates request ID when absent from request", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const headerReqId = res.headers.get("x-request-id");
    assert.ok(headerReqId, "x-request-id header must be present");
    assert.match(headerReqId, /^req_[0-9a-f-]{36}$/i, "must match req_<uuid> pattern");
  });

  it("uses valid x-request-id header when supplied", async () => {
    const customId = `req_${crypto.randomUUID()}`;
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { "x-request-id": customId },
    });
    const headerReqId = res.headers.get("x-request-id");
    assert.equal(headerReqId, customId, "must echo valid supplied request ID");
  });

  it("ignores malformed x-request-id and generates a new one", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { "x-request-id": "not-a-valid-id" },
    });
    const headerReqId = res.headers.get("x-request-id");
    assert.ok(headerReqId, "x-request-id must still be present");
    assert.match(headerReqId, /^req_[0-9a-f-]{36}$/i, "must be a fresh generated ID");
  });

  it("request ID appears in successful response body", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const body = (await res.json()) as ApiResponse<HealthData>;
    const headerReqId = res.headers.get("x-request-id");
    assert.equal(body.requestId, headerReqId, "body.requestId must match header");
  });

  // ─── Security Headers ────────────────────────────────────────────────────

  it("includes X-Content-Type-Options: nosniff", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  });

  it("includes X-Frame-Options header", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const header = res.headers.get("x-frame-options");
    assert.ok(header, "X-Frame-Options must be present");
    assert.match(header.toUpperCase(), /DENY|SAMEORIGIN/);
  });

  it("includes Referrer-Policy header", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const header = res.headers.get("referrer-policy");
    assert.ok(header, "Referrer-Policy must be present");
  });

  // ─── CORS ────────────────────────────────────────────────────────────────

  it("allows configured origin", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { origin: "http://localhost:5173" },
    });
    const acao = res.headers.get("access-control-allow-origin");
    assert.equal(acao, "http://localhost:5173", "must reflect the allowed origin");
  });

  it("rejects unexpected CORS origin", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { origin: "https://evil.example.com" },
    });
    // CORS rejection can be a 500 error or blocked; the response must NOT set the unauthorized origin
    const acao = res.headers.get("access-control-allow-origin");
    assert.notEqual(acao, "https://evil.example.com", "must not permit evil origin");
  });

  it("allows requests with no Origin header (server-to-server / test runners)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200, "requests without Origin must succeed");
  });

  // ─── Request Size Limits ─────────────────────────────────────────────────

  it("rejects oversized JSON payload (>50kb)", async () => {
    // Build a payload just over 50 KB
    const oversizedPayload = JSON.stringify({ data: "x".repeat(52 * 1024) });
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizedPayload,
    });
    assert.equal(res.status, 413, "must return 413 for oversized payload");

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "REQUEST_TOO_LARGE");
    assert.ok(body.requestId, "requestId must be present in size-limit error response");
  });

  // ─── Error Envelope ──────────────────────────────────────────────────────

  it("returns standard error envelope for unknown routes (404)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint-xyz`);
    assert.equal(res.status, 404);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
    assert.ok(body.requestId?.startsWith("req_"), "requestId must be present");
  });

  // ─── Controlled Error Endpoint ────────────────────────────────────────────

  it("error-test endpoint returns standard INTERNAL_ERROR envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=internal`);
    assert.equal(res.status, 500);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "INTERNAL_ERROR");
    assert.ok(body.error.message, "must have a non-empty message");
    assert.ok(body.requestId?.startsWith("req_"), "requestId must be in error response");
  });

  it("error-test endpoint does NOT expose stack traces", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=internal`);
    const body = (await res.json()) as ApiErrorResponse & { stack?: string };
    assert.ok(!("stack" in body), "response must not contain stack");
    assert.ok(!("stack" in body.error), "error must not contain stack");
    // Check the message doesn't contain path-like strings
    assert.ok(
      !body.error.message.includes("src/"),
      "error message must not contain filesystem paths"
    );
  });

  it("error-test returns VALIDATION_ERROR envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=validation`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(body.error.details), "validation errors must have details array");
  });

  it("error-test returns NOT_FOUND envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=not_found`);
    assert.equal(res.status, 404);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("error-test returns UNAUTHORIZED envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=unauthorized`);
    assert.equal(res.status, 401);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  it("error-test returns FORBIDDEN envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=forbidden`);
    assert.equal(res.status, 403);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "FORBIDDEN");
  });

  it("error-test rejects unknown scenario with VALIDATION_ERROR", async () => {
    const res = await fetch(`${baseUrl}/api/v1/error-test?scenario=nonexistent`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});
