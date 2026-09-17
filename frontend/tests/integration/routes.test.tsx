import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "@/app/router";
import { tenderService, bidService, healthService } from "@/services/api";

// Mock API services
vi.mock("@/services/api/tender.service", () => ({
  tenderService: {
    getTenders: vi.fn(),
    getTenderById: vi.fn(),
    createTender: vi.fn(),
  },
}));

vi.mock("@/services/api/bid.service", () => ({
  bidService: {
    getBids: vi.fn(),
    getBidById: vi.fn(),
  },
}));

vi.mock("@/services/api/health.service", () => ({
  healthService: {
    getHealth: vi.fn(),
  },
}));

const createTestClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe("Route Integration & Entry Verification (Phase 03.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(tenderService.getTenders).mockResolvedValue({
      success: true,
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      requestId: "req_mock",
    });

    vi.mocked(bidService.getBids).mockResolvedValue({
      success: true,
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      requestId: "req_mock",
    });

    vi.mocked(healthService.getHealth).mockResolvedValue({
      success: true,
      data: { status: "ok", service: "bidsure-api", version: "1.0.0" },
      requestId: "req_mock",
    });
  });

  const renderRoute = (initialPath: string) => {
    const memoryRouter = createMemoryRouter(router.routes, {
      initialEntries: [initialPath],
    });
    const client = createTestClient();

    return render(
      <QueryClientProvider client={client}>
        <RouterProvider router={memoryRouter} />
      </QueryClientProvider>
    );
  };

  it("loads root '/' government procurement portal landing page", async () => {
    renderRoute("/");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /BidSure.*e-Procurement Portal/i })).toBeInTheDocument();
      expect(screen.getByText(/Designated Access Portals/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Officer Console/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Bidder Portal/i).length).toBeGreaterThan(0);
    });
  });

  it("loads '/health-ui' as Phase 02 diagnostic page", async () => {
    renderRoute("/health-ui");
    await waitFor(() => {
      expect(screen.getByText("System Health")).toBeInTheDocument();
      expect(screen.getByText("bidsure-api")).toBeInTheDocument();
    });
  });

  it("loads '/error-test' developer error testing page", async () => {
    renderRoute("/error-test");
    await waitFor(() => {
      expect(screen.getByText("Error Integration Test")).toBeInTheDocument();
    });
  });

  it("loads '/officer/tenders' within officer shell", async () => {
    renderRoute("/officer/tenders");
    await waitFor(() => {
      expect(screen.getByText(/Tender Solicitations/i)).toBeInTheDocument();
      expect(screen.getByText(/New Tender/i)).toBeInTheDocument();
    });
  });

  it("loads '/officer/bids' within officer shell", async () => {
    renderRoute("/officer/bids");
    await waitFor(() => {
      expect(screen.getByText(/Bids & Vendor Submissions/i)).toBeInTheDocument();
    });
  });

  it("loads '/bidder/tenders' within bidder shell", async () => {
    renderRoute("/bidder/tenders");
    await waitFor(() => {
      expect(screen.getByText(/Find Solicitations & Tenders/i)).toBeInTheDocument();
    });
  });

  it("loads '/bidder/bids' within bidder shell", async () => {
    renderRoute("/bidder/bids");
    await waitFor(() => {
      expect(screen.getByText(/My Proposals & Submissions/i)).toBeInTheDocument();
    });
  });
});
