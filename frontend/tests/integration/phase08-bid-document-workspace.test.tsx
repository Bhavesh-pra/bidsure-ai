import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BidDocumentWorkspace } from "@/features/documents/bid-document-workspace";
import { documentService } from "@/services/api/document.service";
import type { BidDocumentDTO } from "@/types";

// Mock documentService
vi.mock("@/services/api/document.service", () => ({
  documentService: {
    getDocuments: vi.fn(),
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

const mockDoc1: BidDocumentDTO = {
  id: "bid-doc-1",
  bidId: "bid-123",
  documentId: "doc-123",
  documentType: "TECHNICAL_BID",
  document: {
    id: "doc-123",
    organizationId: "org-1",
    fileName: "doc-123.pdf",
    originalFilename: "Technical_Proposal_v1.pdf",
    mediaType: "application/pdf",
    extension: "pdf",
    sizeBytes: 2048576, // ~2 MB
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "READY",
    scanStatus: "PASSED",
    scanTimestamp: "2026-03-01T10:05:00.000Z",
    failureCode: null,
    failureMessage: null,
    supersedesDocumentId: null,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:05:00.000Z",
  },
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:05:00.000Z",
};

const mockDocFailed: BidDocumentDTO = {
  id: "bid-doc-2",
  bidId: "bid-123",
  documentId: "doc-456",
  documentType: "COMPLIANCE_CERTIFICATE",
  document: {
    id: "doc-456",
    organizationId: "org-1",
    fileName: "doc-456.pdf",
    originalFilename: "ISO_Cert_corrupted.pdf",
    mediaType: "application/pdf",
    extension: "pdf",
    sizeBytes: 1024,
    sha256: "abcd1234ef0123456789abcdef0123456789abcdef0123456789abcdef012345",
    status: "FAILED",
    scanStatus: "PASSED",
    scanTimestamp: "2026-03-01T10:10:00.000Z",
    failureCode: "PROCESSING_TIMEOUT",
    failureMessage: "Document processing timed out during hashing",
    supersedesDocumentId: null,
    createdAt: "2026-03-01T10:09:00.000Z",
    updatedAt: "2026-03-01T10:10:00.000Z",
  },
  createdAt: "2026-03-01T10:09:00.000Z",
  updatedAt: "2026-03-01T10:10:00.000Z",
};

describe("Phase 08 — BidDocumentWorkspace Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  const renderComponent = (bidId = "bid-123", bidStatus = "DRAFT") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BidDocumentWorkspace bidId={bidId} bidStatus={bidStatus} />
      </QueryClientProvider>
    );
  };

  it("renders empty state when bid proposal has no attached documents", async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValueOnce({
      success: true,
      data: [],
      meta: { total: 0 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No documents uploaded yet")).toBeInTheDocument();
    });
    expect(screen.getByText("Upload Proposal Document")).toBeInTheDocument();
  });

  it("renders document table with correct metadata and SHA-256 fingerprint", async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValueOnce({
      success: true,
      data: [mockDoc1],
      meta: { total: 1 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Technical_Proposal_v1.pdf")).toBeInTheDocument();
    });

    // Check SHA-256 preview
    expect(screen.getByText(/e3b0c44298/)).toBeInTheDocument();

    // Check size format (1.95 MB)
    expect(screen.getByText(/1.95 MB/)).toBeInTheDocument();

    // Status check
    expect(screen.getByText("Ingested")).toBeInTheDocument();
    expect(screen.queryByText(/verified/i)).toBeNull();
  });

  it("disables uploads and deletion when proposal is SUBMITTED", async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValueOnce({
      success: true,
      data: [mockDoc1],
      meta: { total: 1 },
    });

    renderComponent("bid-123", "SUBMITTED");

    await waitFor(() => {
      expect(
        screen.getByText(/Proposal locked \(SUBMITTED\)/)
      ).toBeInTheDocument();
    });

    // Upload zone must NOT be rendered
    expect(screen.queryByText("Upload Proposal Document")).toBeNull();

    // Delete button must NOT be rendered
    expect(screen.queryByTitle("Delete document")).toBeNull();
  });

  it("opens metadata inspector modal with full provenance details", async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValueOnce({
      success: true,
      data: [mockDoc1],
      meta: { total: 1 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTitle("Inspect document metadata")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Inspect document metadata"));

    await waitFor(() => {
      expect(screen.getByText("Document Provenance & Metadata")).toBeInTheDocument();
    });

    // Full SHA-256 hash must be visible
    expect(
      screen.getByText("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    ).toBeInTheDocument();

    // Scan status must be visible
    expect(screen.getByText(/PASSED/)).toBeInTheDocument();
  });

  it("allows retrying a FAILED document in DRAFT proposal", async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValueOnce({
      success: true,
      data: [mockDocFailed],
      meta: { total: 1 },
    });
    vi.mocked(documentService.retryDocument).mockResolvedValueOnce({
      success: true,
      data: {
        ...mockDocFailed,
        document: {
          ...mockDocFailed.document,
          status: "SCANNING",
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Ingestion Failed")).toBeInTheDocument();
    });

    const retryBtn = screen.getByTitle("Retry failed ingestion");
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(documentService.retryDocument).toHaveBeenCalledWith("bid-123", "doc-456");
    });
  });

  it("rejects oversized file selection with client-side error before API call", async () => {
    vi.mocked(documentService.getDocuments).mockResolvedValueOnce({
      success: true,
      data: [],
      meta: { total: 0 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Upload Proposal Document")).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText("Upload proposal document file");

    // Create 12MB mock file
    const oversizedFile = new File(["x".repeat(100)], "huge_proposal.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(oversizedFile, "size", { value: 12 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/exceeds the 10 MB maximum limit/i)
      ).toBeInTheDocument();
    });

    expect(documentService.uploadDocument).not.toHaveBeenCalled();
  });
});
