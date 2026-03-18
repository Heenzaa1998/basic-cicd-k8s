import app from "./app";
import { log } from "./app";

// ─── Configuration ───────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000", 10);
const ENV = process.env.NODE_ENV || "development";
const VERSION = process.env.APP_VERSION || "1.0.0";

// ─── Start Server ───────────────────────────────────────────────
const server = app.listen(PORT, () => {
  log("info", `API service started`, {
    port: PORT,
    environment: ENV,
    version: VERSION,
  });
});

// ─── Graceful Shutdown ──────────────────────────────────────────
function shutdown(signal: string): void {
  log("info", `Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    log("info", "HTTP server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    log("error", "Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
