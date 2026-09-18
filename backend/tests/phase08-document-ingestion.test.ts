import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import crypto from "node:crypto";
import { createApp } from "../src/app/app.js";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { SEED_IDS } from "../prisma/seed.js";
import { getStorageService } from "../src/infrastructure/storage/storage.service.js";
import { getQueueService } from "../src/infrastructure/queue/queue.service.js";
import type { ApiResponse, ApiErrorResponse } from "../src/shared/types/api.types.js";
import type { BidDocumentDTO } from "../src/modules/documents/document.types.js";
import { DocumentStatus } from "@prisma/client";

describe("Phase 08 — Secure Document Ingestion Vertical Slice Integration Tests", () => {
  let server: Server;
  let baseUrl: string;
  let bidderA1Cookie: string;
  let bidderA2Cookie: string;
  let bidderBCookie: string;
  let testTenderId: string;
  let testTenderVersionId: string;
  let draftBidId: string;
  let secondDraftBidId: string;
  let submittedBidId: string;

  const validPdfBuffer = Buffer.concat([
    Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"),
    Buffer.from("Valid test proposal content for Phase 08 integration testing"),
  ]);
  const validPdfHash = crypto.createHash("sha256").update(validPdfBuffer).digest("hex");

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    const login = async (email: string, password: string): Promise<string> => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(res.status, 200, `Login failed for ${email}`);
      const cookieHeader = res.headers.get("set-cookie");
      assert.ok(cookieHeader);
      return cookieHeader.split(";")[0]!;
    };

    bidderA1Cookie = await login("bidder@apexinfra.bidsure.test", "Bidder@123");
    bidderA2Cookie = await login("bidder2@skyline.bidsure.test", "Bidder@123");
    bidderBCookie = await login("bidder@bharatinfra.bidsure.test", "Bidder@123");

    // Create an isolated test tender with version for Phase 08 tests
    const tender = await prisma.tender.create({
      data: {
        organizationId: SEED_IDS.orgA,
        title: "Highway Optical Fiber Network Solicitation",
        referenceNumber: `TDR-P08-${Date.now()}`,
        status: "PUBLISHED",
        versions: {
          create: [
            {
              versionNumber: 1,
              title: "Specification V1",
              status: "PUBLISHED",
              description: "OFC laying tender specification",
            },
          ],
        },
      },
      include: { versions: true },
    });
    testTenderId = tender.id;
    testTenderVersionId = tender.versions[0]!.id;
    await prisma.tender.update({
      where: { id: testTenderId },
      data: { currentVersionId: testTenderVersionId },
    });

    // Create a draft bid for Bidder A1
    const draftBid = await prisma.bid.create({
      data: {
        organizationId: SEED_IDS.orgA,
        tenderId: testTenderId,
        tenderVersionId: testTenderVersionId,
        bidderId: SEED_IDS.bidderRecordA1,
        bidReference: `BID-P08-A1-${Date.now()}`,
        status: "DRAFT",
        totalAmount: 15000000.0,
      },
    });
    draftBidId = draftBid.id;

    // Use seed submitted bid for Bidder A1 to test submission locks
    submittedBidId = SEED_IDS.bidA1;

    // Create a second draft bid for Bidder A2 to test cross-bid reuse
    const secondBid = await prisma.bid.create({
      data: {
        organizationId: SEED_IDS.orgA,
        tenderId: testTenderId,
        tenderVersionId: testTenderVersionId,
        bidderId: SEED_IDS.bidderRecordA2,
        bidReference: `BID-P08-A2-${Date.now()}`,
        status: "DRAFT",
        totalAmount: 18000000.0,
      },
    });
    secondDraftBidId = secondBid.id;
  });

  after(async () => {
    // Clean up test records
    await prisma.bidDocument.deleteMany({
      where: { bidId: { in: [draftBidId, secondDraftBidId] } },
    });
    await prisma.bidDocument.deleteMany({
      where: {
        bidId: submittedBidId,
        document: { fileName: "locked.pdf" },
      },
    });
    await prisma.document.deleteMany({
      where: { fileName: "locked.pdf" },
    });
    await prisma.bid.deleteMany({
      where: { id: { in: [draftBidId, secondDraftBidId] } },
    });
    if (testTenderId) {
      await prisma.tenderVersion.deleteMany({ where: { tenderId: testTenderId } });
      await prisma.tender.deleteMany({ where: { id: testTenderId } });
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  let uploadedDoc1Id: string;
  let uploadedBidDoc1Id: string;

  // Helper function to build multipart/form-data payload with boundary
  const createMultipartPayload = (
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    extraFields: Record<string, string> = {}
  ) => {
    const boundary = "----WebKitFormBoundary" + crypto.randomUUID().replace(/-/g, "");
    const chunks: Buffer[] = [];

    // Add extra text fields
    for (const [key, value] of Object.entries(extraFields)) {
      chunks.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        )
      );
    }

    // Add file field
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      )
    );
    chunks.push(fileBuffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    return {
      body: Buffer.concat(chunks),
      contentType: `multipart/form-data; boundary=${boundary}`,
    };
  };

  it("1. Authenticated Bidder uploads valid PDF (POST /api/v1/bids/:bidId/documents)", async () => {
    const { body, contentType } = createMultipartPayload(
      validPdfBuffer,
      "Technical_Proposal_v1.pdf",
      "application/pdf",
      { category: "TECHNICAL_PROPOSAL" }
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 201, "Upload must succeed with HTTP 201 Created");
    const json = (await res.json()) as ApiResponse<BidDocumentDTO>;
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    assert.equal(json.data.bidId, draftBidId);
    assert.equal(json.data.category, "TECHNICAL_PROPOSAL");

    const doc = json.data.document;
    assert.ok(doc.id);
    assert.equal(doc.fileName, "Technical_Proposal_v1.pdf");
    assert.equal(doc.extension, "pdf");
    assert.equal(doc.mimeType, "application/pdf");
    assert.equal(doc.sizeBytes, validPdfBuffer.length);
    assert.equal(doc.sha256, validPdfHash);
    assert.equal(doc.scanStatus, "CLEAN");
    assert.ok(
      doc.status === "PROCESSING" || doc.status === "READY",
      `Status must be PROCESSING or READY, got ${doc.status}`
    );

    uploadedDoc1Id = doc.id;
    uploadedBidDoc1Id = json.data.id;

    // Verify object storage persistence
    const storageService = getStorageService();
    const exists = await storageService.exists(doc.storageKey);
    assert.equal(exists, true, "File must be persisted in object storage");

    // Drain queue to ensure worker marks document READY
    await getQueueService().drain?.("processing.queue");

    const checkDb = await prisma.document.findUnique({ where: { id: doc.id } });
    assert.equal(checkDb?.status, DocumentStatus.READY, "Document must transition to READY after ingestion");
    assert.equal(checkDb?.processingStatus, "PROCESSED");
  });

  it("2. Authoritative Duplicate Detection: Uploading identical content to same bid fails with 409 DUPLICATE_DOCUMENT", async () => {
    const { body, contentType } = createMultipartPayload(
      validPdfBuffer, // Exact same content/SHA-256
      "Duplicate_Technical_Proposal.pdf",
      "application/pdf",
      { category: "TECHNICAL_PROPOSAL" }
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 409, "Duplicate content must return HTTP 409 Conflict");
    const json = (await res.json()) as ApiErrorResponse;
    assert.equal(json.success, false);
    assert.equal(json.error.code, "DUPLICATE_DOCUMENT");
    assert.ok(json.error.message.includes("already been uploaded"));
  });

  it("3. Cross-Bid Reuse Permitted: Uploading same content to a DIFFERENT bid succeeds", async () => {
    // Exact same PDF content, but to a different bid in the same organization
    const { body, contentType } = createMultipartPayload(
      validPdfBuffer,
      "Apex_Common_Statutory_Cert.pdf",
      "application/pdf",
      { category: "STATUTORY_COMPLIANCE" }
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${secondDraftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA2Cookie, // Bidder A2 uploading to secondDraftBid
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 201, "Reusing content across different bids must succeed");
    const json = (await res.json()) as ApiResponse<BidDocumentDTO>;
    assert.equal(json.success, true);
    assert.equal(json.data.document.sha256, validPdfHash);
  });

  it("4. Idempotent Retry: Replaying upload with same Idempotency-Key returns cached response", async () => {
    const uniqueBuffer = Buffer.concat([
      Buffer.from("%PDF-1.7\nUnique idempotency test content "),
      Buffer.from(crypto.randomUUID()),
    ]);
    const testIdempKey = `upload-idemp-${Date.now()}-${crypto.randomUUID()}`;

    const { body, contentType } = createMultipartPayload(
      uniqueBuffer,
      "Unique_Annexure.pdf",
      "application/pdf",
      { category: "FINANCIAL_PROPOSAL" }
    );

    // Initial upload
    const res1 = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
        "Idempotency-Key": testIdempKey,
      },
      body,
    });

    assert.equal(res1.status, 201);
    const json1 = (await res1.json()) as ApiResponse<BidDocumentDTO>;
    const originalDocId = json1.data.document.id;

    // Replay with identical key and payload (simulating network retry / double click)
    const res2 = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
        "Idempotency-Key": testIdempKey,
      },
      body,
    });

    assert.equal(res2.status, 201, "Replayed request must return HTTP 201");
    assert.equal(res2.headers.get("x-idempotent-replay"), "true", "x-idempotent-replay header must be true");
    const json2 = (await res2.json()) as ApiResponse<BidDocumentDTO>;
    assert.equal(json2.data.document.id, originalDocId, "Replay must return original document without creating duplicates");
  });

  it("5. MIME Spoofing & Magic-Byte Mismatch rejected server-side", async () => {
    // Non-PDF content disguised with .pdf filename and application/pdf header
    const fakePdfContent = Buffer.from("MZ90 This is an executable file pretending to be PDF");
    const { body, contentType } = createMultipartPayload(
      fakePdfContent,
      "malicious_disguise.pdf",
      "application/pdf"
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 400, "Magic byte mismatch must be rejected with HTTP 400");
    const json = (await res.json()) as ApiErrorResponse;
    assert.equal(json.error.code, "INVALID_FILE_SIGNATURE");
  });

  it("6. Oversized file (>10MB) rejected server-side with 413 REQUEST_TOO_LARGE", async () => {
    const elevenMb = 11 * 1024 * 1024;
    const oversizedBuffer = Buffer.alloc(elevenMb);
    oversizedBuffer.write("%PDF-1.7", 0);

    const { body, contentType } = createMultipartPayload(
      oversizedBuffer,
      "oversized_blueprint.pdf",
      "application/pdf"
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 413, "Oversized upload must be rejected with HTTP 413");
    const json = (await res.json()) as ApiErrorResponse;
    assert.equal(json.error.code, "FILE_TOO_LARGE");
  });

  it("7. Security Quarantine: EICAR signature flags document as QUARANTINED and halts processing", async () => {
    const eicarBuffer = Buffer.concat([
      Buffer.from("%PDF-1.7\n"),
      Buffer.from("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"),
    ]);

    const { body, contentType } = createMultipartPayload(
      eicarBuffer,
      "infected_sample.pdf",
      "application/pdf"
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA1Cookie,
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 201, "API records quarantined document resource");
    const json = (await res.json()) as ApiResponse<BidDocumentDTO>;
    assert.equal(json.data.document.status, "QUARANTINED", "Status must be QUARANTINED");
    assert.equal(json.data.document.scanStatus, "INFECTED");
    assert.equal(json.data.document.failureCode, "SECURITY_SCAN_QUARANTINED");

    // Verify it never transitioned to READY
    const docInDb = await prisma.document.findUnique({ where: { id: json.data.document.id } });
    assert.equal(docInDb?.status, DocumentStatus.QUARANTINED);

    // Invariant: Quarantined document MUST remain linked via BidDocument for immutable audit trail (Phase 15)
    const bidDocInDb = await prisma.bidDocument.findFirst({
      where: { documentId: json.data.document.id, bidId: draftBidId },
    });
    assert.ok(bidDocInDb, "Quarantined document MUST remain linked via BidDocument for immutable audit trail");
    assert.equal(bidDocInDb?.documentId, json.data.document.id);
  });

  it("8. Cross-Tenant Upload Denied: Org B Bidder cannot upload to Org A bid", async () => {
    const { body, contentType } = createMultipartPayload(
      validPdfBuffer,
      "Cross_Tenant_Attack.pdf",
      "application/pdf"
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderBCookie, // Org B bidder
        "Content-Type": contentType,
      },
      body,
    });

    assert.ok(res.status === 403 || res.status === 404, "Cross tenant upload must fail with 403 or 404");
  });

  it("9. Bidder Impersonation Denied: Bidder A2 cannot upload to Bidder A1's bid", async () => {
    const { body, contentType } = createMultipartPayload(
      validPdfBuffer,
      "Impersonation_Attempt.pdf",
      "application/pdf"
    );

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      method: "POST",
      headers: {
        Cookie: bidderA2Cookie, // Different bidder in same Org A
        "Content-Type": contentType,
      },
      body,
    });

    assert.equal(res.status, 403, "Impersonating another bidder must return HTTP 403");
  });

  it("10. Bidder lists documents for bid (GET /api/v1/bids/:bidId/documents)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents`, {
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as ApiResponse<BidDocumentDTO[]>;
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 2);

    const found = json.data.find((d) => d.document.id === uploadedDoc1Id);
    assert.ok(found);
    assert.equal(found.document.fileName, "Technical_Proposal_v1.pdf");
    assert.equal(found.document.status, "READY");
  });

  it("11. Bidder reads single document detail (GET /api/v1/bids/:bidId/documents/:docId)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents/${uploadedDoc1Id}`, {
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as ApiResponse<BidDocumentDTO>;
    assert.equal(json.success, true);
    assert.equal(json.data.document.id, uploadedDoc1Id);
    assert.equal(json.data.document.sha256, validPdfHash);
    assert.equal(json.data.document.status, "READY");
    assert.equal(json.data.document.extension, "pdf");
  });

  it("12. Deletion in DRAFT bid succeeds (DELETE /api/v1/bids/:bidId/documents/:docId)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents/${uploadedDoc1Id}`, {
      method: "DELETE",
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 204, "Deletion in draft bid must return 204 No Content");

    // Verify deletion in DB
    const check = await prisma.bidDocument.findUnique({
      where: { id: uploadedBidDoc1Id },
    });
    assert.equal(check, null, "BidDocument association must be deleted");
  });

  it("13. Deletion in SUBMITTED bid is strictly locked with 409 DOCUMENT_NOT_DELETABLE", async () => {
    // First link a document to the submitted bid directly for testing
    const doc = await prisma.document.create({
      data: {
        organizationId: SEED_IDS.orgA,
        storageKey: "documents/test/locked.pdf",
        fileName: "locked.pdf",
        extension: "pdf",
        mimeType: "application/pdf",
        fileSize: 1000,
        sha256: crypto.randomUUID().replace(/-/g, ""),
        status: DocumentStatus.READY,
        processingStatus: "PROCESSED",
      },
    });
    await prisma.bidDocument.create({
      data: {
        bidId: submittedBidId,
        documentId: doc.id,
        category: "LEGAL",
      },
    });

    const res = await fetch(`${baseUrl}/api/v1/bids/${submittedBidId}/documents/${doc.id}`, {
      method: "DELETE",
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 409, "Deletion from submitted bid must return 409 Conflict");
    const json = (await res.json()) as ApiErrorResponse;
    assert.equal(json.error.code, "DOCUMENT_NOT_DELETABLE");
  });

  it("14. Retry Processing: Failed document retries and transitions to READY", async () => {
    // Create a failed document in draft bid
    const failedDoc = await prisma.document.create({
      data: {
        organizationId: SEED_IDS.orgA,
        storageKey: "documents/test/retryable.pdf",
        fileName: "retryable.pdf",
        extension: "pdf",
        mimeType: "application/pdf",
        fileSize: 500,
        sha256: crypto.randomUUID().replace(/-/g, ""),
        status: DocumentStatus.FAILED,
        processingStatus: "FAILED",
        failureCode: "TRANSIENT_TIMEOUT",
        failureMessage: "Transient connection timeout during ingestion.",
      },
    });
    await prisma.bidDocument.create({
      data: {
        bidId: draftBidId,
        documentId: failedDoc.id,
        category: "FINANCIAL",
      },
    });

    // Write file to storage so worker verification succeeds
    const storageService = getStorageService();
    await storageService.upload(failedDoc.storageKey, validPdfBuffer, "application/pdf");

    const res = await fetch(`${baseUrl}/api/v1/bids/${draftBidId}/documents/${failedDoc.id}/retry`, {
      method: "POST",
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 200, "Retry must succeed with HTTP 200");
    const json = (await res.json()) as ApiResponse<BidDocumentDTO>;
    assert.ok(json.data.document.status === "PROCESSING" || json.data.document.status === "READY");

    // Drain queue
    await getQueueService().drain?.("processing.queue");
    const updated = await prisma.document.findUnique({ where: { id: failedDoc.id } });
    assert.equal(updated?.status, DocumentStatus.READY, "Retried document must transition to READY");
  });

  it("15. Phase 07 Invariant Preservation: Bid remains bound to original TenderVersion", async () => {
    const checkBid = await prisma.bid.findUnique({
      where: { id: draftBidId },
      select: { tenderId: true, tenderVersionId: true },
    });

    assert.equal(checkBid?.tenderId, testTenderId);
    assert.equal(
      checkBid?.tenderVersionId,
      testTenderVersionId,
      "Bid TenderVersionId must remain firmly bound throughout document operations"
    );
  });
});
