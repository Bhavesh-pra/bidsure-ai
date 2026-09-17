import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import type { ApiErrorResponse } from "./api.types";
import { ApiError } from "./api.errors";

export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Optional Tracing
// Backend is the authoritative source for request IDs (req_<uuid>); browser only provides correlation
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.headers["x-correlation-id"] && typeof crypto !== "undefined" && crypto.randomUUID) {
      config.headers["x-correlation-id"] = `corr_${crypto.randomUUID()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error Mapping adhering to frozen contract
httpClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const errorData = error.response?.data?.error;
    const headerRequestId = error.response?.headers?.["x-request-id"];
    const requestId =
      error.response?.data?.requestId ||
      (typeof headerRequestId === "string" ? headerRequestId : undefined);

    const apiError = new ApiError({
      code: errorData?.code || (status ? `HTTP_${status}` : "NETWORK_ERROR"),
      message:
        errorData?.message ||
        (!error.response
          ? "Unable to connect to the BidSure backend."
          : error.message || "An unexpected network error occurred"),
      status,
      details: errorData?.details || error.response?.data,
      requestId,
    });

    return Promise.reject(apiError);
  }
);
