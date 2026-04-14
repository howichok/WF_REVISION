import type { ExamConditionsDifficultyMode, ExamConditionsSession } from "@/lib/exam-conditions";

const STORAGE_KEY = "wf-exam-conditions-draft-v1";

export type ExamConditionsDraftV1 = {
  v: 1;
  routeTopicId: string;
  /** Stable signature for multi-topic launch; null when single-topic. */
  allocSignature: string | null;
  setSize: number;
  difficultyMode: ExamConditionsDifficultyMode;
  preferredQuestionId: string | null;
  session: ExamConditionsSession;
  answers: Record<string, string>;
  currentIndex: number;
  startedAt: number;
  totalSeconds: number;
};

export function examAllocSignature(
  alloc: Array<{ topicId: string; count: number }> | null,
): string | null {
  if (!alloc || alloc.length === 0) {
    return null;
  }
  return [...alloc]
    .sort((a, b) => a.topicId.localeCompare(b.topicId))
    .map((x) => `${x.topicId}:${x.count}`)
    .join("|");
}

export function loadExamConditionsDraft(): ExamConditionsDraftV1 | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ExamConditionsDraftV1;
    if (parsed?.v !== 1 || !parsed.session?.questions?.length) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveExamConditionsDraft(draft: ExamConditionsDraftV1) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* quota or private mode */
  }
}

export function clearExamConditionsDraft() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function draftMatchesRoute(
  draft: ExamConditionsDraftV1,
  input: {
    routeTopicId: string;
    allocSignature: string | null;
    setSize: number;
    difficultyMode: ExamConditionsDifficultyMode;
    preferredQuestionId?: string | null;
  },
): boolean {
  if (draft.routeTopicId !== input.routeTopicId) {
    return false;
  }
  if ((draft.allocSignature ?? null) !== (input.allocSignature ?? null)) {
    return false;
  }
  if (draft.setSize !== input.setSize || draft.difficultyMode !== input.difficultyMode) {
    return false;
  }
  const pref = input.preferredQuestionId ?? null;
  if ((draft.preferredQuestionId ?? null) !== pref) {
    return false;
  }
  return true;
}
