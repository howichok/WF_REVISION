"use client";

import { createContext, useContext } from "react";

import type { AttemptDraft, AttemptEvaluation, ProgressState } from "@/lib/domain/types";
import { useAuth } from "@/components/providers/auth-provider";

interface ProgressContextValue extends ProgressState {
  hydrated: boolean;
  submitAttempt: (attempt: AttemptDraft) => void;
  toggleBookmark: (questionId: string) => void;
  clearProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const defaultState: ProgressState = {
  attempts: [],
  bookmarks: [],
};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const state = auth.currentUser?.progress ?? defaultState;

  return (
    <ProgressContext.Provider
      value={{
        ...state,
        hydrated: auth.hydrated,
        submitAttempt: (attempt) => {
          auth.updateCurrentUser((currentUser) => {
            const current = currentUser.progress;
            const nextAttempt: AttemptEvaluation = {
              id: `attempt-${crypto.randomUUID()}`,
              answeredAt: new Date().toISOString(),
              retryState: attempt.scoreAchieved >= attempt.maxScore ? "resolved" : "pending",
              ...attempt,
            };

            const previousAttempts = current.attempts.map((existing) =>
              existing.questionId === attempt.questionId && attempt.scoreAchieved >= attempt.maxScore
                ? { ...existing, retryState: "resolved" as const }
                : existing,
            );

            return {
              ...currentUser,
              progress: {
                ...current,
                attempts: [...previousAttempts, nextAttempt],
              },
            };
          });
        },
        toggleBookmark: (questionId) => {
          auth.updateCurrentUser((currentUser) => {
            const current = currentUser.progress;

            return {
              ...currentUser,
              progress: {
                ...current,
                bookmarks: current.bookmarks.includes(questionId)
                  ? current.bookmarks.filter((bookmark) => bookmark !== questionId)
                  : [...current.bookmarks, questionId],
              },
            };
          });
        },
        clearProgress: () => {
          auth.updateCurrentUser((currentUser) => ({
            ...currentUser,
            progress: defaultState,
          }));
        },
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used within ProgressProvider");
  }

  return context;
}
