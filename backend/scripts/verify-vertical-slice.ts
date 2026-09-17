import { prisma } from "../src/infrastructure/database/prisma.js";
import { tenderService } from "../src/modules/tenders/tender.service.js";
import { bidService } from "../src/modules/bids/bid.service.js";

async function verifyVerticalSlice() {
  console.log("=================================================");
  console.log("BIDSURE PHASE 03 — VERTICAL SLICE VERIFICATION");
  console.log("=================================================");

  // 1. Check raw database connection
  console.log("\n[1/6] Verifying Neon PostgreSQL connection...");
  const rawCheck = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected;`;
  if (!rawCheck || rawCheck[0]?.connected !== 1) {
    throw new Error("Failed raw query check");
  }
  console.log("✓ Neon PostgreSQL connection established via Prisma.");

  // 2. Verify organizations and users
  console.log("\n[2/6] Verifying Organizations and Users...");
  const orgs = await prisma.organization.findMany();
  const users = await prisma.user.findMany();
  console.log(`✓ Found ${orgs.length} organization(s): ${orgs.map((o) => o.name).join(", ")}`);
  console.log(`✓ Found ${users.length} seeded user(s) with roles: ${users.map((u) => `${u.email} (${u.role})`).join("; ")}`);

  // 3. Verify seeded Tenders and Requirements
  console.log("\n[3/6] Verifying Tenders and Requirements hierarchy...");
  const tendersResponse = await tenderService.listTenders(
    { page: 1, pageSize: 10 },
    { organizationId: orgs[0]!.id }
  );
  console.log(`✓ Found ${tendersResponse.meta.total} tender(s) in repository.`);
  for (const t of tendersResponse.items) {
    const detail = await tenderService.getTenderById(t.id);
    console.log(`  - Tender [${t.referenceNumber}] "${t.title}" (Status: ${t.status})`);
    console.log(`    Current Version: v${detail?.currentVersion?.versionNumber} with ${detail?.currentVersion?.requirements?.length ?? 0} requirement(s)`);
  }

  // 4. Verify seeded Bids and Documents
  console.log("\n[4/6] Verifying Bids and Documents hierarchy...");
  const bidsResponse = await bidService.listBids(
    { page: 1, pageSize: 10 },
    { organizationId: orgs[0]!.id }
  );
  console.log(`✓ Found ${bidsResponse.meta.total} bid(s) in repository.`);
  for (const b of bidsResponse.items) {
    const detail = await bidService.getBidById(b.id);
    console.log(`  - Bid [${b.bidReference}] from Bidder "${detail?.bidder?.legalName}" (Status: ${b.status}, Amount: ${b.totalAmount} ${b.currency})`);
    console.log(`    Attached documents: ${detail?.documents?.length ?? 0} document(s)`);
  }

  // 5. Create new persistent Tender to test write-path & persistence
  console.log("\n[5/6] Testing write path: creating new persistent Tender in Neon...");
  const testRef = `VERIFY-${Date.now()}`;
  const createdTender = await tenderService.createTender({
    title: "Autonomous Highway Surveillance Grid",
    referenceNumber: testRef,
    description: "Multi-sensor highway perimeter surveillance with automated compliance audit.",
    organizationId: orgs[0]!.id,
  });
  console.log(`✓ Created new Tender in Neon PostgreSQL (ID: ${createdTender.id}, Ref: ${createdTender.referenceNumber})`);

  // Read back directly to verify persistence
  const readBack = await prisma.tender.findUnique({
    where: { id: createdTender.id },
    include: { versions: true },
  });
  if (!readBack) {
    throw new Error("Created tender not found on read back!");
  }
  console.log(`✓ Read back confirmed from Neon DB: "${readBack.title}" (Versions: ${readBack.versions.length})`);

  // 6. Clean up verification tenders to keep seed state clean
  console.log("\n[6/6] Cleaning up verification tenders...");
  const testTenders = await prisma.tender.findMany({
    where: { title: "Autonomous Highway Surveillance Grid" },
  });
  for (const tt of testTenders) {
    await prisma.tender.update({
      where: { id: tt.id },
      data: { currentVersionId: null },
    });
    await prisma.tenderVersion.deleteMany({
      where: { tenderId: tt.id },
    });
    await prisma.tender.delete({
      where: { id: tt.id },
    });
  }
  console.log(`✓ Cleaned up ${testTenders.length} test tender(s), seed integrity preserved.`);

  console.log("\n=================================================");
  console.log("VERTICAL SLICE VERIFICATION COMPLETE: ALL CHECKS PASSED");
  console.log("=================================================");
}

verifyVerticalSlice()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
