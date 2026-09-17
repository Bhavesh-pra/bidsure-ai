import { describe, it, expect } from "vitest";
import { httpClient } from "@/services/api/client";
import { env } from "@/lib/env";
import {
  ApiError,
  isApiError,
  isUnauthorizedError,
  isForbiddenError,
  isNotFoundError,
  isValidationError,
  isConflictError,
  isNetworkError,
  isRateLimitError,
} from "@/services/api/api.errors";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

describe("Central HTTP Client & Error Handling", () => {
  describe("Client Defaults", () => {
    it("has the configured base URL", () => {
      expect(httpClient.defaults.baseURL).toBe(env.apiBaseUrl);
    });

    it("has JSON content type default header", () => {
      expect(httpClient.defaults.headers["Content-Type"]).toBe("application/json");
    });

    it("has credentials enabled for session cookies", () => {
      expect(httpClient.defaults.withCredentials).toBe(true);
    });
  });

  describe("ApiError & Type Guards", () => {
    it("correctly identifies ApiError instances", () => {
      const err = new ApiError({
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        status: 400,
        requestId: "req_test-123",
      });

      expect(isApiError(err)).toBe(true);
      expect(err.name).toBe("ApiError");
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.status).toBe(400);
      expect(err.requestId).toBe("req_test-123");
    });

    it("identifies 401 Unauthorized errors", () => {
      const err = new ApiError({ code: "UNAUTHORIZED", message: "Not logged in", status: 401 });
      expect(isUnauthorizedError(err)).toBe(true);
      expect(isForbiddenError(err)).toBe(false);
    });

    it("identifies 403 Forbidden errors", () => {
      const err = new ApiError({ code: "FORBIDDEN", message: "Insufficient permissions", status: 403 });
      expect(isForbiddenError(err)).toBe(true);
      expect(isUnauthorizedError(err)).toBe(false);
    });

    it("identifies 404 Not Found errors", () => {
      const err = new ApiError({ code: "NOT_FOUND", message: "Resource not found", status: 404 });
      expect(isNotFoundError(err)).toBe(true);
    });

    it("identifies 400 Validation errors", () => {
      const err = new ApiError({ code: "VALIDATION_ERROR", message: "Bad data", status: 400 });
      expect(isValidationError(err)).toBe(true);
    });

    it("identifies 409 Conflict and Idempotency Conflict errors", () => {
      const errConflict = new ApiError({ code: "CONFLICT", message: "Duplicate", status: 409 });
      const errIdemp = new ApiError({ code: "IDEMPOTENCY_CONFLICT", message: "Payload changed", status: 409 });
      const errConcurrent = new ApiError({ code: "CONCURRENT_REQUEST", message: "In progress", status: 409 });

      expect(isConflictError(errConflict)).toBe(true);
      expect(isConflictError(errIdemp)).toBe(true);
      expect(isConflictError(errConcurrent)).toBe(true);
    });

    it("identifies network failures", () => {
      const err = new ApiError({ code: "NETWORK_ERROR", message: "Offline" });
      expect(isNetworkError(err)).toBe(true);
    });

    it("identifies 429 Rate Limit errors", () => {
      const err = new ApiError({ code: "TOO_MANY_REQUESTS", message: "Slow down", status: 429 });
      expect(isRateLimitError(err)).toBe(true);
    });
  });

  describe("Interceptors Behavior", () => {
    it("request interceptor adds x-correlation-id if not already present", () => {
      const requestInterceptor = (httpClient.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }>;
      }).handlers[0]?.fulfilled;

      if (requestInterceptor) {
        const config = {
          headers: {} as Record<string, string>,
        } as unknown as InternalAxiosRequestConfig;

        const updated = requestInterceptor(config);
        expect(updated.headers["x-correlation-id"]).toBeDefined();
        expect(String(updated.headers["x-correlation-id"]).startsWith("corr_")).toBe(true);
      }
    });

    it("response interceptor extracts data directly on success", () => {
      const responseInterceptor = (httpClient.interceptors.response as unknown as {
        handlers: Array<{ fulfilled: (res: AxiosResponse) => unknown }>;
      }).handlers[0]?.fulfilled;

      if (responseInterceptor) {
        const mockResponse = {
          data: {
            success: true,
            data: { id: "123", title: "Test" },
            requestId: "req_success_1",
          },
        } as AxiosResponse;

        const result = responseInterceptor(mockResponse);
        expect(result).toEqual(mockResponse.data);
      }
    });

    it("response interceptor normalizes AxiosError into ApiError with requestId", async () => {
      const errorInterceptor = (httpClient.interceptors.response as unknown as {
        handlers: Array<{ rejected: (err: AxiosError) => Promise<never> }>;
      }).handlers[0]?.rejected;

      if (errorInterceptor) {
        const mockAxiosError = {
          response: {
            status: 409,
            headers: { "x-request-id": "req_header_corr_99" },
            data: {
              success: false,
              error: {
                code: "IDEMPOTENCY_CONFLICT",
                message: "Idempotency key reused with different request payload",
              },
              requestId: "req_body_99",
            },
          },
        } as unknown as AxiosError;

        await expect(errorInterceptor(mockAxiosError)).rejects.toMatchObject({
          name: "ApiError",
          code: "IDEMPOTENCY_CONFLICT",
          status: 409,
          requestId: "req_body_99",
          message: "Idempotency key reused with different request payload",
        });
      }
    });
  });
});
