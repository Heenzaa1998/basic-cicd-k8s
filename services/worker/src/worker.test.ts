describe("Worker Service", () => {
  describe("runJob", () => {
    let tickCount: number;
    let lastTickTime: number;

    function runJob(): { tickCount: number; lastTickTime: number } {
      tickCount++;
      lastTickTime = Date.now();
      return { tickCount, lastTickTime };
    }

    beforeEach(() => {
      tickCount = 0;
      lastTickTime = 0;
    });

    it("should increment tick count on each run", () => {
      runJob();
      expect(tickCount).toBe(1);

      runJob();
      expect(tickCount).toBe(2);
    });

    it("should update lastTickTime to current time", () => {
      const before = Date.now();
      runJob();
      const after = Date.now();

      expect(lastTickTime).toBeGreaterThanOrEqual(before);
      expect(lastTickTime).toBeLessThanOrEqual(after);
    });
  });

  describe("health check logic", () => {
    const INTERVAL_MS = 5000;

    function isHealthy(lastTickTime: number): boolean {
      const timeSinceLastTick = Date.now() - lastTickTime;
      return timeSinceLastTick < INTERVAL_MS * 3;
    }

    it("should be healthy when tick is recent", () => {
      expect(isHealthy(Date.now())).toBe(true);
    });

    it("should be unhealthy when tick is stale", () => {
      const staleTime = Date.now() - INTERVAL_MS * 4;
      expect(isHealthy(staleTime)).toBe(false);
    });

    it("should be healthy within 3 intervals", () => {
      const withinThreshold = Date.now() - INTERVAL_MS * 2;
      expect(isHealthy(withinThreshold)).toBe(true);
    });
  });
});
