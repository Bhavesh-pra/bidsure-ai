import { useQuery } from "@tanstack/react-query";
import { errorTestService } from "@/services/api/error-test.service";
import type { ApiError } from "@/types";

/**
 * Hook that deliberately triggers a backend error.
 * Used exclusively for Phase 02 integration testing to verify the error pipeline:
 * Backend → API error envelope → axios interceptor → ApiError → ErrorState component.
 *
 * @param scenario - Error scenario to trigger. Default: "internal".
 */
export const useErrorTest = (scenario: string = "internal") => {
  return useQuery<never, ApiError>({
    queryKey: ["error-test", scenario],
    queryFn: () => errorTestService.triggerError(scenario),
    // Always triggers — this is designed to always error
    retry: false,
    // Don't refetch automatically; user controls this explicitly
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};
