"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  getNextAppRoute,
  loadAppState,
  saveDiagnosticResult,
  saveFocusBreakdown,
  saveMaterialProgress,
  savePracticeSetProgress,
  saveProfileNickname,
  saveTopicCoachingMemoryEntries,
  saveWeakAreas,
  toggleSubtopicProgress,
} from "@/lib/app-data";
import {
  getTopicCoachingMemoryStorageKey,
  mergeTopicCoachingMemoryMaps,
  recordAnswerCheckTopicCoaching,
  recordAskTopicCoaching,
  recordExamDrillTopicCoaching,
  recordQuizTopicCoaching,
  recordRecallTopicCoaching,
  readTopicCoachingMemory,
  serializeTopicCoachingMemory,
  type TopicCoachingMemoryEntry,
  type TopicCoachingMemoryMap,
} from "@/lib/coaching-memory";
import { getLocalSharedCurriculumSnapshot } from "@/lib/shared-curriculum";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { buildAuthRedirectUrl } from "@/lib/supabase/urls";
import type {
  AppBootstrapState,
  DiagnosticResult,
  FocusBreakdownData,
  RevisionProgressEntry,
  UserProfile,
} from "@/lib/types";

type AuthResult = {
  nextPath: string;
  requiresEmailVerification: boolean;
};

type AppDataContextValue = {
  configError: string | null;
  isConfigured: boolean;
  isHydrating: boolean;
  user: UserProfile | null;
  sharedCurriculum: AppBootstrapState["sharedCurriculum"];
  onboarding: AppBootstrapState["onboarding"];
  diagnostic: AppBootstrapState["diagnostic"];
  revisionProgress: RevisionProgressEntry[];
  topicCoachingMemory: TopicCoachingMemoryMap;
  activityHistory: AppBootstrapState["activityHistory"];
  refreshAppState: () => Promise<AppBootstrapState | null>;
  signUp: (input: {
    nickname: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<AppBootstrapState>;
  sendPasswordReset: () => Promise<void>;
  saveWeakAreas: (weakAreas: string[]) => Promise<AppBootstrapState>;
  saveFocusBreakdown: (input: {
    weakAreas: string[];
    selectedSubtopics: FocusBreakdownData["selectedSubtopics"];
    freeTextNotes: FocusBreakdownData["freeTextNotes"];
    globalNote?: string;
  }) => Promise<AppBootstrapState>;
  saveDiagnosticResult: (result: DiagnosticResult) => Promise<AppBootstrapState>;
  toggleSubtopicReview: (input: {
    topicId: string;
    subtopicId: string;
    subtopicLabel: string;
    completed: boolean;
  }) => Promise<AppBootstrapState>;
  trackMaterialProgress: (input: {
    materialId: string;
    topicId: string;
    title: string;
    activityType: string;
    currentProgressPercent?: number;
    estimatedMinutes?: number;
  }) => Promise<AppBootstrapState>;
  trackPracticeSetProgress: (input: {
    practiceSetId: string;
    topicId: string;
    title: string;
    progressPercent: number;
    minutesSpent?: number;
  }) => Promise<AppBootstrapState>;
  recordAskCoaching: (input: {
    topicId: string;
    intent: string;
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) => void;
  recordAnswerCheckCoaching: (input: {
    topicId: string;
    questionId?: string | null;
    pointId?: string | null;
    scorePercent: number;
    misconceptionLabels?: string[];
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) => void;
  recordExamDrillCoaching: (input: {
    topicId: string;
    drillId?: string | null;
    pointId?: string | null;
    readinessPercent: number;
    rating?: "needs-work" | "ready";
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) => void;
  recordRecallCoaching: (input: {
    topicId: string;
    masteryPercent: number;
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) => void;
  recordQuizCoaching: (input: {
    topicId: string;
    scorePercent: number;
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const EMPTY_STATE: AppBootstrapState = {
  user: null,
  onboarding: null,
  diagnostic: null,
  sharedCurriculum: getLocalSharedCurriculumSnapshot(),
  revisionProgress: [],
  topicCoachingMemory: {},
  activityHistory: [],
};

function getAuthRedirectPath(appState: AppBootstrapState) {
  return getNextAppRoute(appState.onboarding);
}

export function AppDataProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: AppBootstrapState | null;
}) {
  const router = useRouter();
  const config = getSupabaseConfig();
  const supabaseRef = useRef(
    config ? getBrowserSupabaseClient() : null
  );
  const [state, setState] = useState<AppBootstrapState>(initialState ?? EMPTY_STATE);
  const [topicCoachingMemory, setTopicCoachingMemory] = useState<TopicCoachingMemoryMap>(
    initialState?.topicCoachingMemory ?? {}
  );
  const [isHydrating, setIsHydrating] = useState(
    Boolean(config && !initialState?.user)
  );
  const [configError, setConfigError] = useState<string | null>(
    config
      ? null
      : "Supabase is not configured. Add the public URL and publishable key before using auth or persistence."
  );
  const mountedRef = useRef(true);
  const hydrateRequestRef = useRef(0);
  const coachingMemoryReadyRef = useRef(false);
  const topicCoachingUserIdRef = useRef<string | null>(initialState?.user?.id ?? null);
  const topicCoachingMemoryRef = useRef<TopicCoachingMemoryMap>(
    initialState?.topicCoachingMemory ?? {}
  );

  function readLocalTopicCoachingMemory(userId?: string | null) {
    if (typeof window === "undefined") {
      return {};
    }

    return readTopicCoachingMemory(
      window.localStorage.getItem(getTopicCoachingMemoryStorageKey(userId))
    );
  }

  function isEntryNewerThanRemote(
    localEntry: TopicCoachingMemoryEntry,
    remoteEntry?: TopicCoachingMemoryEntry | null
  ) {
    return (
      Date.parse(localEntry.updatedAt) >
      Date.parse(remoteEntry?.updatedAt ?? "")
    );
  }

  function persistTopicCoachingEntries(entries: TopicCoachingMemoryEntry[]) {
    if (!supabaseRef.current || !state.user || entries.length === 0) {
      return;
    }

    void saveTopicCoachingMemoryEntries(
      supabaseRef.current,
      state.user.id,
      entries
    ).catch((error) => {
      const message = error instanceof Error ? error.message : String(error ?? "");

      if (
        process.env.NODE_ENV !== "production" &&
        !message.includes("topic_coaching_memory")
      ) {
        console.warn("Unable to persist topic coaching memory.", error);
      }
    });
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const localTopicCoachingMemory = readLocalTopicCoachingMemory(
      initialState?.user?.id ?? null
    );
    const mergedTopicCoachingMemory = mergeTopicCoachingMemoryMaps(
      initialState?.topicCoachingMemory ?? {},
      localTopicCoachingMemory
    );
    setTopicCoachingMemory(mergedTopicCoachingMemory);
    topicCoachingMemoryRef.current = mergedTopicCoachingMemory;
    coachingMemoryReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !coachingMemoryReadyRef.current) {
      return;
    }

    const storageUserId = state.user?.id ?? topicCoachingUserIdRef.current;
    topicCoachingMemoryRef.current = topicCoachingMemory;
    window.localStorage.setItem(
      getTopicCoachingMemoryStorageKey(storageUserId),
      serializeTopicCoachingMemory(topicCoachingMemory)
    );
  }, [state.user?.id, topicCoachingMemory]);

  async function hydrate(authUser?: SupabaseUser | null) {
    if (!supabaseRef.current) {
      setIsHydrating(false);
      return null;
    }

    const requestId = ++hydrateRequestRef.current;
    setIsHydrating(true);

    try {
      const user =
        authUser ??
        (await supabaseRef.current.auth.getUser()).data.user ??
        null;

      if (!user) {
        if (!mountedRef.current || requestId !== hydrateRequestRef.current) {
          return null;
        }

        setState((current) => ({
          ...EMPTY_STATE,
          sharedCurriculum: current.sharedCurriculum,
        }));
        setTopicCoachingMemory({});
        topicCoachingMemoryRef.current = {};
        topicCoachingUserIdRef.current = null;
        setConfigError(null);
        return null;
      }

      const nextState = await loadAppState(supabaseRef.current, user, {
        sharedCurriculum:
          state.sharedCurriculum ?? initialState?.sharedCurriculum ?? getLocalSharedCurriculumSnapshot(),
      });
      const localTopicCoachingMemory = readLocalTopicCoachingMemory(user.id);
      const mergedTopicCoachingMemory = mergeTopicCoachingMemoryMaps(
        nextState.topicCoachingMemory,
        localTopicCoachingMemory
      );
      const staleLocalEntries = Object.values(localTopicCoachingMemory).filter((entry) =>
        isEntryNewerThanRemote(entry, nextState.topicCoachingMemory[entry.topicId])
      );

      if (!mountedRef.current || requestId !== hydrateRequestRef.current) {
        return null;
      }

      const hydratedState = {
        ...nextState,
        topicCoachingMemory: mergedTopicCoachingMemory,
      };

      setState(hydratedState);
      setTopicCoachingMemory(mergedTopicCoachingMemory);
      topicCoachingMemoryRef.current = mergedTopicCoachingMemory;
      topicCoachingUserIdRef.current = user.id;
      setConfigError(null);

      if (staleLocalEntries.length > 0) {
        void saveTopicCoachingMemoryEntries(
          supabaseRef.current,
          user.id,
          staleLocalEntries
        ).catch((error) => {
          const message = error instanceof Error ? error.message : String(error ?? "");

          if (
            process.env.NODE_ENV !== "production" &&
            !message.includes("topic_coaching_memory")
          ) {
            console.warn("Unable to merge local coaching memory into Supabase.", error);
          }
        });
      }

      return hydratedState;
    } catch (error) {
      if (!mountedRef.current || requestId !== hydrateRequestRef.current) {
        return null;
      }

      const message =
        error instanceof Error ? error.message : "Unable to load account data.";
      setConfigError(message);
      return null;
    } finally {
      if (mountedRef.current && requestId === hydrateRequestRef.current) {
        setIsHydrating(false);
      }
    }
  }

  useEffect(() => {
    if (!supabaseRef.current) {
      return;
    }

    mountedRef.current = true;
    void hydrate();

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        hydrateRequestRef.current += 1;
        setState((current) => ({
          ...EMPTY_STATE,
          sharedCurriculum: current.sharedCurriculum,
        }));
        setTopicCoachingMemory({});
        topicCoachingMemoryRef.current = {};
        topicCoachingUserIdRef.current = null;
        setConfigError(null);
        setIsHydrating(false);
        return;
      }

      void hydrate(session.user);
    });

    return () => {
      mountedRef.current = false;
      hydrateRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshAppState() {
    return hydrate();
  }

  async function signUp(input: {
    nickname: string;
    email: string;
    password: string;
  }) {
    if (!supabaseRef.current) {
      throw new Error(configError ?? "Supabase is not configured.");
    }

    const redirectTo = buildAuthRedirectUrl("/auth/callback");

    const { data, error } = await supabaseRef.current.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          nickname: input.nickname,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Sign up did not return a user.");
    }

    const nextState = data.session ? await hydrate(data.user) : null;

    return {
      requiresEmailVerification: !data.session,
      nextPath: nextState ? getAuthRedirectPath(nextState) : "/auth",
    };
  }

  async function signIn(input: { email: string; password: string }) {
    if (!supabaseRef.current) {
      throw new Error(configError ?? "Supabase is not configured.");
    }

    const { data, error } = await supabaseRef.current.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Sign in did not return a user.");
    }

    const nextState = await hydrate(data.user);

    return {
      requiresEmailVerification: false,
      nextPath: nextState ? getAuthRedirectPath(nextState) : "/revision",
    };
  }

  async function signOut() {
    if (!supabaseRef.current) {
      setState((current) => ({
        ...EMPTY_STATE,
        sharedCurriculum: current.sharedCurriculum,
      }));
      return;
    }

    hydrateRequestRef.current += 1;
    const { error } = await supabaseRef.current.auth.signOut();

    if (error) {
      throw error;
    }

    setState((current) => ({
      ...EMPTY_STATE,
      sharedCurriculum: current.sharedCurriculum,
    }));
    setTopicCoachingMemory({});
    topicCoachingMemoryRef.current = {};
    topicCoachingUserIdRef.current = null;
    setConfigError(null);
    setIsHydrating(false);
    startTransition(() => {
      router.push("/auth");
      router.refresh();
    });
  }

  async function updateNickname(nickname: string) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to update your profile.");
    }

    const trimmedNickname = nickname.trim();
    await saveProfileNickname(supabaseRef.current, state.user.id, trimmedNickname);

    try {
      const { error: metadataError } = await supabaseRef.current.auth.updateUser({
        data: {
          nickname: trimmedNickname,
        },
      });

      if (metadataError) {
        // Profile rows are canonical; metadata sync is best-effort fallback only.
      }
    } catch {
      // Profile rows are canonical; metadata sync is best-effort fallback only.
    }

    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh profile state.");
    }

    return nextState;
  }

  async function sendPasswordReset() {
    if (!supabaseRef.current || !state.user?.email) {
      throw new Error("Your account email is unavailable for password reset.");
    }

    const redirectTo = buildAuthRedirectUrl(
      "/auth/callback?next=/auth/update-password"
    );

    const { error } = await supabaseRef.current.auth.resetPasswordForEmail(
      state.user.email,
      {
        redirectTo,
      }
    );

    if (error) {
      throw error;
    }
  }

  async function updateWeakAreas(weakAreas: string[]) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to update onboarding.");
    }

    await saveWeakAreas(supabaseRef.current, state.user.id, weakAreas);
    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh onboarding state.");
    }

    return nextState;
  }

  async function updateFocusBreakdown(input: {
    weakAreas: string[];
    selectedSubtopics: FocusBreakdownData["selectedSubtopics"];
    freeTextNotes: FocusBreakdownData["freeTextNotes"];
    globalNote?: string;
  }) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to update focus breakdown.");
    }

    await saveFocusBreakdown(supabaseRef.current, state.user.id, input);
    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh onboarding state.");
    }

    return nextState;
  }

  async function updateDiagnosticResult(result: DiagnosticResult) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to save diagnostics.");
    }

    await saveDiagnosticResult(supabaseRef.current, state.user.id, result);
    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh diagnostic state.");
    }

    return nextState;
  }

  async function updateSubtopicReview(input: {
    topicId: string;
    subtopicId: string;
    subtopicLabel: string;
    completed: boolean;
  }) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to update progress.");
    }

    await toggleSubtopicProgress(supabaseRef.current, state.user.id, input);
    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh revision progress.");
    }

    return nextState;
  }

  async function updateMaterialProgress(input: {
    materialId: string;
    topicId: string;
    title: string;
    activityType: string;
    currentProgressPercent?: number;
    estimatedMinutes?: number;
  }) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to update progress.");
    }

    await saveMaterialProgress(supabaseRef.current, state.user.id, input);
    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh material progress.");
    }

    return nextState;
  }

  async function updatePracticeSetProgress(input: {
    practiceSetId: string;
    topicId: string;
    title: string;
    progressPercent: number;
    minutesSpent?: number;
  }) {
    if (!supabaseRef.current || !state.user) {
      throw new Error("You need to be signed in to update practice progress.");
    }

    await savePracticeSetProgress(supabaseRef.current, state.user.id, input);
    const nextState = await hydrate();

    if (!nextState) {
      throw new Error("Unable to refresh practice progress.");
    }

    return nextState;
  }

  function updateTopicCoachingMemory(
    updater: (current: TopicCoachingMemoryMap) => TopicCoachingMemoryMap,
    topicId?: string
  ) {
    const nextTopicCoachingMemory = updater(topicCoachingMemoryRef.current);
    setTopicCoachingMemory(nextTopicCoachingMemory);
    topicCoachingMemoryRef.current = nextTopicCoachingMemory;

    if (topicId) {
      const nextEntry = nextTopicCoachingMemory[topicId];

      if (nextEntry) {
        persistTopicCoachingEntries([nextEntry]);
      }
    }
  }

  function recordAskCoaching(input: {
    topicId: string;
    intent: string;
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) {
    updateTopicCoachingMemory(
      (current) => recordAskTopicCoaching(current, input),
      input.topicId
    );
  }

  function recordAnswerCheckCoaching(input: {
    topicId: string;
    questionId?: string | null;
    pointId?: string | null;
    scorePercent: number;
    misconceptionLabels?: string[];
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) {
    updateTopicCoachingMemory(
      (current) => recordAnswerCheckTopicCoaching(current, input),
      input.topicId
    );
  }

  function recordExamDrillCoaching(input: {
    topicId: string;
    drillId?: string | null;
    pointId?: string | null;
    readinessPercent: number;
    rating?: "needs-work" | "ready";
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) {
    updateTopicCoachingMemory(
      (current) => recordExamDrillTopicCoaching(current, input),
      input.topicId
    );
  }

  function recordRecallCoaching(input: {
    topicId: string;
    masteryPercent: number;
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) {
    updateTopicCoachingMemory(
      (current) => recordRecallTopicCoaching(current, input),
      input.topicId
    );
  }

  function recordQuizCoaching(input: {
    topicId: string;
    scorePercent: number;
    recommendedAction?: string | null;
    recommendedHref?: string | null;
  }) {
    updateTopicCoachingMemory(
      (current) => recordQuizTopicCoaching(current, input),
      input.topicId
    );
  }

  const value: AppDataContextValue = {
    configError,
    isConfigured: Boolean(config),
    isHydrating,
    user: state.user,
    sharedCurriculum: state.sharedCurriculum,
    onboarding: state.onboarding,
    diagnostic: state.diagnostic,
    revisionProgress: state.revisionProgress,
    topicCoachingMemory,
    activityHistory: state.activityHistory,
    refreshAppState,
    signUp,
    signIn,
    signOut,
    updateNickname,
    sendPasswordReset,
    saveWeakAreas: updateWeakAreas,
    saveFocusBreakdown: updateFocusBreakdown,
    saveDiagnosticResult: updateDiagnosticResult,
    toggleSubtopicReview: updateSubtopicReview,
    trackMaterialProgress: updateMaterialProgress,
    trackPracticeSetProgress: updatePracticeSetProgress,
    recordAskCoaching,
    recordAnswerCheckCoaching,
    recordExamDrillCoaching,
    recordRecallCoaching,
    recordQuizCoaching,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
