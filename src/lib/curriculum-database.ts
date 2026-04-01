import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCurriculumSeedPayload,
  type CurriculumSeedPayload,
} from "@/data/curriculum";

type CurriculumSupabaseClient = SupabaseClient;

function assertSeedWriteError(error: { message: string } | null, tableName: string) {
  if (error) {
    throw new Error(`Unable to sync ${tableName}: ${error.message}`);
  }
}

export function getCurriculumSeedPayload(): CurriculumSeedPayload {
  return buildCurriculumSeedPayload();
}

export async function syncCurriculumSeed(
  supabase: CurriculumSupabaseClient
) {
  const seed = buildCurriculumSeedPayload();

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_sources")
        .upsert(seed.sources, { onConflict: "id" })
    ).error,
    "curriculum_sources"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_topics")
        .upsert(seed.topics, { onConflict: "id" })
    ).error,
    "curriculum_topics"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_subtopics")
        .upsert(seed.subtopics, { onConflict: "id" })
    ).error,
    "curriculum_subtopics"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_points")
        .upsert(seed.points, { onConflict: "id" })
    ).error,
    "curriculum_points"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_topic_points")
        .upsert(seed.topicPointMappings, { onConflict: "topic_id,point_id" })
    ).error,
    "curriculum_topic_points"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_terms")
        .upsert(seed.terms, { onConflict: "id" })
    ).error,
    "curriculum_terms"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_point_terms")
        .upsert(seed.pointTerms, { onConflict: "point_id,term_id" })
    ).error,
    "curriculum_point_terms"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_materials")
        .upsert(seed.materials, { onConflict: "id" })
    ).error,
    "curriculum_materials"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_point_materials")
        .upsert(seed.pointMaterials, { onConflict: "point_id,material_id" })
    ).error,
    "curriculum_point_materials"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_questions")
        .upsert(seed.questions, { onConflict: "id" })
    ).error,
    "curriculum_questions"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_question_points")
        .upsert(seed.questionPoints, { onConflict: "question_id,point_id" })
    ).error,
    "curriculum_question_points"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_concepts")
        .upsert(seed.concepts, { onConflict: "id" })
    ).error,
    "curriculum_concepts"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_misconceptions")
        .upsert(seed.misconceptions, { onConflict: "id" })
    ).error,
    "curriculum_misconceptions"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_practice_prompts")
        .upsert(seed.practicePrompts, { onConflict: "id" })
    ).error,
    "curriculum_practice_prompts"
  );

  return seed;
}

export async function loadCurriculumTopicsFromDatabase(
  supabase: CurriculumSupabaseClient
) {
  const { data, error } = await supabase
    .from("curriculum_topics")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
