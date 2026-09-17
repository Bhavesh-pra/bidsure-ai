import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/api/health.service";
import type { HealthResponse, ApiError } from "@/types";

export const useHealth = () => {
  return useQuery<HealthResponse, ApiError>({
    queryKey: ["health"],
    queryFn: () => healthService.getHealth(),
    refetchInterval: 30000,
    retry: 1,
  });
};
