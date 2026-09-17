import { httpClient } from "./client";
import type { ApiResponse, AuthUser, LoginCredentials } from "@/types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    return httpClient.post<unknown, ApiResponse<AuthUser>>("/auth/login", credentials);
  },

  getMe: async (): Promise<ApiResponse<AuthUser>> => {
    return httpClient.get<unknown, ApiResponse<AuthUser>>("/auth/me");
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    return httpClient.post<unknown, ApiResponse<{ message: string }>>("/auth/logout");
  },
};
