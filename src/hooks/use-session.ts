"use client";

import { useMemo } from "react";
import { useAppData } from "@/components/providers/app-data-provider";

export type AppSessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Client session snapshot aligned with Supabase cookies + {@link AppDataProvider} hydration.
 * Maps to the same source as `useUser`, with an explicit status for gating UI.
 */
export function useSession() {
  const { user, isHydrating, isConfigured, signOut, refreshAppState } = useAppData();

  const status: AppSessionStatus = useMemo(() => {
    if (!isConfigured) {
      return "unauthenticated";
    }
    if (isHydrating) {
      return "loading";
    }
    return user ? "authenticated" : "unauthenticated";
  }, [isConfigured, isHydrating, user]);

  return {
    user,
    status,
    isLoading: isHydrating,
    signOut,
    refreshAppState,
  };
}
