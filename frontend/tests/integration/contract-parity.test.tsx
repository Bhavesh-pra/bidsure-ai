import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OfficerTendersPage } from "@/features/tenders/officer-tenders-page";
import { tenderService } from "@/services/api/tender.service";
import type { PaginatedResponse, ApiResponse, ApiErrorResponse, TenderDTO } from "@/types";
import {
  ApiError,
  isApiError,
  isUnauthorizedError,
  isForbiddenError,
  isNotFoundError,
  isValidationError,
  isConflictError,
  isNetworkError,
} from "@/services/api/api.errors";

vi.mock("@/services/api/tender.service", () => ({
  tenderService: {
    getTenders: vi.fn(),
    getTenderById: vi.fn(),
    createTender: vi.fn(),
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

describe("Phase 05 — Frontend Data Layer & Contract Parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Contract Type Parity Verification", () => {
    it("validates that backend success response conforms to ApiResponse contract", () => {
      const backendSuccessEnvelope: ApiResponse<{ id: string; name: string }> = {
        success: true,
        data: { id: "123", name: "Sample" },
        meta: { timestamp: new Date().toISOString() },
        requestId: "req_f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
      };

      expect(backendSuccessEnvelope.success).toBe(true);
      expect(backendSuccessEnvelope.requestId.startsWith("req_")).toBe(true);
      expect(backendSuccessEnvelope.data.id).toBe("123");
    });

    it("validates that backend paginated response conforms to PaginatedResponse and CollectionMeta", () => {
      const backendPaginatedEnvelope: PaginatedResponse<TenderDTO> = {
        success: true,
        data: [
          {
            id: "00000000-0000-4000-a000-000000000021",
            organizationId: "00000000-0000-4000-a000-000000000001",
            title: "Eastern Dedicated Freight Corridor Project",
            referenceNumber: "TDR-2026-DEL-001",
            status: "PUBLISHED",
            currentVersionId: "00000000-0000-4000-a000-000000000022",
            createdAt: "2026-09-17T12:00:00.000Z",
            updatedAt: "2026-09-17T12:00:00.000Z",
            currentVersion: {
              id: "00000000-0000-4000-a000-000000000022",
              tenderId: "00000000-0000-4000-a000-000000000021",
              versionNumber: 1,
              title: "Version 1",
              description: "Initial specification",
              content: null,
              status: "ACTIVE",
              createdAt: "2026-09-17T12:00:00.000Z",
            },
            versionsCount: 1,
          },
        ],
        meta: {
          page: 1,
          pageSize: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
          hasNext: true,
          hasPrev: false,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 25,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
        requestId: "req_e825dbfa-dc77-4074-bc15-1066d0a0d3b2",
      };

      expect(backendPaginatedEnvelope.success).toBe(true);
      expect(backendPaginatedEnvelope.meta.pagination.totalPages).toBe(3);
      expect(backendPaginatedEnvelope.meta.page).toBe(1);
      expect(backendPaginatedEnvelope.meta.pagination.hasNextPage).toBe(true);
      expect(backendPaginatedEnvelope.data.length).toBe(1);
    });

    it("validates backend error response structure", () => {
      const backendErrorEnvelope: ApiErrorResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: [{ field: "title", message: "Title is required" }],
        },
        requestId: "req_error_trace_abc",
      };

      expect(backendErrorEnvelope.success).toBe(false);
      expect(backendErrorEnvelope.error.code).toBe("VALIDATION_ERROR");
      expect(backendErrorEnvelope.requestId).toBe("req_error_trace_abc");
    });
  });

  describe("2. Error Normalization & Type Guards Integration", () => {
    it("handles 400 Validation Error correctly", () => {
      const err = new ApiError({
        code: "VALIDATION_ERROR",
        message: "Invalid tender title",
        status: 400,
        requestId: "req_val_1",
      });
      expect(isValidationError(err)).toBe(true);
      expect(err.requestId).toBe("req_val_1");
    });

    it("handles 401 and 403 authorization errors", () => {
      const err401 = new ApiError({ code: "UNAUTHORIZED", message: "Please log in", status: 401 });
      const err403 = new ApiError({ code: "FORBIDDEN", message: "Access denied", status: 403 });

      expect(isUnauthorizedError(err401)).toBe(true);
      expect(isForbiddenError(err403)).toBe(true);
    });

    it("handles 404 Not Found error", () => {
      const err404 = new ApiError({ code: "NOT_FOUND", message: "Tender missing", status: 404 });
      expect(isNotFoundError(err404)).toBe(true);
    });

    it("handles 409 Conflict and IDEMPOTENCY_CONFLICT", () => {
      const errConflict = new ApiError({
        code: "IDEMPOTENCY_CONFLICT",
        message: "Idempotency key reused with different request payload",
        status: 409,
        requestId: "req_idemp_conflict",
      });
      expect(isConflictError(errConflict)).toBe(true);
      expect(errConflict.requestId).toBe("req_idemp_conflict");
    });

    it("handles network failure without status code", () => {
      const errNet = new ApiError({
        code: "NETWORK_ERROR",
        message: "Unable to connect to the BidSure backend.",
      });
      expect(isNetworkError(errNet)).toBe(true);
      expect(errNet.status).toBeUndefined();
    });
  });

  describe("3. UI Integration: Pagination & Diagnostics Tracing", () => {
    it("renders pagination bar and handles page change interactions", async () => {
      const mockTenders: TenderDTO[] = [
        {
          id: "tender-1",
          organizationId: "org-1",
          title: "Highway Development Sector 1",
          referenceNumber: "TDR-PAGE-01",
          status: "PUBLISHED",
          currentVersionId: "v-1",
          createdAt: "2026-09-17T12:00:00.000Z",
          updatedAt: "2026-09-17T12:00:00.000Z",
          versionsCount: 1,
        },
      ];

      // Initial call returns page 1 of 2
      vi.mocked(tenderService.getTenders).mockResolvedValueOnce({
        success: true,
        data: mockTenders,
        meta: {
          page: 1,
          pageSize: 10,
          total: 15,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 15,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
        requestId: "req_page_1",
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerTendersPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify tender is rendered
      await waitFor(() => {
        expect(screen.getByText("Highway Development Sector 1")).toBeInTheDocument();
      });

      // Verify pagination text
      expect(screen.getByText(/Page/)).toBeInTheDocument();
      expect(screen.getByText(/15 tenders/)).toBeInTheDocument();

      // Next button should be enabled
      const nextButton = screen.getByRole("button", { name: "Next" });
      const prevButton = screen.getByRole("button", { name: "Previous" });

      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();

      // Setup page 2 response
      vi.mocked(tenderService.getTenders).mockResolvedValueOnce({
        success: true,
        data: [
          {
            ...mockTenders[0],
            id: "tender-2",
            title: "Highway Development Sector 2",
            referenceNumber: "TDR-PAGE-02",
          },
        ],
        meta: {
          page: 2,
          pageSize: 10,
          total: 15,
          totalPages: 2,
          hasNextPage: false,
          hasPreviousPage: true,
          pagination: {
            page: 2,
            pageSize: 10,
            total: 15,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true,
          },
        },
        requestId: "req_page_2",
      });

      // Click Next
      fireEvent.click(nextButton);

      // Verify tenderService.getTenders was called with page 2
      await waitFor(() => {
        expect(tenderService.getTenders).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
      });
    });

    it("displays canonical requestId on query error state", async () => {
      const testError = new ApiError({
        code: "INTERNAL_ERROR",
        message: "Database connection failed",
        status: 500,
        requestId: "req_trace_987654321",
      });

      vi.mocked(tenderService.getTenders).mockRejectedValueOnce(testError);

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <OfficerTendersPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Failed to load tenders")).toBeInTheDocument();
      });

      expect(screen.getByText("req_trace_987654321")).toBeInTheDocument();
    });
  });
});
