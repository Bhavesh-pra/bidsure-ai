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

const prisma = new PrismaClient();

const SEED_IDS = {
  organization: "00000000-0000-4000-a000-000000000001",
  officerUser: "00000000-0000-4000-a000-000000000011",
  reviewerUser: "00000000-0000-4000-a000-000000000012",
  bidderUser: "00000000-0000-4000-a000-000000000013",
  tender: "00000000-0000-4000-a000-000000000021",
  tenderVersion: "00000000-0000-4000-a000-000000000022",
  req1: "00000000-0000-4000-a000-000000000031",
  req2: "00000000-0000-4000-a000-000000000032",
  req3: "00000000-0000-4000-a000-000000000033",
  req4: "00000000-0000-4000-a000-000000000034",
  bidder: "00000000-0000-4000-a000-000000000041",
  bid: "00000000-0000-4000-a000-000000000051",
  document: "00000000-0000-4000-a000-000000000061",
  bidDocument: "00000000-0000-4000-a000-000000000071",
};

export async function seed() {
  console.log("[BidSure Seed] Starting deterministic database seeding...");

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: SEED_IDS.organization },
    update: {
      name: "Demo Procurement Authority",
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      id: SEED_IDS.organization,
      name: "Demo Procurement Authority",
      status: OrganizationStatus.ACTIVE,
    },
  });

  // 2. Users
  await prisma.user.upsert({
    where: { id: SEED_IDS.officerUser },
    update: {
      name: "Rajesh Sharma",
      email: "officer@bidsure.demo",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
      organizationId: org.id,
    },
    create: {
      id: SEED_IDS.officerUser,
      organizationId: org.id,
      name: "Rajesh Sharma",
      email: "officer@bidsure.demo",
      role: Role.PROCUREMENT_OFFICER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { id: SEED_IDS.reviewerUser },
    update: {
      name: "Priya Patel",
      email: "reviewer@bidsure.demo",
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
      organizationId: org.id,
    },
    create: {
      id: SEED_IDS.reviewerUser,
      organizationId: org.id,
      name: "Priya Patel",
      email: "reviewer@bidsure.demo",
      role: Role.REVIEWER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { id: SEED_IDS.bidderUser },
    update: {
      name: "Amit Verma",
      email: "bidder@bidsure.demo",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
      organizationId: org.id,
    },
    create: {
      id: SEED_IDS.bidderUser,
      organizationId: org.id,
      name: "Amit Verma",
      email: "bidder@bidsure.demo",
      role: Role.BIDDER,
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Tender
  const tender = await prisma.tender.upsert({
    where: { id: SEED_IDS.tender },
    update: {
      title: "Automated Toll Plaza Management & Highway Surveillance System",
      referenceNumber: "TDR-2026-DEL-001",
      status: TenderStatus.PUBLISHED,
      organizationId: org.id,
      currentVersionId: SEED_IDS.tenderVersion,
    },
    create: {
      id: SEED_IDS.tender,
      organizationId: org.id,
      title: "Automated Toll Plaza Management & Highway Surveillance System",
      referenceNumber: "TDR-2026-DEL-001",
      status: TenderStatus.PUBLISHED,
      currentVersionId: SEED_IDS.tenderVersion,
    },
  });

  // 4. TenderVersion 1
  const tenderVersion = await prisma.tenderVersion.upsert({
    where: { id: SEED_IDS.tenderVersion },
    update: {
      versionNumber: 1,
      title: "Automated Toll Plaza Management & Highway Surveillance System - Initial Release",
      description: "Comprehensive procurement for AI-driven ANPR cameras, toll collection automation, and centralized corridor surveillance.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 50000000,
        submissionDeadline: "2026-10-31T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
        publishingAuthority: "Demo Procurement Authority",
      },
      tenderId: tender.id,
    },
    create: {
      id: SEED_IDS.tenderVersion,
      tenderId: tender.id,
      versionNumber: 1,
      title: "Automated Toll Plaza Management & Highway Surveillance System - Initial Release",
      description: "Comprehensive procurement for AI-driven ANPR cameras, toll collection automation, and centralized corridor surveillance.",
      status: TenderVersionStatus.PUBLISHED,
      content: {
        budgetINR: 50000000,
        submissionDeadline: "2026-10-31T18:00:00.000Z",
        tenderType: "OPEN_COMPETITIVE",
        publishingAuthority: "Demo Procurement Authority",
      },
    },
  });

  // 5. Requirements and Versions
  const requirementsData = [
    {
      reqId: SEED_IDS.req1,
      identifier: "REQ-TECH-001",
      category: "TECHNICAL",
      versionNumber: 1,
      description: "Automated Number Plate Recognition (ANPR) cameras must achieve minimum 99.5% accuracy under all-weather day/night conditions.",
      mandatory: true,
    },
    {
      reqId: SEED_IDS.req2,
      identifier: "REQ-FIN-001",
      category: "FINANCIAL",
      versionNumber: 1,
      description: "Bidder must demonstrate average annual turnover of at least ₹50 Crore over the last three audited financial years.",
      mandatory: true,
    },
    {
      reqId: SEED_IDS.req3,
      identifier: "REQ-STAT-001",
      category: "STATUTORY",
      versionNumber: 1,
      description: "Bidder must possess valid ISO 27001 Information Security Management certification and valid GST registration.",
      mandatory: true,
    },
    {
      reqId: SEED_IDS.req4,
      identifier: "REQ-EXP-001",
      category: "EXPERIENCE",
      versionNumber: 1,
      description: "Bidder must have successfully executed at least 2 comparable highway toll plaza automation projects within the last 5 years.",
      mandatory: false,
    },
  ];

  for (const item of requirementsData) {
    const req = await prisma.requirement.upsert({
      where: { id: item.reqId },
      update: {
        identifier: item.identifier,
        category: item.category,
        tenderVersionId: tenderVersion.id,
      },
      create: {
        id: item.reqId,
        tenderVersionId: tenderVersion.id,
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

  // 6. Bidder
  const bidder = await prisma.bidder.upsert({
    where: { id: SEED_IDS.bidder },
    update: {
      legalName: "Apex InfraTech Solutions Pvt Ltd",
      tradeName: "Apex InfraTech",
      contactEmail: "tenders@apexinfra.example.com",
      contactPhone: "+91-9876543210",
      organizationId: org.id,
    },
    create: {
      id: SEED_IDS.bidder,
      organizationId: org.id,
      legalName: "Apex InfraTech Solutions Pvt Ltd",
      tradeName: "Apex InfraTech",
      contactEmail: "tenders@apexinfra.example.com",
      contactPhone: "+91-9876543210",
    },
  });

  // 7. Bid
  const bid = await prisma.bid.upsert({
    where: { id: SEED_IDS.bid },
    update: {
      organizationId: org.id,
      tenderId: tender.id,
      tenderVersionId: tenderVersion.id,
      bidderId: bidder.id,
      bidReference: "BID-2026-APEX-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 42500000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-15T10:30:00Z"),
    },
    create: {
      id: SEED_IDS.bid,
      organizationId: org.id,
      tenderId: tender.id,
      tenderVersionId: tenderVersion.id,
      bidderId: bidder.id,
      bidReference: "BID-2026-APEX-001",
      status: BidStatus.SUBMITTED,
      totalAmount: 42500000.0,
      currency: "INR",
      submittedAt: new Date("2026-03-15T10:30:00Z"),
    },
  });

  // 8. Document
  const document = await prisma.document.upsert({
    where: { id: SEED_IDS.document },
    update: {
      organizationId: org.id,
      storageKey: "documents/demo/apex_technical_v1.pdf",
      fileName: "Apex_Technical_Proposal_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 2457600,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      processingStatus: DocumentProcessingStatus.PROCESSED,
    },
    create: {
      id: SEED_IDS.document,
      organizationId: org.id,
      storageKey: "documents/demo/apex_technical_v1.pdf",
      fileName: "Apex_Technical_Proposal_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 2457600,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      processingStatus: DocumentProcessingStatus.PROCESSED,
    },
  });

  // 9. BidDocument
  await prisma.bidDocument.upsert({
    where: { id: SEED_IDS.bidDocument },
    update: {
      bidId: bid.id,
      documentId: document.id,
      category: "TECHNICAL_PROPOSAL",
      required: true,
    },
    create: {
      id: SEED_IDS.bidDocument,
      bidId: bid.id,
      documentId: document.id,
      category: "TECHNICAL_PROPOSAL",
      required: true,
    },
  });

  console.log("[BidSure Seed] Seeding completed successfully.");
}

seed()
  .catch((e) => {
    console.error("[BidSure Seed] Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

