/**
 * Wraps a promise with an AbortSignal-based timeout.
 * On timeout the returned promise rejects with an error whose message starts with "Request timed out".
 */
export function withTimeout<T>(promise: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  return promise(controller.signal)
    .then((result) => {
      clearTimeout(timerId);
      return result;
    })
    .catch((error: unknown) => {
      clearTimeout(timerId);
      if (controller.signal.aborted) {
        throw new Error(`Request timed out after ${timeoutMs}ms.`);
      }
      throw error;
    });
}

/** Default timeouts used across AI route handlers. */
export const AI_TIMEOUTS = {
  /** Fast local evaluation — no external call. */
  localEval: 8_000,
  /** Topic assistant (local + optional Gemini). */
  topicAssistant: 25_000,
  /** Revision improve. */
  revisionImprove: 30_000,
  /** Grounded research (external Gemini + Google Search). */
  groundedAnswer: 40_000,
  /** Exam conditions marking (multi-question Gemini call). */
  examMark: 55_000,
} as const;
