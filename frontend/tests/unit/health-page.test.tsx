import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { HealthPage } from "@/features/health/health-page";
import * as healthHook from "@/hooks/use-health";
import type { HealthResponse, ApiError } from "@/types";

describe("HealthPage Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <HealthPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  it("renders loading state when query is pending", () => {
    vi.spyOn(healthHook, "useHealth").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderWithProviders();

    expect(screen.getByText("Checking BidSure API…")).toBeInTheDocument();
  });

  it("renders success state with API Online and details when data is received", () => {
    const mockHealthData: HealthResponse = {
      success: true,
      data: {
        status: "ok",
        service: "bidsure-api",
        version: "1.0.0",
      },
      requestId: "req_550e8400-e29b-41d4-a716-446655440000",
    };

    vi.spyOn(healthHook, "useHealth").mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderWithProviders();

    expect(screen.getByText("API Online")).toBeInTheDocument();
    expect(screen.getByText("bidsure-api")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("req_550e8400-e29b-41d4-a716-446655440000")).toBeInTheDocument();
  });

  it("renders error state when backend is unreachable", () => {
    const mockError: ApiError = {
      code: "NETWORK_ERROR",
      message: "Unable to connect to the BidSure backend.",
      status: 503,
      requestId: "req_failed-req-1234",
    };

    vi.spyOn(healthHook, "useHealth").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderWithProviders();

    expect(screen.getByText("API unavailable")).toBeInTheDocument();
    expect(screen.getByText("Unable to connect to the BidSure backend.")).toBeInTheDocument();
    expect(screen.getByText(/req_failed-req-1234/)).toBeInTheDocument();
  });
});
