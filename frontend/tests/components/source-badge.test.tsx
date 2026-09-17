import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SourceBadge } from "@/components/bidsure/source-badge";
import type { SourceEnvironment } from "@/components/bidsure/source-badge";

describe("SourceBadge", () => {
  const environments: SourceEnvironment[] = ["LIVE", "MOCK", "DEMO", "UNKNOWN"];

  it.each(environments)("renders '%s' with a visible label", (env) => {
    render(<SourceBadge environment={env} />);
    // The span has an aria-label — confirm it is present
    const container = screen.getByLabelText(/Data source:/i);
    expect(container).toBeTruthy();
    // Environment text is visible in the badge
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("renders MOCK label prominently — not hidden", () => {
    render(<SourceBadge environment="MOCK" />);
    expect(screen.getByText("MOCK SOURCE")).toBeTruthy();
  });

  it("renders DEMO label prominently", () => {
    render(<SourceBadge environment="DEMO" />);
    expect(screen.getByText("DEMO SOURCE")).toBeTruthy();
  });

  it("renders LIVE label", () => {
    render(<SourceBadge environment="LIVE" />);
    expect(screen.getByText("LIVE SOURCE")).toBeTruthy();
  });

  it("renders UNKNOWN label", () => {
    render(<SourceBadge environment="UNKNOWN" />);
    expect(screen.getByText("UNKNOWN SOURCE")).toBeTruthy();
  });

  it("renders sourceName when provided", () => {
    render(<SourceBadge environment="MOCK" sourceName="GST Registry" />);
    expect(screen.getByText("GST Registry")).toBeTruthy();
  });

  it("has aria-label describing source environment", () => {
    render(<SourceBadge environment="MOCK" />);
    const el = screen.getByLabelText(/not live government verification/i);
    expect(el).toBeTruthy();
  });
});
