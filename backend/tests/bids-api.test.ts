import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from "../src/shared/types/api.types.js";
import type { BidDTO } from "../src/modules/bids/bid.types.js";

describe("Phase 03 — Persistent Bid Read API", () => {
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

  it("GET /api/v1/bids should return paginated list with bidder and tender metadata", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids?page=1&pageSize=10`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as PaginatedResponse<BidDTO>;
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.ok(body.meta.total >= 1);
    assert.ok(body.requestId.startsWith("req_"));

    const seedBid = body.data.find((b) => b.bidReference === "BID-2026-APEX-001");
    assert.ok(seedBid, "Seed bid must be returned");
    assert.equal(seedBid.status, "SUBMITTED");
    assert.equal(seedBid.bidder?.legalName, "Apex InfraTech Solutions Pvt Ltd");
    assert.equal(seedBid.tender?.referenceNumber, "TDR-2026-DEL-001");
  });

  it("GET /api/v1/bids/:id should return complete bid detail with documents", async () => {
    // First get the bid ID from list
    const listRes = await fetch(`${baseUrl}/api/v1/bids`);
    const listBody = (await listRes.json()) as PaginatedResponse<BidDTO>;
    const bidId = listBody.data[0].id;

    const res = await fetch(`${baseUrl}/api/v1/bids/${bidId}`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as ApiResponse<BidDTO>;
    assert.equal(body.success, true);
    assert.equal(body.data.id, bidId);
    assert.ok(body.data.bidder);
    assert.ok(body.data.tender);
    assert.ok(body.data.tenderVersion);
    assert.ok(Array.isArray(body.data.documents));
  });

  it("GET /api/v1/bids/:id should return 404 for nonexistent UUID", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/00000000-0000-4000-a000-999999999999`);
    assert.equal(res.status, 404);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("GET /api/v1/bids/:id should return 400 for malformed ID", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/invalid-id`);
    assert.equal(res.status, 400);

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

