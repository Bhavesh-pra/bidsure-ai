import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OfficerTendersPage } from "@/features/tenders/officer-tenders-page";
import { OfficerBidsPage } from "@/features/bids/officer-bids-page";
import { tenderService, bidService } from "@/services/api";

// Mock services
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

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("Phase 03 Application Shell — Tenders & Bids Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Officer Tenders View", () => {
    it("renders empty state when no tenders exist", async () => {
      vi.mocked(tenderService.getTenders).mockResolvedValueOnce({
        success: true,
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        requestId: "req_test_empty",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerTendersPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("No Tenders Found")).toBeInTheDocument();
      });
      expect(screen.getByText("Create First Tender")).toBeInTheDocument();
    });

    it("renders table with tenders when tenders are returned from API", async () => {
      vi.mocked(tenderService.getTenders).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: "11111111-1111-4111-a111-111111111111",
            organizationId: "org-1",
            title: "Road Construction & Asphalt Paving",
            referenceNumber: "TND-2026-001",
            status: "PUBLISHED",
            currentVersionId: "v-1",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            currentVersion: {
              id: "v-1",
              tenderId: "11111111-1111-4111-a111-111111111111",
              versionNumber: 1,
              title: "Road Construction & Asphalt Paving v1",
              description: "Scope includes 50km highway",
              content: {},
              status: "PUBLISHED",
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          },
        ],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        requestId: "req_test_tenders",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerTendersPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("TND-2026-001")).toBeInTheDocument();
      });
      expect(screen.getByText("Road Construction & Asphalt Paving")).toBeInTheDocument();
      expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
      expect(screen.getByText("Scope includes 50km highway")).toBeInTheDocument();
    });

    it("renders error state when backend API call fails", async () => {
      vi.mocked(tenderService.getTenders).mockRejectedValueOnce({
        code: "DATABASE_ERROR",
        message: "Failed to connect to database",
        requestId: "req_err_1",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerTendersPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Failed to load tenders")).toBeInTheDocument();
      });
      expect(screen.getByText("Failed to connect to database")).toBeInTheDocument();
      expect(screen.getByText("req_err_1")).toBeInTheDocument();
    });
  });

  describe("Officer Bids View", () => {
    it("renders empty state when no bids exist", async () => {
      vi.mocked(bidService.getBids).mockResolvedValueOnce({
        success: true,
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        requestId: "req_test_bids_empty",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerBidsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("No Bids Submitted")).toBeInTheDocument();
      });
    });

    it("renders bids list with vendor details and proposal amount", async () => {
      vi.mocked(bidService.getBids).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: "22222222-2222-4222-a222-222222222222",
            organizationId: "org-1",
            tenderId: "11111111-1111-4111-a111-111111111111",
            tenderVersionId: "v-1",
            bidderId: "bidder-1",
            bidReference: "BID-2026-999",
            status: "SUBMITTED",
            totalAmount: 4500000,
            currency: "USD",
            submittedAt: "2026-02-01T00:00:00.000Z",
            createdAt: "2026-02-01T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
            bidder: {
              id: "bidder-1",
              legalName: "Acme Infrastructure Pvt Ltd",
              tradeName: "Acme Infra",
              contactEmail: "bids@acmeinfra.com",
            },
            tender: {
              id: "11111111-1111-4111-a111-111111111111",
              title: "Road Construction & Asphalt Paving",
              referenceNumber: "TND-2026-001",
            },
          },
        ],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        requestId: "req_test_bids",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerBidsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("BID-2026-999")).toBeInTheDocument();
      });
      expect(screen.getByText("Acme Infrastructure Pvt Ltd")).toBeInTheDocument();
      expect(screen.getByText("SUBMITTED")).toBeInTheDocument();
      expect(screen.getByText(/4,500,000 USD/)).toBeInTheDocument();
    });
  });
});
