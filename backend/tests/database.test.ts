import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/infrastructure/database/prisma.js";

describe("Phase 03 — Domain Model & Relational Database Integrity", () => {
  it("should have seeded organization with valid status and timestamps", async () => {
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { id: "00000000-0000-4000-a000-000000000001" },
          { name: "Demo Procurement Authority" },
        ],
      },
    });
    assert.ok(org, "Organization must exist");
    assert.equal(org.status, "ACTIVE");
    assert.ok(org.createdAt instanceof Date);
    assert.ok(org.updatedAt instanceof Date);
  });

  it("should have seeded users with correct roles associated with organization", async () => {
    const users = await prisma.user.findMany({
      orderBy: { email: "asc" },
    });
    assert.ok(users.length >= 3, "At least 3 seed users must exist");

    const officer = users.find((u) => u.email === "officer@bidsure.demo");
    assert.ok(officer, "Officer must exist");
    assert.equal(officer.role, "PROCUREMENT_OFFICER");

    const reviewer = users.find((u) => u.email === "reviewer@bidsure.demo");
    assert.ok(reviewer, "Reviewer must exist");
    assert.equal(reviewer.role, "REVIEWER");

    const bidderUser = users.find((u) => u.email === "bidder@bidsure.demo");
    assert.ok(bidderUser, "Bidder user must exist");
    assert.equal(bidderUser.role, "BIDDER");
  });

  it("should enforce Tender -> TenderVersion -> Requirements relational hierarchy", async () => {
    const tender = await prisma.tender.findFirst({
      where: { referenceNumber: "TDR-2026-DEL-001" },
      include: {
        versions: {
          include: {
            requirements: {
              include: {
                versions: true,
              },
            },
          },
        },
      },
    });

    assert.ok(tender, "Seed tender must exist");
    assert.equal(tender.referenceNumber, "TDR-2026-DEL-001");
    assert.ok(tender.versions.length >= 1);

    const v1 = tender.versions.find((v) => v.versionNumber === 1);
    assert.ok(v1, "Version 1 must exist");
    assert.equal(v1.versionNumber, 1);
    assert.ok(v1.requirements.length >= 4, "Must have 4 seeded requirements");

    const mandatoryReqs = v1.requirements.filter(
      (r) => r.versions[0]?.mandatory === true
    );
    assert.equal(mandatoryReqs.length, 3);
  });

  it("should link Bid to specific TenderVersion and Bidder", async () => {
    const bid = await prisma.bid.findFirst({
      where: { bidReference: "BID-2026-APEX-001" },
      include: {
        bidder: true,
        tender: true,
        tenderVersion: true,
        bidDocuments: {
          include: {
            document: true,
          },
        },
      },
    });

    assert.ok(bid, "Seed bid must exist");
    assert.equal(bid.status, "SUBMITTED");
    assert.ok(
      bid.bidder.legalName.includes("Apex InfraTech Solutions"),
      "Bidder legalName must match Apex InfraTech Solutions"
    );
    assert.equal(bid.tender.referenceNumber, "TDR-2026-DEL-001");
    assert.equal(bid.tenderVersion.versionNumber, 1);
    assert.equal(bid.bidDocuments.length, 1);
    assert.equal(bid.bidDocuments[0].document.fileName, "Apex_Technical_Proposal_v1.pdf");
  });
});

