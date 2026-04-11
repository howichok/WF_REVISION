import { unstable_cache } from "next/cache";
import { loadSharedCurriculumSnapshotFromDatabase } from "@/lib/curriculum-database";
import { createAnonCurriculumSupabaseClient } from "@/lib/supabase/anon-curriculum-client";
import type { SharedCurriculumSnapshot } from "@/lib/shared-curriculum";

/** Use with `revalidateTag` after curriculum seed / admin updates. */
export const SHARED_CURRICULUM_CACHE_TAG = "shared-curriculum";

const REVALIDATE_SECONDS = 120;

/**
 * Shared curriculum is identical for all users; cache avoids repeated PostgREST work.
 * Uses an anonymous client so the result is not keyed on auth cookies.
 */
export const getCachedSharedCurriculumSnapshot: () => Promise<SharedCurriculumSnapshot> =
  unstable_cache(
    async () => {
      const supabase = createAnonCurriculumSupabaseClient();
      return loadSharedCurriculumSnapshotFromDatabase(supabase);
    },
    ["shared-curriculum-snapshot-v1"],
    { revalidate: REVALIDATE_SECONDS, tags: [SHARED_CURRICULUM_CACHE_TAG] }
  );
