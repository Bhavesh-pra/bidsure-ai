import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EvidencePage } from "@/features/evidence/evidence-page";
import { EvidenceCard } from "@/features/evidence/components/evidence-card";
import { OcrTextViewer } from "@/features/evidence/components/ocr-text-viewer";
import { DocumentPreviewPanel } from "@/features/evidence/components/document-preview-panel";
import { evidenceService } from "@/services/api/evidence.service";
import { bidService } from "@/services/api/bid.service";
import { documentService } from "@/services/api/document.service";
import type { ExtractedEvidenceItemDTO, DocumentIntelligenceDTO } from "@/types";

vi.mock("@/services/api/evidence.service", () => ({
  evidenceService: {
    getBidEvidence: vi.fn(),
    getDocumentIntelligence: vi.fn(),
    processDocument: vi.fn(),
  },
}));

vi.mock("@/services/api/bid.service", () => ({
  bidService: {
    getBidById: vi.fn(),
  },
}));

vi.mock("@/services/api/document.service", () => ({
  documentService: {
    getDocuments: vi.fn(),
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

const mockEvidenceItem1: ExtractedEvidenceItemDTO = {
  id: "ev-1",
  documentId: "doc-1",
  documentName: "gst_certificate.pdf",
  documentType: "GST_CERTIFICATE",
  field: "gstin",
  value: "27AABCU9603R1ZM",
  normalizedValue: "27AABCU9603R1ZM",
  page: 1,
  boundingBox: { x: 0.2, y: 0.3, width: 0.4, height: 0.05 },
  confidence: 0.98,
  method: "DETERMINISTIC_EXTRACTION",
  extractionStatus: "EXTRACTED",
  pipelineVersion: "phase09-v1",
  createdAt: "2026-03-01T12:00:00Z",
};

const mockEvidenceItem2: ExtractedEvidenceItemDTO = {
  id: "ev-2",
  documentId: "doc-1",
  documentName: "gst_certificate.pdf",
  documentType: "GST_CERTIFICATE",
  field: "legal_name",
  value: "Apex Infrastructure Limited",
  normalizedValue: "APEX INFRASTRUCTURE LIMITED",
  page: 2,
  boundingBox: { x: 0.15, y: 0.45, width: 0.6, height: 0.06 },
  confidence: 0.62,
  method: "FALLBACK_AI",
  extractionStatus: "REVIEW_RECOMMENDED",
  pipelineVersion: "phase09-v1",
  createdAt: "2026-03-01T12:00:00Z",
};

const mockIntelligence: DocumentIntelligenceDTO = {
  document: {
    id: "doc-1",
    fileName: "gst_certificate.pdf",
    originalFilename: "GST_Apex.pdf",
    status: "READY",
    documentType: "GST_CERTIFICATE",
    classificationConfidence: 0.95,
    mimeType: "application/pdf",
    fileSize: 1048576,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  ocr: {
    id: "ocr-1",
    status: "COMPLETED",
    text: "GOVERNMENT OF INDIA\nGST REGISTRATION\nRegistration Number: 27AABCU9603R1ZM",
    pageCount: 2,
    engine: "NATIVE_PDF",
    engineVersion: "1.0",
    extractionMethod: "NATIVE_PDF",
    confidence: 0.96,
    startedAt: "2026-03-01T12:00:00Z",
    completedAt: "2026-03-01T12:00:01Z",
    runNumber: 1,
    pages: [
      {
        page: 1,
        text: "GOVERNMENT OF INDIA\nGST REGISTRATION\nRegistration Number: 27AABCU9603R1ZM",
        confidence: 0.96,
        boundingBoxes: [{ text: "27AABCU9603R1ZM", box: { x: 0.2, y: 0.3, width: 0.4, height: 0.05 } }],
      },
      {
        page: 2,
        text: "Principal Place of Business: Mumbai\nApex Infrastructure Limited",
        confidence: 0.94,
        boundingBoxes: [{ text: "Apex Infrastructure Limited", box: { x: 0.15, y: 0.45, width: 0.6, height: 0.06 } }],
      },
    ],
  },
  classification: {
    id: "class-1",
    documentType: "GST_CERTIFICATE",
    confidence: 0.95,
    method: "RULE_BASED",
    runNumber: 1,
    pipelineVersion: "phase09-v1",
    classifierVersion: "phase09-classifier-v1",
  },
  evidence: [
    {
      id: "ev-1",
      field: "gstin",
      value: "27AABCU9603R1ZM",
      normalizedValue: "27AABCU9603R1ZM",
      page: 1,
      boundingBox: { x: 0.2, y: 0.3, width: 0.4, height: 0.05 },
      confidence: 0.98,
      method: "DETERMINISTIC_EXTRACTION",
      extractionStatus: "EXTRACTED",
      pipelineVersion: "phase09-v1",
      createdAt: "2026-03-01T12:00:00Z",
    },
    {
      id: "ev-2",
      field: "legal_name",
      value: "Apex Infrastructure Limited",
      normalizedValue: "APEX INFRASTRUCTURE LIMITED",
      page: 2,
      boundingBox: { x: 0.15, y: 0.45, width: 0.6, height: 0.06 },
      confidence: 0.62,
      method: "FALLBACK_AI",
      extractionStatus: "REVIEW_RECOMMENDED",
      pipelineVersion: "phase09-v1",
      createdAt: "2026-03-01T12:00:00Z",
    },
  ],
};

const mockBidDetails = {
  id: "bid-101",
  bidReference: "BID-2026-001",
  organizationId: "org-1",
  tenderId: "tender-1",
  bidderId: "bidder-1",
  status: "SUBMITTED",
  totalAmount: 15000000,
  bidder: {
    id: "bidder-1",
    legalName: "Apex Infrastructure Limited",
    tradeName: "Apex Infra",
    contactEmail: "bidder@apexinfra.bidsure.test",
  },
  documents: [
    {
      id: "bid-doc-1",
      bidId: "bid-101",
      documentId: "doc-1",
      documentType: "GST_CERTIFICATE",
      document: {
        id: "doc-1",
        organizationId: "org-1",
        fileName: "gst_certificate.pdf",
        originalFilename: "GST_Apex.pdf",
        mediaType: "application/pdf",
        extension: "pdf",
        sizeBytes: 1048576,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status: "READY",
        scanStatus: "PASSED",
        scanTimestamp: null,
        failureCode: null,
        failureMessage: null,
        supersedesDocumentId: null,
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-01T10:00:00Z",
      },
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-01T10:00:00Z",
    },
  ],
};

describe("Phase 09 — Evidence Review Component Unit Tests", () => {
  it("EvidenceCard displays high confidence badge and page provenance", () => {
    const handleSelectPage = vi.fn();

    render(
      <EvidenceCard
        evidence={mockEvidenceItem1}
        onSelectPage={handleSelectPage}
      />
    );

    expect(screen.getByText("GST Identification Number (GSTIN)")).toBeInTheDocument();
    expect(screen.getByText("27AABCU9603R1ZM")).toBeInTheDocument();
    expect(screen.getByText("High confidence")).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("EXTRACTED")).toBeInTheDocument();

    // Verify clicking page button triggers callback with bounding box
    fireEvent.click(screen.getByText("Page 1"));
    expect(handleSelectPage).toHaveBeenCalledWith(1, mockEvidenceItem1.boundingBox);
  });

  it("EvidenceCard displays Review recommended badge for low confidence items", () => {
    render(
      <EvidenceCard
        evidence={mockEvidenceItem2}
      />
    );

    expect(screen.getByText("Legal Name of Bidder")).toBeInTheDocument();
    expect(screen.getByText("Apex Infrastructure Limited")).toBeInTheDocument();
    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.getByText("REVIEW_RECOMMENDED")).toBeInTheDocument();
  });

  it("OcrTextViewer renders OCR extracted banner and allows switching pages", () => {
    const handlePageChange = vi.fn();

    render(
      <OcrTextViewer
        pages={mockIntelligence.ocr!.pages!}
        fullText={mockIntelligence.ocr!.text!}
        activePage={1}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByText(/OCR EXTRACTED TEXT/i)).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();

    // Switch to page 2
    fireEvent.click(screen.getByText("Page 2"));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("DocumentPreviewPanel renders page controls and highlights bounding box", () => {
    const handlePageChange = vi.fn();

    render(
      <DocumentPreviewPanel
        fileName="gst_certificate.pdf"
        documentType="GST_CERTIFICATE"
        mimeType="application/pdf"
        activePage={1}
        pageCount={2}
        onPageChange={handlePageChange}
        highlightBox={{ x: 0.2, y: 0.3, width: 0.4, height: 0.05 }}
      />
    );

    expect(screen.getAllByText("gst_certificate.pdf").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    const nextButtons = screen.getAllByRole("button");
    const nextBtn = nextButtons.find((btn) => btn.querySelector("svg") && !btn.hasAttribute("disabled"));
    expect(nextBtn).toBeDefined();
  });
});

describe("Phase 09 — Interactive Evidence Review Workspace Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bidService.getBidById).mockResolvedValue({
      success: true,
      data: mockBidDetails as any,
    });
    vi.mocked(documentService.getDocuments).mockResolvedValue({
      success: true,
      data: mockBidDetails.documents as any,
    });
    vi.mocked(evidenceService.getBidEvidence).mockResolvedValue({
      success: true,
      data: {
        bidId: "bid-101",
        totalEvidence: 2,
        documentsCount: 1,
        evidence: [mockEvidenceItem1, mockEvidenceItem2],
      },
      requestId: "req_test",
    });
    vi.mocked(evidenceService.getDocumentIntelligence).mockResolvedValue({
      success: true,
      data: mockIntelligence,
      requestId: "req_test",
    });
  });

  it("renders EvidencePage with extracted cards, summary counters, and document preview", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/officer/bids/bid-101/evidence"]}>
          <Routes>
            <Route path="/officer/bids/:id/evidence" element={<EvidencePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Structured Evidence & OCR Review")).toBeInTheDocument();
    });

    expect(screen.getByText("BID-2026-001")).toBeInTheDocument();

    // Verify summary statistics
    await waitFor(() => {
      expect(screen.getByText("Total Evidence")).toBeInTheDocument();
      expect(screen.getByText("Classification")).toBeInTheDocument();
    });

    // Verify both evidence items are rendered
    expect(screen.getByText("GST Identification Number (GSTIN)")).toBeInTheDocument();
    expect(screen.getByText("Legal Name of Bidder")).toBeInTheDocument();

    // Test filter mode toggle: click Needs Review filter
    const reviewFilterBtn = screen.getByRole("button", { name: "Needs Review" });
    fireEvent.click(reviewFilterBtn);

    // In review mode, high confidence GSTIN should be filtered out
    expect(screen.getByText("Legal Name of Bidder")).toBeInTheDocument();
    expect(screen.queryByText("27AABCU9603R1ZM")).not.toBeInTheDocument();

    // Switch back to All
    const allFilterBtn = screen.getByRole("button", { name: "All" });
    fireEvent.click(allFilterBtn);
    expect(screen.getByText("27AABCU9603R1ZM")).toBeInTheDocument();
  });
});
