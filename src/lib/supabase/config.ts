const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function normalizeSupabaseUrl(value: string) {
  return new URL(value).toString().replace(/\/+$/, "");
}

export function getSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  try {
    return {
      supabaseUrl: normalizeSupabaseUrl(supabaseUrl),
      supabasePublishableKey,
    };
  } catch {
    return null;
  }
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Missing or invalid Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return config;
}
