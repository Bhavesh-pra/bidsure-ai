import { PrismaClient } from "@prisma/client";
import { logger } from "../logging/logger.js";
import { config } from "../../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prismaInstance ??
  new PrismaClient({
    log: config.isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ]
      : [{ emit: "event", level: "error" }],
  });

if (config.isDev) {
  globalThis.__prismaInstance = prisma;
}

// Log errors through structured logger without leaking secrets
// @ts-expect-error Prisma event typing
prisma.$on("error", (e: { message: string }) => {
  logger.error({ internalError: e.message }, "Prisma database error");
});

