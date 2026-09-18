import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequirementsPage } from "@/features/requirements/requirements-page";
import { requirementService } from "@/services/api/requirement.service";
import { tenderService } from "@/services/api/tender.service";
import type { RequirementDTO, RuleCatalogItem } from "@/types";

vi.mock("@/services/api/requirement.service", () => ({
  requirementService: {
    getRequirementsByTenderVersion: vi.fn(),
    getRequirementById: vi.fn(),
    getRequirementVersionHistory: vi.fn(),
    getRuleCatalog: vi.fn(),
    createRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    approveRequirement: vi.fn(),
    rejectRequirement: vi.fn(),
    mapComplianceRule: vi.fn(),
    extractRequirements: vi.fn(),
  },
}));

vi.mock("@/services/api/tender.service", () => ({
  tenderService: {
    getTenderById: vi.fn(),
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

const mockTender = {
  id: "tender-100",
  title: "Modern Metro Rail Signaling System",
  referenceNumber: "TD-METRO-2026-001",
  currentVersionId: "ver-100",
  currentVersion: {
    id: "ver-100",
    versionNumber: 1,
  },
};

const mockCatalog: RuleCatalogItem[] = [
  {
    id: "TURNOVER_MINIMUM",
    name: "Minimum Annual Turnover",
    category: "TURNOVER",
    description: "Evaluates bidder turnover against threshold.",
    defaultVersion: 1,
    supportedOperators: ["GREATER_THAN_OR_EQUAL"],
    requiredParameters: [
      { name: "unit", type: "string", description: "INR", required: true },
      { name: "financialYears", type: "number", description: "3", required: true },
    ],
    expectedEvidenceType: "AUDITED_FINANCIAL_STATEMENT",
  },
  {
    id: "GST_STATUS",
    name: "GST Registration & Active Status",
    category: "GST_REGISTRATION",
    description: "Checks whether bidder holds active GSTIN.",
    defaultVersion: 1,
    supportedOperators: ["STATUS_EQUALS", "EQUALS"],
    requiredParameters: [
      { name: "expectedStatus", type: "string", description: "Active", required: true },
    ],
    expectedEvidenceType: "GST_CERTIFICATE",
  },
];

const mockReqProposed: RequirementDTO = {
  id: "req-1",
  tenderId: "tender-100",
  tenderVersionId: "ver-100",
  identifier: "REQ-2026-0001",
  category: "TURNOVER",
  currentVersionId: "ver-req-1",
  currentVersion: {
    id: "ver-req-1",
    requirementId: "req-1",
    tenderVersionId: "ver-100",
    versionNumber: 1,
    status: "PROPOSED",
    category: "TURNOVER",
    title: "Minimum Annual Turnover 50 Cr",
    description: "Average annual turnover of preceding 3 financial years must exceed 50 Cr.",
    mandatory: true,
    condition: "turnover >= 500000000",
    operator: "GREATER_THAN_OR_EQUAL",
    expectedValue: "500000000",
    requiredEvidenceType: "AUDITED_FINANCIAL_STATEMENT",
    source: {
      clauseRef: "Clause 3.1.2",
      page: 14,
      text: "Bidder must have minimum turnover of INR 50 Cr.",
    },
    ai: {
      generated: true,
      confidence: 0.94,
    },
    createdAt: "2026-03-01T10:00:00Z",
    ruleMapping: {
      id: "rule-map-1",
      ruleId: "TURNOVER_MINIMUM",
      ruleVersion: 1,
      operator: "GREATER_THAN_OR_EQUAL",
      expectedValue: "500000000",
    },
  },
  versionsCount: 1,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

const mockReqUnmapped: RequirementDTO = {
  id: "req-2",
  tenderId: "tender-100",
  tenderVersionId: "ver-100",
  identifier: "REQ-2026-0002",
  category: "OTHER",
  currentVersionId: "ver-req-2",
  currentVersion: {
    id: "ver-req-2",
    requirementId: "req-2",
    tenderVersionId: "ver-100",
    versionNumber: 1,
    status: "IN_REVIEW",
    category: "OTHER",
    title: "Integrity Pact Commitment",
    description: "Signed integrity pact submission is required.",
    mandatory: true,
    source: {
      clauseRef: null,
      page: null,
      text: "Integrity pact required.",
    },
    ai: {
      generated: false,
    },
    createdAt: "2026-03-01T11:00:00Z",
    ruleMapping: null,
  },
  versionsCount: 1,
  createdAt: "2026-03-01T11:00:00Z",
  updatedAt: "2026-03-01T11:00:00Z",
};

const renderWorkspace = () => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/officer/tenders/tender-100/versions/ver-100/requirements"]}>
        <Routes>
          <Route
            path="/officer/tenders/:id/versions/:versionId/requirements"
            element={<RequirementsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Phase 10 — Frontend Requirements Workspace & Review Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(tenderService.getTenderById).mockResolvedValue({
      success: true,
      data: mockTender as any,
      requestId: "req-test",
    });

    vi.mocked(requirementService.getRequirementsByTenderVersion).mockResolvedValue({
      success: true,
      data: [mockReqProposed, mockReqUnmapped],
      meta: {
        total: 2,
        page: 1,
        pageSize: 15,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      requestId: "req-test",
    });

    vi.mocked(requirementService.getRuleCatalog).mockResolvedValue({
      success: true,
      data: mockCatalog,
      requestId: "req-test",
    });

    vi.mocked(requirementService.getRequirementById).mockResolvedValue({
      success: true,
      data: mockReqProposed,
      requestId: "req-test",
    });

    vi.mocked(requirementService.getRequirementVersionHistory).mockResolvedValue({
      success: true,
      data: [mockReqProposed.currentVersion!],
      requestId: "req-test",
    });
  });

  it("Renders header, metrics, and requirement rows correctly", async () => {
    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByText("Modern Metro Rail Signaling System")).toBeInTheDocument();
      expect(screen.getByText("REQ-2026-0001")).toBeInTheDocument();
      expect(screen.getByText("REQ-2026-0002")).toBeInTheDocument();
    });

    // Verify metrics
    expect(screen.getByText("Total Requirements")).toBeInTheDocument();
    expect(screen.getAllByText("AI Proposed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Approved Baseline")).toBeInTheDocument();
  });

  it("Displays advisory AI badge and source clause citation", async () => {
    renderWorkspace();

    await waitFor(() => {
      expect(screen.getAllByText("AI Proposed").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Clause 3.1.2")).toBeInTheDocument();
      expect(screen.getByText("Page 14")).toBeInTheDocument();
      expect(screen.getByText("TURNOVER_MINIMUM")).toBeInTheDocument();
    });
  });

  it("Displays warnings for unmapped rule and missing citation", async () => {
    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByText("Citation Missing ⚠️")).toBeInTheDocument();
      expect(screen.getByText("Unmapped ⚠️")).toBeInTheDocument();
    });
  });

  it("Opens detail review modal and inspects provenance and rule mapping", async () => {
    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByText("REQ-2026-0001")).toBeInTheDocument();
    });

    // Click on the specific requirement review button
    const reviewButton = screen.getByRole("button", { name: "Review REQ-2026-0001" });
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText("Evidentiary Source Provenance")).toBeInTheDocument();
      expect(screen.getByText("All Statutory Review Prerequisites Met")).toBeInTheDocument();
    });
  });

  it("Allows triggering approve mutation with expectedCurrentVersionId", async () => {
    vi.mocked(requirementService.approveRequirement).mockResolvedValue({
      success: true,
      data: {
        ...mockReqProposed,
        currentVersion: {
          ...mockReqProposed.currentVersion!,
          status: "APPROVED",
        },
      },
      requestId: "req-test",
    });

    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByText("REQ-2026-0001")).toBeInTheDocument();
    });

    const reviewButton = screen.getByRole("button", { name: "Review REQ-2026-0001" });
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Approve Requirement/i })).toBeInTheDocument();
    });

    const approveButton = screen.getByRole("button", { name: /Approve Requirement/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(requirementService.approveRequirement).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({
          expectedCurrentVersionId: "ver-req-1",
        })
      );
    });
  });
});
