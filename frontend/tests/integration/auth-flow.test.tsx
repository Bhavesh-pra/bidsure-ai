import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route, createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { LoginPage } from "@/features/auth/login-page";
import { ForbiddenPage } from "@/features/error/forbidden-page";
import { Topbar } from "@/components/navigation/topbar";
import { authService, healthService } from "@/services/api";

// Mock API services
vi.mock("@/services/api/auth.service", () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("@/services/api/health.service", () => ({
  healthService: {
    getHealth: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

describe("Phase 04 Frontend Authentication & RBAC Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(healthService.getHealth).mockResolvedValue({
      success: true,
      data: { status: "ok", service: "bidsure-api", version: "1.0.0" },
      requestId: "req_health_mock",
    });
  });

  it("LoginPage renders official login form with synthetic demo personas", async () => {
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error("Unauthorized"));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/auth/login"]}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByRole("heading", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Official Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Procurement Officer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bidder \(Apex\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reviewer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Auditor/i })).toBeInTheDocument();
  });

  it("Clicking quick-fill persona populates the credentials form", async () => {
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error("Unauthorized"));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/auth/login"]}>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const bidderBtn = screen.getByRole("button", { name: /Bidder \(Apex\)/i });
    fireEvent.click(bidderBtn);

    const emailInput = screen.getByLabelText(/Official Email/i) as HTMLInputElement;
    expect(emailInput.value).toBe("bidder1@apexinfra.bidsure.test");
  });

  it("ProtectedRoute redirects unauthenticated visitor to /auth/login", async () => {
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error("Unauthorized"));

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route
                path="/protected"
                element={
                  <ProtectedRoute>
                    <div>Protected Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/login" element={<div>Login Page Mock</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Login Page Mock")).toBeInTheDocument();
    });
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("ForbiddenPage displays access denied and dashboard return navigation", async () => {
    vi.mocked(authService.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        id: "mock-officer-id",
        email: "officer@nhai.bidsure.test",
        fullName: "NHAI Officer",
        role: "PROCUREMENT_OFFICER",
        organizationId: "mock-org-id",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      requestId: "req_mock",
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/403"]}>
            <ForbiddenPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return to Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Switch Account/i })).toBeInTheDocument();
  });

  it("Topbar displays user name and role badge when authenticated", async () => {
    vi.mocked(authService.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        id: "mock-officer-id",
        email: "officer@nhai.bidsure.test",
        fullName: "Rajesh Sharma",
        role: "PROCUREMENT_OFFICER",
        organizationId: "mock-org-id",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      requestId: "req_mock",
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter>
            <Topbar />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
      expect(screen.getByText("Procurement Officer")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Sign Out/i })).toBeInTheDocument();
  });
});
