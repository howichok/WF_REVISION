type RevisionRouteId =
  | "topic-assistant-stream"
  | "revision-evaluate-stream"
  | "revision-improve-stream"
  | "grounded-answer";

interface RevisionRouteMetric {
  routeId: RevisionRouteId;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  lastDurationMs: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
}

interface RevisionRuntimeStore {
  metrics: Record<RevisionRouteId, RevisionRouteMetric>;
}

const DEFAULT_ROUTES: RevisionRouteId[] = [
  "topic-assistant-stream",
  "revision-evaluate-stream",
  "revision-improve-stream",
  "grounded-answer",
];

function createRouteMetric(routeId: RevisionRouteId): RevisionRouteMetric {
  return {
    routeId,
    successCount: 0,
    errorCount: 0,
    totalDurationMs: 0,
    lastDurationMs: 0,
  };
}

function getRuntimeStore(): RevisionRuntimeStore {
  const globalStore = globalThis as typeof globalThis & {
    __wfRevisionRuntimeStore?: RevisionRuntimeStore;
  };

  if (!globalStore.__wfRevisionRuntimeStore) {
    globalStore.__wfRevisionRuntimeStore = {
      metrics: Object.fromEntries(
        DEFAULT_ROUTES.map((routeId) => [routeId, createRouteMetric(routeId)])
      ) as Record<RevisionRouteId, RevisionRouteMetric>,
    };
  }

  return globalStore.__wfRevisionRuntimeStore;
}

export function recordRevisionRouteMetric(
  routeId: RevisionRouteId,
  durationMs: number,
  ok: boolean
) {
  const store = getRuntimeStore();
  const metric = store.metrics[routeId] ?? createRouteMetric(routeId);

  metric.lastDurationMs = Math.max(0, Math.round(durationMs));
  metric.totalDurationMs += Math.max(0, durationMs);

  if (ok) {
    metric.successCount += 1;
    metric.lastSuccessAt = new Date().toISOString();
  } else {
    metric.errorCount += 1;
    metric.lastErrorAt = new Date().toISOString();
  }

  store.metrics[routeId] = metric;
}

export function getRevisionRuntimeMetrics() {
  const store = getRuntimeStore();

  return DEFAULT_ROUTES.map((routeId) => {
    const metric = store.metrics[routeId] ?? createRouteMetric(routeId);
    const totalCalls = metric.successCount + metric.errorCount;

    return {
      routeId,
      successCount: metric.successCount,
      errorCount: metric.errorCount,
      avgDurationMs:
        totalCalls > 0 ? Math.round(metric.totalDurationMs / totalCalls) : 0,
      lastDurationMs: metric.lastDurationMs,
      lastSuccessAt: metric.lastSuccessAt,
      lastErrorAt: metric.lastErrorAt,
    };
  });
}

export function getRevisionRuntimeHealth() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasSupabaseKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";

  return {
    generatedAt: new Date().toISOString(),
    env: {
      gemini: hasGemini ? "configured" : "missing",
      supabase:
        hasSupabaseUrl && hasSupabaseKey
          ? "configured"
          : hasSupabaseUrl || hasSupabaseKey
            ? "partial"
            : "missing",
      appUrl,
    },
    smokePaths: [
      `${appUrl}/revision/security/ask`,
      `${appUrl}/revision/security/exam-drill`,
      `${appUrl}/revision/security/answer-check`,
      `${appUrl}/revision/security/recall`,
      `${appUrl}/revision/security/quiz`,
      `${appUrl}/api/intelligence/topic-assistant/stream`,
      `${appUrl}/api/intelligence/evaluate/stream`,
      `${appUrl}/api/intelligence/revision-improve/stream`,
    ],
    metrics: getRevisionRuntimeMetrics(),
  };
}
