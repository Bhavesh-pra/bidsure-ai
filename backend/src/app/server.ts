import { createApp } from "./app.js";
import { config } from "../config/env.js";
import { logger } from "../infrastructure/logging/logger.js";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      env: config.nodeEnv,
      service: config.serviceName,
      version: config.version,
    },
    `BidSure API started`
  );
});

// Graceful shutdown — log and exit cleanly
const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutdown signal received");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
