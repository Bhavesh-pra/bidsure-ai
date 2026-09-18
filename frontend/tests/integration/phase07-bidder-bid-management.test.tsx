import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BidderTenderDetailsPage } from "@/features/tenders/bidder-tender-details-page";
import { BidderCreateBidPage } from "@/features/bids/bidder-create-bid-page";
import { BidderBidWorkspacePage } from "@/features/bids/bidder-bid-workspace-page";
import { OfficerBidDetailsPage } from "@/features/bids/officer-bid-details-page";
import { tenderService, bidService } from "@/services/api";

// Mock services
vi.mock("@/services/api/tender.service", () => ({
  tenderService: {
    getTenders: vi.fn(),
    getTenderById: vi.fn(),
    getTenderVersions: vi.fn(),
    getTenderVersion: vi.fn(),
    getTenderRequirements: vi.fn(),
  },
}));

vi.mock("@/services/api/bid.service", () => ({
  bidService: {
    getBids: vi.fn(),
    getBidById: vi.fn(),
    createBid: vi.fn(),
    updateDraftBid: vi.fn(),
    submitBid: vi.fn(),
  },
}));

vi.mock("@/services/api/document.service", () => ({
  documentService: {
    getDocuments: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getDocumentById: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    retryDocument: vi.fn(),
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

describe("Phase 07 — Bidder & Bid Management Frontend Vertical Slice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTender = {
    id: "tender-uuid-1",
    organizationId: "org-1",
    title: "Automated Toll Plaza System",
    referenceNumber: "TDR-2026-DEL-001",
    status: "PUBLISHED",
    currentVersionId: "ver-uuid-2",
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z",
    currentVersion: {
      id: "ver-uuid-2",
      tenderId: "tender-uuid-1",
      versionNumber: 2,
      title: "Automated Toll Plaza System v2",
      description: "Advanced ANPR integration",
      content: {},
      status: "PUBLISHED",
      createdAt: "2026-03-05T10:00:00.000Z",
    },
  };

  const mockVersions = [
    {
      id: "ver-uuid-1",
      tenderId: "tender-uuid-1",
      versionNumber: 1,
      title: "Initial Tender Spec",
      changeSummary: "Initial version",
      status: "PUBLISHED",
      createdAt: "2026-03-01T10:00:00.000Z",
    },
    {
      id: "ver-uuid-2",
      tenderId: "tender-uuid-1",
      versionNumber: 2,
      title: "Revised Specification with ANPR",
      changeSummary: "Added ANPR requirements",
      status: "PUBLISHED",
      createdAt: "2026-03-05T10:00:00.000Z",
    },
  ];

  it("1. Bidder selects tender and specific TenderVersion on BidderTenderDetailsPage", async () => {
    vi.mocked(tenderService.getTenderById).mockResolvedValueOnce({
      success: true,
      data: mockTender as any,
      requestId: "req_tender_detail",
    });

    vi.mocked(tenderService.getTenderVersions).mockResolvedValueOnce({
      success: true,
      data: mockVersions as any,
      requestId: "req_tender_versions",
    });

    vi.mocked(tenderService.getTenderRequirements).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: "req-1",
          identifier: "REQ-01",
          category: "ANPR Accuracy",
          createdAt: "2026-03-01T10:00:00.000Z",
          currentVersion: {
            versionNumber: 1,
            description: "99.5% ANPR plate recognition accuracy required",
            mandatory: true,
          },
        },
      ],
      requestId: "req_reqs",
    });

    vi.mocked(bidService.getBids).mockResolvedValueOnce({
      success: true,
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      requestId: "req_bids",
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/bidder/tenders/tender-uuid-1"]}>
          <Routes>
            <Route path="/bidder/tenders/:id" element={<BidderTenderDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Automated Toll Plaza System")).toBeInTheDocument();
      expect(screen.getByText(/This bid will be submitted against Version 2/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Create Proposal against v2")).toBeInTheDocument();
  });

  it("2. Bidder creates a new bid proposal draft on BidderCreateBidPage", async () => {
    vi.mocked(tenderService.getTenderById).mockResolvedValueOnce({
      success: true,
      data: mockTender as any,
      requestId: "req_tender",
    });

    vi.mocked(tenderService.getTenderVersion).mockResolvedValueOnce({
      success: true,
      data: mockVersions[1] as any,
      requestId: "req_ver",
    });

    vi.mocked(bidService.createBid).mockResolvedValueOnce({
      success: true,
      data: {
        id: "new-bid-123",
        organizationId: "org-1",
        tenderId: "tender-uuid-1",
        tenderVersionId: "ver-uuid-2",
        bidderId: "bidder-1",
        bidReference: "BID-2026-APEX-001",
        status: "DRAFT",
        version: 1,
        totalAmount: 48000000,
        currency: "INR",
        submittedAt: null,
        createdAt: "2026-03-10T10:00:00.000Z",
        updatedAt: "2026-03-10T10:00:00.000Z",
      },
      requestId: "req_create",
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/bidder/bids/new?tenderId=tender-uuid-1&versionId=ver-uuid-2"]}>
          <Routes>
            <Route path="/bidder/bids/new" element={<BidderCreateBidPage />} />
            <Route path="/bidder/bids/:id" element={<div>Workspace Page for new-bid-123</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Initialize Proposal Workspace/i)).toBeInTheDocument();
    });

    // Enter total amount
    const amountInput = screen.getByPlaceholderText(/45000000/i);
    fireEvent.change(amountInput, { target: { value: "48000000" } });

    // Submit form
    const createButton = screen.getByRole("button", { name: /Initialize Bid Proposal/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(bidService.createBid).toHaveBeenCalledWith(
        expect.objectContaining({
          tenderId: "tender-uuid-1",
          tenderVersionId: "ver-uuid-2",
          totalAmount: 48000000,
          currency: "INR",
        })
      );
      expect(screen.getByText("Workspace Page for new-bid-123")).toBeInTheDocument();
    });
  });

  it("3. Bidder workspace allows DRAFT edits and locks when SUBMITTED", async () => {
    const draftBid = {
      id: "bid-draft-1",
      organizationId: "org-1",
      tenderId: "tender-uuid-1",
      tenderVersionId: "ver-uuid-2",
      bidderId: "bidder-1",
      bidReference: "BID-2026-APEX-002",
      status: "DRAFT",
      version: 1,
      totalAmount: 50000000,
      currency: "INR",
      metadata: { proposalNote: "Draft toll solution" },
      submittedAt: null,
      createdAt: "2026-03-10T10:00:00.000Z",
      updatedAt: "2026-03-10T10:00:00.000Z",
      tender: {
        id: "tender-uuid-1",
        title: "Automated Toll Plaza System",
        referenceNumber: "TDR-2026-DEL-001",
      },
      tenderVersion: {
        id: "ver-uuid-2",
        versionNumber: 2,
        title: "Revised Specification with ANPR",
      },
    };

    let currentBid = { ...draftBid };
    vi.mocked(bidService.getBidById).mockImplementation(async () => ({
      success: true,
      data: currentBid as any,
      requestId: "req_bid_workspace",
    }));

    vi.mocked(bidService.updateDraftBid).mockImplementation(async (_id, payload) => {
      currentBid = {
        ...currentBid,
        totalAmount: payload.totalAmount ?? currentBid.totalAmount,
        currency: payload.currency ?? currentBid.currency,
        version: currentBid.version + 1,
      };
      return {
        success: true,
        data: currentBid as any,
        requestId: "req_bid_updated",
      };
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/bidder/bids/bid-draft-1"]}>
          <Routes>
            <Route path="/bidder/bids/:id" element={<BidderBidWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Draft Proposal Workspace")).toBeInTheDocument();
      expect(screen.getByText("concurrency: v1")).toBeInTheDocument();
    });

    // Save draft edit
    const amountInput = screen.getByDisplayValue("50000000");
    fireEvent.change(amountInput, { target: { value: "49500000" } });

    const saveDraftBtn = screen.getByRole("button", { name: /Save Draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(bidService.updateDraftBid).toHaveBeenCalledWith(
        "bid-draft-1",
        expect.objectContaining({
          totalAmount: 49500000,
          expectedVersion: 1,
        })
      );
      expect(screen.getByText(/Draft proposal successfully saved/i)).toBeInTheDocument();
    });
  });

  it("4. Explicit submission displays irreversible confirmation modal and calls submit with Idempotency-Key", async () => {
    const draftBid = {
      id: "bid-draft-2",
      organizationId: "org-1",
      tenderId: "tender-uuid-1",
      tenderVersionId: "ver-uuid-2",
      bidderId: "bidder-1",
      bidReference: "BID-2026-APEX-003",
      status: "DRAFT",
      version: 2,
      totalAmount: 49500000,
      currency: "INR",
      submittedAt: null,
      createdAt: "2026-03-10T10:00:00.000Z",
      updatedAt: "2026-03-10T10:00:00.000Z",
      tender: {
        id: "tender-uuid-1",
        title: "Automated Toll Plaza System",
        referenceNumber: "TDR-2026-DEL-001",
      },
      tenderVersion: {
        id: "ver-uuid-2",
        versionNumber: 2,
        title: "Revised Specification with ANPR",
      },
    };

    let currentBid = { ...draftBid };
    vi.mocked(bidService.getBidById).mockImplementation(async () => ({
      success: true,
      data: currentBid as any,
      requestId: "req_bid_workspace_submit",
    }));

    vi.mocked(bidService.submitBid).mockImplementation(async () => {
      currentBid = {
        ...currentBid,
        status: "SUBMITTED",
        version: currentBid.version + 1,
        submittedAt: "2026-03-15T12:00:00.000Z",
      };
      return {
        success: true,
        data: currentBid as any,
        requestId: "req_submitted",
      };
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/bidder/bids/bid-draft-2"]}>
          <Routes>
            <Route path="/bidder/bids/:id" element={<BidderBidWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("BID-2026-APEX-003")).toBeInTheDocument();
    });

    // Click submit proposal button
    const submitBtn = screen.getByRole("button", { name: /Submit Bid Proposal/i });
    fireEvent.click(submitBtn);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByText(/Confirm Official Bid Submission/i)).toBeInTheDocument();
      expect(screen.getByText(/Irreversible state transition to SUBMITTED/i)).toBeInTheDocument();
    });

    // Confirm submit in modal
    const confirmBtn = screen.getByRole("button", { name: /Confirm & Submit/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(bidService.submitBid).toHaveBeenCalledWith(
        "bid-draft-2",
        expect.any(String) // UUID idempotency key
      );
      expect(screen.getByText(/Proposal officially submitted and locked/i)).toBeInTheDocument();
    });
  });

  it("5. Procurement Officer details page preserves exact historical TenderVersion snapshot", async () => {
    const submittedBid = {
      id: "bid-submitted-1",
      organizationId: "org-1",
      tenderId: "tender-uuid-1",
      tenderVersionId: "ver-uuid-1", // Version 1, even if tender now has Version 2!
      bidderId: "bidder-1",
      bidReference: "BID-2026-APEX-001",
      status: "SUBMITTED",
      version: 2,
      totalAmount: 42500000,
      currency: "INR",
      metadata: {
        proposalNote: "Apex Technical & Commercial Proposal",
        executiveSummary: "Turnkey delivery with 5-year SLA.",
      },
      submittedAt: "2026-03-02T10:00:00.000Z",
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z",
      bidder: {
        id: "bidder-1",
        legalName: "Apex Infrastructure Solutions Ltd",
        tradeName: "Apex Infra",
        contactEmail: "contracts@apexinfra.test",
      },
      tender: {
        id: "tender-uuid-1",
        title: "Automated Toll Plaza System",
        referenceNumber: "TDR-2026-DEL-001",
      },
      tenderVersion: {
        id: "ver-uuid-1",
        versionNumber: 1,
        title: "Initial Tender Spec",
      },
      documents: [],
    };

    vi.mocked(bidService.getBidById).mockResolvedValueOnce({
      success: true,
      data: submittedBid as any,
      requestId: "req_officer_bid",
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/officer/bids/bid-submitted-1"]}>
          <Routes>
            <Route path="/officer/bids/:id" element={<OfficerBidDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Proposal for: Automated Toll Plaza System")).toBeInTheDocument();
      expect(
        screen.getByText(/Authoritative Specification Snapshot: Version 1/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Turnkey delivery with 5-year SLA/i)
      ).toBeInTheDocument();
    });
  });
});
