import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import crypto from "node:crypto";
import { createApp } from "../src/app/app.js";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { SEED_IDS } from "../prisma/seed.js";
import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from "../src/shared/types/api.types.js";
import type { BidDTO } from "../src/modules/bids/bid.types.js";

describe("Phase 07 — Authoritative Bidder & Bid Management Vertical Slice", () => {
  let server: Server;
  let baseUrl: string;
  let officerACookie: string;
  let officerBCookie: string;
  let bidderA1Cookie: string;
  let bidderA2Cookie: string;
  let bidderBCookie: string;
  let testTenderId: string;
  let testTenderVersion1Id: string;
  let testTenderVersion2Id: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Helper to log in and extract session cookie
    const login = async (email: string, password: string): Promise<string> => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(res.status, 200, `Login failed for ${email}`);
      const cookieHeader = res.headers.get("set-cookie");
      assert.ok(cookieHeader, `Missing cookie for ${email}`);
      return cookieHeader.split(";")[0]!;
    };

    officerACookie = await login("officer@nhai.bidsure.test", "Officer@123");
    officerBCookie = await login("officer@dfccil.bidsure.test", "Officer@123");
    bidderA1Cookie = await login("bidder@apexinfra.bidsure.test", "Bidder@123");
    bidderA2Cookie = await login("bidder2@skyline.bidsure.test", "Bidder@123");
    bidderBCookie = await login("bidder@bharatinfra.bidsure.test", "Bidder@123");

    // Create an isolated published tender with 2 versions for the lifecycle test suite
    const testTender = await prisma.tender.create({
      data: {
        organizationId: SEED_IDS.orgA,
        title: "Highway Video Management and Analytics System",
        referenceNumber: `TDR-TEST-${Date.now()}`,
        status: "PUBLISHED",
        versions: {
          create: [
            {
              versionNumber: 1,
              title: "Highway Video Management V1",
              status: "PUBLISHED",
              description: "V1 scope",
            },
            {
              versionNumber: 2,
              title: "Highway Video Management V2",
              status: "PUBLISHED",
              description: "V2 scope with advanced analytics",
            },
          ],
        },
      },
      include: { versions: { orderBy: { versionNumber: "asc" } } },
    });
    testTenderId = testTender.id;
    testTenderVersion1Id = testTender.versions[0]!.id;
    testTenderVersion2Id = testTender.versions[1]!.id;
    await prisma.tender.update({
      where: { id: testTenderId },
      data: { currentVersionId: testTenderVersion2Id },
    });
  });

  after(async () => {
    if (testTenderId) {
      await prisma.bid.deleteMany({ where: { tenderId: testTenderId } });
      await prisma.tenderVersion.deleteMany({ where: { tenderId: testTenderId } });
      await prisma.tender.deleteMany({ where: { id: testTenderId } });
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  let createdBidId: string;
  let createdBidReference: string;

  it("1. Bidder creates a new Bid strictly in DRAFT state (POST /api/v1/bids)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        tenderId: testTenderId,
        tenderVersionId: testTenderVersion2Id, // Version 2 of test tender
        totalAmount: 52000000.0,
        currency: "INR",
        metadata: {
          proposalNote: "Phase 07 integration test bid",
          executiveSummary: "Full ANPR and WIM hardware suite delivery.",
        },
      }),
    });

    const text = await res.text();
    assert.equal(res.status, 201, `Failed with: ${text}`);
    const body = JSON.parse(text) as ApiResponse<BidDTO>;
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.status, "DRAFT", "Initial status MUST be DRAFT");
    assert.equal(body.data.version, 1, "Initial optimistic concurrency version must be 1");
    assert.equal(body.data.tenderId, testTenderId);
    assert.equal(body.data.tenderVersionId, testTenderVersion2Id);
    assert.equal(body.data.totalAmount, 52000000);
    assert.equal(body.data.currency, "INR");
    assert.equal(body.data.submittedAt, null, "DRAFT bid submittedAt must be null");
    assert.ok(body.data.bidReference.startsWith("BID-"));

    createdBidId = body.data.id;
    createdBidReference = body.data.bidReference;
  });

  it("2. Bidder reads created Bid detail (GET /api/v1/bids/:id)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as ApiResponse<BidDTO>;
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdBidId);
    assert.equal(body.data.status, "DRAFT");
    assert.equal(body.data.tender?.id, testTenderId);
    assert.equal(body.data.tenderVersion?.id, testTenderVersion2Id);
    assert.equal(body.data.tenderVersion?.versionNumber, 2);
    assert.equal(body.data.bidder?.id, SEED_IDS.bidderRecordA1);
    assert.ok(body.data.metadata);
  });

  it("3. Bidder updates permitted DRAFT metadata (PATCH /api/v1/bids/:id)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        totalAmount: 51500000.0,
        metadata: {
          proposalNote: "Phase 07 updated draft proposal",
          executiveSummary: "Revised WIM sensor discount applied.",
        },
        expectedVersion: 1,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as ApiResponse<BidDTO>;
    assert.equal(body.success, true);
    assert.equal(body.data.totalAmount, 51500000);
    assert.equal(body.data.version, 2, "Version must increment to 2");
    assert.equal(body.data.status, "DRAFT", "Status must remain DRAFT after draft patch");
  });

  it("4. Status Tampering Rejected: Generic PATCH cannot mutate lifecycle state", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        status: "DECIDED",
      }),
    });

    assert.equal(res.status, 400, "Generic status patch must be rejected");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("5. TenderVersion Tampering Rejected: TenderVersion binding is immutable", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        tenderVersionId: SEED_IDS.tenderVersionA,
      }),
    });

    assert.equal(res.status, 400, "TenderVersion mutation must be rejected");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("6. Optimistic Concurrency Conflict: Stale expectedVersion produces 409 Conflict", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        totalAmount: 51000000.0,
        expectedVersion: 1, // Stale! Current version is 2
      }),
    });

    assert.equal(res.status, 409);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "BID_CONCURRENCY_CONFLICT");
  });

  it("7. Bidder explicitly submits DRAFT bid (POST /api/v1/bids/:id/submit)", async () => {
    const idempotencyKey = crypto.randomUUID();

    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}/submit`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Idempotency-Key": idempotencyKey,
      },
    });

    const text = await res.text();
    assert.equal(res.status, 200, `Submission failed: ${text}`);
    const body = JSON.parse(text) as ApiResponse<BidDTO>;
    assert.equal(body.success, true);
    assert.equal(body.data.status, "SUBMITTED", "Authoritative status must transition to SUBMITTED");
    assert.ok(body.data.submittedAt, "submittedAt timestamp must be set");
    assert.equal(body.data.version, 3, "Version must increment upon submission");
  });

  it("8. Submitted Bid is locked against draft modifications (PATCH /api/v1/bids/:id -> 409)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        totalAmount: 49000000.0,
      }),
    });

    assert.equal(res.status, 409);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "BID_NOT_EDITABLE");
  });

  it("9. Idempotent Submission: Repeated request with same Idempotency-Key returns stored result", async () => {
    const idempotencyKey = crypto.randomUUID();

    // Clean up any previous test bid on tenderA2 for bidderRecordA2
    await prisma.bid.deleteMany({
      where: {
        tenderId: SEED_IDS.tenderA2,
        bidderId: SEED_IDS.bidderRecordA2,
      },
    });

    // Create a fresh draft bid for idempotency testing on tenderA2
    const draftRes = await fetch(`${baseUrl}/api/v1/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA2Cookie,
      },
      body: JSON.stringify({
        tenderId: SEED_IDS.tenderA2,
        tenderVersionId: SEED_IDS.tenderVersionA2_1,
        totalAmount: 22000000.0,
      }),
    });
    assert.equal(draftRes.status, 201);
    const draftJson = (await draftRes.json()) as ApiResponse<BidDTO>;
    const bidId = draftJson.data.id;

    // First submit with idempotency key
    const sub1 = await fetch(`${baseUrl}/api/v1/bids/${bidId}/submit`, {
      method: "POST",
      headers: {
        Cookie: bidderA2Cookie,
        "Idempotency-Key": idempotencyKey,
      },
    });
    assert.equal(sub1.status, 200);
    const body1 = (await sub1.json()) as ApiResponse<BidDTO>;
    assert.equal(body1.data.status, "SUBMITTED");

    // Second submit with identical key (simulating retry / double click)
    const sub2 = await fetch(`${baseUrl}/api/v1/bids/${bidId}/submit`, {
      method: "POST",
      headers: {
        Cookie: bidderA2Cookie,
        "Idempotency-Key": idempotencyKey,
      },
    });
    assert.equal(sub2.status, 200, "Idempotent replay must return HTTP 200");
    const body2 = (await sub2.json()) as ApiResponse<BidDTO>;
    assert.equal(body2.data.id, body1.data.id);
    assert.equal(body2.data.status, "SUBMITTED");

    // Third submit without key or with a DIFFERENT key must fail with 409 Conflict (illegal state transition)
    const sub3 = await fetch(`${baseUrl}/api/v1/bids/${bidId}/submit`, {
      method: "POST",
      headers: {
        Cookie: bidderA2Cookie,
        "Idempotency-Key": crypto.randomUUID(), // Different key
      },
    });
    assert.equal(sub3.status, 409);
    const body3 = (await sub3.json()) as ApiErrorResponse;
    assert.equal(body3.error.code, "BID_INVALID_STATE_TRANSITION");
  });

  it("10. Concurrency Safety: Simultaneous submission requests yield exactly one transition", async () => {
    // We test with seed DRAFT bid (bidA_draft on tenderA2)
    const bidId = SEED_IDS.bidA_draft;

    // Ensure deterministic clean DRAFT state
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "DRAFT", submittedAt: null, version: 1 },
    });

    // Run 2 concurrent submission requests without idempotency key to test raw DB concurrency
    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl}/api/v1/bids/${bidId}/submit`, {
        method: "POST",
        headers: { Cookie: bidderA1Cookie },
      }),
      fetch(`${baseUrl}/api/v1/bids/${bidId}/submit`, {
        method: "POST",
        headers: { Cookie: bidderA1Cookie },
      }),
    ]);

    const statuses = [resA.status, resB.status];
    assert.ok(statuses.includes(200), "At least one concurrent submission must succeed");
    assert.ok(statuses.includes(409), "The conflicting concurrent submission must receive 409 Conflict");

    // Verify database state
    const check = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { status: true, submittedAt: true },
    });
    assert.equal(check?.status, "SUBMITTED");
    assert.ok(check?.submittedAt);
  });

  it("11. Historical TenderVersion Binding Invariant (Rule 4 & Test H)", async () => {
    // Seed Bid A1 was created against Tender Version 1 (tenderVersionA).
    // In seed.ts, Tender Version 2 (tenderVersionA2) was created and set as currentVersionId.
    const res = await fetch(`${baseUrl}/api/v1/bids/${SEED_IDS.bidA1}`, {
      headers: { Cookie: officerACookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as ApiResponse<BidDTO>;
    assert.equal(body.data.id, SEED_IDS.bidA1);
    assert.equal(
      body.data.tenderVersionId,
      SEED_IDS.tenderVersionA,
      "Bid A1 MUST remain bound to Tender Version 1 ID"
    );
    assert.equal(
      body.data.tenderVersion?.versionNumber,
      1,
      "Bid A1 MUST evaluate against Version 1, NOT the newer Version 2"
    );
  });

  it("12. Cross-Tenant Bid Access Denied (Test A): Org B Officer cannot access Org A's bid", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${SEED_IDS.bidA1}`, {
      headers: { Cookie: officerBCookie }, // Org B attempting to read Org A bid
    });

    assert.equal(res.status, 404, "Cross-tenant bid read must return 404 Not Found");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("13. Cross-Tenant Bid Creation Denied (Test B): Org B Bidder cannot create bid for Org A's tender", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderBCookie, // Org B bidder
      },
      body: JSON.stringify({
        tenderId: SEED_IDS.tenderA, // Org A tender
        tenderVersionId: SEED_IDS.tenderVersionA,
        totalAmount: 10000000.0,
      }),
    });

    assert.equal(res.status, 403, "Cross-tenant bid creation must return 403 Forbidden");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "CROSS_TENANT_ACCESS_DENIED");
  });

  it("14. Bidder Impersonation Denied (Test C): Bidder cannot create or submit on behalf of another entity", async () => {
    // Attempt to create bid with someone else's bidderId
    const res = await fetch(`${baseUrl}/api/v1/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        tenderId: SEED_IDS.tenderA,
        tenderVersionId: SEED_IDS.tenderVersionA,
        bidderId: SEED_IDS.bidderRecordA2, // Someone else's bidder ID!
      }),
    });

    assert.equal(res.status, 403);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "BIDDER_IMPERSONATION_FORBIDDEN");
  });

  it("15. Cross-Tender Version Mismatch Denied: tenderVersionId must belong to tenderId", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderA1Cookie,
      },
      body: JSON.stringify({
        tenderId: SEED_IDS.tenderA, // Tender A
        tenderVersionId: SEED_IDS.tenderVersionB, // Version belonging to Tender B!
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });

  it("16. Procurement Officer views authorized submitted bids and inspections", async () => {
    // List bids
    const listRes = await fetch(`${baseUrl}/api/v1/bids?page=1&pageSize=10`, {
      headers: { Cookie: officerACookie },
    });
    assert.equal(listRes.status, 200);
    const listJson = (await listRes.json()) as PaginatedResponse<BidDTO>;
    assert.equal(listJson.success, true);
    assert.ok(listJson.data.length >= 2);

    const found = listJson.data.find((b) => b.id === createdBidId);
    assert.ok(found, "Submitted bid must be listed for procurement officer");
    assert.equal(found.status, "SUBMITTED");
    assert.ok(found.bidder?.legalName);
    assert.equal(found.tenderVersion?.versionNumber, 2);

    // Get bid detail
    const detailRes = await fetch(`${baseUrl}/api/v1/bids/${createdBidId}`, {
      headers: { Cookie: officerACookie },
    });
    assert.equal(detailRes.status, 200);
    const detailJson = (await detailRes.json()) as ApiResponse<BidDTO>;
    assert.equal(detailJson.data.status, "SUBMITTED");
    assert.equal(detailJson.data.tender?.id, testTenderId);
    assert.equal(detailJson.data.tenderVersion?.versionNumber, 2);
  });
});
