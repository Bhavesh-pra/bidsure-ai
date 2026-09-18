import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OfficerTendersPage } from "@/features/tenders/officer-tenders-page";
import { OfficerTenderDetailsPage } from "@/features/tenders/officer-tender-details-page";
import { OfficerTenderVersionPage } from "@/features/tenders/officer-tender-version-page";
import { tenderService } from "@/services/api/tender.service";
import { ApiError } from "@/services/api/api.errors";
import type { TenderDTO, TenderVersionDTO } from "@/types";

vi.mock("@/services/api/tender.service", () => ({
  tenderService: {
    getTenders: vi.fn(),
    getTenderById: vi.fn(),
    createTender: vi.fn(),
    updateTender: vi.fn(),
    publishTender: vi.fn(),
    closeTender: vi.fn(),
    archiveTender: vi.fn(),
    getTenderVersions: vi.fn(),
    getTenderVersion: vi.fn(),
    createTenderVersion: vi.fn(),
    getTenderRequirements: vi.fn(),
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

const mockTender: TenderDTO = {
  id: "00000000-0000-4000-a000-000000000021",
  organizationId: "00000000-0000-4000-a000-000000000001",
  title: "Automated Toll Plaza Highway Surveillance",
  referenceNumber: "TDR-2026-DEL-001",
  category: "Infrastructure",
  department: "National Highway Authority",
  status: "PUBLISHED",
  currentVersionId: "00000000-0000-4000-a000-000000000023",
  createdAt: "2026-09-17T12:00:00.000Z",
  updatedAt: "2026-09-18T10:00:00.000Z",
  currentVersion: {
    id: "00000000-0000-4000-a000-000000000023",
    tenderId: "00000000-0000-4000-a000-000000000021",
    versionNumber: 2,
    title: "Automated Toll Plaza Highway Surveillance - Corrigendum 1",
    description: "Expanded corridor coverage and amended deadline",
    content: {
      budget: 60000000,
      submissionDeadline: "2026-11-30T18:00:00.000Z",
    },
    changeSummary: "Corrigendum 1: Revised deadline and scope",
    status: "PUBLISHED",
    createdAt: "2026-09-18T10:00:00.000Z",
    isCurrent: true,
    requirements: [
      {
        id: "req-1",
        identifier: "TECH-01",
        category: "Technical",
        createdAt: "2026-09-17T12:00:00.000Z",
        currentVersion: {
          versionNumber: 1,
          description: "Must support ANPR camera integration",
          mandatory: true,
        },
      },
    ],
  },
  versionsCount: 2,
};

const mockVersionsList: TenderVersionDTO[] = [
  {
    id: "00000000-0000-4000-a000-000000000023",
    tenderId: "00000000-0000-4000-a000-000000000021",
    versionNumber: 2,
    title: "Corrigendum 1",
    description: "Expanded corridor coverage and amended deadline",
    content: { budget: 60000000 },
    changeSummary: "Corrigendum 1: Revised deadline and scope",
    status: "PUBLISHED",
    createdAt: "2026-09-18T10:00:00.000Z",
    isCurrent: true,
  },
  {
    id: "00000000-0000-4000-a000-000000000022",
    tenderId: "00000000-0000-4000-a000-000000000021",
    versionNumber: 1,
    title: "Initial Release",
    description: "Original specification",
    content: { budget: 50000000 },
    changeSummary: "Initial version created",
    status: "SUPERSEDED",
    createdAt: "2026-09-17T12:00:00.000Z",
    isCurrent: false,
  },
];

describe("Phase 06 — Frontend Tender & Versioning Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Officer Tender List Screen", () => {
    it("renders tender list with version number and reference", async () => {
      vi.mocked(tenderService.getTenders).mockResolvedValueOnce({
        success: true,
        data: [mockTender],
        meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
        requestId: "req_test_list",
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
        expect(screen.getByText("TDR-2026-DEL-001")).toBeInTheDocument();
        expect(screen.getByText("Automated Toll Plaza Highway Surveillance")).toBeInTheDocument();
        expect(screen.getByText("v2")).toBeInTheDocument();
      });
    });
  });

  describe("2. Officer Tender Details Screen", () => {
    it("displays current version spotlight and version history list with authoritative badges", async () => {
      vi.mocked(tenderService.getTenderById).mockResolvedValueOnce({
        success: true,
        data: mockTender,
        requestId: "req_test_detail",
      });
      vi.mocked(tenderService.getTenderVersions).mockResolvedValueOnce({
        success: true,
        data: mockVersionsList,
        requestId: "req_test_versions",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/officer/tenders/00000000-0000-4000-a000-000000000021"]}>
            <Routes>
              <Route path="/officer/tenders/:id" element={<OfficerTenderDetailsPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Spotlight banner
        expect(screen.getByText(/CURRENT VERSION v2/i)).toBeInTheDocument();
        // Version history table contains both CURRENT and HISTORICAL version labels
        expect(screen.getByText("CURRENT VERSION")).toBeInTheDocument();
        expect(screen.getByText("HISTORICAL VERSION")).toBeInTheDocument();
        expect(screen.getAllByText("Corrigendum 1: Revised deadline and scope").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("handles 409 concurrency conflict when creating a version", async () => {
      vi.mocked(tenderService.getTenderById).mockResolvedValue({
        success: true,
        data: mockTender,
        requestId: "req_test_detail",
      });
      vi.mocked(tenderService.getTenderVersions).mockResolvedValue({
        success: true,
        data: mockVersionsList,
        requestId: "req_test_versions",
      });

      // Mock conflict error adhering to ApiError signature
      const conflictError = new ApiError({
        code: "CONFLICT",
        message: "This tender was updated by another user. Refresh to review the latest version.",
        status: 409,
      });
      vi.mocked(tenderService.createTenderVersion).mockRejectedValueOnce(conflictError);

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/officer/tenders/00000000-0000-4000-a000-000000000021"]}>
            <Routes>
              <Route path="/officer/tenders/:id" element={<OfficerTenderDetailsPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Create New Version")).toBeInTheDocument();
      });

      // Open version creation modal
      fireEvent.click(screen.getByText("Create New Version"));

      await waitFor(() => {
        expect(screen.getByText("Create New Tender Version")).toBeInTheDocument();
      });

      // Fill change summary
      const summaryInput = screen.getByPlaceholderText(/Corrigendum 1:/i);
      fireEvent.change(summaryInput, { target: { value: "Conflicting update" } });

      // Submit form
      fireEvent.submit(summaryInput.closest("form")!);

      await waitFor(() => {
        expect(
          screen.getByText("This tender was updated by another user. Refresh to review the latest version.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("3. Historical Version Snapshot Screen", () => {
    it("renders HISTORICAL VERSION banner and read-only message when viewing historical version", async () => {
      vi.mocked(tenderService.getTenderById).mockResolvedValueOnce({
        success: true,
        data: mockTender,
        requestId: "req_test_tender",
      });
      vi.mocked(tenderService.getTenderVersion).mockResolvedValueOnce({
        success: true,
        data: mockVersionsList[1], // Version 1 (historical, isCurrent: false)
        requestId: "req_test_v1",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter
            initialEntries={[
              "/officer/tenders/00000000-0000-4000-a000-000000000021/versions/00000000-0000-4000-a000-000000000022",
            ]}
          >
            <Routes>
              <Route
                path="/officer/tenders/:id/versions/:versionId"
                element={<OfficerTenderVersionPage />}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/HISTORICAL VERSION v1/i)).toBeInTheDocument();
        expect(screen.getByText(/Immutable Evidentiary Snapshot/i)).toBeInTheDocument();
        expect(screen.getByText("Original specification")).toBeInTheDocument();
      });
    });

    it("renders CURRENT VERSION banner when viewing active version snapshot", async () => {
      vi.mocked(tenderService.getTenderById).mockResolvedValueOnce({
        success: true,
        data: mockTender,
        requestId: "req_test_tender",
      });
      vi.mocked(tenderService.getTenderVersion).mockResolvedValueOnce({
        success: true,
        data: mockVersionsList[0], // Version 2 (active, isCurrent: true)
        requestId: "req_test_v2",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter
            initialEntries={[
              "/officer/tenders/00000000-0000-4000-a000-000000000021/versions/00000000-0000-4000-a000-000000000023",
            ]}
          >
            <Routes>
              <Route
                path="/officer/tenders/:id/versions/:versionId"
                element={<OfficerTenderVersionPage />}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/CURRENT VERSION v2/i)).toBeInTheDocument();
        expect(screen.getByText(/Active Baseline/i)).toBeInTheDocument();
      });
    });
  });
});
