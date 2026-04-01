"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/app-state-provider";
import { LoadingScreen } from "@/components/shared/loading-screen";

interface OnboardingGuardProps {
  step: "time" | "weakness";
  children: React.ReactNode;
}

export function OnboardingGuard({ step, children }: OnboardingGuardProps) {
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

    if (state.settings.onboardingComplete) {
      router.replace("/app");
      return;
    }

    if (step === "weakness") {
      const hasStudyInput =
        Boolean(state.settings.minutesPerDay && state.settings.minutesPerDay > 0) ||
        Boolean(state.settings.hoursPerWeek && state.settings.hoursPerWeek > 0);

      if (!hasStudyInput) {
        router.replace("/onboarding/time");
      }
    }
  }, [isLoaded, state.profile, state.settings, step, router]);

  if (!isLoaded) {
    return <LoadingScreen label="Preparing onboarding..." />;
  }

  if (!state.profile || state.settings.onboardingComplete) {
    return <LoadingScreen label="Routing..." />;
  }

  return <>{children}</>;
}
