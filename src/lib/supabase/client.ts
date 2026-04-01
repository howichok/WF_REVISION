"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { requireSupabaseConfig } from "./config";

let browserClient: SupabaseClient<Database> | undefined;

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();

  browserClient = createBrowserClient<Database>(
    supabaseUrl,
    supabasePublishableKey
  );

  return browserClient;
}
