import express, { Request, Response, NextFunction } from "express";
import client from "prom-client";

// ─── Configuration ───────────────────────────────────────────────
const ENV = process.env.NODE_ENV || "development";
const SERVICE_NAME = "api-service";
const VERSION = process.env.APP_VERSION || "1.0.0";

// ─── Structured Logger ──────────────────────────────────────────
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  [key: string]: unknown;
}

export function log(level: string, message: string, extra: Record<string, unknown> = {}): void {
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

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestErrors = new client.Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors (4xx and 5xx)",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// ─── Express App ────────────────────────────────────────────────
const app = express();
const startTime = Date.now();

// Metrics middleware — track every request
app.use((req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    end(labels);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrors.inc(labels);
    }

    log("info", "request completed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: end,
    });
  });

  next();
});

// ─── Routes ─────────────────────────────────────────────────────

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: VERSION,
    environment: ENV,
  });
});

// Prometheus metrics endpoint
app.get("/metrics", async (_req: Request, res: Response) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    log("error", "Failed to collect metrics", { error: String(err) });
    res.status(500).end();
  }
});

export default app;
