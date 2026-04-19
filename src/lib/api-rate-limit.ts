/**
 * General in-memory rate limiter. Per-process; resets on cold start.
 * For persistent / multi-instance limits use an external store (Redis).
 */
const hitsByKey = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const prev = hitsByKey.get(key) ?? [];
  const recent = prev.filter((t) => now - t < windowMs);

  if (recent.length >= maxPerWindow) {
    const oldest = recent[0]!;
    const retryAfterMs = windowMs - (now - oldest);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]!.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
