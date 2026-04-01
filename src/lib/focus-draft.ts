import { getTopicTree, TOPICS } from "@/lib/types";

export type FocusTopicOrigin = "weak-area" | "auto-added" | "confirmed";

export interface FocusBreakdownDraft {
  topicOrder: string[];
  topicOrigins: Record<string, FocusTopicOrigin>;
  selectedSubtopics: Record<string, string[]>;
  freeTextNotes: Record<string, string>;
  globalNote: string;
  openTopicId: string | null;
  updatedAt: string;
}

const DRAFT_KEY_PREFIX = "kosti:focus-breakdown:draft";

function getDraftKey(userId: string) {
  return `${DRAFT_KEY_PREFIX}:${userId}`;
}

function isKnownTopicId(topicId: string) {
  return TOPICS.some((topic) => topic.id === topicId);
}

function normalizeTopicOrder(topicOrder: string[]) {
  return [...new Set(topicOrder.filter(isKnownTopicId))];
}

function normalizeTopicOrigins(
  topicOrigins: Record<string, FocusTopicOrigin>,
  topicOrder: string[]
) {
  const normalized: Record<string, FocusTopicOrigin> = {};

  topicOrder.forEach((topicId) => {
    const origin = topicOrigins[topicId];
    normalized[topicId] =
      origin === "weak-area" || origin === "auto-added" || origin === "confirmed"
        ? origin
        : "weak-area";
  });

  return normalized;
}

function normalizeSelectedSubtopics(
  selectedSubtopics: Record<string, string[]>,
  topicOrder: string[]
) {
  const normalized: Record<string, string[]> = {};

  topicOrder.forEach((topicId) => {
    const tree = getTopicTree(topicId);
    if (!tree) {
      return;
    }

    const allowedSubtopicIds = new Set(tree.subtopics.map((subtopic) => subtopic.id));
    const safeSubtopics = [...new Set((selectedSubtopics[topicId] ?? []).filter((subtopicId) => {
      return allowedSubtopicIds.has(subtopicId);
    }))];

    if (safeSubtopics.length > 0) {
      normalized[topicId] = safeSubtopics;
    }
  });

  return normalized;
}

function normalizeFreeTextNotes(
  freeTextNotes: Record<string, string>,
  topicOrder: string[]
) {
  const normalized: Record<string, string> = {};

  topicOrder.forEach((topicId) => {
    const note = freeTextNotes[topicId]?.trim();
    if (note) {
      normalized[topicId] = note;
    }
  });

  return normalized;
}

function sanitizeDraft(input: Partial<FocusBreakdownDraft>): FocusBreakdownDraft | null {
  const topicOrder = normalizeTopicOrder(input.topicOrder ?? []);

  if (topicOrder.length === 0) {
    return null;
  }

  const topicOrigins = normalizeTopicOrigins(input.topicOrigins ?? {}, topicOrder);
  const selectedSubtopics = normalizeSelectedSubtopics(
    input.selectedSubtopics ?? {},
    topicOrder
  );
  const freeTextNotes = normalizeFreeTextNotes(input.freeTextNotes ?? {}, topicOrder);
  const globalNote = input.globalNote?.trim() ?? "";
  const openTopicId =
    input.openTopicId && topicOrder.includes(input.openTopicId)
      ? input.openTopicId
      : topicOrder[0] ?? null;

  return {
    topicOrder,
    topicOrigins,
    selectedSubtopics,
    freeTextNotes,
    globalNote,
    openTopicId,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function loadFocusBreakdownDraft(userId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getDraftKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<FocusBreakdownDraft>;
    return sanitizeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveFocusBreakdownDraft(
  userId: string,
  draft: Omit<FocusBreakdownDraft, "updatedAt">
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedDraft = sanitizeDraft({
    ...draft,
    updatedAt: new Date().toISOString(),
  });

  if (!normalizedDraft) {
    clearFocusBreakdownDraft(userId);
    return;
  }

  window.localStorage.setItem(
    getDraftKey(userId),
    JSON.stringify(normalizedDraft)
  );
}

export function clearFocusBreakdownDraft(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getDraftKey(userId));
}
