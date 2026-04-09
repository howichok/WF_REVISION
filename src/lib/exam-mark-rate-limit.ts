/**
 * Soft rate limit for exam marking POSTs (reduces API spam). Per-process; resets on cold start.
 */
const hitsByKey = new Map<string, number[]>();

export function checkExamMarkRateLimit(
  key: string,
  maxPerWindow = 6,
  windowMs = 60_000
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

export function clientExamMarkCooldownMs() {
  return 45_000;
}

export const EXAM_MARK_CLIENT_STORAGE_KEY = "wf_exam_mark_last_ts";
