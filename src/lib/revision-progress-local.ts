import type { RevisionProgressEntry } from "@/lib/types";

const STORAGE_KEY = "wf-revision-progress-local-v1";

function entityKey(e: Pick<RevisionProgressEntry, "topicId" | "entityType" | "entityId">) {
  return `${e.topicId}:${e.entityType}:${e.entityId}`;
}

export function readLocalRevisionProgress(): RevisionProgressEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((row): row is RevisionProgressEntry => {
      return (
        typeof row === "object" &&
        row !== null &&
        typeof (row as RevisionProgressEntry).id === "string" &&
        typeof (row as RevisionProgressEntry).topicId === "string" &&
        typeof (row as RevisionProgressEntry).entityId === "string" &&
        typeof (row as RevisionProgressEntry).entityType === "string"
      );
    });
  } catch {
    return [];
  }
}

export function writeLocalRevisionProgress(entries: RevisionProgressEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function clearLocalRevisionProgress() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function revisionProgressRecencyMs(row: RevisionProgressEntry): number {
  const u = Date.parse(row.updatedAt);
  const l = Date.parse(row.lastInteractedAt);
  const primary = Number.isFinite(u) ? u : 0;
  const secondary = Number.isFinite(l) ? l : 0;
  return Math.max(primary, secondary);
}

/** Prefer the row with the newer activity timestamp for the same topic+entity. */
export function mergeRevisionProgressPreferNewer(
  primary: RevisionProgressEntry[],
  secondary: RevisionProgressEntry[],
): RevisionProgressEntry[] {
  const map = new Map<string, RevisionProgressEntry>();
  for (const row of primary) {
    map.set(entityKey(row), row);
  }
  for (const row of secondary) {
    const key = entityKey(row);
    const existing = map.get(key);
    if (!existing || revisionProgressRecencyMs(row) > revisionProgressRecencyMs(existing)) {
      map.set(key, row);
    }
  }
  return [...map.values()].sort(
    (a, b) => revisionProgressRecencyMs(b) - revisionProgressRecencyMs(a)
  );
}

export function revisionStatusFromPercent(
  progressPercent: number,
): RevisionProgressEntry["status"] {
  if (progressPercent >= 100) {
    return "completed";
  }
  if (progressPercent > 0) {
    return "in-progress";
  }
  return "not-started";
}

export function upsertLocalRevisionProgress(
  entries: RevisionProgressEntry[],
  next: RevisionProgressEntry,
): RevisionProgressEntry[] {
  const key = entityKey(next);
  const filtered = entries.filter((e) => entityKey(e) !== key);
  return [...filtered, next];
}
