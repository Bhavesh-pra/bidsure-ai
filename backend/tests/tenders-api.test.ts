import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from "../src/shared/types/api.types.js";
import type { TenderDTO } from "../src/modules/tenders/tender.types.js";

describe("Phase 03 — Persistent Tender API", () => {
  let server: Server;
  let baseUrl: string;
  let authCookie: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Authenticate as Officer to obtain HttpOnly session cookie
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });
    const setCookie = loginRes.headers.get("set-cookie");
    authCookie = setCookie ? setCookie.split(";")[0]! : "";
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("GET /api/v1/tenders should return paginated list of tenders with standard envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/tenders?page=1&pageSize=5`, {
      headers: { Cookie: authCookie },
    });
    assert.equal(res.status, 200);

    const body = (await res.json()) as PaginatedResponse<TenderDTO>;
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.ok(body.meta.total >= 1);
    assert.equal(body.meta.page, 1);
    assert.equal(body.meta.pageSize, 5);
    assert.ok(body.requestId.startsWith("req_"));

    const first = body.data[0];
    assert.ok(first.id);
    assert.ok(first.title);
    assert.ok(first.referenceNumber);
    assert.ok(first.createdAt);
  });

  it("POST /api/v1/tenders should validate request body and create persistent tender", async () => {
    const uniqueRef = `TDR-TEST-${Date.now()}`;
    const payload = {
      title: "Smart Highway Traffic Management Software",
      referenceNumber: uniqueRef,
      description: "Integration test tender creation",
    };

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 201);

    const body = (await res.json()) as ApiResponse<TenderDTO>;
    assert.equal(body.success, true);
    assert.equal(body.data.title, payload.title);
    assert.equal(body.data.referenceNumber, uniqueRef);
    assert.equal(body.data.status, "DRAFT");
    assert.ok(body.data.currentVersionId);
    assert.ok(body.requestId.startsWith("req_"));

    // Verify it is retrievable by ID
    const getRes = await fetch(`${baseUrl}/api/v1/tenders/${body.data.id}`, {
      headers: { Cookie: authCookie },
    });
    assert.equal(getRes.status, 200);
    const getBody = (await getRes.json()) as ApiResponse<TenderDTO>;
    assert.equal(getBody.data.id, body.data.id);
    assert.equal(getBody.data.referenceNumber, uniqueRef);
    assert.ok(getBody.data.currentVersion);
    assert.equal(getBody.data.currentVersion?.versionNumber, 1);
  });

  it("POST /api/v1/tenders should reject invalid payload with VALIDATION_ERROR (400)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        title: "X", // too short
        referenceNumber: "invalid spaces ref#",
      }),
    });
    assert.equal(res.status, 400);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(body.error.details));
  });

  it("POST /api/v1/tenders should reject duplicate reference number with CONFLICT (409)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        title: "Duplicate Reference Test",
        referenceNumber: "TDR-2026-DEL-001", // already in seed
      }),
    });
    assert.equal(res.status, 409);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "CONFLICT");
  });

  it("GET /api/v1/tenders/:id should return 404 for nonexistent UUID", async () => {
    const nonExistentUuid = "99999999-9999-4999-a999-999999999999";
    const res = await fetch(`${baseUrl}/api/v1/tenders/${nonExistentUuid}`, {
      headers: { Cookie: authCookie },
    });
    assert.equal(res.status, 404);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("GET /api/v1/tenders/:id should return 400 for malformed non-UUID ID", async () => {
    const res = await fetch(`${baseUrl}/api/v1/tenders/invalid-not-uuid`, {
      headers: { Cookie: authCookie },
    });
    assert.equal(res.status, 400);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

