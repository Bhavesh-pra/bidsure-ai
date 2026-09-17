import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default("/api/v1"),
});

const parsedEnv = envSchema.safeParse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:", parsedEnv.error.format());
}

export const env = {
  apiBaseUrl: parsedEnv.success ? parsedEnv.data.VITE_API_BASE_URL : "/api/v1",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
