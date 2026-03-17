// ─── Configuration ───────────────────────────────────────────────
const INTERVAL_MS = parseInt(process.env.WORKER_INTERVAL_MS || "5000", 10);
const ENV = process.env.NODE_ENV || "development";
const SERVICE_NAME = "worker-service";
const VERSION = process.env.APP_VERSION || "1.0.0";

// ─── Structured Logger ──────────────────────────────────────────
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  [key: string]: unknown;
}

function log(level: string, message: string, extra: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    message,
    ...extra,
  };
  console.log(JSON.stringify(entry));
}

// ─── Worker Job ─────────────────────────────────────────────────
let tickCount = 0;

function runJob(): void {
  tickCount++;
  log("info", "Worker tick - updating timestamp", {
    tick: tickCount,
    currentTimestamp: new Date().toISOString(),
    environment: ENV,
  });
}

// ─── Start Worker ───────────────────────────────────────────────
log("info", "Worker service started", {
  intervalMs: INTERVAL_MS,
  environment: ENV,
  version: VERSION,
});

const intervalId = setInterval(runJob, INTERVAL_MS);

// Run immediately on start
runJob();

// ─── Graceful Shutdown ──────────────────────────────────────────
function shutdown(signal: string): void {
  log("info", `Received ${signal}. Shutting down gracefully...`);
  clearInterval(intervalId);
  log("info", "Worker stopped", { totalTicks: tickCount });
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
