import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import type { DocumentStatus } from "@/types";

describe("Phase 08 — DocumentStatusBadge Component", () => {
  const statuses: DocumentStatus[] = [
    "UPLOADING",
    "SCANNING",
    "PROCESSING",
    "READY",
    "FAILED",
    "QUARANTINED",
    "REPLACEMENT_REQUIRED",
  ];

  it("renders an accessible badge for each of the 7 document statuses", () => {
    statuses.forEach((status) => {
      const { unmount } = render(<DocumentStatusBadge status={status} />);
      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      expect(badge.getAttribute("aria-label")).toContain("Document status:");
      unmount();
    });
  });

  it("labels READY status as 'Ingested' and NEVER as 'Verified' or 'Approved'", () => {
    render(<DocumentStatusBadge status="READY" showDescription />);
    const badge = screen.getByRole("status");

    expect(badge).toHaveTextContent("Ingested");
    expect(screen.queryByText(/verified/i)).toBeNull();
    expect(screen.queryByText(/approved/i)).toBeNull();

    // Verify description explains ingestion boundary
    expect(
      screen.getByText("Secure ingestion and storage processing completed.")
    ).toBeInTheDocument();
  });

  it("renders QUARANTINED with prominent alert styling and clear warning", () => {
    render(<DocumentStatusBadge status="QUARANTINED" showDescription />);
    const badge = screen.getByRole("status");

    expect(badge).toHaveTextContent("Quarantined");
    expect(badge.className).toContain("text-rose-800");
    expect(
      screen.getByText(/Security threat or malicious signature detected/i)
    ).toBeInTheDocument();
  });

  it("renders SCANNING and PROCESSING with animation indicators", () => {
    const { unmount } = render(<DocumentStatusBadge status="SCANNING" />);
    expect(screen.getByRole("status")).toHaveTextContent("Scanning");
    unmount();

    render(<DocumentStatusBadge status="PROCESSING" />);
    expect(screen.getByRole("status")).toHaveTextContent("Processing");
  });

  it("renders REPLACEMENT_REQUIRED with appropriate label and description", () => {
    render(<DocumentStatusBadge status="REPLACEMENT_REQUIRED" showDescription />);
    expect(screen.getByRole("status")).toHaveTextContent("Replacement Required");
    expect(
      screen.getByText(/requires replacement by bidder/i)
    ).toBeInTheDocument();
  });
});
