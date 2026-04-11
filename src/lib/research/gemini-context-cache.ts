/**
 * Google Gemini explicit context caching (cachedContents) for stable long prefixes.
 * @see https://ai.google.dev/gemini-api/docs/caching
 */

const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

export interface CreateGeminiCachedContentResult {
  name: string;
  expireTime?: string;
}

function modelResourcePath(modelId: string) {
  const trimmed = modelId.replace(/^models\//, "").trim();
  return trimmed.startsWith("models/") ? trimmed : `models/${trimmed}`;
}

/**
 * Creates a cached content resource. Caller should attach `name` as `cachedContent` on generateContent.
 */
export async function createGeminiCachedContent(params: {
  apiKey: string;
  modelId: string;
  displayName: string;
  ttlSeconds: number;
  /** Text stored in cache (prefix rubric / many-shot block). */
  rubricText: string;
}): Promise<CreateGeminiCachedContentResult> {
  const ttl = Math.max(60, Math.min(params.ttlSeconds, 86_400));
  const response = await fetch(`${GEMINI_API_ROOT}/cachedContents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": params.apiKey,
    },
    body: JSON.stringify({
      model: modelResourcePath(params.modelId),
      displayName: params.displayName.slice(0, 128),
      ttl: `${ttl}s`,
      contents: [
        {
          role: "user",
          parts: [{ text: params.rubricText }],
        },
      ],
    }),
  });

  const payload = (await response.json()) as { name?: string; expireTime?: string; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Failed to create Gemini cached content.");
  }
  if (!payload.name) {
    throw new Error("Gemini cached content response missing name.");
  }
  return { name: payload.name, expireTime: payload.expireTime };
}

let autoCachedName: string | null = null;
let autoCachedExpiresAt = 0;

/**
 * Resolves explicit cache resource name: manual env, or auto-created singleton when enabled.
 */
export async function resolveExamMarkCachedContentName(params: {
  apiKey: string;
  modelId: string;
  rubricForCache: string;
  minCharsForAuto: number;
  ttlSeconds: number;
}): Promise<string | undefined> {
  const manual = process.env.GEMINI_EXAM_MARK_CACHED_CONTENT?.trim();
  if (manual) {
    return manual;
  }

  if (process.env.GEMINI_EXAM_MARK_EXPLICIT_CACHE_AUTO !== "1") {
    return undefined;
  }

  if (params.rubricForCache.length < params.minCharsForAuto) {
    return undefined;
  }

  const bufferMs = 120_000;
  if (autoCachedName && autoCachedExpiresAt > Date.now() + bufferMs) {
    return autoCachedName;
  }

  const created = await createGeminiCachedContent({
    apiKey: params.apiKey,
    modelId: params.modelId,
    displayName: "wf-exam-mark-rubric",
    ttlSeconds: params.ttlSeconds,
    rubricText: params.rubricForCache,
  });

  autoCachedName = created.name;
  const ttlMs = params.ttlSeconds * 1000;
  autoCachedExpiresAt = Date.now() + ttlMs;
  return autoCachedName;
}
