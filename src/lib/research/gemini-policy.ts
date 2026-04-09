export type GeminiPolicyMode =
  | "coach"
  | "improve-polish"
  | "grounded-official"
  | "exam-session-mark";

interface GeminiModePolicy {
  timeoutMs: number;
  maxOutputTokens: number;
  cacheTtlMs: number;
}

const GEMINI_MODE_POLICIES: Record<GeminiPolicyMode, GeminiModePolicy> = {
  coach: {
    timeoutMs: 8_000,
    maxOutputTokens: 400,
    cacheTtlMs: 10 * 60_000,
  },
  "improve-polish": {
    timeoutMs: 7_500,
    maxOutputTokens: 240,
    cacheTtlMs: 15 * 60_000,
  },
  "grounded-official": {
    timeoutMs: 10_000,
    maxOutputTokens: 720,
    cacheTtlMs: 10 * 60_000,
  },
  /** Full paper: micro marks + examiner walkthrough + WW/TTI in one JSON object. */
  "exam-session-mark": {
    timeoutMs: 90_000,
    maxOutputTokens: 4096,
    /** Same answers+questions → no second API call (retries, double submit). */
    cacheTtlMs: 25 * 60_000,
  },
};

const GEMINI_RESPONSE_CACHE = new Map<string, { expiresAt: number; payload: unknown }>();

function normalizeCacheSeed(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function getGeminiModePolicy(mode: GeminiPolicyMode) {
  return GEMINI_MODE_POLICIES[mode];
}

export function buildGeminiCacheKey(mode: GeminiPolicyMode, ...parts: string[]) {
  return [mode, ...parts.map((part) => normalizeCacheSeed(part))].join("::");
}

export function readGeminiCachedResponse<T>(cacheKey: string): T | null {
  const cached = GEMINI_RESPONSE_CACHE.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    GEMINI_RESPONSE_CACHE.delete(cacheKey);
    return null;
  }

  return cached.payload as T;
}

export function writeGeminiCachedResponse<T>(
  mode: GeminiPolicyMode,
  cacheKey: string,
  payload: T
) {
  const ttl = getGeminiModePolicy(mode).cacheTtlMs;
  if (ttl <= 0) {
    return;
  }
  GEMINI_RESPONSE_CACHE.set(cacheKey, {
    expiresAt: Date.now() + ttl,
    payload,
  });
}

export function createGeminiTimeoutSignal(mode: GeminiPolicyMode) {
  const policy = getGeminiModePolicy(mode);
  return AbortSignal.timeout(policy.timeoutMs);
}
