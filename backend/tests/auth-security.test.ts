import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app/app.js";
import { prisma } from "../src/infrastructure/database/prisma.js";
import { SEED_IDS } from "../prisma/seed.js";
import { UserStatus } from "@prisma/client";
import type { ApiResponse, ApiErrorResponse, PaginatedResponse } from "../src/shared/types/api.types.js";
import type { LoginResponseData, UserDTO } from "../src/modules/auth/auth.types.js";
import type { TenderDTO } from "../src/modules/tenders/tender.types.js";
import type { BidDTO } from "../src/modules/bids/bid.types.js";

describe("Phase 04 — Authentication, Tenant Isolation & RBAC Security Suite", () => {
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

  /** Helper to login and extract the raw HttpOnly cookie string */
  async function loginAndGetCookie(email: string, password: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(res.status, 200, `Login for ${email} should succeed`);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "set-cookie header must be present on login");
    return setCookie.split(";")[0]!;
  }

  // =========================================================================
  // 1. AUTHENTICATION (8 TESTS)
  // =========================================================================

  it("1. Valid login succeeds: sets HttpOnly cookie and returns sanitized user", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });

    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "set-cookie header must be present");
    assert.match(setCookie, /bidsure_session=/i);
    assert.match(setCookie, /httponly/i, "cookie must have HttpOnly flag");

    const body = (await res.json()) as ApiResponse<LoginResponseData>;
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, "officer@nhai.bidsure.test");
    assert.equal(body.data.user.role, "PROCUREMENT_OFFICER");
    assert.equal(body.data.user.organization.name, "National Highway Authority (Synthetic Demo Org A)");
    assert.ok(!("passwordHash" in body.data.user), "passwordHash must never be returned");
  });

  it("2. Invalid password fails with safe generic 401 error", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "WrongPassword999!",
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(body.error.message, "Invalid email or password");
  });

  it("3. Unknown user fails safely with identical generic 401 error", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.user@bidsure.test",
        password: "SomePassword123!",
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(body.error.message, "Invalid email or password");
  });

  it("4. Inactive user cannot authenticate (401)", async () => {
    // Create or ensure an INACTIVE user exists
    const inactiveEmail = "inactive.user@nhai.bidsure.test";
    await prisma.user.upsert({
      where: { email: inactiveEmail },
      update: { status: UserStatus.INACTIVE },
      create: {
        organizationId: SEED_IDS.orgA,
        name: "Inactive User",
        email: inactiveEmail,
        status: UserStatus.INACTIVE,
        role: "PROCUREMENT_OFFICER",
      },
    });

    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inactiveEmail,
        password: "Officer@123",
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
  });

  it("5. Suspended user cannot authenticate (401)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "suspended@nhai.bidsure.test",
        password: "Suspended@123",
      }),
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.match(body.error.message, /not active/i);
  });

  it("6. /auth/me returns current authenticated user profile with valid session", async () => {
    const cookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");

    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as ApiResponse<{ user: UserDTO }>;
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, "officer@nhai.bidsure.test");
    assert.equal(body.data.user.role, "PROCUREMENT_OFFICER");
    assert.equal(body.data.user.organization.name, "National Highway Authority (Synthetic Demo Org A)");
  });

  it("7. Logout invalidates session on server: subsequent request returns 401", async () => {
    const cookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");

    // Verify session works
    const meBefore = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(meBefore.status, 200);

    // Call logout
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    assert.equal(logoutRes.status, 200);
    const logoutCookie = logoutRes.headers.get("set-cookie");
    assert.ok(logoutCookie, "logout must clear cookie");

    // Attempt to access /me with the logged out session token
    const meAfter = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(meAfter.status, 401, "Invalidated session must be rejected with 401");
  });

  it("8. Unauthenticated protected endpoints return 401", async () => {
    const tendersRes = await fetch(`${baseUrl}/api/v1/tenders`);
    assert.equal(tendersRes.status, 401);
    const tendersBody = (await tendersRes.json()) as ApiErrorResponse;
    assert.equal(tendersBody.error.code, "UNAUTHORIZED");

    const bidsRes = await fetch(`${baseUrl}/api/v1/bids`);
    assert.equal(bidsRes.status, 401);
    const bidsBody = (await bidsRes.json()) as ApiErrorResponse;
    assert.equal(bidsBody.error.code, "UNAUTHORIZED");
  });

  // =========================================================================
  // 2. RBAC (4 TESTS)
  // =========================================================================

  it("9. Bidder cannot create tenders (POST /tenders returns 403)", async () => {
    const bidderCookie = await loginAndGetCookie("bidder@apexinfra.bidsure.test", "Bidder@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderCookie,
      },
      body: JSON.stringify({
        title: "Unauthorized Tender Attempt by Bidder",
        referenceNumber: `TDR-FORBIDDEN-${Date.now()}`,
      }),
    });

    assert.equal(res.status, 403);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "FORBIDDEN");
  });

  it("10. Auditor cannot mutate resources (POST /tenders returns 403)", async () => {
    const auditorCookie = await loginAndGetCookie("auditor@nhai.bidsure.test", "Auditor@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: auditorCookie,
      },
      body: JSON.stringify({
        title: "Unauthorized Mutation by Auditor",
        referenceNumber: `TDR-AUDITOR-${Date.now()}`,
      }),
    });

    assert.equal(res.status, 403);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "FORBIDDEN");
  });

  it("11. Reviewer cannot mutate tenders (POST /tenders returns 403)", async () => {
    const reviewerCookie = await loginAndGetCookie("reviewer@nhai.bidsure.test", "Reviewer@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: reviewerCookie,
      },
      body: JSON.stringify({
        title: "Unauthorized Tender by Reviewer",
        referenceNumber: `TDR-REV-${Date.now()}`,
      }),
    });

    assert.equal(res.status, 403);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "FORBIDDEN");
  });

  it("12. Admin policy boundaries: Admin cannot act as procurement officer", async () => {
    const adminCookie = await loginAndGetCookie("admin@nhai.bidsure.test", "Admin@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        title: "Unauthorized Tender Creation by Admin",
        referenceNumber: `TDR-ADMIN-${Date.now()}`,
      }),
    });

    assert.equal(res.status, 403);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "FORBIDDEN");
  });

  // =========================================================================
  // 3. TENANT ISOLATION (5 TESTS)
  // =========================================================================

  it("13. Cross-tenant GET blocked: ORG-A Officer requesting ORG-B tender returns safe 404", async () => {
    const officerACookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");

    // SEED_IDS.tenderB belongs to ORG-B
    const res = await fetch(`${baseUrl}/api/v1/tenders/${SEED_IDS.tenderB}`, {
      headers: { Cookie: officerACookie },
    });

    assert.equal(res.status, 404, "Cross-tenant tender access must return 404 without leaking existence");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("14. Cross-tenant bid GET blocked: ORG-A Officer requesting ORG-B bid returns safe 404", async () => {
    const officerACookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");

    // SEED_IDS.bidB belongs to ORG-B
    const res = await fetch(`${baseUrl}/api/v1/bids/${SEED_IDS.bidB}`, {
      headers: { Cookie: officerACookie },
    });

    assert.equal(res.status, 404, "Cross-tenant bid access must return 404 without leaking existence");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("15. Cross-tenant list isolation: ORG-A Officer list returns only ORG-A records", async () => {
    const officerACookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders?page=1&pageSize=50`, {
      headers: { Cookie: officerACookie },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as PaginatedResponse<TenderDTO>;
    assert.ok(body.data.length >= 1);

    // Verify every single returned tender belongs strictly to ORG-A
    for (const tender of body.data) {
      assert.equal(tender.organizationId, SEED_IDS.orgA, "Every listed tender must belong to ORG-A");
      assert.notEqual(tender.id, SEED_IDS.tenderB, "ORG-B tender must not be in ORG-A list");
    }
  });

  it("16. Cross-tenant nested resource blocked: ORG-A user requesting ORG-B bid details returns 404", async () => {
    const officerACookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");

    const res = await fetch(`${baseUrl}/api/v1/bids/${SEED_IDS.bidB}`, {
      headers: { Cookie: officerACookie },
    });

    assert.equal(res.status, 404);
  });

  it("17. Same-org bidder-to-bidder isolation: Bidder A1 requesting Bidder A2 bid returns safe 404", async () => {
    const bidderA1Cookie = await loginAndGetCookie("bidder@apexinfra.bidsure.test", "Bidder@123");

    // SEED_IDS.bidA2 belongs to competitor Bidder A2 in the same organization
    const res = await fetch(`${baseUrl}/api/v1/bids/${SEED_IDS.bidA2}`, {
      headers: { Cookie: bidderA1Cookie },
    });

    assert.equal(res.status, 404, "Competitor bid must return 404 to bidder");
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "NOT_FOUND");
  });

  // =========================================================================
  // 4. IDENTITY TRUST (3 TESTS)
  // =========================================================================

  it("18. Client-provided organizationId cannot override tenant context", async () => {
    const officerACookie = await loginAndGetCookie("officer@nhai.bidsure.test", "Officer@123");
    const uniqueRef = `TDR-TRUST-${Date.now()}`;

    // Officer A attempts to create a tender specifying ORG-B
    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: officerACookie,
      },
      body: JSON.stringify({
        title: "Spoofed Tenant Tender",
        referenceNumber: uniqueRef,
        organizationId: SEED_IDS.orgB, // Attempting to spoof organization
      }),
    });

    assert.equal(res.status, 201);
    const body = (await res.json()) as ApiResponse<TenderDTO>;

    // CRITICAL: The created tender MUST belong to ORG-A, NOT the spoofed ORG-B
    assert.equal(
      body.data.organizationId,
      SEED_IDS.orgA,
      "Server must enforce authenticated tenant context and ignore client organizationId"
    );
  });

  it("19. Client-provided role in body/headers cannot escalate privileges", async () => {
    const bidderCookie = await loginAndGetCookie("bidder@apexinfra.bidsure.test", "Bidder@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderCookie,
        "x-user-role": "PROCUREMENT_OFFICER", // Spoofed role header
      },
      body: JSON.stringify({
        title: "Privilege Escalation Attempt",
        referenceNumber: `TDR-ESC-${Date.now()}`,
        role: "PROCUREMENT_OFFICER", // Spoofed role body
      }),
    });

    assert.equal(res.status, 403, "Spoofed role must be completely ignored");
  });

  it("20. Client-provided userId cannot impersonate another user", async () => {
    const bidderCookie = await loginAndGetCookie("bidder@apexinfra.bidsure.test", "Bidder@123");

    const res = await fetch(`${baseUrl}/api/v1/tenders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bidderCookie,
      },
      body: JSON.stringify({
        title: "Impersonation Attempt",
        referenceNumber: `TDR-IMP-${Date.now()}`,
        userId: SEED_IDS.officerA, // Spoofed user ID
      }),
    });

    assert.equal(res.status, 403, "Spoofed userId must be ignored");
  });

  // =========================================================================
  // 5. SECURITY HYGIENE & INPUT VALIDATION (5 TESTS)
  // =========================================================================

  it("21. Password hash never appears in login, /me, or any API response", async () => {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });

    const loginText = await loginRes.text();
    assert.ok(!loginText.includes("passwordHash"), "passwordHash must not appear in login response");
    assert.ok(!loginText.includes("$scrypt$"), "scrypt hash must not appear in login response");

    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    const meText = await meRes.text();
    assert.ok(!meText.includes("passwordHash"), "passwordHash must not appear in /me response");
  });

  it("22. Credentials never leaked in response payload or headers", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });
    const body = await res.text();
    assert.ok(!body.includes("Officer@123"), "plaintext password must never be reflected");
  });

  it("23. Malformed or forged session cookie returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: "bidsure_session=forged-invalid-session-token-12345" },
    });

    assert.equal(res.status, 401);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  it("24. Expired session returns 401 Unauthorized", async () => {
    // Create an explicitly expired session directly in DB
    const crypto = await import("node:crypto");
    const expiredToken = "expired_test_token_12345";
    const tokenHash = crypto.createHash("sha256").update(expiredToken).digest("hex");

    await prisma.session.create({
      data: {
        userId: (await prisma.user.findFirstOrThrow({ where: { email: "officer@nhai.bidsure.test" } })).id,
        tokenHash,
        expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
      },
    });

    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `bidsure_session=${expiredToken}` },
    });

    assert.equal(res.status, 401);
  });

  it("25. Malformed login input is rejected by Zod with 400 VALIDATION_ERROR", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "123", // too short (< 6 chars)
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ApiErrorResponse;
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(body.error.details));
  });

  // =========================================================================
  // 6. CRITICAL VERTICAL SLICE (1 TEST)
  // =========================================================================

  it("26. Critical Vertical Slice: Login → /me → Access Resource → Cross-tenant Denial → Logout → 401", async () => {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "officer@nhai.bidsure.test",
        password: "Officer@123",
      }),
    });
    assert.equal(loginRes.status, 200, "Step 1: Login must succeed");
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;

    // 2. GET /me (authoritative identity resolution)
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(meRes.status, 200, "Step 2: /me must succeed");
    const meBody = (await meRes.json()) as ApiResponse<{ user: UserDTO }>;
    assert.equal(meBody.data.user.email, "officer@nhai.bidsure.test");

    // 3. Access authorized resource (own org tender)
    const ownTenderRes = await fetch(`${baseUrl}/api/v1/tenders/${SEED_IDS.tenderA}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(ownTenderRes.status, 200, "Step 3: Accessing own tender must succeed");
    const ownTender = (await ownTenderRes.json()) as ApiResponse<TenderDTO>;
    assert.equal(ownTender.data.id, SEED_IDS.tenderA);

    // 4. Attempt cross-tenant resource (ORG-B tender)
    const crossTenantRes = await fetch(`${baseUrl}/api/v1/tenders/${SEED_IDS.tenderB}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(crossTenantRes.status, 404, "Step 4: Cross-tenant access must return safe 404");

    // 5. Logout
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    assert.equal(logoutRes.status, 200, "Step 5: Logout must succeed");

    // 6. Attempt protected resource with logged out cookie
    const protectedAfterLogout = await fetch(`${baseUrl}/api/v1/tenders/${SEED_IDS.tenderA}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(protectedAfterLogout.status, 401, "Step 6: Access after logout must return 401");
  });
});
