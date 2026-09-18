import {
  PrismaClient,
  Role,
  OrganizationStatus,
  UserStatus,
  TenderStatus,
  TenderVersionStatus,
  BidStatus,
  DocumentProcessingStatus,
  DocumentStatus,
  RequirementStatus,
  RequirementCategory,
  RequirementOperator,
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
  tenderVersionA2: "00000000-0000-4000-a000-000000000023",
  tenderA2: "00000000-0000-4000-a000-000000000024",
  tenderVersionA2_1: "00000000-0000-4000-a000-000000000025",
  req1: "00000000-0000-4000-a000-000000000031",
  req2: "00000000-0000-4000-a000-000000000032",
  req3: "00000000-0000-4000-a000-000000000033",
  req4: "00000000-0000-4000-a000-000000000034",
  req5: "00000000-0000-4000-a000-000000000035",
  req6: "00000000-0000-4000-a000-000000000036",
  req7: "00000000-0000-4000-a000-000000000037",
  req8: "00000000-0000-4000-a000-000000000038",
  req9: "00000000-0000-4000-a000-000000000039",
  req10: "00000000-0000-4000-a000-00000000003a",

  // Version IDs
  reqVer1_v1: "00000000-0000-4000-b000-000000000001",
  reqVer2_v1: "00000000-0000-4000-b000-000000000002",
  reqVer3_v1: "00000000-0000-4000-b000-000000000003",
  reqVer4_v1: "00000000-0000-4000-b000-000000000004",
  reqVer5_v1: "00000000-0000-4000-b000-000000000005",
  reqVer5_v2: "00000000-0000-4000-b000-000000000055",
  reqVer6_v1: "00000000-0000-4000-b000-000000000006",
  reqVer7_v1: "00000000-0000-4000-b000-000000000007",
  reqVer8_v1: "00000000-0000-4000-b000-000000000008",
  reqVer9_v1: "00000000-0000-4000-b000-000000000009",
  reqVer10_v1: "00000000-0000-4000-b000-00000000000a",
  bidderRecordA1: "00000000-0000-4000-a000-000000000041",
  bidderRecordA2: "00000000-0000-4000-a000-000000000042",
  bidA1: "00000000-0000-4000-a000-000000000051",
  bidA2: "00000000-0000-4000-a000-000000000052",
  bidA_draft: "00000000-0000-4000-a000-000000000053",
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

  const tenderVersionA2 = await prisma.tenderVersion.upsert({
    where: { id: SEED_IDS.tenderVersionA2 },
    update: {
      versionNumber: 2,
      title: "Automated Toll Plaza Management & Highway Surveillance System - Addendum 1",
      description: "Updated technical specifications: added high-speed Weigh-in-Motion (WIM) sensor integration.",
      changeSummary: "Added WIM sensor requirements and extended submission deadline.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 55000000,
        submissionDeadline: "2026-11-15T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
      },
      tenderId: tenderA.id,
    },
    create: {
      id: SEED_IDS.tenderVersionA2,
      tenderId: tenderA.id,
      versionNumber: 2,
      title: "Automated Toll Plaza Management & Highway Surveillance System - Addendum 1",
      description: "Updated technical specifications: added high-speed Weigh-in-Motion (WIM) sensor integration.",
      changeSummary: "Added WIM sensor requirements and extended submission deadline.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 55000000,
        submissionDeadline: "2026-11-15T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
      },
    },
  });

  // Tender A2 (Second Solicitation for ORG-A to hold Draft demo bid)
  const tenderA2 = await prisma.tender.upsert({
    where: { id: SEED_IDS.tenderA2 },
    update: {
      title: "Smart Expressway Emergency Traffic Control & Incident Management System",
      referenceNumber: "TDR-2026-DEL-002",
      status: TenderStatus.PUBLISHED,
      organizationId: orgA.id,
      currentVersionId: SEED_IDS.tenderVersionA2_1,
    },
    create: {
      id: SEED_IDS.tenderA2,
      organizationId: orgA.id,
      title: "Smart Expressway Emergency Traffic Control & Incident Management System",
      referenceNumber: "TDR-2026-DEL-002",
      status: TenderStatus.PUBLISHED,
      currentVersionId: SEED_IDS.tenderVersionA2_1,
    },
  });

  const tenderVersionA2_1 = await prisma.tenderVersion.upsert({
    where: { id: SEED_IDS.tenderVersionA2_1 },
    update: {
      versionNumber: 1,
      title: "Smart Expressway Emergency Traffic Control - Release 1",
      description: "IoT emergency call boxes, variable message signs, and optical CCTV.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 25000000,
        submissionDeadline: "2026-12-31T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
      },
      tenderId: tenderA2.id,
    },
    create: {
      id: SEED_IDS.tenderVersionA2_1,
      tenderId: tenderA2.id,
      versionNumber: 1,
      title: "Smart Expressway Emergency Traffic Control - Release 1",
      description: "IoT emergency call boxes, variable message signs, and optical CCTV.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 25000000,
        submissionDeadline: "2026-12-31T18:00:00.000Z",
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

  // Deterministic DRAFT Bid for Phase 07 (Apex on Tender A2)
  await prisma.bid.upsert({
    where: { id: SEED_IDS.bidA_draft },
    update: {
      organizationId: orgA.id,
      tenderId: tenderA2.id,
      tenderVersionId: tenderVersionA2_1.id,
      bidderId: bidderA1.id,
      bidReference: "BID-2026-APEX-DRAFT",
      status: BidStatus.DRAFT,
      version: 1,
      totalAmount: 18500000.0,
      currency: "INR",
      metadata: {
        proposalNotes: "Preliminary proposal draft for Emergency Traffic Control.",
        executiveSummary: "Turnkey delivery within 120 days.",
      },
      submittedAt: null,
    },
    create: {
      id: SEED_IDS.bidA_draft,
      organizationId: orgA.id,
      tenderId: tenderA2.id,
      tenderVersionId: tenderVersionA2_1.id,
      bidderId: bidderA1.id,
      bidReference: "BID-2026-APEX-DRAFT",
      status: BidStatus.DRAFT,
      version: 1,
      totalAmount: 18500000.0,
      currency: "INR",
      metadata: {
        proposalNotes: "Preliminary proposal draft for Emergency Traffic Control.",
        executiveSummary: "Turnkey delivery within 120 days.",
      },
      submittedAt: null,
    },
  });

  const docA = await prisma.document.upsert({
    where: { id: SEED_IDS.documentA },
    update: {
      organizationId: orgA.id,
      storageKey: "documents/demo/apex_technical_v1.pdf",
      fileName: "Apex_Technical_Proposal_v1.pdf",
      originalFilename: "Apex_Technical_Proposal_v1.pdf",
      mimeType: "application/pdf",
      mediaType: "application/pdf",
      extension: "pdf",
      fileSize: 2457600,
      sizeBytes: 2457600,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: DocumentStatus.READY,
      processingStatus: DocumentProcessingStatus.PROCESSED,
      scanStatus: "CLEAN",
    },
    create: {
      id: SEED_IDS.documentA,
      organizationId: orgA.id,
      storageKey: "documents/demo/apex_technical_v1.pdf",
      fileName: "Apex_Technical_Proposal_v1.pdf",
      originalFilename: "Apex_Technical_Proposal_v1.pdf",
      mimeType: "application/pdf",
      mediaType: "application/pdf",
      extension: "pdf",
      fileSize: 2457600,
      sizeBytes: 2457600,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: DocumentStatus.READY,
      processingStatus: DocumentProcessingStatus.PROCESSED,
      scanStatus: "CLEAN",
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
      originalFilename: "Bharat_Technical_v1.pdf",
      mimeType: "application/pdf",
      mediaType: "application/pdf",
      extension: "pdf",
      fileSize: 1800000,
      sizeBytes: 1800000,
      sha256: "d41d8cd98f00b204e9800998ecf8427e",
      status: DocumentStatus.READY,
      processingStatus: DocumentProcessingStatus.PROCESSED,
      scanStatus: "CLEAN",
    },
    create: {
      id: SEED_IDS.documentB,
      organizationId: orgB.id,
      storageKey: "documents/demo/bharat_technical_v1.pdf",
      fileName: "Bharat_Technical_v1.pdf",
      originalFilename: "Bharat_Technical_v1.pdf",
      mimeType: "application/pdf",
      mediaType: "application/pdf",
      extension: "pdf",
      fileSize: 1800000,
      sizeBytes: 1800000,
      sha256: "d41d8cd98f00b204e9800998ecf8427e",
      status: DocumentStatus.READY,
      processingStatus: DocumentProcessingStatus.PROCESSED,
      scanStatus: "CLEAN",
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

  // =========================================================================
  // 11. PHASE 10: REQUIREMENT INTELLIGENCE & HUMAN REVIEW SEEDING
  // =========================================================================
  console.log("[BidSure Seed] Seeding Phase 10 requirements & compliance rules...");

  const requirementsData = [
    {
      id: SEED_IDS.req1,
      identifier: "REQ-2026-0001",
      category: RequirementCategory.TURNOVER,
      versionId: SEED_IDS.reqVer1_v1,
      versionNumber: 1,
      status: RequirementStatus.APPROVED,
      title: "Minimum Annual Turnover ₹50 Crores",
      description: "Average annual financial turnover of at least INR 50 Crores across the last 3 financial years (FY 2022-23, FY 2023-24, FY 2024-25).",
      mandatory: true,
      operator: RequirementOperator.GREATER_THAN_OR_EQUAL,
      threshold: { amount: 500000000, currency: "INR" },
      expectedValue: "₹50,00,00,000",
      requiredEvidenceType: "Audited Financial Statements / CA Certificate",
      sourceClause: "Clause 4.2.1",
      sourcePage: 14,
      sourceText: "The Bidder shall have an average annual financial turnover of at least INR 50 Crores during the last 3 financial years (FY 2022-23, FY 2023-24, FY 2024-25).",
      aiGenerated: true,
      aiConfidence: 0.98,
      ruleType: "TURNOVER_MINIMUM",
      ruleParams: { minAmount: 500000000, currency: "INR", durationYears: 3 },
      approvedBy: SEED_IDS.officerA,
      approvedAt: new Date("2026-03-01T10:30:00Z"),
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req2,
      identifier: "REQ-2026-0002",
      category: RequirementCategory.GST_REGISTRATION,
      versionId: SEED_IDS.reqVer2_v1,
      versionNumber: 1,
      status: RequirementStatus.PROPOSED,
      title: "Active GSTIN Registration",
      description: "Bidder must possess a valid GSTIN registration certificate with active status on the date of bid submission.",
      mandatory: true,
      operator: RequirementOperator.EQUALS,
      threshold: null,
      expectedValue: "ACTIVE",
      requiredEvidenceType: "GST Registration Certificate",
      sourceClause: "Clause 3.1.4",
      sourcePage: 8,
      sourceText: "The bidder must possess a valid GSTIN registration certificate with active status on the date of bid submission.",
      aiGenerated: true,
      aiConfidence: 0.96,
      aiSuggestedRuleId: "GST_STATUS",
      ruleType: "GST_STATUS",
      ruleParams: { requiredStatus: "ACTIVE" },
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req3,
      identifier: "REQ-2026-0003",
      category: RequirementCategory.UDYAM_REGISTRATION,
      versionId: SEED_IDS.reqVer3_v1,
      versionNumber: 1,
      status: RequirementStatus.IN_REVIEW,
      title: "MSME / Udyam Certificate for Prior Experience Relaxation",
      description: "Micro and Small Enterprises registered under Udyam Registration are eligible for relaxation in prior turnover and experience criteria as per DoE guidelines.",
      mandatory: false,
      operator: RequirementOperator.EXISTS,
      threshold: null,
      expectedValue: "VALID_UDYAM",
      requiredEvidenceType: "Udyam Registration Certificate",
      sourceClause: "Clause 3.2.1",
      sourcePage: 9,
      sourceText: "Micro and Small Enterprises registered under Udyam Registration are eligible for relaxation in prior turnover and experience criteria as per DoE guidelines.",
      aiGenerated: true,
      aiConfidence: 0.88,
      aiSuggestedRuleId: "UDYAM_STATUS",
      ruleType: "UDYAM_STATUS",
      ruleParams: { allowRelaxation: true },
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req4,
      identifier: "REQ-2026-0004",
      category: RequirementCategory.OEM_AUTHORIZATION,
      versionId: SEED_IDS.reqVer4_v1,
      versionNumber: 1,
      status: RequirementStatus.APPROVED,
      title: "OEM Authorization Form (MAF)",
      description: "Manufacturer Authorization Form (MAF) from the Original Equipment Manufacturer is required for all active IT equipment and server hardware.",
      mandatory: true,
      operator: RequirementOperator.EXISTS,
      threshold: null,
      expectedValue: "OEM_MAF_LETTER",
      requiredEvidenceType: "Manufacturer Authorization Form",
      sourceClause: "Clause 5.3",
      sourcePage: 22,
      sourceText: "Manufacturer Authorization Form (MAF) from the Original Equipment Manufacturer is required for all active IT equipment and server hardware.",
      aiGenerated: true,
      aiConfidence: 0.94,
      ruleType: "OEM_AUTHORIZATION",
      ruleParams: { equipmentCategories: ["SERVERS", "SWITCHES", "CAMERAS"] },
      approvedBy: SEED_IDS.reviewerA,
      approvedAt: new Date("2026-03-02T11:00:00Z"),
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req5,
      identifier: "REQ-2026-0005",
      category: RequirementCategory.EMD,
      versionId: SEED_IDS.reqVer5_v2,
      versionNumber: 2,
      status: RequirementStatus.APPROVED,
      title: "Earnest Money Deposit (EMD) / Bank Guarantee ₹25 Lakhs",
      description: "Earnest Money Deposit of INR 25 Lakhs or valid MSME Exemption Certificate must be submitted prior to the bid closing timestamp.",
      mandatory: true,
      operator: RequirementOperator.GREATER_THAN_OR_EQUAL,
      threshold: { amount: 2500000, currency: "INR" },
      expectedValue: "₹25,00,00,000",
      requiredEvidenceType: "Bank Guarantee / FDR Receipt / MSME Exemption",
      sourceClause: "Clause 2.8",
      sourcePage: 6,
      sourceText: "Earnest Money Deposit of INR 25 Lakhs or valid MSME Exemption Certificate must be submitted prior to the bid closing timestamp.",
      aiGenerated: false,
      aiConfidence: null,
      ruleType: "EMD_EXEMPTION",
      ruleParams: { minAmount: 2500000, currency: "INR", allowMsmeExemption: true },
      approvedBy: SEED_IDS.officerA,
      approvedAt: new Date("2026-03-03T15:00:00Z"),
      rejectionReason: null,
      supersedesVersionId: SEED_IDS.reqVer5_v1,
      previousVersion: {
        id: SEED_IDS.reqVer5_v1,
        versionNumber: 1,
        status: RequirementStatus.SUPERSEDED,
        title: "Earnest Money Deposit (EMD) ₹20 Lakhs",
        description: "Initial requirement draft specifying INR 20 Lakhs EMD.",
        mandatory: true,
        operator: RequirementOperator.GREATER_THAN_OR_EQUAL,
        threshold: { amount: 2000000, currency: "INR" },
        expectedValue: "₹20,00,000",
        sourceClause: "Clause 2.8",
        sourcePage: 6,
        sourceText: "Earnest Money Deposit of INR 20 Lakhs must be submitted prior to bid closing.",
        aiGenerated: true,
        aiConfidence: 0.95,
      },
    },
    {
      id: SEED_IDS.req6,
      identifier: "REQ-2026-0006",
      category: RequirementCategory.EXPERIENCE,
      versionId: SEED_IDS.reqVer6_v1,
      versionNumber: 1,
      status: RequirementStatus.IN_REVIEW,
      title: "Prior Highway Surveillance Experience (3 Projects >= 20 Cr)",
      description: "The bidder must have successfully completed at least three similar highway surveillance and toll management works of not less than INR 20 Crores each in the past 7 years.",
      mandatory: true,
      operator: RequirementOperator.GREATER_THAN_OR_EQUAL,
      threshold: { completedProjectsCount: 3, projectValueINR: 200000000 },
      expectedValue: "3 completed projects >= 20 Cr each",
      requiredEvidenceType: "Client Completion Certificates",
      sourceClause: "Clause 4.1.2",
      sourcePage: 12,
      sourceText: "The bidder must have successfully completed at least three similar highway surveillance and toll management works of not less than INR 20 Crores each in the past 7 years.",
      aiGenerated: true,
      aiConfidence: 0.91,
      ruleType: "EXPERIENCE_MINIMUM",
      ruleParams: { minProjects: 3, minProjectValue: 200000000, yearsWindow: 7 },
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req7,
      identifier: "REQ-2026-0007",
      category: RequirementCategory.DECLARATION,
      versionId: SEED_IDS.reqVer7_v1,
      versionNumber: 1,
      status: RequirementStatus.REJECTED,
      title: "Self-Affidavit of Non-Debarment / Non-Blacklisting",
      description: "Non-judicial stamp paper self-declaration of not being blacklisted by any Central/State Ministry or PSU.",
      mandatory: true,
      operator: RequirementOperator.EQUALS,
      threshold: null,
      expectedValue: "NOT_BLACKLISTED",
      requiredEvidenceType: "Notarized Affidavit on Rs. 100 Stamp Paper",
      sourceClause: "Clause 1.4",
      sourcePage: 3,
      sourceText: "Non-judicial stamp paper self-declaration of not being blacklisted by any Central/State Ministry or PSU.",
      aiGenerated: true,
      aiConfidence: 0.89,
      ruleType: null,
      ruleParams: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: "Duplicate clause - already covered under General Terms and Conditions Section 2.1 in primary tender document.",
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req8,
      identifier: "REQ-2026-0008",
      category: RequirementCategory.CERTIFICATION,
      versionId: SEED_IDS.reqVer8_v1,
      versionNumber: 1,
      status: RequirementStatus.PROPOSED,
      title: "Quality & Security Certifications (ISO 9001 & ISO 27001)",
      description: "Valid ISO 9001:2015 and ISO/IEC 27001 certifications held by the bidding consortium or lead member.",
      mandatory: false,
      operator: RequirementOperator.CONTAINS,
      threshold: null,
      expectedValue: "ISO 9001:2015 AND ISO 27001:2022",
      requiredEvidenceType: "Accredited ISO Certificate",
      sourceClause: "Clause 6.1.1",
      sourcePage: 28,
      sourceText: "Valid ISO 9001:2015 and ISO/IEC 27001 certifications held by the bidding consortium or lead member.",
      aiGenerated: true,
      aiConfidence: 0.93,
      aiSuggestedRuleId: "ISO_CERTIFICATION",
      ruleType: "ISO_CERTIFICATION",
      ruleParams: { standards: ["ISO 9001:2015", "ISO/IEC 27001:2022"] },
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req9,
      identifier: "REQ-2026-0009",
      category: RequirementCategory.FINANCIAL_CAPACITY,
      versionId: SEED_IDS.reqVer9_v1,
      versionNumber: 1,
      status: RequirementStatus.APPROVED,
      title: "Bank Solvency Certificate ₹15 Crores",
      description: "Solvency certificate from a Scheduled Commercial Bank of not less than INR 15 Crores issued within 6 months prior to tender notice date.",
      mandatory: true,
      operator: RequirementOperator.GREATER_THAN_OR_EQUAL,
      threshold: { amount: 150000000, currency: "INR" },
      expectedValue: "₹15,00,00,000",
      requiredEvidenceType: "Scheduled Commercial Bank Solvency Letter",
      sourceClause: "Clause 4.3",
      sourcePage: 16,
      sourceText: "Solvency certificate from a Scheduled Commercial Bank of not less than INR 15 Crores issued within 6 months prior to tender notice date.",
      aiGenerated: true,
      aiConfidence: 0.97,
      ruleType: "FINANCIAL_RATIOS",
      ruleParams: { minSolvencyAmount: 150000000, currency: "INR", validityMonths: 6 },
      approvedBy: SEED_IDS.officerA,
      approvedAt: new Date("2026-03-02T16:45:00Z"),
      rejectionReason: null,
      supersedesVersionId: null,
    },
    {
      id: SEED_IDS.req10,
      identifier: "REQ-2026-0010",
      category: RequirementCategory.DECLARATION,
      versionId: SEED_IDS.reqVer10_v1,
      versionNumber: 1,
      status: RequirementStatus.PROPOSED,
      title: "Litigation and Dispute History Declaration",
      description: "Details of all pending arbitration or litigation cases exceeding 5% of company net worth during the preceding 3 financial years.",
      mandatory: true,
      operator: RequirementOperator.EQUALS,
      threshold: null,
      expectedValue: "NO_MATERIAL_DISPUTE",
      requiredEvidenceType: "Chartered Accountant / Legal Counsel Certified Statement",
      sourceClause: "Clause 1.6",
      sourcePage: 4,
      sourceText: "Details of all pending arbitration or litigation cases exceeding 5% of company net worth during the preceding 3 financial years.",
      aiGenerated: true,
      aiConfidence: 0.85,
      aiSuggestedRuleId: "LITIGATION_CLEAR",
      ruleType: "LITIGATION_CLEAR",
      ruleParams: { maxMaterialDisputes: 0 },
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      supersedesVersionId: null,
    },
  ];

  for (const r of requirementsData) {
    // 1. Create requirement parent
    const requirement = await prisma.requirement.upsert({
      where: { id: r.id },
      update: {
        organizationId: orgA.id,
        tenderId: tenderA.id,
        tenderVersionId: tenderVersionA.id,
        identifier: r.identifier,
        category: r.category,
      },
      create: {
        id: r.id,
        organizationId: orgA.id,
        tenderId: tenderA.id,
        tenderVersionId: tenderVersionA.id,
        identifier: r.identifier,
        category: r.category,
      },
    });

    // 2. Handle previous version if applicable
    if ("previousVersion" in r && r.previousVersion) {
      const pv = r.previousVersion;
      await prisma.requirementVersion.upsert({
        where: {
          requirementId_versionNumber: {
            requirementId: requirement.id,
            versionNumber: pv.versionNumber,
          },
        },
        update: {
          requirementId: requirement.id,
          versionNumber: pv.versionNumber,
          status: pv.status,
          category: r.category,
          title: pv.title,
          description: pv.description,
          mandatory: pv.mandatory,
          operator: pv.operator,
          threshold: pv.threshold as any,
          expectedValue: pv.expectedValue,
          sourceClause: pv.sourceClause,
          sourcePage: pv.sourcePage,
          sourceText: pv.sourceText,
          sourceDocumentId: SEED_IDS.documentA,
          tenderVersionId: tenderVersionA.id,
          aiGenerated: pv.aiGenerated,
          aiConfidence: pv.aiConfidence,
        },
        create: {
          id: pv.id,
          requirementId: requirement.id,
          tenderVersionId: tenderVersionA.id,
          versionNumber: pv.versionNumber,
          status: pv.status,
          category: r.category,
          title: pv.title,
          description: pv.description,
          mandatory: pv.mandatory,
          operator: pv.operator,
          threshold: pv.threshold as any,
          expectedValue: pv.expectedValue,
          sourceClause: pv.sourceClause,
          sourcePage: pv.sourcePage,
          sourceText: pv.sourceText,
          sourceDocumentId: SEED_IDS.documentA,
          aiGenerated: pv.aiGenerated,
          aiConfidence: pv.aiConfidence,
        },
      });
    }

    // 3. Upsert current version
    const version = await prisma.requirementVersion.upsert({
      where: {
        requirementId_versionNumber: {
          requirementId: requirement.id,
          versionNumber: r.versionNumber,
        },
      },
      update: {
        requirementId: requirement.id,
        versionNumber: r.versionNumber,
        status: r.status,
        category: r.category,
        title: r.title,
        description: r.description,
        mandatory: r.mandatory,
        operator: r.operator,
        threshold: r.threshold as any,
        expectedValue: r.expectedValue,
        requiredEvidenceType: r.requiredEvidenceType,
        sourceClause: r.sourceClause,
        sourcePage: r.sourcePage,
        sourceText: r.sourceText,
        sourceDocumentId: SEED_IDS.documentA,
        tenderVersionId: tenderVersionA.id,
        aiGenerated: r.aiGenerated,
        aiConfidence: r.aiConfidence,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt,
        rejectionReason: r.rejectionReason,
        supersedesVersionId: r.supersedesVersionId,
      },
      create: {
        id: r.versionId,
        requirementId: requirement.id,
        tenderVersionId: tenderVersionA.id,
        versionNumber: r.versionNumber,
        status: r.status,
        category: r.category,
        title: r.title,
        description: r.description,
        mandatory: r.mandatory,
        operator: r.operator,
        threshold: r.threshold as any,
        expectedValue: r.expectedValue,
        requiredEvidenceType: r.requiredEvidenceType,
        sourceClause: r.sourceClause,
        sourcePage: r.sourcePage,
        sourceText: r.sourceText,
        sourceDocumentId: SEED_IDS.documentA,
        aiGenerated: r.aiGenerated,
        aiConfidence: r.aiConfidence,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt,
        rejectionReason: r.rejectionReason,
        supersedesVersionId: r.supersedesVersionId,
      },
    });

    // 4. Update requirement's currentVersionId
    await prisma.requirement.update({
      where: { id: requirement.id },
      data: { currentVersionId: version.id },
    });

    // 5. Seed ComplianceRule mapping if ruleType is defined
    if (r.ruleType) {
      const existingRule = await prisma.complianceRule.findFirst({
        where: {
          requirementVersionId: version.id,
          ruleType: r.ruleType,
        },
      });

      if (existingRule) {
        await prisma.complianceRule.update({
          where: { id: existingRule.id },
          data: {
            requirementId: requirement.id,
            operator: r.operator,
            expectedValue: r.expectedValue,
            parameters: (r.ruleParams as any) || {},
            enabled: true,
          },
        });
      } else {
        await prisma.complianceRule.create({
          data: {
            requirementId: requirement.id,
            requirementVersionId: version.id,
            ruleType: r.ruleType,
            version: 1,
            operator: r.operator,
            expectedValue: r.expectedValue,
            parameters: (r.ruleParams as any) || {},
            enabled: true,
          },
        });
      }
    }

    // 6. Seed AuditEvent for traceability
    await prisma.auditEvent.create({
      data: {
        organizationId: orgA.id,
        userId: r.approvedBy || SEED_IDS.officerA,
        action: r.status === RequirementStatus.APPROVED ? "REQUIREMENT_APPROVED" : "REQUIREMENT_PROPOSED",
        entityType: "REQUIREMENT",
        entityId: requirement.id,
        newState: {
          requirementId: requirement.id,
          identifier: requirement.identifier,
          status: r.status,
          versionNumber: r.versionNumber,
          title: r.title,
        },
        metadata: {
          sourceClause: r.sourceClause,
          sourcePage: r.sourcePage,
          ruleType: r.ruleType,
        },
      },
    });
  }

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
