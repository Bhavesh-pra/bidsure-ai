import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from "../src/shared/types/api.types.js";
import type { TenderDTO, TenderVersionDTO } from "../src/modules/tenders/tender.types.js";

describe("Phase 06 — Tender & Tender-Version Management Integration Tests", () => {
  let server: Server;
  let baseUrl: string;
  let officerACookie: string;
  let officerBCookie: string;
  let bidderACookie: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // 1. Authenticate as Org A Officer (NHAI)
    const loginResA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });
    assert.equal(loginResA.status, 200);
    const setCookieA = loginResA.headers.get("set-cookie");
    assert.ok(setCookieA);
    officerACookie = setCookieA.split(";")[0]!;

    // 2. Authenticate as Org B Officer (DFCCIL)
    const loginResB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@dfccil.bidsure.test",
        password: "Officer@123",
      }),
    });
    assert.equal(loginResB.status, 200);
    const setCookieB = loginResB.headers.get("set-cookie");
    assert.ok(setCookieB);
    officerBCookie = setCookieB.split(";")[0]!;

    // 3. Authenticate as Org A Bidder
    const loginResBidder = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bidder@apexinfra.bidsure.test",
        password: "Bidder@123",
      }),
    });
    assert.equal(loginResBidder.status, 200);
    const setCookieBidder = loginResBidder.headers.get("set-cookie");
    assert.ok(setCookieBidder);
    bidderACookie = setCookieBidder.split(";")[0]!;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe("1. Atomic Tender Creation & Initial Version 1", () => {
    it("creates tender and initial version 1 atomically with currentVersionId", async () => {
      const uniqueRef = `TDR-P06-${Date.now()}-1`;
      const createRes = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: officerACookie,
        },
        body: JSON.stringify({
          title: "Optical Fiber Cable Laying Corridor A",
          referenceNumber: uniqueRef,
          description: "Initial specification for optical fiber laying",
          category: "Telecommunications",
          department: "NHAI IT Projects",
          budget: 25000000,
          submissionDeadline: "2026-12-31T18:00:00.000Z",
        }),
      });

      assert.equal(createRes.status, 201);
      const body = (await createRes.json()) as ApiResponse<TenderDTO>;
      assert.equal(body.success, true);
      assert.ok(body.data.id);
      assert.equal(body.data.referenceNumber, uniqueRef);
      assert.equal(body.data.category, "Telecommunications");
      assert.equal(body.data.department, "NHAI IT Projects");
      assert.equal(body.data.status, "DRAFT");
      assert.ok(body.data.currentVersionId);
      assert.ok(body.data.currentVersion);
      assert.equal(body.data.currentVersion?.versionNumber, 1);
      assert.equal(body.data.currentVersion?.id, body.data.currentVersionId);
      assert.equal(body.data.currentVersion?.description, "Initial specification for optical fiber laying");
    });
  });

  describe("2. Historical Versioning & Immutability Integrity", () => {
    it("creates Version 2, updates currentVersionId, and leaves Version 1 byte/value unchanged", async () => {
      // 1. Create initial tender (V1)
      const uniqueRef = `TDR-P06-${Date.now()}-2`;
      const originalTitle = "Smart Highway Tolling Infra Phase 1";
      const originalDesc = "Specification Version 1 original description";
      const originalDeadline = "2026-11-15T18:00:00.000Z";

      const createRes = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: officerACookie,
        },
        body: JSON.stringify({
          title: originalTitle,
          referenceNumber: uniqueRef,
          description: originalDesc,
          submissionDeadline: originalDeadline,
          budget: 50000000,
        }),
      });
      assert.equal(createRes.status, 201);
      const tenderData = ((await createRes.json()) as ApiResponse<TenderDTO>).data;
      const tenderId = tenderData.id;
      const v1Id = tenderData.currentVersionId!;
      assert.ok(v1Id);

      // 2. Create Version 2 with modified content
      const v2Title = "Smart Highway Tolling Infra Phase 1 - Addendum A";
      const v2Desc = "Specification Version 2 updated with toll plaza expansions";
      const v2Deadline = "2026-12-15T18:00:00.000Z";

      const createV2Res = await fetch(`${baseUrl}/api/v1/tenders/${tenderId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: officerACookie,
        },
        body: JSON.stringify({
          title: v2Title,
          description: v2Desc,
          submissionDeadline: v2Deadline,
          budget: 65000000,
          changeSummary: "Extended submission deadline by 30 days and increased budget",
          expectedCurrentVersionId: v1Id,
        }),
      });
      assert.equal(createV2Res.status, 201);
      const v2Body = (await createV2Res.json()) as ApiResponse<{ tender: TenderDTO; version: TenderVersionDTO }>;
      assert.equal(v2Body.success, true);
      assert.equal(v2Body.data.version.versionNumber, 2);
      const v2Id = v2Body.data.version.id;
      assert.notEqual(v1Id, v2Id);
      assert.equal(v2Body.data.tender.currentVersionId, v2Id);

      // 3. CRITICAL HISTORICAL INTEGRITY CHECK: GET Version 1
      const getV1Res = await fetch(`${baseUrl}/api/v1/tenders/${tenderId}/versions/${v1Id}`, {
        headers: { Cookie: officerACookie },
      });
      assert.equal(getV1Res.status, 200);
      const v1Retrieved = ((await getV1Res.json()) as ApiResponse<TenderVersionDTO>).data;
      assert.equal(v1Retrieved.id, v1Id);
      assert.equal(v1Retrieved.versionNumber, 1);
      assert.equal(v1Retrieved.description, originalDesc);
      assert.equal(v1Retrieved.isCurrent, false); // V1 is no longer current

      // 4. GET Version 2
      const getV2Res = await fetch(`${baseUrl}/api/v1/tenders/${tenderId}/versions/${v2Id}`, {
        headers: { Cookie: officerACookie },
      });
      assert.equal(getV2Res.status, 200);
      const v2Retrieved = ((await getV2Res.json()) as ApiResponse<TenderVersionDTO>).data;
      assert.equal(v2Retrieved.id, v2Id);
      assert.equal(v2Retrieved.versionNumber, 2);
      assert.equal(v2Retrieved.title, v2Title);
      assert.equal(v2Retrieved.description, v2Desc);
      assert.equal(v2Retrieved.changeSummary, "Extended submission deadline by 30 days and increased budget");
      assert.equal(v2Retrieved.isCurrent, true); // V2 is current

      // 5. GET Canonical Tender
      const getTenderRes = await fetch(`${baseUrl}/api/v1/tenders/${tenderId}`, {
        headers: { Cookie: officerACookie },
      });
      assert.equal(getTenderRes.status, 200);
      const tenderRetrieved = ((await getTenderRes.json()) as ApiResponse<TenderDTO>).data;
      assert.equal(tenderRetrieved.currentVersionId, v2Id);
      assert.equal(tenderRetrieved.versionsCount, 2);

      // 6. List Versions: check deterministic ordering (v2 first, then v1)
      const listVersionsRes = await fetch(`${baseUrl}/api/v1/tenders/${tenderId}/versions`, {
        headers: { Cookie: officerACookie },
      });
      assert.equal(listVersionsRes.status, 200);
      const versionsList = ((await listVersionsRes.json()) as ApiResponse<TenderVersionDTO[]>).data;
      assert.equal(versionsList.length, 2);
      assert.equal(versionsList[0].versionNumber, 2);
      assert.equal(versionsList[0].isCurrent, true);
      assert.equal(versionsList[1].versionNumber, 1);
      assert.equal(versionsList[1].isCurrent, false);
    });
  });

  describe("3. Tenant Isolation & Cross-Tender Access Control", () => {
    it("Org B officer cannot access, update, or create versions for Org A tender", async () => {
      // 1. Create tender in Org A
      const uniqueRef = `TDR-P06-ISO-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: officerACookie,
        },
        body: JSON.stringify({
          title: "Confidential Highway Survey",
          referenceNumber: uniqueRef,
        }),
      });
      assert.equal(createRes.status, 201);
      const tenderA = ((await createRes.json()) as ApiResponse<TenderDTO>).data;
      const tenderAId = tenderA.id;
      const v1AId = tenderA.currentVersionId!;

      // 2. Org B attempts GET tender -> 404
      const getResB = await fetch(`${baseUrl}/api/v1/tenders/${tenderAId}`, {
        headers: { Cookie: officerBCookie },
      });
      assert.equal(getResB.status, 404);

      // 3. Org B attempts GET tender version -> 404
      const getVersionResB = await fetch(`${baseUrl}/api/v1/tenders/${tenderAId}/versions/${v1AId}`, {
        headers: { Cookie: officerBCookie },
      });
      assert.equal(getVersionResB.status, 404);

      // 4. Org B attempts to create version on Org A tender -> 404
      const createVersionResB = await fetch(`${baseUrl}/api/v1/tenders/${tenderAId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: officerBCookie,
        },
        body: JSON.stringify({
          description: "Malicious cross-tenant version injection",
        }),
      });
      assert.equal(createVersionResB.status, 404);
    });

    it("prevents cross-tender version association (version belonging to another tender returns 404)", async () => {
      // Create Tender 1 and Tender 2 under Org A
      const res1 = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({ title: "Tender One", referenceNumber: `TDR-CT1-${Date.now()}` }),
      });
      const tender1 = ((await res1.json()) as ApiResponse<TenderDTO>).data;

      const res2 = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({ title: "Tender Two", referenceNumber: `TDR-CT2-${Date.now()}` }),
      });
      const tender2 = ((await res2.json()) as ApiResponse<TenderDTO>).data;

      // Attempt to access Tender 2's version under Tender 1 ID
      const mismatchRes = await fetch(`${baseUrl}/api/v1/tenders/${tender1.id}/versions/${tender2.currentVersionId}`, {
        headers: { Cookie: officerACookie },
      });
      assert.equal(mismatchRes.status, 404);
    });
  });

  describe("4. RBAC Enforcement (Bidder vs Officer Boundary)", () => {
    it("bidder cannot create tender (returns 403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: bidderACookie,
        },
        body: JSON.stringify({
          title: "Unauthorized Bidder Tender",
          referenceNumber: `TDR-BIDDER-${Date.now()}`,
        }),
      });
      assert.equal(res.status, 403);
      const body = (await res.json()) as ApiErrorResponse;
      assert.equal(body.error.code, "FORBIDDEN");
    });

    it("bidder cannot create tender version (returns 403 Forbidden)", async () => {
      // Use existing seed tender
      const res = await fetch(`${baseUrl}/api/v1/tenders/00000000-0000-4000-a000-000000000021/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: bidderACookie,
        },
        body: JSON.stringify({
          description: "Unauthorized Bidder Version",
        }),
      });
      assert.equal(res.status, 403);
    });

    it("bidder cannot update tender metadata (returns 403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders/00000000-0000-4000-a000-000000000021`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: bidderACookie,
        },
        body: JSON.stringify({
          category: "Tampered Category",
        }),
      });
      assert.equal(res.status, 403);
    });

    it("bidder can read tenders list", async () => {
      const res = await fetch(`${baseUrl}/api/v1/tenders`, {
        headers: { Cookie: bidderACookie },
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as PaginatedResponse<TenderDTO>;
      assert.equal(body.success, true);
    });
  });

  describe("5. Lifecycle State Transitions", () => {
    it("transitions DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED; rejects invalid transitions", async () => {
      // 1. Create draft tender
      const uniqueRef = `TDR-LIFE-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({ title: "Lifecycle State Test Tender", referenceNumber: uniqueRef }),
      });
      const tender = ((await createRes.json()) as ApiResponse<TenderDTO>).data;
      assert.equal(tender.status, "DRAFT");

      // 2. Publish tender
      const pubRes = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/publish`, {
        method: "POST",
        headers: { Cookie: officerACookie },
      });
      assert.equal(pubRes.status, 200);
      const pubData = ((await pubRes.json()) as ApiResponse<TenderDTO>).data;
      assert.equal(pubData.status, "PUBLISHED");

      // 3. Close tender
      const closeRes = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/close`, {
        method: "POST",
        headers: { Cookie: officerACookie },
      });
      assert.equal(closeRes.status, 200);
      const closeData = ((await closeRes.json()) as ApiResponse<TenderDTO>).data;
      assert.equal(closeData.status, "CLOSED");

      // 4. Archive tender
      const archiveRes = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/archive`, {
        method: "POST",
        headers: { Cookie: officerACookie },
      });
      assert.equal(archiveRes.status, 200);
      const archiveData = ((await archiveRes.json()) as ApiResponse<TenderDTO>).data;
      assert.equal(archiveData.status, "ARCHIVED");

      // 5. Illegal transition: Cannot publish an archived tender
      const illegalPubRes = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/publish`, {
        method: "POST",
        headers: { Cookie: officerACookie },
      });
      assert.equal(illegalPubRes.status, 409);
      const errBody = (await illegalPubRes.json()) as ApiErrorResponse;
      assert.equal(errBody.error.code, "CONFLICT");
    });
  });

  describe("6. Concurrency Safety & Optimistic Concurrency", () => {
    it("rejects create version with 409 CONFLICT when expectedCurrentVersionId does not match", async () => {
      // 1. Create tender (V1)
      const uniqueRef = `TDR-OPT-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({ title: "Optimistic Concurrency Test", referenceNumber: uniqueRef }),
      });
      const tender = ((await createRes.json()) as ApiResponse<TenderDTO>).data;
      const v1Id = tender.currentVersionId!;

      // 2. Advance to V2
      await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({ description: "Version 2 update" }),
      });

      // 3. User attempts to create Version 3 expecting V1 as base
      const staleRes = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({
          description: "Stale Version 3 update based on V1",
          expectedCurrentVersionId: v1Id, // Stale! Current is already V2
        }),
      });

      assert.equal(staleRes.status, 409);
      const body = (await staleRes.json()) as ApiErrorResponse;
      assert.equal(body.error.code, "CONFLICT");
    });

    it("concurrent create-version requests execute safely without duplicate version numbers", async () => {
      const uniqueRef = `TDR-CONC-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/v1/tenders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: officerACookie },
        body: JSON.stringify({ title: "Concurrent Version Race Test", referenceNumber: uniqueRef }),
      });
      const tender = ((await createRes.json()) as ApiResponse<TenderDTO>).data;

      // Issue two simultaneous version creation requests
      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/v1/tenders/${tender.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: officerACookie },
          body: JSON.stringify({ description: "Concurrent Worker A" }),
        }),
        fetch(`${baseUrl}/api/v1/tenders/${tender.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: officerACookie },
          body: JSON.stringify({ description: "Concurrent Worker B" }),
        }),
      ]);

      assert.equal(res1.status, 201);
      assert.equal(res2.status, 201);

      // Verify all versions: must have unique version numbers 1, 2, 3
      const listRes = await fetch(`${baseUrl}/api/v1/tenders/${tender.id}/versions`, {
        headers: { Cookie: officerACookie },
      });
      const versions = ((await listRes.json()) as ApiResponse<TenderVersionDTO[]>).data;
      assert.equal(versions.length, 3);
      const versionNumbers = versions.map((v) => v.versionNumber).sort((a, b) => a - b);
      assert.deepEqual(versionNumbers, [1, 2, 3]);
    });
  });
});
