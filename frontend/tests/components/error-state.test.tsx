import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ErrorState } from "@/components/feedback/error-state";
import type { ApiError } from "@/types";

describe("ErrorState", () => {
  it("renders the default title when no error provided", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("renders the error message from an ApiError", () => {
    const error: ApiError = {
      code: "INTERNAL_ERROR",
      message: "Controlled internal error for integration testing",
      status: 500,
      requestId: "req_test-id-123",
    };
    render(<ErrorState error={error} />);
    expect(screen.getByText("Controlled internal error for integration testing")).toBeTruthy();
  });

  it("renders the request ID from an ApiError", () => {
    const error: ApiError = {
      code: "INTERNAL_ERROR",
      message: "Test error",
      status: 500,
      requestId: "req_abc-123",
    };
    render(<ErrorState error={error} />);
    expect(screen.getByText("req_abc-123")).toBeTruthy();
  });

  it("renders the error code", () => {
    const error: ApiError = {
      code: "NOT_FOUND",
      message: "Resource not found",
      status: 404,
    };
    render(<ErrorState error={error} />);
    expect(screen.getByText(/NOT_FOUND/i)).toBeTruthy();
  });

  it("renders a custom title", () => {
    render(<ErrorState title="Unable to load tender details." />);
    expect(screen.getByText("Unable to load tender details.")).toBeTruthy();
  });

  it("renders plain string error", () => {
    render(<ErrorState error="Something specific went wrong" />);
    expect(screen.getByText("Something specific went wrong")).toBeTruthy();
  });

  it("does NOT render a request ID section when requestId is absent", () => {
    const error: ApiError = { code: "FAIL", message: "No ID here", status: 500 };
    render(<ErrorState error={error} />);
    expect(screen.queryByText(/Request ID:/i)).toBeNull();
  });

  it("renders the try again button when onRetry provided", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
  });

  it("does NOT render try again button when onRetry is absent", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("uses role=alert for screen reader announcement", () => {
    render(<ErrorState error="fail" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
