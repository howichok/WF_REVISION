import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const SELECT_CHUNK = 200;
const BUMP_CHUNK = 64;

export async function fetchExamGlobalExposureCounts(
  supabase: SupabaseClient<Database>,
  questionIds: string[]
): Promise<Record<string, number>> {
  const unique = [...new Set(questionIds.map((id) => id.trim()).filter(Boolean))];
  const out: Record<string, number> = {};
  if (unique.length === 0) {
    return out;
  }

  for (let i = 0; i < unique.length; i += SELECT_CHUNK) {
    const chunk = unique.slice(i, i + SELECT_CHUNK);
    const { data, error } = await supabase
      .from("exam_question_global_exposure")
      .select("question_id, serve_count")
      .in("question_id", chunk);

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[exam-global-exposure] select failed:", error.message);
      }
      continue;
    }

    for (const row of data ?? []) {
      out[row.question_id] = Number(row.serve_count) || 0;
    }
  }

  return out;
}

export async function bumpExamGlobalExposure(
  supabase: SupabaseClient<Database>,
  questionIds: string[]
): Promise<void> {
  const unique = [...new Set(questionIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return;
  }

  for (let i = 0; i < unique.length; i += BUMP_CHUNK) {
    const chunk = unique.slice(i, i + BUMP_CHUNK);
    const { error } = await supabase.rpc("bump_exam_question_exposure", {
      p_question_ids: chunk,
    });
    if (error && process.env.NODE_ENV !== "production") {
      console.warn("[exam-global-exposure] bump failed:", error.message);
    }
  }
}
