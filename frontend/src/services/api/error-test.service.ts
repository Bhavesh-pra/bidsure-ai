import { httpClient } from "./client";

/**
 * Calls the Phase 02 controlled error endpoint.
 * This always rejects — the purpose is to exercise the error pipeline.
 *
 * @param scenario - The error scenario to trigger on the backend.
 */
export const errorTestService = {
  triggerError: async (scenario: string = "internal"): Promise<never> => {
    // httpClient interceptor always transforms errors to ApiError rejections
    // We cast to never since this endpoint is designed to always throw
    return httpClient.get(`/error-test?scenario=${encodeURIComponent(scenario)}`) as Promise<never>;
  },
};
