import type { User as SupabaseUser, SupabaseClient } from "@supabase/supabase-js";
import { TOPICS } from "./types";
import type {
  ActivityLog,
  AppBootstrapState,
  DiagnosticResult,
  FocusBreakdownData,
  OnboardingData,
  RevisionProgressEntry,
  TopicScore,
  TopicDiagnosticReport,
  UserProfile,
} from "./types";
import type { Database, Json } from "./supabase/database.types";
import {
  loadPersistedTopicDiagnostics,
  persistDiagnosticSessionDetails,
} from "./diagnostic-database";

type AppSupabaseClient = SupabaseClient<Database>;

type FocusRow = Database["public"]["Tables"]["focus_breakdown_entries"]["Row"];
type OnboardingRow = Database["public"]["Tables"]["user_onboarding"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DiagnosticAttemptRow =
  Database["public"]["Tables"]["diagnostic_attempts"]["Row"];
type DiagnosticScoreRow =
  Database["public"]["Tables"]["diagnostic_topic_scores"]["Row"];
type RevisionRow = Database["public"]["Tables"]["revision_progress"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activity_history"]["Row"];

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeStringList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getProgressStatus(
  progressPercent: number
): RevisionProgressEntry["status"] {
  if (progressPercent >= 100) {
    return "completed";
  }

  if (progressPercent > 0) {
    return "in-progress";
  }

  return "not-started";
}

async function pruneFocusBreakdownEntries(
  supabase: AppSupabaseClient,
  userId: string,
  activeTopicIds: string[]
) {
  const activeTopics = new Set(activeTopicIds);
  const { data: focusRows, error: focusRowsError } = await supabase
    .from("focus_breakdown_entries")
    .select("id, topic_id")
    .eq("user_id", userId);

  if (focusRowsError) {
    throw focusRowsError;
  }

  const staleRowIds = (focusRows ?? [])
    .filter((row) => !activeTopics.has(row.topic_id))
    .map((row) => row.id);

  if (staleRowIds.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("focus_breakdown_entries")
    .delete()
    .in("id", staleRowIds);

  if (deleteError) {
    throw deleteError;
  }
}

export function getFallbackNickname(user: {
  email?: string | null;
  user_metadata?: Record<string, Json | undefined>;
}) {
  const metadataNickname = user.user_metadata?.nickname;

  if (typeof metadataNickname === "string" && metadataNickname.trim().length >= 2) {
    return metadataNickname.trim();
  }

  if (user.email) {
    return user.email.split("@")[0] || "Student";
  }

  return "Student";
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    email: row.email ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFocusBreakdown(
  onboardingRow: OnboardingRow | null,
  focusRows: FocusRow[]
): OnboardingData | null {
  if (!onboardingRow) {
    return null;
  }

  const selectedSubtopics: Record<string, string[]> = {};
  const freeTextNotes: Record<string, string> = {};

  focusRows.forEach((row) => {
    selectedSubtopics[row.topic_id] = row.selected_subtopics ?? [];
    if (row.free_text_note) {
      freeTextNotes[row.topic_id] = row.free_text_note;
    }
  });

  const focusBreakdown: FocusBreakdownData | undefined =
    focusRows.length > 0 || onboardingRow.global_focus_note
      ? {
          selectedSubtopics,
          freeTextNotes,
          globalNote: onboardingRow.global_focus_note ?? "",
          completedAt: onboardingRow.completed_at ?? "",
        }
      : undefined;

  return {
    weakAreas: onboardingRow.weak_areas ?? [],
    focusBreakdown,
    completedAt: onboardingRow.completed_at ?? "",
  };
}

function parseStringList(value: Json | undefined) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function isTopicDiagnosticPointStatus(
  value: unknown
): value is TopicDiagnosticReport["curriculumPoints"][number]["status"] {
  return (
    value === "covered" ||
    value === "partial" ||
    value === "unassessed" ||
    value === "misconception"
  );
}

function isTopicDiagnosticReportEntry(
  value: unknown
): value is TopicDiagnosticReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entry = value as Record<string, Json | undefined>;

  return (
    typeof entry.topicId === "string" &&
    typeof entry.topicLabel === "string" &&
    typeof entry.topicIcon === "string" &&
    typeof entry.assessedAt === "string" &&
    typeof entry.freeformResponse === "string" &&
    typeof entry.confidence === "number" &&
    Array.isArray(entry.curriculumPoints) &&
    entry.curriculumPoints.every((point) => {
      if (!point || typeof point !== "object" || Array.isArray(point)) {
        return false;
      }

      const valuePoint = point as Record<string, Json | undefined>;

      return (
        typeof valuePoint.pointId === "string" &&
        typeof valuePoint.label === "string" &&
        isTopicDiagnosticReportEntryArray(valuePoint.matchedTerms) &&
        isTopicDiagnosticReportEntryArray(valuePoint.missingTerms) &&
        isTopicDiagnosticReportEntryArray(valuePoint.evidence) &&
        isTopicDiagnosticPointStatus(valuePoint.status) &&
        typeof valuePoint.confidence === "number" &&
        (valuePoint.notes === undefined ||
          valuePoint.notes === null ||
          typeof valuePoint.notes === "string")
      );
    }) &&
    isTopicDiagnosticReportEntryArray(entry.keyTermsMatched) &&
    Array.isArray(entry.misconceptions) &&
    entry.misconceptions.every((misconception) => {
      if (!misconception || typeof misconception !== "object" || Array.isArray(misconception)) {
        return false;
      }

      const valueMisconception = misconception as Record<string, Json | undefined>;

      return (
        typeof valueMisconception.id === "string" &&
        typeof valueMisconception.label === "string" &&
        typeof valueMisconception.explanation === "string" &&
        (valueMisconception.pointId === undefined ||
          valueMisconception.pointId === null ||
          typeof valueMisconception.pointId === "string")
      );
    }) &&
    isTopicDiagnosticReportEntryArray(entry.suggestedNextTargets) &&
    isTopicDiagnosticReportEntryArray(entry.recommendedMaterialIds) &&
    Array.isArray(entry.followUps) &&
    entry.followUps.every((followUp) => {
      if (!followUp || typeof followUp !== "object" || Array.isArray(followUp)) {
        return false;
      }

      const valueFollowUp = followUp as Record<string, Json | undefined>;

      return (
        typeof valueFollowUp.id === "string" &&
        typeof valueFollowUp.targetedPointId === "string" &&
        typeof valueFollowUp.question === "string" &&
        typeof valueFollowUp.answer === "string" &&
        (valueFollowUp.reason === "missing-point" ||
          valueFollowUp.reason === "weak-point" ||
          valueFollowUp.reason === "misconception" ||
          valueFollowUp.reason === "low-confidence")
      );
    })
  );
}

function isTopicDiagnosticReportEntryArray(
  value: Json | undefined
): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function parseTopicDiagnostics(value: Json | undefined) {
  return Array.isArray(value)
    ? (value.filter((entry) => isTopicDiagnosticReportEntry(entry)) as unknown as TopicDiagnosticReport[])
    : [];
}

function extractDiagnosticSnapshot(snapshot: Json | undefined) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {
      version: undefined,
      latestTopicId: undefined,
      assessedTopicIds: undefined,
      unassessedTopicIds: undefined,
      recommendedTopicIds: undefined,
      topicDiagnostics: undefined,
    };
  }

  const data = snapshot as Record<string, Json | undefined>;
  const topicDiagnostics = parseTopicDiagnostics(data.topicDiagnostics);

  return {
    version: typeof data.version === "number" ? data.version : undefined,
    latestTopicId:
      typeof data.latestTopicId === "string" ? data.latestTopicId : undefined,
    assessedTopicIds: parseStringList(data.assessedTopicIds),
    unassessedTopicIds: parseStringList(data.unassessedTopicIds),
    recommendedTopicIds: parseStringList(data.recommendedTopicIds),
    topicDiagnostics,
  };
}

function serializeDiagnosticSnapshot(result: DiagnosticResult): Json {
  return JSON.parse(
    JSON.stringify({
      version: result.version ?? 1,
      latestTopicId: result.latestTopicId ?? null,
      assessedTopicIds: result.assessedTopicIds ?? [],
      unassessedTopicIds: result.unassessedTopicIds ?? [],
      recommendedTopicIds: result.recommendedTopicIds ?? [],
      topicDiagnostics: result.topicDiagnostics ?? [],
    })
  ) as Json;
}

function mapDiagnostic(
  attemptRow: DiagnosticAttemptRow | null,
  scoreRows: DiagnosticScoreRow[]
): DiagnosticResult | null {
  if (!attemptRow) {
    return null;
  }

  const topicScores: TopicScore[] = scoreRows.map((row) => ({
    topic: row.topic_label,
    category: row.topic_id,
    score: row.score,
    maxScore: row.max_score,
  }));
  const snapshot = extractDiagnosticSnapshot(attemptRow.diagnostic_snapshot);

  return {
    id: attemptRow.id,
    completedAt: attemptRow.completed_at,
    overallScore: attemptRow.overall_score,
    questionCount: attemptRow.question_count,
    version:
      snapshot.version ??
      (typeof attemptRow.version === "number" ? attemptRow.version : undefined),
    latestTopicId: snapshot.latestTopicId,
    assessedTopicIds:
      snapshot.assessedTopicIds && snapshot.assessedTopicIds.length > 0
        ? snapshot.assessedTopicIds
        : topicScores.map((score) => score.category),
    unassessedTopicIds:
      snapshot.unassessedTopicIds && snapshot.unassessedTopicIds.length > 0
        ? snapshot.unassessedTopicIds
        : undefined,
    recommendedTopicIds: snapshot.recommendedTopicIds,
    topicDiagnostics: snapshot.topicDiagnostics,
    topicScores,
  };
}

function mapRevisionProgress(rows: RevisionRow[]): RevisionProgressEntry[] {
  return rows.map((row) => ({
    id: row.id,
    topicId: row.topic_id,
    entityId: row.entity_id,
    entityType: row.entity_type as RevisionProgressEntry["entityType"],
    status: row.status as RevisionProgressEntry["status"],
    progressPercent: row.progress_percent,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
    lastInteractedAt: row.last_interacted_at,
  }));
}

function mapActivities(rows: ActivityRow[]): ActivityLog[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.activity_type,
    title: row.title,
    topicId: row.topic_id,
    occurredAt: row.occurred_at,
    minutesSpent: row.minutes_spent,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? row.metadata
        : {},
  }));
}

export async function ensureUserBootstrap(
  supabase: AppSupabaseClient,
  user: SupabaseUser,
  nickname?: string
) {
  const profileNickname = trimOrNull(nickname) ?? getFallbackNickname(user);
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id, nickname, email")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  if (!existingProfile) {
    const { error: insertProfileError } = await supabase.from("profiles").insert({
      id: user.id,
      nickname: profileNickname,
      email: user.email ?? null,
    });

    if (insertProfileError) {
      throw insertProfileError;
    }
  } else if (existingProfile.email !== (user.email ?? null)) {
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        email: user.email ?? null,
      })
      .eq("id", user.id);

    if (updateProfileError) {
      throw updateProfileError;
    }
  }

  const { error: onboardingError } = await supabase.from("user_onboarding").upsert(
    {
      user_id: user.id,
    },
    {
      onConflict: "user_id",
    }
  );

  if (onboardingError) {
    throw onboardingError;
  }
}

export async function loadAppState(
  supabase: AppSupabaseClient,
  user: SupabaseUser
): Promise<AppBootstrapState> {
  await ensureUserBootstrap(supabase, user);

  const [{ data: profileRow, error: profileError }, { data: onboardingRow, error: onboardingError }, { data: focusRows, error: focusError }, { data: revisionRows, error: revisionError }, { data: activityRows, error: activityError }, { data: diagnosticAttempt, error: attemptError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("focus_breakdown_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("topic_id", { ascending: true }),
      supabase
        .from("revision_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("activity_history")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_at", { ascending: false })
        .limit(50),
      supabase
        .from("diagnostic_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (onboardingError) {
    throw onboardingError;
  }

  if (focusError) {
    throw focusError;
  }

  if (revisionError) {
    throw revisionError;
  }

  if (activityError) {
    throw activityError;
  }

  if (attemptError) {
    throw attemptError;
  }

  let profile = profileRow as ProfileRow | null;

  if (!profile) {
    await ensureUserBootstrap(supabase, user);

    const { data: recoveredProfile, error: recoveredProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (recoveredProfileError) {
      throw recoveredProfileError;
    }

    profile = recoveredProfile as ProfileRow;
  }

  const onboardingState = (onboardingRow ?? null) as OnboardingRow | null;
  const focusState = (focusRows ?? []) as FocusRow[];
  const revisionState = (revisionRows ?? []) as RevisionRow[];
  const activityState = (activityRows ?? []) as ActivityRow[];
  const latestAttempt = diagnosticAttempt as DiagnosticAttemptRow | null;
  let diagnostic: DiagnosticResult | null = null;

  if (latestAttempt) {
    const { data: diagnosticScoreRows, error: scoreError } = await supabase
      .from("diagnostic_topic_scores")
      .select("*")
      .eq("attempt_id", latestAttempt.id)
      .order("created_at", { ascending: true });

    if (scoreError) {
      throw scoreError;
    }

    diagnostic = mapDiagnostic(
      latestAttempt,
      (diagnosticScoreRows ?? []) as DiagnosticScoreRow[]
    );

    try {
      const detailedTopicDiagnostics = await loadPersistedTopicDiagnostics(
        supabase,
        user.id,
        latestAttempt.id
      );

      if (diagnostic && detailedTopicDiagnostics.length > 0) {
        diagnostic = {
          ...diagnostic,
          latestTopicId:
            diagnostic.latestTopicId ??
            detailedTopicDiagnostics[detailedTopicDiagnostics.length - 1]?.topicId,
          topicDiagnostics: detailedTopicDiagnostics,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (
        !message.includes("diagnostic_sessions") &&
        !message.includes("diagnostic_point_assessments") &&
        !message.includes("curriculum_")
      ) {
        throw error;
      }
    }
  }

  return {
    user: mapProfile(profile),
    onboarding: mapFocusBreakdown(onboardingState, focusState),
    diagnostic,
    revisionProgress: mapRevisionProgress(revisionState),
    activityHistory: mapActivities(activityState),
  };
}

export function getNextAppRoute(onboarding: OnboardingData | null) {
  if (!onboarding || onboarding.weakAreas.length === 0) {
    return "/onboarding";
  }

  if (!onboarding.completedAt) {
    return "/onboarding/focus";
  }

  return "/home";
}

export async function saveWeakAreas(
  supabase: AppSupabaseClient,
  userId: string,
  weakAreas: string[]
) {
  const normalizedWeakAreas = normalizeStringList(weakAreas);

  const { error } = await supabase.from("user_onboarding").upsert(
    {
      user_id: userId,
      weak_areas: normalizedWeakAreas,
      completed_at: null,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: null,
    })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  await pruneFocusBreakdownEntries(supabase, userId, normalizedWeakAreas);
}

export async function saveProfileNickname(
  supabase: AppSupabaseClient,
  userId: string,
  nickname: string
) {
  const normalizedNickname = trimOrNull(nickname);

  if (!normalizedNickname || normalizedNickname.length < 2) {
    throw new Error("Nickname needs to be at least 2 characters.");
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        nickname: normalizedNickname,
      },
      {
        onConflict: "id",
      }
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }
}

export async function saveFocusBreakdown(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    weakAreas: string[];
    selectedSubtopics: Record<string, string[]>;
    freeTextNotes: Record<string, string>;
    globalNote?: string;
  }
) {
  const normalizedWeakAreas = normalizeStringList(input.weakAreas);
  const completedAt = new Date().toISOString();

  const { error: onboardingError } = await supabase.from("user_onboarding").upsert(
    {
      user_id: userId,
      weak_areas: normalizedWeakAreas,
      global_focus_note: trimOrNull(input.globalNote),
      completed_at: completedAt,
    },
    {
      onConflict: "user_id",
    }
  );

  if (onboardingError) {
    throw onboardingError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: completedAt,
    })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  await pruneFocusBreakdownEntries(supabase, userId, normalizedWeakAreas);

  const rows = normalizedWeakAreas.map((topicId) => ({
    user_id: userId,
    topic_id: topicId,
    selected_subtopics: normalizeStringList(input.selectedSubtopics[topicId] ?? []),
    free_text_note: trimOrNull(input.freeTextNotes[topicId]),
  }));

  if (rows.length > 0) {
    const { error: focusError } = await supabase
      .from("focus_breakdown_entries")
      .upsert(rows, {
        onConflict: "user_id,topic_id",
      });

    if (focusError) {
      throw focusError;
    }
  }

  await logActivity(supabase, userId, {
    type: "onboarding",
    title: "Updated focus breakdown",
    minutesSpent: 5,
  });
}

export async function saveMaterialProgress(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    materialId: string;
    title: string;
    topicId: string;
    activityType: string;
    currentProgressPercent?: number;
    estimatedMinutes?: number;
  }
) {
  const currentProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(input.currentProgressPercent ?? 0))
  );
  const nextProgressPercent =
    currentProgressPercent >= 100
      ? 100
      : Math.min(100, currentProgressPercent + 25);
  const status = getProgressStatus(nextProgressPercent);
  const timestamp = new Date().toISOString();

  const { error } = await supabase.from("revision_progress").upsert(
    {
      user_id: userId,
      topic_id: input.topicId,
      entity_id: input.materialId,
      entity_type: "material",
      status,
      progress_percent: nextProgressPercent,
      last_interacted_at: timestamp,
      completed_at: nextProgressPercent >= 100 ? timestamp : null,
    },
    {
      onConflict: "user_id,topic_id,entity_id,entity_type",
    }
  );

  if (error) {
    throw error;
  }

  const activityVerb =
    nextProgressPercent >= 100
      ? currentProgressPercent >= 100
        ? "Reviewed"
        : "Completed"
      : currentProgressPercent > 0
        ? "Continued"
        : "Started";

  await logActivity(supabase, userId, {
    type: input.activityType,
    title: `${activityVerb} ${input.title}`,
    topicId: input.topicId,
    minutesSpent: input.estimatedMinutes
      ? Math.max(5, Math.min(input.estimatedMinutes, 20))
      : 10,
    metadata: {
      entityId: input.materialId,
      entityType: "material",
      progressPercent: nextProgressPercent,
    },
  });
}

export async function savePracticeSetProgress(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    practiceSetId: string;
    topicId: string;
    title: string;
    progressPercent: number;
    minutesSpent?: number;
  }
) {
  const nextProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(input.progressPercent))
  );
  const status = getProgressStatus(nextProgressPercent);
  const timestamp = new Date().toISOString();

  const { error } = await supabase.from("revision_progress").upsert(
    {
      user_id: userId,
      topic_id: input.topicId,
      entity_id: input.practiceSetId,
      entity_type: "practice-set",
      status,
      progress_percent: nextProgressPercent,
      last_interacted_at: timestamp,
      completed_at: nextProgressPercent >= 100 ? timestamp : null,
    },
    {
      onConflict: "user_id,topic_id,entity_id,entity_type",
    }
  );

  if (error) {
    throw error;
  }

  const activityVerb =
    nextProgressPercent >= 100 ? "Completed" : "Updated";

  await logActivity(supabase, userId, {
    type: "practice",
    title: `${activityVerb} ${input.title}`,
    topicId: input.topicId,
    minutesSpent: input.minutesSpent ?? 12,
    metadata: {
      entityId: input.practiceSetId,
      entityType: "practice-set",
      progressPercent: nextProgressPercent,
    },
  });
}

export async function saveDiagnosticResult(
  supabase: AppSupabaseClient,
  userId: string,
  result: DiagnosticResult
) {
  const { data: attemptRow, error: attemptError } = await supabase
    .from("diagnostic_attempts")
    .insert({
      user_id: userId,
      overall_score: result.overallScore,
      question_count: result.questionCount ?? result.topicScores.length,
      version: result.version ?? 1,
      diagnostic_snapshot: serializeDiagnosticSnapshot(result),
      completed_at: result.completedAt,
    })
    .select("*")
    .single();

  if (attemptError) {
    throw attemptError;
  }

  const savedAttempt = attemptRow as DiagnosticAttemptRow;

  try {
    const rows = result.topicScores.map((score) => ({
      attempt_id: savedAttempt.id,
      user_id: userId,
      topic_id: score.category,
      topic_label: score.topic,
      score: score.score,
      max_score: score.maxScore,
    }));

    const { error: scoreError } = await supabase
      .from("diagnostic_topic_scores")
      .insert(rows);

    if (scoreError) {
      throw scoreError;
    }

    await persistDiagnosticSessionDetails(supabase, userId, savedAttempt.id, result);

    const weakestTopic = [...result.topicScores].sort(
      (left, right) => left.score / left.maxScore - right.score / right.maxScore
    )[0];

    await logActivity(supabase, userId, {
      type: "diagnostic",
      title: weakestTopic
        ? `Completed diagnostic, weakest in ${weakestTopic.topic}`
        : "Completed diagnostic",
      topicId: weakestTopic?.category,
      minutesSpent: 25,
    });
  } catch (error) {
    await supabase.from("diagnostic_attempts").delete().eq("id", savedAttempt.id);
    throw error;
  }
}

export async function toggleSubtopicProgress(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    topicId: string;
    subtopicId: string;
    subtopicLabel: string;
    completed: boolean;
  }
) {
  const timestamp = new Date().toISOString();
  const progressPercent = input.completed ? 100 : 0;
  const { error } = await supabase.from("revision_progress").upsert(
    {
      user_id: userId,
      topic_id: input.topicId,
      entity_id: input.subtopicId,
      entity_type: "subtopic",
      status: getProgressStatus(progressPercent),
      progress_percent: progressPercent,
      last_interacted_at: timestamp,
      completed_at: input.completed ? timestamp : null,
    },
    {
      onConflict: "user_id,topic_id,entity_id,entity_type",
    }
  );

  if (error) {
    throw error;
  }

  if (input.completed) {
    const topicLabel = TOPICS.find((topic) => topic.id === input.topicId)?.label;

    await logActivity(supabase, userId, {
      type: "review",
      title: `Reviewed ${input.subtopicLabel}`,
      topicId: input.topicId,
      minutesSpent: 10,
      metadata: topicLabel ? { topicLabel } : {},
    });
  }
}

export async function logActivity(
  supabase: AppSupabaseClient,
  userId: string,
  input: {
    type: string;
    title: string;
    topicId?: string;
    minutesSpent?: number;
    metadata?: Record<string, Json>;
  }
) {
  const { error } = await supabase.from("activity_history").insert({
    user_id: userId,
    activity_type: input.type,
    title: input.title,
    topic_id: input.topicId ?? null,
    minutes_spent: input.minutesSpent ?? 0,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }
}
