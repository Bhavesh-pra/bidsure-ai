import { httpClient } from "./client";
import type { HealthResponse } from "@/types";

export const healthService = {
  getHealth: async (): Promise<HealthResponse> => {
    return await httpClient.get<never, HealthResponse>("/health");
  },
};
