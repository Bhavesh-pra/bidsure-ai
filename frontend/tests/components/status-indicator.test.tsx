import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { ComplianceStatus } from "@/components/ui/status-indicator";

describe("StatusIndicator", () => {
  const statuses: ComplianceStatus[] = [
    "PASS",
    "FAIL",
    "PENDING",
    "REVIEW_REQUIRED",
    "NOT_APPLICABLE",
  ];

  it.each(statuses)("renders '%s' with a visible text label (not only color)", (status) => {
    render(<StatusIndicator status={status} />);
    // The status label text must be visible in the DOM
    const element = screen.getByRole("status");
    expect(element).toBeTruthy();
    // Must have text content — status must not rely on color alone
    expect(element.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("renders PASS with the default label", () => {
    render(<StatusIndicator status="PASS" />);
    expect(screen.getByText("Pass")).toBeTruthy();
  });

  it("renders FAIL with the default label", () => {
    render(<StatusIndicator status="FAIL" />);
    expect(screen.getByText("Fail")).toBeTruthy();
  });

  it("renders PENDING with the default label", () => {
    render(<StatusIndicator status="PENDING" />);
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("renders REVIEW_REQUIRED with the default label", () => {
    render(<StatusIndicator status="REVIEW_REQUIRED" />);
    expect(screen.getByText("Review Required")).toBeTruthy();
  });

  it("renders NOT_APPLICABLE with the default label", () => {
    render(<StatusIndicator status="NOT_APPLICABLE" />);
    expect(screen.getByText("Not Applicable")).toBeTruthy();
  });

  it("renders a custom label when provided", () => {
    render(<StatusIndicator status="PASS" label="Cleared" />);
    expect(screen.getByText("Cleared")).toBeTruthy();
  });

  it("has accessible aria-label describing the status", () => {
    render(<StatusIndicator status="PASS" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-label")).toContain("Pass");
  });
});
