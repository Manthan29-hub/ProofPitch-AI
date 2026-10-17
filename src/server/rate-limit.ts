export type RateLimit = { max: number; windowMs: number };

/** Sliding-window limits with bounded keys; active keys are never evicted to admit new ones. */
export class WindowRateLimiter {
  private readonly requests = new Map<string, number[]>();
  constructor(private readonly limit: RateLimit, private readonly maxKeys = 10_000, private readonly now: () => number = Date.now) {
    if (!Number.isInteger(limit.max) || limit.max < 1 || !Number.isFinite(limit.windowMs) || limit.windowMs <= 0 || !Number.isInteger(maxKeys) || maxKeys < 1) throw Error("Invalid rate limit configuration");
  }
  allow(key: string): boolean {
    const now = this.now();
    const recent = (this.requests.get(key) ?? []).filter(time => now - time < this.limit.windowMs);
    if (recent.length >= this.limit.max) return false;
    if (recent.length === 0) this.requests.delete(key);
    if (!this.requests.has(key) && this.requests.size >= this.maxKeys) {
      for (const [candidate, times] of this.requests) {
        if (now - times[times.length - 1] >= this.limit.windowMs) this.requests.delete(candidate);
      }
      if (this.requests.size >= this.maxKeys) return false;
    }
    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }
}
