"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { assessableTopics } from "@/lib/content";
import { FLASHCARD_BOX_INTERVALS_DAYS, WEAK_BONUS } from "@/lib/constants";
import { buildRevisionPlan } from "@/lib/planner";
import {
  createDefaultState,
  isoDayKey,
  loadState,
  saveState,
} from "@/lib/storage/client-store";
import type {
  AnswerCheckReport,
  PaperId,
  PersistedAppState,
  Profile,
  SessionLog,
  TopicProgress,
} from "@/lib/types";

interface QuizTopicStat {
  topicId: string;
  correct: number;
  total: number;
}

interface QuizAttemptPayload {
  mode: "quiz" | "revision";
  paperId?: PaperId;
  score: number;
  durationMinutes: number;
  topicStats: QuizTopicStat[];
}

interface ExamAttemptPayload {
  paperId: PaperId;
  score: number;
  durationMinutes: number;
  topicIds: string[];
  weakTopics: string[];
}

interface AppStateContextValue {
  state: PersistedAppState;
  isLoaded: boolean;
  plan: ReturnType<typeof buildRevisionPlan>;
  createProfile: (nickname: string, email?: string) => void;
  updateSettings: (minutesPerDay?: number, hoursPerWeek?: number, daysPerWeek?: number) => void;
  completeOnboarding: () => void;
  setManualWeak: (topicId: string, weak: boolean) => void;
  setTopicMastery: (topicId: string, mastery: number) => void;
  submitQuizAttempt: (payload: QuizAttemptPayload) => void;
  submitExamAttempt: (payload: ExamAttemptPayload) => void;
  reviewFlashcard: (cardId: string, remembered: boolean) => void;
  addMinutes: (minutes: number) => void;
  getDayNumber: () => number;
  saveAnswerCheck: (report: AnswerCheckReport) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function getYesterdayKey(todayKey: string): string {
  const yesterday = new Date(`${todayKey}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  return isoDayKey(yesterday);
}

function updateStreak(state: PersistedAppState): PersistedAppState {
  const today = isoDayKey();
  const { streak } = state;

  if (streak.lastActiveDate === today) {
    return state;
  }

  const shouldContinue = streak.lastActiveDate === getYesterdayKey(today);
  const current = shouldContinue ? streak.current + 1 : 1;

  return {
    ...state,
    streak: {
      current,
      best: Math.max(streak.best, current),
      lastActiveDate: today,
    },
  };
}

function createSessionLog(payload: {
  mode: SessionLog["mode"];
  score: number;
  durationMinutes: number;
  paperId?: PaperId;
  topicIds: string[];
}): SessionLog {
  return {
    id: `session-${Date.now()}`,
    date: new Date().toISOString(),
    mode: payload.mode,
    score: payload.score,
    durationMinutes: payload.durationMinutes,
    paperId: payload.paperId,
    topicIds: payload.topicIds,
  };
}

function updateTopicFromAnswers(topic: TopicProgress, correct: number, total: number): TopicProgress {
  const mergedCorrect = topic.correctAnswers + correct;
  const mergedTotal = topic.totalAnswers + total;
  const mastery = mergedTotal === 0
    ? topic.mastery
    : clamp(Math.round((mergedCorrect / mergedTotal) * 100));

  return {
    ...topic,
    correctAnswers: mergedCorrect,
    totalAnswers: mergedTotal,
    mastery,
    lastReviewedAt: new Date().toISOString(),
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(createDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    loadState().then((loadedState) => {
      setState(loadedState);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!persistedRef.current) {
      persistedRef.current = true;
    }

    void saveState(state);
  }, [state, isLoaded]);

  const createProfile = useCallback((nickname: string, email?: string) => {
    const normalizedNickname = nickname.trim();
    const normalizedEmail = email?.trim();

    if (!normalizedNickname) {
      return;
    }

    const profile: Profile = {
      nickname: normalizedNickname,
      email: normalizedEmail || undefined,
      createdAt: new Date().toISOString(),
    };

    setState((previous) => ({
      ...previous,
      profile,
    }));
  }, []);

  const updateSettings = useCallback((minutesPerDay?: number, hoursPerWeek?: number, daysPerWeek?: number) => {
    setState((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        minutesPerDay,
        hoursPerWeek,
        daysPerWeek: daysPerWeek ?? previous.settings.daysPerWeek,
      },
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        onboardingComplete: true,
      },
    }));
  }, []);

  const setManualWeak = useCallback((topicId: string, weak: boolean) => {
    setState((previous) => {
      const topic = previous.topicProgress[topicId];
      if (!topic) {
        return previous;
      }

      return {
        ...previous,
        topicProgress: {
          ...previous.topicProgress,
          [topicId]: {
            ...topic,
            weakManual: weak,
            weakBonus: weak ? WEAK_BONUS : 0,
          },
        },
      };
    });
  }, []);

  const setTopicMastery = useCallback((topicId: string, mastery: number) => {
    setState((previous) => {
      const topic = previous.topicProgress[topicId];
      if (!topic) {
        return previous;
      }

      return {
        ...previous,
        topicProgress: {
          ...previous.topicProgress,
          [topicId]: {
            ...topic,
            mastery: clamp(mastery),
            lastReviewedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const submitQuizAttempt = useCallback((payload: QuizAttemptPayload) => {
    setState((previous) => {
      const nextTopicProgress = { ...previous.topicProgress };

      for (const stat of payload.topicStats) {
        const topic = nextTopicProgress[stat.topicId];
        if (!topic) {
          continue;
        }

        nextTopicProgress[stat.topicId] = updateTopicFromAnswers(topic, stat.correct, stat.total);
      }

      const touchedTopics = payload.topicStats.map((stat) => stat.topicId);
      const withDailyMinutes = {
        ...previous.dailyMinutes,
        [isoDayKey()]: (previous.dailyMinutes[isoDayKey()] ?? 0) + payload.durationMinutes,
      };

      const nextState: PersistedAppState = updateStreak({
        ...previous,
        topicProgress: nextTopicProgress,
        dailyMinutes: withDailyMinutes,
        sessionLogs: [
          createSessionLog({
            mode: payload.mode,
            score: payload.score,
            durationMinutes: payload.durationMinutes,
            paperId: payload.paperId,
            topicIds: touchedTopics,
          }),
          ...previous.sessionLogs,
        ].slice(0, 40),
      });

      return nextState;
    });
  }, []);

  const submitExamAttempt = useCallback((payload: ExamAttemptPayload) => {
    setState((previous) => {
      const nextTopicProgress = { ...previous.topicProgress };

      for (const topicId of payload.topicIds) {
        const topic = nextTopicProgress[topicId];
        if (!topic) {
          continue;
        }

        const isWeak = payload.weakTopics.includes(topicId);
        const delta = isWeak ? -6 : 2;

        nextTopicProgress[topicId] = {
          ...topic,
          mastery: clamp(topic.mastery + delta),
          lastReviewedAt: new Date().toISOString(),
        };
      }

      const withDailyMinutes = {
        ...previous.dailyMinutes,
        [isoDayKey()]: (previous.dailyMinutes[isoDayKey()] ?? 0) + payload.durationMinutes,
      };

      const nextState: PersistedAppState = updateStreak({
        ...previous,
        topicProgress: nextTopicProgress,
        dailyMinutes: withDailyMinutes,
        examAttempts: [
          {
            id: `exam-${Date.now()}`,
            date: new Date().toISOString(),
            paperId: payload.paperId,
            score: payload.score,
            durationMinutes: payload.durationMinutes,
            weakTopics: payload.weakTopics,
          },
          ...previous.examAttempts,
        ].slice(0, 20),
        sessionLogs: [
          createSessionLog({
            mode: "exam",
            score: payload.score,
            durationMinutes: payload.durationMinutes,
            paperId: payload.paperId,
            topicIds: payload.topicIds,
          }),
          ...previous.sessionLogs,
        ].slice(0, 40),
      });

      return nextState;
    });
  }, []);

  const reviewFlashcard = useCallback((cardId: string, remembered: boolean) => {
    setState((previous) => {
      const current = previous.flashcardProgress[cardId] ?? {
        cardId,
        box: 1 as const,
        dueDate: new Date().toISOString(),
      };

      const nextBox = remembered
        ? (Math.min(5, current.box + 1) as 1 | 2 | 3 | 4 | 5)
        : (1 as const);

      const due = new Date();
      due.setDate(due.getDate() + FLASHCARD_BOX_INTERVALS_DAYS[nextBox]);

      return {
        ...previous,
        flashcardProgress: {
          ...previous.flashcardProgress,
          [cardId]: {
            cardId,
            box: nextBox,
            dueDate: due.toISOString(),
            lastReviewedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const addMinutes = useCallback((minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    setState((previous) => {
      const next = {
        ...previous,
        dailyMinutes: {
          ...previous.dailyMinutes,
          [isoDayKey()]: (previous.dailyMinutes[isoDayKey()] ?? 0) + Math.round(minutes),
        },
      };

      return updateStreak(next);
    });
  }, []);

  const getDayNumber = useCallback(() => {
    const created = state.profile?.createdAt;
    if (!created) {
      return 1;
    }

    const start = new Date(created);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
  }, [state.profile?.createdAt]);

  const saveAnswerCheck = useCallback((report: AnswerCheckReport) => {
    setState((previous) => ({
      ...previous,
      answerCheckHistory: [
        {
          id: `check-${Date.now()}`,
          ...report,
        },
        ...previous.answerCheckHistory,
      ].slice(0, 120),
    }));
  }, []);

  const plan = useMemo(() => buildRevisionPlan(state), [state]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      isLoaded,
      plan,
      createProfile,
      updateSettings,
      completeOnboarding,
      setManualWeak,
      setTopicMastery,
      submitQuizAttempt,
      submitExamAttempt,
      reviewFlashcard,
      addMinutes,
      getDayNumber,
      saveAnswerCheck,
    }),
    [
      state,
      isLoaded,
      plan,
      createProfile,
      updateSettings,
      completeOnboarding,
      setManualWeak,
      setTopicMastery,
      submitQuizAttempt,
      submitExamAttempt,
      reviewFlashcard,
      addMinutes,
      getDayNumber,
      saveAnswerCheck,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}

export function useWeakTopics(limit = 5) {
  const { state } = useAppState();

  return useMemo(
    () =>
      assessableTopics
        .map((topic) => ({
          topicId: topic.id,
          title: topic.title,
          paperId: topic.paperId,
          mastery: state.topicProgress[topic.id]?.mastery ?? 50,
          weakManual: state.topicProgress[topic.id]?.weakManual ?? false,
          weight:
            (100 - (state.topicProgress[topic.id]?.mastery ?? 50)) +
            (state.topicProgress[topic.id]?.weakBonus ?? 0),
        }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit),
    [state.topicProgress, limit]
  );
}
