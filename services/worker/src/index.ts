import express, { Request, Response } from "express";
import client from "prom-client";

// ─── Configuration ───────────────────────────────────────────────
const INTERVAL_MS = parseInt(process.env.WORKER_INTERVAL_MS || "5000", 10);
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || "9090", 10);
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

// ─── Prometheus Metrics ─────────────────────────────────────────
const register = new client.Registry();

client.collectDefaultMetrics({ register });

const workerLastTick = new client.Gauge({
  name: "worker_last_tick_timestamp",
  help: "Timestamp of the last successful worker tick",
  registers: [register],
});

const workerTicksTotal = new client.Counter({
  name: "worker_ticks_total",
  help: "Total number of worker ticks processed",
  registers: [register],
});

// ─── Worker Job ─────────────────────────────────────────────────
let tickCount = 0;
let lastTickTime = Date.now();

function runJob(): void {
  tickCount++;
  lastTickTime = Date.now();

  // Update Prometheus metrics
  workerLastTick.set(lastTickTime / 1000);
  workerTicksTotal.inc();

  log("info", "Worker tick - updating timestamp", {
    tick: tickCount,
    currentTimestamp: new Date().toISOString(),
    environment: ENV,
  });
}

// ─── Health & Metrics Server ────────────────────────────────────
const app = express();

app.get("/health", (_req: Request, res: Response) => {
  const timeSinceLastTick = Date.now() - lastTickTime;
  const healthy = timeSinceLastTick < INTERVAL_MS * 3; // unhealthy if no tick for 3 intervals

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "unhealthy",
    lastTick: new Date(lastTickTime).toISOString(),
    tickCount,
    timeSinceLastTickMs: timeSinceLastTick,
    version: VERSION,
    environment: ENV,
  });
});

app.get("/metrics", async (_req: Request, res: Response) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    log("error", "Failed to collect metrics", { error: String(err) });
    res.status(500).end();
  }
});

const server = app.listen(HEALTH_PORT, () => {
  log("info", "Worker health server started", { port: HEALTH_PORT });
});

// ─── Start Worker ───────────────────────────────────────────────
log("info", "Worker service started", {
  intervalMs: INTERVAL_MS,
  healthPort: HEALTH_PORT,
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
  server.close(() => {
    log("info", "Worker stopped", { totalTicks: tickCount });
    process.exit(0);
  });

  setTimeout(() => {
    log("error", "Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
