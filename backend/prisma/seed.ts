import {
  PrismaClient,
  Role,
  OrganizationStatus,
  UserStatus,
  TenderStatus,
  TenderVersionStatus,
  BidStatus,
  DocumentProcessingStatus,
} from "@prisma/client";
import { passwordService } from "../src/shared/auth/password.service.js";

const prisma = new PrismaClient();

export const SEED_IDS = {
  // Organizations
  orgA: "00000000-0000-4000-a000-000000000001",
  orgB: "00000000-0000-4000-a000-000000000002",

  // ORG-A Synthetic Users
  officerA: "00000000-0000-4000-a000-000000000011",
  reviewerA: "00000000-0000-4000-a000-000000000012",
  bidderA1: "00000000-0000-4000-a000-000000000013",
  bidderA2: "00000000-0000-4000-a000-000000000014",
  auditorA: "00000000-0000-4000-a000-000000000015",
  adminA: "00000000-0000-4000-a000-000000000016",
  suspendedA: "00000000-0000-4000-a000-000000000017",

  // Backward compatibility demo users
  demoOfficer: "00000000-0000-4000-a000-000000000018",
  demoReviewer: "00000000-0000-4000-a000-000000000019",
  demoBidder: "00000000-0000-4000-a000-00000000001a",

  // ORG-B Synthetic Users
  officerB: "00000000-0000-4000-a000-000000000081",
  bidderB: "00000000-0000-4000-a000-000000000082",

  // ORG-A Resources
  tenderA: "00000000-0000-4000-a000-000000000021",
  tenderVersionA: "00000000-0000-4000-a000-000000000022",
  req1: "00000000-0000-4000-a000-000000000031",
  req2: "00000000-0000-4000-a000-000000000032",
  req3: "00000000-0000-4000-a000-000000000033",
  req4: "00000000-0000-4000-a000-000000000034",
  bidderRecordA1: "00000000-0000-4000-a000-000000000041",
  bidderRecordA2: "00000000-0000-4000-a000-000000000042",
  bidA1: "00000000-0000-4000-a000-000000000051",
  bidA2: "00000000-0000-4000-a000-000000000052",
  documentA: "00000000-0000-4000-a000-000000000061",
  bidDocumentA: "00000000-0000-4000-a000-000000000071",

  // ORG-B Resources
  tenderB: "00000000-0000-4000-a000-000000000091",
  tenderVersionB: "00000000-0000-4000-a000-000000000092",
  bidderRecordB: "00000000-0000-4000-a000-000000000093",
  bidB: "00000000-0000-4000-a000-000000000094",
  documentB: "00000000-0000-4000-a000-000000000095",
  bidDocumentB: "00000000-0000-4000-a000-000000000096",
};

export async function seed() {
  console.log("[BidSure Seed] Starting deterministic multi-tenant database seeding...");

  // Pre-hash development passwords
  const passwordOfficer = await passwordService.hashPassword("Officer@123");
  const passwordBidder = await passwordService.hashPassword("Bidder@123");
  const passwordReviewer = await passwordService.hashPassword("Reviewer@123");
  const passwordAuditor = await passwordService.hashPassword("Auditor@123");
  const passwordAdmin = await passwordService.hashPassword("Admin@123");
  const passwordSuspended = await passwordService.hashPassword("Suspended@123");
  const passwordLegacyDemo = await passwordService.hashPassword("password123");

  // =========================================================================
  // 1. ORGANIZATIONS (ORG-A & ORG-B)
  // =========================================================================
  const orgA = await prisma.organization.upsert({
    where: { id: SEED_IDS.orgA },
    update: {
      name: "National Highway Authority (Synthetic Demo Org A)",
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      id: SEED_IDS.orgA,
      name: "National Highway Authority (Synthetic Demo Org A)",
      status: OrganizationStatus.ACTIVE,
    },
  });

  const orgB = await prisma.organization.upsert({
    where: { id: SEED_IDS.orgB },
    update: {
      name: "Dedicated Freight Corridor (Synthetic Demo Org B)",
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      id: SEED_IDS.orgB,
      name: "Dedicated Freight Corridor (Synthetic Demo Org B)",
      status: OrganizationStatus.ACTIVE,
    },
  });

  // =========================================================================
  // 2. BIDDER PROFILES
  // =========================================================================
  // Bidder A1 (ORG-A)
  const bidderA1 = await prisma.bidder.upsert({
    where: { id: SEED_IDS.bidderRecordA1 },
    update: {
      legalName: "Apex InfraTech Solutions (Synthetic) Pvt Ltd",
      tradeName: "Apex InfraTech",
      contactEmail: "bidder@apexinfra.bidsure.test",
      contactPhone: "+91-9876543210",
      organizationId: orgA.id,
    },
    create: {
      id: SEED_IDS.bidderRecordA1,
      organizationId: orgA.id,
      legalName: "Apex InfraTech Solutions (Synthetic) Pvt Ltd",
      tradeName: "Apex InfraTech",
      contactEmail: "bidder@apexinfra.bidsure.test",
      contactPhone: "+91-9876543210",
    },
  });

  // Bidder A2 (ORG-A, distinct competitor)
  const bidderA2 = await prisma.bidder.upsert({
    where: { id: SEED_IDS.bidderRecordA2 },
    update: {
      legalName: "Skyline Engineering (Synthetic) Ltd",
      tradeName: "Skyline Infra",
      contactEmail: "bidder2@skyline.bidsure.test",
      contactPhone: "+91-9876543222",
      organizationId: orgA.id,
    },
    create: {
      id: SEED_IDS.bidderRecordA2,
      organizationId: orgA.id,
      legalName: "Skyline Engineering (Synthetic) Ltd",
      tradeName: "Skyline Infra",
      contactEmail: "bidder2@skyline.bidsure.test",
      contactPhone: "+91-9876543222",
    },
  });

  // Bidder B (ORG-B)
  const bidderB = await prisma.bidder.upsert({
    where: { id: SEED_IDS.bidderRecordB },
    update: {
      legalName: "Bharat Heavy Rail (Synthetic) Corporation",
      tradeName: "Bharat Rail",
      contactEmail: "bidder@bharatinfra.bidsure.test",
      contactPhone: "+91-9876543333",
      organizationId: orgB.id,
    },
    create: {
      id: SEED_IDS.bidderRecordB,
      organizationId: orgB.id,
      legalName: "Bharat Heavy Rail (Synthetic) Corporation",
      tradeName: "Bharat Rail",
      contactEmail: "bidder@bharatinfra.bidsure.test",
      contactPhone: "+91-9876543333",
    },
  });

  // =========================================================================
  // 3. SYNTHETIC USERS
  // =========================================================================
  // ORG-A Users
  await prisma.user.upsert({
    where: { email: "officer@nhai.bidsure.test" },
    update: {
      name: "Rajesh Sharma (Officer)",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordOfficer,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Rajesh Sharma (Officer)",
      email: "officer@nhai.bidsure.test",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordOfficer,
    },
  });

  await prisma.user.upsert({
    where: { email: "bidder@apexinfra.bidsure.test" },
    update: {
      name: "Amit Verma (Bidder A1)",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordBidder,
      organizationId: orgA.id,
      bidderId: bidderA1.id,
    },
    create: {
      organizationId: orgA.id,
      bidderId: bidderA1.id,
      name: "Amit Verma (Bidder A1)",
      email: "bidder@apexinfra.bidsure.test",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordBidder,
    },
  });

  await prisma.user.upsert({
    where: { email: "bidder2@skyline.bidsure.test" },
    update: {
      name: "Vikram Mehta (Bidder A2)",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordBidder,
      organizationId: orgA.id,
      bidderId: bidderA2.id,
    },
    create: {
      organizationId: orgA.id,
      bidderId: bidderA2.id,
      name: "Vikram Mehta (Bidder A2)",
      email: "bidder2@skyline.bidsure.test",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordBidder,
    },
  });

  await prisma.user.upsert({
    where: { email: "reviewer@nhai.bidsure.test" },
    update: {
      name: "Priya Patel (Reviewer)",
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordReviewer,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Priya Patel (Reviewer)",
      email: "reviewer@nhai.bidsure.test",
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordReviewer,
    },
  });

  await prisma.user.upsert({
    where: { email: "auditor@nhai.bidsure.test" },
    update: {
      name: "Sunil Rao (Auditor)",
      role: Role.AUDITOR,
      status: UserStatus.ACTIVE,
      passwordHash: passwordAuditor,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Sunil Rao (Auditor)",
      email: "auditor@nhai.bidsure.test",
      role: Role.AUDITOR,
      status: UserStatus.ACTIVE,
      passwordHash: passwordAuditor,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@nhai.bidsure.test" },
    update: {
      name: "Kavita Reddy (Admin)",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: passwordAdmin,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Kavita Reddy (Admin)",
      email: "admin@nhai.bidsure.test",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: passwordAdmin,
    },
  });

  await prisma.user.upsert({
    where: { email: "suspended@nhai.bidsure.test" },
    update: {
      name: "Suspended Officer",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.SUSPENDED,
      passwordHash: passwordSuspended,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Suspended Officer",
      email: "suspended@nhai.bidsure.test",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.SUSPENDED,
      passwordHash: passwordSuspended,
    },
  });

  // Backward-compatible demo accounts
  await prisma.user.upsert({
    where: { email: "officer@bidsure.demo" },
    update: {
      name: "Demo Officer",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordLegacyDemo,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Demo Officer",
      email: "officer@bidsure.demo",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordLegacyDemo,
    },
  });

  await prisma.user.upsert({
    where: { email: "reviewer@bidsure.demo" },
    update: {
      name: "Demo Reviewer",
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordLegacyDemo,
      organizationId: orgA.id,
    },
    create: {
      organizationId: orgA.id,
      name: "Demo Reviewer",
      email: "reviewer@bidsure.demo",
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordLegacyDemo,
    },
  });

  await prisma.user.upsert({
    where: { email: "bidder@bidsure.demo" },
    update: {
      name: "Demo Bidder",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordLegacyDemo,
      organizationId: orgA.id,
      bidderId: bidderA1.id,
    },
    create: {
      organizationId: orgA.id,
      bidderId: bidderA1.id,
      name: "Demo Bidder",
      email: "bidder@bidsure.demo",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordLegacyDemo,
    },
  });

  // ORG-B Users
  await prisma.user.upsert({
    where: { email: "officer@dfccil.bidsure.test" },
    update: {
      name: "Alok Gupta (Officer B)",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordOfficer,
      organizationId: orgB.id,
    },
    create: {
      organizationId: orgB.id,
      name: "Alok Gupta (Officer B)",
      email: "officer@dfccil.bidsure.test",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordOfficer,
    },
  });

  await prisma.user.upsert({
    where: { email: "bidder@bharatinfra.bidsure.test" },
    update: {
      name: "Manoj Tiwari (Bidder B)",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordBidder,
      organizationId: orgB.id,
      bidderId: bidderB.id,
    },
    create: {
      organizationId: orgB.id,
      bidderId: bidderB.id,
      name: "Manoj Tiwari (Bidder B)",
      email: "bidder@bharatinfra.bidsure.test",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      passwordHash: passwordBidder,
    },
  });

  // =========================================================================
  // 4. ORG-A TENDER & REQUIREMENTS
  // =========================================================================
  const tenderA = await prisma.tender.upsert({
    where: { id: SEED_IDS.tenderA },
    update: {
      title: "Automated Toll Plaza Management & Highway Surveillance System",
      referenceNumber: "TDR-2026-DEL-001",
      status: TenderStatus.PUBLISHED,
      organizationId: orgA.id,
      currentVersionId: SEED_IDS.tenderVersionA,
    },
    create: {
      id: SEED_IDS.tenderA,
      organizationId: orgA.id,
      title: "Automated Toll Plaza Management & Highway Surveillance System",
      referenceNumber: "TDR-2026-DEL-001",
      status: TenderStatus.PUBLISHED,
      currentVersionId: SEED_IDS.tenderVersionA,
    },
  });

  const tenderVersionA = await prisma.tenderVersion.upsert({
    where: { id: SEED_IDS.tenderVersionA },
    update: {
      versionNumber: 1,
      title: "Automated Toll Plaza Management & Highway Surveillance System - Initial Release",
      description: "Procurement for AI-driven ANPR cameras and corridor surveillance.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 50000000,
        submissionDeadline: "2026-10-31T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
      },
      tenderId: tenderA.id,
    },
    create: {
      id: SEED_IDS.tenderVersionA,
      tenderId: tenderA.id,
      versionNumber: 1,
      title: "Automated Toll Plaza Management & Highway Surveillance System - Initial Release",
      description: "Procurement for AI-driven ANPR cameras and corridor surveillance.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 50000000,
        submissionDeadline: "2026-10-31T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
      },
    },
  });

  const reqData = [
    {
      reqId: SEED_IDS.req1,
      identifier: "REQ-TECH-001",
      category: "TECHNICAL",
      versionNumber: 1,
      description: "Automated Number Plate Recognition (ANPR) cameras with 99.5% accuracy.",
      mandatory: true,
    },
    {
      reqId: SEED_IDS.req2,
      identifier: "REQ-FIN-001",
      category: "FINANCIAL",
      versionNumber: 1,
      description: "Average annual turnover of at least ₹50 Crore over last 3 financial years.",
      mandatory: true,
    },
    {
      reqId: SEED_IDS.req3,
      identifier: "REQ-STAT-001",
      category: "STATUTORY",
      versionNumber: 1,
      description: "Valid ISO 27001 certification and GST registration.",
      mandatory: true,
    },
  ];

  for (const item of reqData) {
    const req = await prisma.requirement.upsert({
      where: { id: item.reqId },
      update: {
        identifier: item.identifier,
        category: item.category,
        tenderVersionId: tenderVersionA.id,
      },
      create: {
        id: item.reqId,
        tenderVersionId: tenderVersionA.id,
        identifier: item.identifier,
        category: item.category,
      },
    });

    await prisma.requirementVersion.upsert({
      where: {
        requirementId_versionNumber: {
          requirementId: req.id,
          versionNumber: item.versionNumber,
        },
      },
      update: {
        description: item.description,
        mandatory: item.mandatory,
      },
      create: {
        requirementId: req.id,
        versionNumber: item.versionNumber,
        description: item.description,
        mandatory: item.mandatory,
      },
    });
  }

  // =========================================================================
  // 5. ORG-A BIDS (A1 and A2)
  // =========================================================================
  const bidA1 = await prisma.bid.upsert({
    where: { id: SEED_IDS.bidA1 },
    update: {
      organizationId: orgA.id,
      tenderId: tenderA.id,
      tenderVersionId: tenderVersionA.id,
      bidderId: bidderA1.id,
      bidReference: "BID-2026-APEX-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 42500000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-15T10:30:00Z"),
    },
    create: {
      id: SEED_IDS.bidA1,
      organizationId: orgA.id,
      tenderId: tenderA.id,
      tenderVersionId: tenderVersionA.id,
      bidderId: bidderA1.id,
      bidReference: "BID-2026-APEX-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 42500000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-15T10:30:00Z"),
    },
  });

  await prisma.bid.upsert({
    where: { id: SEED_IDS.bidA2 },
    update: {
      organizationId: orgA.id,
      tenderId: tenderA.id,
      tenderVersionId: tenderVersionA.id,
      bidderId: bidderA2.id,
      bidReference: "BID-2026-SKY-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 44000000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-16T11:00:00Z"),
    },
    create: {
      id: SEED_IDS.bidA2,
      organizationId: orgA.id,
      tenderId: tenderA.id,
      tenderVersionId: tenderVersionA.id,
      bidderId: bidderA2.id,
      bidReference: "BID-2026-SKY-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 44000000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-16T11:00:00Z"),
    },
  });

  const docA = await prisma.document.upsert({
    where: { id: SEED_IDS.documentA },
    update: {
      organizationId: orgA.id,
      storageKey: "documents/demo/apex_technical_v1.pdf",
      fileName: "Apex_Technical_Proposal_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 2457600,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      processingStatus: DocumentProcessingStatus.PROCESSED,
    },
    create: {
      id: SEED_IDS.documentA,
      organizationId: orgA.id,
      storageKey: "documents/demo/apex_technical_v1.pdf",
      fileName: "Apex_Technical_Proposal_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 2457600,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      processingStatus: DocumentProcessingStatus.PROCESSED,
    },
  });

  await prisma.bidDocument.upsert({
    where: { id: SEED_IDS.bidDocumentA },
    update: {
      bidId: bidA1.id,
      documentId: docA.id,
      category: "TECHNICAL_PROPOSAL",
      required: true,
    },
    create: {
      id: SEED_IDS.bidDocumentA,
      bidId: bidA1.id,
      documentId: docA.id,
      category: "TECHNICAL_PROPOSAL",
      required: true,
    },
  });

  // =========================================================================
  // 6. ORG-B TENDER & BID (FOR CROSS-TENANT ISOLATION TESTS)
  // =========================================================================
  const tenderB = await prisma.tender.upsert({
    where: { id: SEED_IDS.tenderB },
    update: {
      title: "Heavy Rail Signalling and Electrification Infrastructure",
      referenceNumber: "TDR-2026-DFCC-001",
      status: TenderStatus.PUBLISHED,
      organizationId: orgB.id,
      currentVersionId: SEED_IDS.tenderVersionB,
    },
    create: {
      id: SEED_IDS.tenderB,
      organizationId: orgB.id,
      title: "Heavy Rail Signalling and Electrification Infrastructure",
      referenceNumber: "TDR-2026-DFCC-001",
      status: TenderStatus.PUBLISHED,
      currentVersionId: SEED_IDS.tenderVersionB,
    },
  });

  const tenderVersionB = await prisma.tenderVersion.upsert({
    where: { id: SEED_IDS.tenderVersionB },
    update: {
      versionNumber: 1,
      title: "Heavy Rail Signalling and Electrification Infrastructure - Release 1",
      status: TenderVersionStatus.PUBLISHED,
      tenderId: tenderB.id,
    },
    create: {
      id: SEED_IDS.tenderVersionB,
      tenderId: tenderB.id,
      versionNumber: 1,
      title: "Heavy Rail Signalling and Electrification Infrastructure - Release 1",
      status: TenderVersionStatus.PUBLISHED,
    },
  });

  const bidB = await prisma.bid.upsert({
    where: { id: SEED_IDS.bidB },
    update: {
      organizationId: orgB.id,
      tenderId: tenderB.id,
      tenderVersionId: tenderVersionB.id,
      bidderId: bidderB.id,
      bidReference: "BID-2026-BHARAT-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 89000000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-18T14:00:00Z"),
    },
    create: {
      id: SEED_IDS.bidB,
      organizationId: orgB.id,
      tenderId: tenderB.id,
      tenderVersionId: tenderVersionB.id,
      bidderId: bidderB.id,
      bidReference: "BID-2026-BHARAT-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 89000000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-18T14:00:00Z"),
    },
  });

  const docB = await prisma.document.upsert({
    where: { id: SEED_IDS.documentB },
    update: {
      organizationId: orgB.id,
      storageKey: "documents/demo/bharat_technical_v1.pdf",
      fileName: "Bharat_Technical_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 1800000,
      sha256: "d41d8cd98f00b204e9800998ecf8427e",
      processingStatus: DocumentProcessingStatus.PROCESSED,
    },
    create: {
      id: SEED_IDS.documentB,
      organizationId: orgB.id,
      storageKey: "documents/demo/bharat_technical_v1.pdf",
      fileName: "Bharat_Technical_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 1800000,
      sha256: "d41d8cd98f00b204e9800998ecf8427e",
      processingStatus: DocumentProcessingStatus.PROCESSED,
    },
  });

  await prisma.bidDocument.upsert({
    where: { id: SEED_IDS.bidDocumentB },
    update: {
      bidId: bidB.id,
      documentId: docB.id,
      category: "TECHNICAL_PROPOSAL",
      required: true,
    },
    create: {
      id: SEED_IDS.bidDocumentB,
      bidId: bidB.id,
      documentId: docB.id,
      category: "TECHNICAL_PROPOSAL",
      required: true,
    },
  });

  console.log("[BidSure Seed] Multi-tenant deterministic seeding completed successfully.");
}

seed()
  .catch((e) => {
    console.error("[BidSure Seed] Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
