import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side user from Supabase Auth (validates the JWT; preferred in RSC / Route Handlers).
 */
export async function getServerAuthUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

/**
 * Session payload (includes tokens). Use when you explicitly need refresh/access tokens on the server.
 * For authorization checks, prefer {@link getServerAuthUser}.
 */
export async function getServerAuthSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Redirects to `/auth` when there is no signed-in user.
 */
export async function requireServerAuthUser(): Promise<User> {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/auth");
  }
  return user;
}
