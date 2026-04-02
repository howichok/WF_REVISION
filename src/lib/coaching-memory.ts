import { getRevisionPredictionBand, type RevisionPredictionBand } from "@/lib/intelligence/revision-prediction";

export const TOPIC_COACHING_MEMORY_STORAGE_KEY = "wf-revision-topic-coaching-memory";

export type TopicCoachingActivityKind =
  | "ask"
  | "answer-check"
  | "exam-drill"
  | "recall"
  | "quiz";

export interface TopicCoachingMemoryEntry {
  topicId: string;
  updatedAt: string;
  lastActivityKind?: TopicCoachingActivityKind;
  lastRecommendedAction?: string;
  lastRecommendedHref?: string;
  lastWeakPointId?: string;
  lastSuccessfulPointId?: string;
  lastQuestionId?: string;
  lastDrillId?: string;
  lastAskIntent?: string;
  latestAnswerCheckBand?: RevisionPredictionBand;
  latestAnswerCheckScorePercent?: number;
  latestExamDrillReadiness?: number;
  latestRecallMastery?: number;
  latestQuizScorePercent?: number;
  failStreak: number;
  distinctionStreak: number;
  drillReadyStreak: number;
  drillNeedsWorkStreak: number;
  recentActivityCount: number;
  misconceptionCounts: Record<string, number>;
  repeatedMisconceptions: string[];
}

export type TopicCoachingMemoryMap = Record<string, TopicCoachingMemoryEntry>;

type PartialTopicCoachingEntryRecord = Record<
  string,
  Partial<TopicCoachingMemoryEntry> | null | undefined
>;

interface RecordAskTopicCoachingInput {
  topicId: string;
  intent: string;
  recommendedAction?: string | null;
  recommendedHref?: string | null;
}

interface RecordAnswerCheckTopicCoachingInput {
  topicId: string;
  questionId?: string | null;
  pointId?: string | null;
  scorePercent: number;
  misconceptionLabels?: string[];
  recommendedAction?: string | null;
  recommendedHref?: string | null;
}

interface RecordExamDrillTopicCoachingInput {
  topicId: string;
  drillId?: string | null;
  pointId?: string | null;
  readinessPercent: number;
  rating?: "needs-work" | "ready";
  recommendedAction?: string | null;
  recommendedHref?: string | null;
}

interface RecordRecallTopicCoachingInput {
  topicId: string;
  masteryPercent: number;
  recommendedAction?: string | null;
  recommendedHref?: string | null;
}

interface RecordQuizTopicCoachingInput {
  topicId: string;
  scorePercent: number;
  recommendedAction?: string | null;
  recommendedHref?: string | null;
}

function trimOrUndefined(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getTimestamp(value: string | null | undefined) {
  const timestamp = Date.parse(value ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function createEmptyEntry(topicId: string): TopicCoachingMemoryEntry {
  return {
    topicId,
    updatedAt: new Date().toISOString(),
    failStreak: 0,
    distinctionStreak: 0,
    drillReadyStreak: 0,
    drillNeedsWorkStreak: 0,
    recentActivityCount: 0,
    misconceptionCounts: {},
    repeatedMisconceptions: [],
  };
}

export function getTopicCoachingMemoryStorageKey(userId?: string | null) {
  const trimmedUserId = trimOrUndefined(userId);
  return trimmedUserId
    ? `${TOPIC_COACHING_MEMORY_STORAGE_KEY}:${trimmedUserId}`
    : TOPIC_COACHING_MEMORY_STORAGE_KEY;
}

function normalizeMisconceptionKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function toRepeatedMisconceptions(counts: Record<string, number>) {
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .map(([label]) => label)
    .slice(0, 4);
}

function mergeMisconceptionCounts(
  current: Record<string, number>,
  labels: string[]
) {
  const next = { ...current };

  for (const label of labels) {
    const key = normalizeMisconceptionKey(label);
    if (!key) {
      continue;
    }
    next[key] = (next[key] ?? 0) + 1;
  }

  return next;
}

function updateEntry(
  currentMap: TopicCoachingMemoryMap,
  topicId: string,
  updater: (entry: TopicCoachingMemoryEntry) => TopicCoachingMemoryEntry
) {
  const currentEntry = currentMap[topicId] ?? createEmptyEntry(topicId);
  const nextEntry = updater(currentEntry);

  return {
    ...currentMap,
    [topicId]: {
      ...nextEntry,
      topicId,
      updatedAt: new Date().toISOString(),
      recentActivityCount: Math.max(1, (currentEntry.recentActivityCount ?? 0) + 1),
    },
  };
}

export function getTopicCoachingEntry(
  memory: TopicCoachingMemoryMap | undefined,
  topicId: string
) {
  return memory?.[topicId] ?? null;
}

export function normalizeTopicCoachingMemoryMap(
  raw: PartialTopicCoachingEntryRecord | null | undefined
): TopicCoachingMemoryMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const next: TopicCoachingMemoryMap = {};

  for (const [topicId, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    next[topicId] = {
      ...createEmptyEntry(topicId),
      ...value,
      topicId,
      updatedAt:
        typeof value.updatedAt === "string" && value.updatedAt.trim()
          ? value.updatedAt
          : new Date().toISOString(),
      failStreak: Number.isFinite(value.failStreak)
        ? Math.max(0, value.failStreak ?? 0)
        : 0,
      distinctionStreak: Number.isFinite(value.distinctionStreak)
        ? Math.max(0, value.distinctionStreak ?? 0)
        : 0,
      drillReadyStreak: Number.isFinite(value.drillReadyStreak)
        ? Math.max(0, value.drillReadyStreak ?? 0)
        : 0,
      drillNeedsWorkStreak: Number.isFinite(value.drillNeedsWorkStreak)
        ? Math.max(0, value.drillNeedsWorkStreak ?? 0)
        : 0,
      recentActivityCount: Number.isFinite(value.recentActivityCount)
        ? Math.max(0, value.recentActivityCount ?? 0)
        : 0,
      misconceptionCounts:
        value.misconceptionCounts &&
        typeof value.misconceptionCounts === "object" &&
        !Array.isArray(value.misconceptionCounts)
          ? Object.fromEntries(
              Object.entries(value.misconceptionCounts).filter(
                (entry): entry is [string, number] =>
                  typeof entry[0] === "string" && typeof entry[1] === "number"
              )
            )
          : {},
      repeatedMisconceptions: Array.isArray(value.repeatedMisconceptions)
        ? value.repeatedMisconceptions.filter(
            (entry): entry is string => typeof entry === "string"
          )
        : [],
    };
  }

  return next;
}

export function readTopicCoachingMemory(
  raw: string | null | undefined
): TopicCoachingMemoryMap {
  if (!raw) {
    return {};
  }

  try {
    return normalizeTopicCoachingMemoryMap(
      JSON.parse(raw) as PartialTopicCoachingEntryRecord
    );
  } catch {
    return {};
  }
}

export function serializeTopicCoachingMemory(memory: TopicCoachingMemoryMap) {
  return JSON.stringify(memory);
}

export function mergeTopicCoachingMemoryMaps(
  ...maps: Array<TopicCoachingMemoryMap | null | undefined>
) {
  const next: TopicCoachingMemoryMap = {};

  for (const currentMap of maps) {
    if (!currentMap) {
      continue;
    }

    for (const [topicId, entry] of Object.entries(currentMap)) {
      const existing = next[topicId];

      if (!existing || getTimestamp(entry.updatedAt) >= getTimestamp(existing.updatedAt)) {
        next[topicId] = entry;
      }
    }
  }

  return next;
}

export function recordAskTopicCoaching(
  currentMap: TopicCoachingMemoryMap,
  input: RecordAskTopicCoachingInput
) {
  return updateEntry(currentMap, input.topicId, (entry) => ({
    ...entry,
    lastActivityKind: "ask",
    lastAskIntent: trimOrUndefined(input.intent),
    lastRecommendedAction: trimOrUndefined(input.recommendedAction) ?? entry.lastRecommendedAction,
    lastRecommendedHref: trimOrUndefined(input.recommendedHref) ?? entry.lastRecommendedHref,
  }));
}

export function recordAnswerCheckTopicCoaching(
  currentMap: TopicCoachingMemoryMap,
  input: RecordAnswerCheckTopicCoachingInput
) {
  return updateEntry(currentMap, input.topicId, (entry) => {
    const band = getRevisionPredictionBand(input.scorePercent);
    const pointId = trimOrUndefined(input.pointId) ?? trimOrUndefined(input.questionId);
    const misconceptionCounts = mergeMisconceptionCounts(
      entry.misconceptionCounts,
      input.misconceptionLabels ?? []
    );

    return {
      ...entry,
      lastActivityKind: "answer-check",
      lastQuestionId: trimOrUndefined(input.questionId) ?? entry.lastQuestionId,
      latestAnswerCheckBand: band,
      latestAnswerCheckScorePercent: input.scorePercent,
      lastRecommendedAction: trimOrUndefined(input.recommendedAction) ?? entry.lastRecommendedAction,
      lastRecommendedHref: trimOrUndefined(input.recommendedHref) ?? entry.lastRecommendedHref,
      lastWeakPointId:
        band === "fail" ? pointId ?? entry.lastWeakPointId : entry.lastWeakPointId,
      lastSuccessfulPointId:
        band === "merit" || band === "distinction"
          ? pointId ?? entry.lastSuccessfulPointId
          : entry.lastSuccessfulPointId,
      failStreak:
        band === "fail"
          ? entry.lastWeakPointId === pointId
            ? entry.failStreak + 1
            : 1
          : 0,
      distinctionStreak:
        band === "distinction"
          ? entry.lastSuccessfulPointId === pointId
            ? entry.distinctionStreak + 1
            : 1
          : 0,
      drillReadyStreak: band === "fail" ? entry.drillReadyStreak : entry.drillReadyStreak,
      drillNeedsWorkStreak:
        band === "distinction" || band === "merit" ? entry.drillNeedsWorkStreak : entry.drillNeedsWorkStreak,
      misconceptionCounts,
      repeatedMisconceptions: toRepeatedMisconceptions(misconceptionCounts),
    };
  });
}

export function recordExamDrillTopicCoaching(
  currentMap: TopicCoachingMemoryMap,
  input: RecordExamDrillTopicCoachingInput
) {
  return updateEntry(currentMap, input.topicId, (entry) => {
    const pointId = trimOrUndefined(input.pointId) ?? trimOrUndefined(input.drillId);
    const isReady =
      input.rating === "ready" || (input.rating !== "needs-work" && input.readinessPercent >= 70);

    return {
      ...entry,
      lastActivityKind: "exam-drill",
      lastDrillId: trimOrUndefined(input.drillId) ?? entry.lastDrillId,
      latestExamDrillReadiness: input.readinessPercent,
      lastRecommendedAction: trimOrUndefined(input.recommendedAction) ?? entry.lastRecommendedAction,
      lastRecommendedHref: trimOrUndefined(input.recommendedHref) ?? entry.lastRecommendedHref,
      lastWeakPointId:
        !isReady ? pointId ?? entry.lastWeakPointId : entry.lastWeakPointId,
      lastSuccessfulPointId:
        isReady ? pointId ?? entry.lastSuccessfulPointId : entry.lastSuccessfulPointId,
      drillReadyStreak:
        isReady
          ? entry.lastSuccessfulPointId === pointId
            ? entry.drillReadyStreak + 1
            : 1
          : 0,
      drillNeedsWorkStreak:
        !isReady
          ? entry.lastWeakPointId === pointId
            ? entry.drillNeedsWorkStreak + 1
            : 1
          : 0,
    };
  });
}

export function recordRecallTopicCoaching(
  currentMap: TopicCoachingMemoryMap,
  input: RecordRecallTopicCoachingInput
) {
  return updateEntry(currentMap, input.topicId, (entry) => ({
    ...entry,
    lastActivityKind: "recall",
    latestRecallMastery: input.masteryPercent,
    lastRecommendedAction: trimOrUndefined(input.recommendedAction) ?? entry.lastRecommendedAction,
    lastRecommendedHref: trimOrUndefined(input.recommendedHref) ?? entry.lastRecommendedHref,
  }));
}

export function recordQuizTopicCoaching(
  currentMap: TopicCoachingMemoryMap,
  input: RecordQuizTopicCoachingInput
) {
  return updateEntry(currentMap, input.topicId, (entry) => ({
    ...entry,
    lastActivityKind: "quiz",
    latestQuizScorePercent: input.scorePercent,
    lastRecommendedAction: trimOrUndefined(input.recommendedAction) ?? entry.lastRecommendedAction,
    lastRecommendedHref: trimOrUndefined(input.recommendedHref) ?? entry.lastRecommendedHref,
  }));
}
