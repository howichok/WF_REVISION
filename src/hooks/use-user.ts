"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import type { UserProfile } from "@/lib/types";

/** Signed-in profile from Supabase-backed app state, or null when logged out / not configured. */
export function useUser(): UserProfile | null {
  return useAppData().user;
}
