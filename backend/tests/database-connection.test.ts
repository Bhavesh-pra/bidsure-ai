import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { config } from "../src/config/env.js";

describe("Phase 03.1 — Database Connectivity & Configuration", () => {
  it("should have DATABASE_URL configured in backend config", () => {
    assert.ok(config.databaseUrl, "DATABASE_URL must be configured");
    assert.match(config.databaseUrl, /^postgresql:\/\//i);
  });

  it("should connect to Neon PostgreSQL development database via Prisma and execute SELECT 1", async () => {
    const result = await prisma.$queryRaw<Array<{ test_connection: number }>>`SELECT 1 as test_connection;`;
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 1);
    assert.equal(result[0].test_connection, 1);
  });
});

