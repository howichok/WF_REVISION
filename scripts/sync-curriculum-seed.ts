import { createClient } from "@supabase/supabase-js";
import { getCurriculumSeedPayload, syncCurriculumSeed } from "@/lib/curriculum-database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. These are required to seed shared curriculum data."
  );
}

async function main() {
  const supabase = createClient(supabaseUrl as string, serviceRoleKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const seed = getCurriculumSeedPayload();
  await syncCurriculumSeed(supabase);

  console.log("Curriculum seed synced.");
  console.log(
    JSON.stringify(
      {
        sources: seed.sources.length,
        topics: seed.topics.length,
        subtopics: seed.subtopics.length,
        points: seed.points.length,
        terms: seed.terms.length,
        materials: seed.materials.length,
        questions: seed.questions.length,
        concepts: seed.concepts.length,
        misconceptions: seed.misconceptions.length,
        practicePrompts: seed.practicePrompts.length,
      },
      null,
      2
    )
  );
}

void main();
