import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { UnauthorizedState } from "@/components/feedback/unauthorized-state";
import { ForbiddenState } from "@/components/feedback/forbidden-state";

describe("LoadingState", () => {
  it("renders with default message", () => {
    render(<LoadingState />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it("renders with custom message", () => {
    render(<LoadingState message="Fetching tenders…" />);
    expect(screen.getByText("Fetching tenders…")).toBeTruthy();
  });

  it("has aria-live attribute for screen readers", () => {
    render(<LoadingState />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });
});

describe("EmptyState", () => {
  it("renders default title and message", () => {
    render(<EmptyState />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/Nothing here yet/i)).toBeTruthy();
  });

  it("renders custom title and message", () => {
    render(<EmptyState title="No tenders found" message="Create your first tender to get started." />);
    expect(screen.getByText("No tenders found")).toBeTruthy();
    expect(screen.getByText("Create your first tender to get started.")).toBeTruthy();
  });

  it("renders action button when action provided", () => {
    const handler = () => {};
    render(<EmptyState action={{ label: "Add Item", onClick: handler }} />);
    expect(screen.getByRole("button", { name: /Add Item/i })).toBeTruthy();
  });

  it("does not render action button when no action provided", () => {
    render(<EmptyState />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("UnauthorizedState", () => {
  it("renders with role=alert", () => {
    render(<UnauthorizedState />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("renders Authentication Required heading", () => {
    render(<UnauthorizedState />);
    expect(screen.getByText("Authentication Required")).toBeTruthy();
  });

  it("renders custom message", () => {
    render(<UnauthorizedState message="Please log in to continue." />);
    expect(screen.getByText("Please log in to continue.")).toBeTruthy();
  });
});

describe("ForbiddenState", () => {
  it("renders with role=alert", () => {
    render(<ForbiddenState />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("renders Access Denied heading", () => {
    render(<ForbiddenState />);
    expect(screen.getByText("Access Denied")).toBeTruthy();
  });

  it("renders custom message", () => {
    render(<ForbiddenState message="Insufficient permissions." />);
    expect(screen.getByText("Insufficient permissions.")).toBeTruthy();
  });
});
