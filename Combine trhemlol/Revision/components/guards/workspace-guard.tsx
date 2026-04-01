"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/app-state-provider";
import { LoadingScreen } from "@/components/shared/loading-screen";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { state, isLoaded } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!state.profile) {
      router.replace("/");
      return;
    }

    if (!state.settings.onboardingComplete) {
      router.replace("/onboarding/time");
    }
  }, [isLoaded, state.profile, state.settings.onboardingComplete, router]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!state.profile || !state.settings.onboardingComplete) {
    return <LoadingScreen label="Routing you to the right step..." />;
  }

  return <>{children}</>;
}
