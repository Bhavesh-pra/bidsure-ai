import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { tenderRepository } from "../src/modules/tenders/tender.repository.js";
import { bidService } from "../src/modules/bids/bid.service.js";
import { ValidationError, NotFoundError } from "../src/shared/errors/app-error.js";
import type { TenantContext } from "../src/modules/bids/bid.types.js";

describe("Phase 07 Invariant — Bid.tenderVersionId MUST belong to Bid.tenderId", () => {
  let tenantA: TenantContext;
  let tenantB: TenantContext;
  let tenderA: { id: string; currentVersionId: string | null };
  let tenderB: { id: string; currentVersionId: string | null };
  let tenderAVersionId: string;
  let tenderBVersionId: string;

  before(async () => {
    // 1. Fetch seed organizations
    const orgs = await prisma.organization.findMany({ take: 2 });
    assert.ok(orgs.length >= 2, "Need at least 2 organizations for test");

    tenantA = {
      organizationId: orgs[0].id,
      userId: "00000000-0000-4000-a000-000000000001",
      role: "PROCUREMENT_OFFICER",
    };

    tenantB = {
      organizationId: orgs[1].id,
      userId: "00000000-0000-4000-a000-000000000002",
      role: "PROCUREMENT_OFFICER",
    };

    // 2. Create Tender A (under Tenant A)
    tenderA = await tenderRepository.createWithInitialVersion({
      organizationId: tenantA.organizationId,
      title: `Invariant Test Tender A ${Date.now()}`,
      referenceNumber: `INV-TDR-A-${Date.now()}`,
      description: "Test tender A for invariant check",
      budget: 10000000,
    });
    tenderAVersionId = tenderA.currentVersionId!;

    // 3. Create Tender B (under Tenant B)
    tenderB = await tenderRepository.createWithInitialVersion({
      organizationId: tenantB.organizationId,
      title: `Invariant Test Tender B ${Date.now()}`,
      referenceNumber: `INV-TDR-B-${Date.now()}`,
      description: "Test tender B for invariant check",
      budget: 20000000,
    });
    tenderBVersionId = tenderB.currentVersionId!;
  });

  after(async () => {
    // Clean up test tenders
    if (tenderA?.id) {
      await prisma.tenderVersion.deleteMany({ where: { tenderId: tenderA.id } });
      await prisma.tender.deleteMany({ where: { id: tenderA.id } });
    }
    if (tenderB?.id) {
      await prisma.tenderVersion.deleteMany({ where: { tenderId: tenderB.id } });
      await prisma.tender.deleteMany({ where: { id: tenderB.id } });
    }
  });

  it("1. SUCCEEDS when tenderVersionId belongs to tenderId", async () => {
    const result = await bidService.validateBidTenderVersionBelongsToTender(
      tenderA.id,
      tenderAVersionId,
      tenantA
    );

    assert.equal(result.tenderId, tenderA.id);
    assert.equal(result.tenderVersionId, tenderAVersionId);
    assert.equal(result.versionNumber, 1);
  });

  it("2. FAILS with ValidationError when tenderVersion belongs to a different Tender", async () => {
    // Attempt to validate Tender A with Tender B's version ID
    await assert.rejects(
      async () => {
        await bidService.validateBidTenderVersionBelongsToTender(
          tenderA.id,
          tenderBVersionId // <-- Belongs to Tender B, not Tender A!
        );
      },
      (err: unknown) => {
        assert.ok(err instanceof ValidationError, `Expected ValidationError, got: ${err}`);
        assert.equal(err.code, "VALIDATION_ERROR");
        assert.ok(
          err.message.includes("Cross-tender version violation"),
          `Expected message to explain cross-tender violation, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("3. FAILS with NotFoundError when tenderId does not exist", async () => {
    await assert.rejects(
      async () => {
        await bidService.validateBidTenderVersionBelongsToTender(
          "00000000-0000-4000-a000-999999999999",
          tenderAVersionId
        );
      },
      (err: unknown) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      }
    );
  });

  it("4. FAILS with NotFoundError when tenderVersionId does not exist", async () => {
    await assert.rejects(
      async () => {
        await bidService.validateBidTenderVersionBelongsToTender(
          tenderA.id,
          "00000000-0000-4000-a000-999999999999"
        );
      },
      (err: unknown) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      }
    );
  });

  it("5. FAILS with NotFoundError when tenant context does not match tender organization", async () => {
    // Tenant B attempting to validate Tender A
    await assert.rejects(
      async () => {
        await bidService.validateBidTenderVersionBelongsToTender(
          tenderA.id,
          tenderAVersionId,
          tenantB // <-- Tenant B does not own Tender A
        );
      },
      (err: unknown) => {
        assert.ok(err instanceof NotFoundError);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      }
    );
  });
});
