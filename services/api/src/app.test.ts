import request from "supertest";
import app from "./app";

describe("API Service", () => {
  describe("GET /health", () => {
    it("should return status ok with correct fields", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status", "ok");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("environment");
    });

    it("should return uptime as a number", async () => {
      const res = await request(app).get("/health");

      expect(typeof res.body.uptime).toBe("number");
    });
  });

  describe("GET /metrics", () => {
    it("should return Prometheus metrics", async () => {
      const res = await request(app).get("/metrics");

      expect(res.status).toBe(200);
      expect(res.text).toContain("http_request_duration_seconds");
      expect(res.text).toContain("http_requests_total");
    });
  });

  describe("Unknown route", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/unknown");

      expect(res.status).toBe(404);
    });
  });
});
