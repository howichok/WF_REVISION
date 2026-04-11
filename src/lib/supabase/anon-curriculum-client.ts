import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { requireSupabaseConfig } from "./config";

/**
 * Cookie-less Supabase client for public curriculum reads.
 * Used inside `unstable_cache` so cached work is not tied to request cookies.
 */
export function createAnonCurriculumSupabaseClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
