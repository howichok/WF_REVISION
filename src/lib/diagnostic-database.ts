import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiagnosticResult, TopicDiagnosticReport } from "./types";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AppSupabaseClient = SupabaseClient;

interface DiagnosticSessionRow {
  id: string;
  attempt_id: string;
  user_id: string;
  topic_id: string;
  topic_label: string;
  topic_icon: string;
  confidence: number;
  completed_at: string;
}

interface DiagnosticFreeformRow {
  session_id: string;
  answer_text: string;
}

interface DiagnosticFollowUpQuestionRow {
  session_id: string;
  sequence_number: number;
  targeted_subtopic_id: string;
  question_text: string;
  reason: TopicDiagnosticReport["followUps"][number]["reason"];
}

interface DiagnosticFollowUpResponseRow {
  session_id: string;
  sequence_number: number;
  response_text: string;
}

interface DiagnosticPointAssessmentRow {
  session_id: string;
  subtopic_id: string;
  point_label: string;
  status: TopicDiagnosticReport["curriculumPoints"][number]["status"];
  confidence: number;
  matched_terms: string[];
  missing_terms: string[];
  evidence: string[];
  notes: string | null;
}

interface DiagnosticSessionMisconceptionRow {
  session_id: string;
  subtopic_id: string;
  curriculum_misconception_id: string;
  label: string;
  explanation: string;
}

interface DiagnosticRecommendationRow {
  session_id: string;
  sequence_number: number;
  recommendation_type: "curriculum-point" | "material";
  target_material_id: string | null;
  label: string;
}

function getLatestTopicDiagnosticReport(result: DiagnosticResult) {
  const topicDiagnostics = result.topicDiagnostics ?? [];

  if (topicDiagnostics.length === 0) {
    return null;
  }

  if (result.latestTopicId) {
    return (
      topicDiagnostics.find((report) => report.topicId === result.latestTopicId) ??
      topicDiagnostics[topicDiagnostics.length - 1]
    );
  }

  return topicDiagnostics[topicDiagnostics.length - 1];
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function getTargetSubtopicId(label: string) {
  const [firstToken] = label.trim().split(/\s+/);
  return firstToken || null;
}

function buildMaterialRecommendationMetadata(materialId: string) {
  return toJson({
    source: "diagnostic-session",
    materialId,
  });
}

function toDiagnosticPersistenceError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (message.includes("curriculum_")) {
    return new Error(
      "Shared curriculum data has not been seeded into Supabase yet. Run the curriculum seed step before saving adaptive diagnostics."
    );
  }

  return error instanceof Error
    ? error
    : new Error("Unable to persist the adaptive diagnostic session.");
}

async function insertDiagnosticSession(
  supabase: AppSupabaseClient,
  userId: string,
  attemptId: string,
  report: TopicDiagnosticReport,
  engineVersion: number
) {
  const { data, error } = await supabase
    .from("diagnostic_sessions")
    .insert({
      attempt_id: attemptId,
      user_id: userId,
      topic_id: report.topicId,
      topic_label: report.topicLabel,
      topic_icon: report.topicIcon,
      confidence: report.confidence,
      engine_version: engineVersion,
      completed_at: report.assessedAt,
      started_at: report.assessedAt,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as DiagnosticSessionRow;
}

export async function persistDiagnosticSessionDetails(
  supabase: AppSupabaseClient,
  userId: string,
  attemptId: string,
  result: DiagnosticResult
) {
  try {
    const latestReport = getLatestTopicDiagnosticReport(result);

    if (!latestReport) {
      return;
    }

    const session = await insertDiagnosticSession(
      supabase,
      userId,
      attemptId,
      latestReport,
      result.version ?? 1
    );

    const { error: freeformError } = await supabase
      .from("diagnostic_freeform_inputs")
      .insert({
        session_id: session.id,
        user_id: userId,
        answer_text: latestReport.freeformResponse,
      });

    if (freeformError) {
      throw freeformError;
    }

    if (latestReport.followUps.length > 0) {
      const followUpQuestions = latestReport.followUps.map((followUp, index) => ({
        session_id: session.id,
        user_id: userId,
        sequence_number: index + 1,
        targeted_subtopic_id: followUp.targetedPointId,
        reason: followUp.reason,
        question_text: followUp.question,
        asked_at: latestReport.assessedAt,
      }));

      const { error: questionError } = await supabase
        .from("diagnostic_followup_questions")
        .insert(followUpQuestions);

      if (questionError) {
        throw questionError;
      }

      const followUpResponses = latestReport.followUps.map((followUp, index) => ({
        session_id: session.id,
        user_id: userId,
        sequence_number: index + 1,
        response_text: followUp.answer,
        responded_at: latestReport.assessedAt,
      }));

      const { error: responseError } = await supabase
        .from("diagnostic_followup_responses")
        .insert(followUpResponses);

      if (responseError) {
        throw responseError;
      }
    }

    if (latestReport.curriculumPoints.length > 0) {
      const pointRows = latestReport.curriculumPoints.map((point) => ({
        session_id: session.id,
        user_id: userId,
        subtopic_id: point.pointId,
        point_label: point.label,
        status: point.status,
        confidence: point.confidence,
        matched_terms: point.matchedTerms,
        missing_terms: point.missingTerms,
        evidence: point.evidence,
        notes: point.notes ?? null,
      }));

      const { error: pointError } = await supabase
        .from("diagnostic_point_assessments")
        .insert(pointRows);

      if (pointError) {
        throw pointError;
      }
    }

    if (latestReport.misconceptions.length > 0) {
      const misconceptionRows = latestReport.misconceptions.map((misconception) => {
        const subtopicId =
          misconception.pointId ??
          latestReport.curriculumPoints[0]?.pointId ??
          null;

        if (!subtopicId) {
          throw new Error("Unable to map a misconception to a curriculum subtopic.");
        }

        return {
          session_id: session.id,
          user_id: userId,
          subtopic_id: subtopicId,
          curriculum_misconception_id: `${subtopicId}::${misconception.id}`,
          label: misconception.label,
          explanation: misconception.explanation,
        };
      });

      const { error: misconceptionError } = await supabase
        .from("diagnostic_session_misconceptions")
        .insert(misconceptionRows);

      if (misconceptionError) {
        throw misconceptionError;
      }
    }

    const recommendationRows = [
      ...latestReport.suggestedNextTargets.map((target, index) => ({
        session_id: session.id,
        user_id: userId,
        sequence_number: index + 1,
        recommendation_type: "curriculum-point" as const,
        target_subtopic_id: getTargetSubtopicId(target),
        target_material_id: null,
        label: target,
        metadata: toJson({
          source: "diagnostic-session",
          targetType: "curriculum-point",
        }),
      })),
      ...latestReport.recommendedMaterialIds.map((materialId, index) => ({
        session_id: session.id,
        user_id: userId,
        sequence_number: latestReport.suggestedNextTargets.length + index + 1,
        recommendation_type: "material" as const,
        target_subtopic_id: null,
        target_material_id: materialId,
        label: materialId,
        metadata: buildMaterialRecommendationMetadata(materialId),
      })),
    ].filter((row) =>
      row.recommendation_type === "material"
        ? Boolean(row.target_material_id)
        : Boolean(row.target_subtopic_id)
    );

    if (recommendationRows.length > 0) {
      const { error: recommendationError } = await supabase
        .from("diagnostic_recommendations")
        .insert(recommendationRows);

      if (recommendationError) {
        throw recommendationError;
      }
    }
  } catch (error) {
    throw toDiagnosticPersistenceError(error);
  }
}

export async function loadPersistedTopicDiagnostics(
  supabase: AppSupabaseClient,
  userId: string,
  attemptId: string
) {
  const [
    { data: sessionRows, error: sessionsError },
    { data: freeformRows, error: freeformError },
    { data: followUpQuestionRows, error: followUpQuestionError },
    { data: followUpResponseRows, error: followUpResponseError },
    { data: assessmentRows, error: assessmentError },
    { data: misconceptionRows, error: misconceptionError },
    { data: recommendationRows, error: recommendationError },
  ] = await Promise.all([
    supabase
      .from("diagnostic_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("attempt_id", attemptId)
      .order("completed_at", { ascending: true }),
    supabase
      .from("diagnostic_freeform_inputs")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("diagnostic_followup_questions")
      .select("*")
      .eq("user_id", userId)
      .order("sequence_number", { ascending: true }),
    supabase
      .from("diagnostic_followup_responses")
      .select("*")
      .eq("user_id", userId)
      .order("sequence_number", { ascending: true }),
    supabase
      .from("diagnostic_point_assessments")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("diagnostic_session_misconceptions")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("diagnostic_recommendations")
      .select("*")
      .eq("user_id", userId)
      .order("sequence_number", { ascending: true }),
  ]);

  if (sessionsError) throw sessionsError;
  if (freeformError) throw freeformError;
  if (followUpQuestionError) throw followUpQuestionError;
  if (followUpResponseError) throw followUpResponseError;
  if (assessmentError) throw assessmentError;
  if (misconceptionError) throw misconceptionError;
  if (recommendationError) throw recommendationError;

  const sessions = (sessionRows ?? []) as DiagnosticSessionRow[];
  const freeforms = (freeformRows ?? []) as DiagnosticFreeformRow[];
  const questions = (followUpQuestionRows ?? []) as DiagnosticFollowUpQuestionRow[];
  const responses = (followUpResponseRows ?? []) as DiagnosticFollowUpResponseRow[];
  const assessments = (assessmentRows ?? []) as DiagnosticPointAssessmentRow[];
  const misconceptions =
    (misconceptionRows ?? []) as DiagnosticSessionMisconceptionRow[];
  const recommendations =
    (recommendationRows ?? []) as DiagnosticRecommendationRow[];

  return sessions.map((session) => {
    const sessionFreeform = freeforms.find((row) => row.session_id === session.id);
    const sessionQuestions = questions
      .filter((row) => row.session_id === session.id)
      .sort((left, right) => left.sequence_number - right.sequence_number);
    const sessionResponses = responses
      .filter((row) => row.session_id === session.id)
      .sort((left, right) => left.sequence_number - right.sequence_number);
    const sessionAssessments = assessments
      .filter((row) => row.session_id === session.id)
      .sort((left, right) => left.subtopic_id.localeCompare(right.subtopic_id));
    const sessionMisconceptions = misconceptions.filter(
      (row) => row.session_id === session.id
    );
    const sessionRecommendations = recommendations
      .filter((row) => row.session_id === session.id)
      .sort((left, right) => left.sequence_number - right.sequence_number);

    return {
      topicId: session.topic_id,
      topicLabel: session.topic_label,
      topicIcon: session.topic_icon,
      assessedAt: session.completed_at,
      freeformResponse: sessionFreeform?.answer_text ?? "",
      curriculumPoints: sessionAssessments.map((assessment) => ({
        pointId: assessment.subtopic_id,
        label: assessment.point_label,
        status: assessment.status as TopicDiagnosticReport["curriculumPoints"][number]["status"],
        confidence: assessment.confidence,
        matchedTerms: assessment.matched_terms,
        missingTerms: assessment.missing_terms,
        evidence: assessment.evidence,
        notes: assessment.notes ?? undefined,
      })),
      keyTermsMatched: Array.from(
        new Set(sessionAssessments.flatMap((assessment) => assessment.matched_terms))
      ),
      misconceptions: sessionMisconceptions.map((misconception) => ({
        id: misconception.curriculum_misconception_id,
        pointId: misconception.subtopic_id,
        label: misconception.label,
        explanation: misconception.explanation,
      })),
      confidence: session.confidence,
      suggestedNextTargets: sessionRecommendations
        .filter((recommendation) => recommendation.recommendation_type === "curriculum-point")
        .map((recommendation) => recommendation.label),
      recommendedMaterialIds: sessionRecommendations
        .filter((recommendation) => recommendation.recommendation_type === "material")
        .map((recommendation) => recommendation.target_material_id)
        .filter((materialId): materialId is string => Boolean(materialId)),
      followUps: sessionQuestions.map((question) => ({
        id: `${session.id}-${question.sequence_number}`,
        targetedPointId: question.targeted_subtopic_id,
        question: question.question_text,
        answer:
          sessionResponses.find(
            (response) => response.sequence_number === question.sequence_number
          )?.response_text ?? "",
        reason: question.reason as TopicDiagnosticReport["followUps"][number]["reason"],
      })),
    } satisfies TopicDiagnosticReport;
  });
}
