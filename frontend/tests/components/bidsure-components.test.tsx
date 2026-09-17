import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ComplianceStatusBadge } from "@/components/bidsure/compliance-status";
import { VerificationCard } from "@/components/bidsure/verification-card";
import { EvidenceCard } from "@/components/bidsure/evidence-card";
import { RequirementRow } from "@/components/bidsure/requirement-row";
import { FindingCard } from "@/components/bidsure/finding-card";
import { RiskIndicator } from "@/components/bidsure/risk-indicator";
import { DecisionPanel } from "@/components/bidsure/decision-panel";
import type { ComplianceStatus } from "@/components/ui/status-indicator";
import type { RiskLevel } from "@/components/bidsure/risk-indicator";

// ─── ComplianceStatusBadge ────────────────────────────────────────────────

describe("ComplianceStatusBadge", () => {
  const allStatuses: ComplianceStatus[] = ["PASS", "FAIL", "PENDING", "REVIEW_REQUIRED", "NOT_APPLICABLE"];

  it.each(allStatuses)("renders %s status with visible label", (status) => {
    render(<ComplianceStatusBadge status={status} />);
    const el = screen.getByRole("status");
    expect(el.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("renders explanation text when provided", () => {
    render(<ComplianceStatusBadge status="PASS" explanation="Verified against GSTIN registry." />);
    expect(screen.getByText("Verified against GSTIN registry.")).toBeTruthy();
  });

  it("does not contain compliance calculation logic", () => {
    // This test documents the architectural constraint
    // The component must just render what it receives
    const { container } = render(<ComplianceStatusBadge status="PASS" />);
    // No script execution — it's pure JSX render
    expect(container.querySelectorAll("[data-calculated]").length).toBe(0);
  });
});

// ─── VerificationCard ─────────────────────────────────────────────────────

describe("VerificationCard", () => {
  it("renders check name and status", () => {
    render(
      <VerificationCard
        checkName="GST Registration"
        status="PASS"
        sourceEnvironment="MOCK"
      />
    );
    expect(screen.getByText("GST Registration")).toBeTruthy();
    expect(screen.getByText("Pass")).toBeTruthy();
  });

  it("renders MOCK source badge prominently", () => {
    render(
      <VerificationCard checkName="Test" status="PENDING" sourceEnvironment="MOCK" />
    );
    expect(screen.getByText("MOCK SOURCE")).toBeTruthy();
  });

  it("renders summary text when provided", () => {
    render(
      <VerificationCard checkName="Check" status="FAIL" summary="GST number inactive." />
    );
    expect(screen.getByText("GST number inactive.")).toBeTruthy();
  });
});

// ─── EvidenceCard ─────────────────────────────────────────────────────────

describe("EvidenceCard", () => {
  it("renders title", () => {
    render(<EvidenceCard title="GSTIN Certificate" sourceEnvironment="LIVE" />);
    expect(screen.getByText("GSTIN Certificate")).toBeTruthy();
  });

  it("renders LIVE source badge", () => {
    render(<EvidenceCard title="Doc" sourceEnvironment="LIVE" />);
    expect(screen.getByText("LIVE SOURCE")).toBeTruthy();
  });

  it("renders summary when provided", () => {
    render(<EvidenceCard title="Doc" sourceEnvironment="MOCK" summary="Certificate valid until 2025." />);
    expect(screen.getByText("Certificate valid until 2025.")).toBeTruthy();
  });
});

// ─── RequirementRow ───────────────────────────────────────────────────────

describe("RequirementRow", () => {
  it("renders requirement ID and label", () => {
    render(
      <RequirementRow id="REQ-001" label="GST Registration Required" status="PASS" />
    );
    expect(screen.getByText("REQ-001")).toBeTruthy();
    expect(screen.getByText("GST Registration Required")).toBeTruthy();
  });

  it("renders compliance status badge", () => {
    render(<RequirementRow id="REQ-002" label="PAN Verification" status="REVIEW_REQUIRED" />);
    expect(screen.getByText("Review Required")).toBeTruthy();
  });

  it("renders as a button when onClick is provided", () => {
    const handler = () => {};
    render(<RequirementRow id="REQ-003" label="Req" status="PASS" onClick={handler} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});

// ─── FindingCard ──────────────────────────────────────────────────────────

describe("FindingCard", () => {
  it("renders title and status", () => {
    render(<FindingCard title="GST Registration Expired" status="FAIL" />);
    expect(screen.getByText("GST Registration Expired")).toBeTruthy();
    expect(screen.getByText("Fail")).toBeTruthy();
  });

  it("renders finding ID when provided", () => {
    render(<FindingCard findingId="FND-001" title="Test Finding" status="REVIEW_REQUIRED" />);
    expect(screen.getByText("FND-001")).toBeTruthy();
  });

  it("renders description text", () => {
    render(<FindingCard title="Finding" status="FAIL" description="GST registration number is invalid." />);
    expect(screen.getByText("GST registration number is invalid.")).toBeTruthy();
  });
});

// ─── RiskIndicator ────────────────────────────────────────────────────────

describe("RiskIndicator", () => {
  const levels: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  it.each(levels)("renders '%s' with visible text label", (level) => {
    render(<RiskIndicator level={level} />);
    const el = screen.getByRole("status");
    expect(el.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("renders LOW RISK label", () => {
    render(<RiskIndicator level="LOW" />);
    expect(screen.getByText("Low Risk")).toBeTruthy();
  });

  it("renders CRITICAL RISK label", () => {
    render(<RiskIndicator level="CRITICAL" />);
    expect(screen.getByText("Critical Risk")).toBeTruthy();
  });

  it("has accessible aria-label", () => {
    render(<RiskIndicator level="HIGH" />);
    expect(screen.getByLabelText(/High Risk/i)).toBeTruthy();
  });
});

// ─── DecisionPanel ────────────────────────────────────────────────────────

describe("DecisionPanel", () => {
  it("renders the overall status", () => {
    render(<DecisionPanel overallStatus="REVIEW_REQUIRED" />);
    expect(screen.getByText("Review Required")).toBeTruthy();
  });

  it("renders risk level when provided", () => {
    render(<DecisionPanel overallStatus="FAIL" riskLevel="HIGH" />);
    expect(screen.getByText("High Risk")).toBeTruthy();
  });

  it("renders summary text", () => {
    render(<DecisionPanel overallStatus="PASS" summary="All required documents verified." />);
    expect(screen.getByText("All required documents verified.")).toBeTruthy();
  });

  it("shows pending message when no officer decision made", () => {
    render(<DecisionPanel overallStatus="PENDING" officerDecisionMade={false} />);
    expect(screen.getByText(/Officer decision pending/i)).toBeTruthy();
  });

  it("does not show pending message when officer decision made", () => {
    render(<DecisionPanel overallStatus="PASS" officerDecisionMade={true} />);
    expect(screen.queryByText(/Officer decision pending/i)).toBeNull();
  });
});
