import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import type { ApiResponse, HealthData, ApiErrorResponse } from "../src/shared/types/api.types.js";

describe("Health API & Foundation Middleware", () => {
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

  it("should return 200 with standard health envelope", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const headerReqId = res.headers.get("x-request-id");
    assert.ok(headerReqId, "x-request-id header should be present");
    assert.match(headerReqId, /^req_[0-9a-f-]{36}$/i);

    const body = (await res.json()) as ApiResponse<HealthData>;
    assert.equal(body.success, true);
    assert.equal(body.data.status, "ok");
    assert.equal(body.data.service, "bidsure-api");
    assert.equal(body.data.version, "1.0.0");
    assert.equal(body.requestId, headerReqId);
  });

  it("should return standard error envelope for unknown routes (404)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    assert.equal(res.status, 404);

    const headerReqId = res.headers.get("x-request-id");
    assert.ok(headerReqId, "x-request-id header should be present on 404");

    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
    assert.ok(body.error.message.includes("not found"));
    assert.equal(body.requestId, headerReqId);
  });
});
