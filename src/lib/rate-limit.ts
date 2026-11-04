// Simple in-memory fixed-window rate limiter.
//
// Pragya AI runs on serverless functions, so this Map lives per-instance:
// it will not be perfectly shared across every function instance, but it
// stops the common abuse pattern (one user hammering the API in a loop)
// and costs nothing to run. For strict global limits, swap this module
// for an Upstash/Redis-backed limiter later — the call sites stay the same.

interface WindowEntry {
  count: number;
  windowStart: number;
}

const windows = new Map<string, WindowEntry>();

// Opportunistic cleanup so the Map cannot grow without bound.
function cleanup(now: number, windowMs: number) {
  if (windows.size < 500) return;
  windows.forEach((entry, key) => {
    if (now - entry.windowStart > windowMs * 2) {
      windows.delete(key);
    }
  });
}

/**
 * Returns true when the request is allowed, false when the caller has
 * exceeded `limit` requests inside the current `windowMs` window.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  cleanup(now, windowMs);

  const entry = windows.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    windows.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
