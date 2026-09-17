import { describe, it, expect } from "vitest";
import { httpClient } from "@/services/api/client";
import { env } from "@/lib/env";

describe("Central HTTP Client", () => {
  it("has the configured base URL", () => {
    expect(httpClient.defaults.baseURL).toBe(env.apiBaseUrl);
  });

  it("has JSON content type default header", () => {
    expect(httpClient.defaults.headers["Content-Type"]).toBe("application/json");
  });
});
