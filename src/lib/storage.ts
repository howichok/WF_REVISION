"use client";

import type {
  DiagnosticResult,
  FocusBreakdownData,
  OnboardingData,
  UserProfile,
} from "./types";

const LEGACY_KEYS = {
  user: "kosti_user",
  onboarding: "kosti_onboarding",
  diagnostic: "kosti_diagnostic",
  focusBreakdown: "kosti_focus_breakdown",
} as const;

type LegacySnapshot = {
  user: UserProfile | null;
  onboarding: OnboardingData | null;
  focusBreakdown: FocusBreakdownData | null;
  diagnostic: DiagnosticResult | null;
};

function readLegacyItem<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function getLegacySnapshot(): LegacySnapshot {
  return {
    user: readLegacyItem<UserProfile>(LEGACY_KEYS.user),
    onboarding: readLegacyItem<OnboardingData>(LEGACY_KEYS.onboarding),
    focusBreakdown: readLegacyItem<FocusBreakdownData>(LEGACY_KEYS.focusBreakdown),
    diagnostic: readLegacyItem<DiagnosticResult>(LEGACY_KEYS.diagnostic),
  };
}

export function clearLegacySnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  Object.values(LEGACY_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
