"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RevisionPredictionBand } from "@/lib/intelligence/revision-prediction";
import type {
  AiOverlayContextValue,
  DockMode,
  GuidedSessionCompleteInput,
  GuidedSessionErrorInput,
  GuidedSessionStartInput,
  OverlayPhase,
  OverlaySessionState,
  OverlaySurfaceMeta,
  RevisionModeGroup,
  RevisionPredictionInput,
  RevisionProgressInput,
  RevisionSurfaceRegistration,
  RevisionSurfaceUpdate,
  RevisionCheckCompleteInput,
  RevisionCheckErrorInput,
  RevisionImproveCompleteInput,
  SurfaceRecommendationsInput,
} from "./ai-overlay-types";

const AiRevisionOverlay = dynamic(() => import("./ai-revision-overlay"), {
  ssr: false,
  loading: () => null,
});

const AiOverlayContext = createContext<AiOverlayContextValue | null>(null);

const STORAGE_KEY = "wf-revision-ai-overlay-position";
const FLOATING_WIDTH = 296;
const SNAPPED_WIDTH = 340;
const FLOATING_HEIGHT = 200;
const SNAPPED_HEIGHT = 252;
const VIEWPORT_PADDING = 16;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function shorten(value: string, maxLength = 124) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getDefaultFloatingPosition() {
  if (typeof window === "undefined") {
    return { x: 16, y: 16 };
  }

  return {
    x: Math.max(VIEWPORT_PADDING, window.innerWidth - FLOATING_WIDTH - 28),
    y: Math.max(96, window.innerHeight - FLOATING_HEIGHT - 28),
  };
}

function readStoredPosition() {
  if (typeof window === "undefined") {
    return getDefaultFloatingPosition();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultFloatingPosition();
    }

    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return getDefaultFloatingPosition();
    }

    return {
      x: clamp(parsed.x, VIEWPORT_PADDING, window.innerWidth - FLOATING_WIDTH - VIEWPORT_PADDING),
      y: clamp(parsed.y, 72, window.innerHeight - FLOATING_HEIGHT - VIEWPORT_PADDING),
    };
  } catch {
    return getDefaultFloatingPosition();
  }
}

function getPhaseFromScore(scorePercent: number): OverlayPhase {
  if (scorePercent >= 70) {
    return "distinction";
  }

  if (scorePercent >= 40) {
    return "merit";
  }

  return "fail";
}

function getPhaseFromPredictionBand(band: RevisionPredictionBand): OverlayPhase {
  if (band === "distinction") {
    return "distinction";
  }

  if (band === "merit") {
    return "merit";
  }

  return "fail";
}

function getCheckingStatusLine(meta?: OverlaySurfaceMeta | null) {
  if (!meta) {
    return "Scanning the response against the mark scheme...";
  }

  if (meta.modeGroup === "Exam questions") {
    return `Scanning ${meta.topicLabel} against the exam rubric...`;
  }

  return `Scanning ${meta.topicLabel} inside the current simple-revision task...`;
}

function buildScoreLabel(score: number, maxScore: number, scorePercent: number) {
  return `${score}/${maxScore} marks • ${scorePercent}%`;
}

function getPredictionStatusLine(
  band: RevisionPredictionBand,
  source: "revision-evaluate" | "revision-improve"
) {
  const prefix =
    source === "revision-improve" ? "Early improvement signal" : "Early score signal";

  if (band === "distinction") {
    return `${prefix}: distinction-level coverage is already showing.`;
  }

  if (band === "merit") {
    return `${prefix}: the draft is landing around merit, with a few marks still exposed.`;
  }

  return `${prefix}: the draft still has major coverage or precision gaps.`;
}

function getDefaultModeLabel(modeGroup: RevisionModeGroup) {
  return modeGroup === "Exam questions" ? "Written response" : "Revision task";
}

function getReadyStatusLine(surface: OverlaySurfaceMeta) {
  switch (surface.modeLabel) {
    case "Final written answer":
      return `Exam questions are live for ${surface.topicLabel}. Write the full answer, then run the checker.`;
    case "Planned exam response":
      return `Exam questions are live for ${surface.topicLabel}. Plan the answer first, then reveal the checklist.`;
    case "Quick written check":
      return `Simple revision is live for ${surface.topicLabel}. This is a fast written check, not the full exam-question rubric marker.`;
    case "Fast Q/A":
      return `Simple revision is live for ${surface.topicLabel}. Use this route for quick correction and retrieval.`;
    case "Topic assistant":
      return `Simple revision is live for ${surface.topicLabel}. Use this surface for focused prompts and short explanations.`;
    case "Recall card":
      return `Simple revision is live for ${surface.topicLabel}. Try to retrieve the answer before you reveal it.`;
    default:
      return `${surface.modeGroup} is live for ${surface.topicLabel}.`;
  }
}

function getReadyNote(surface: OverlaySurfaceMeta) {
  if (surface.modeGroup === "Exam questions") {
    return "This mode is for structured exam work: planning first, then a fuller written response and AI checking.";
  }

  if (surface.modeLabel === "Quick written check") {
    return "Simple revision stays fast here. If you want full rubric-style AI feedback, switch to Exam questions.";
  }

  return "The overlay stays global and follows whichever revision mode is currently active.";
}

function getInitialSessionState(): OverlaySessionState {
  return {
    topicLabel: "Revision AI",
    modeLabel: "Waiting for a task",
    prompt: "Open any revision task to wake the overlay.",
    answerPreview: "",
    wordCount: 0,
    phase: "idle",
    statusLine: "Hovering until you open a simple-revision or exam-questions task.",
    note: "The overlay follows the active mode and only turns into full writing AI on timed exam-question tasks.",
    primaryAction: null,
    secondaryAction: null,
  };
}

export function AiOverlayProvider({ children }: { children: React.ReactNode }) {
  const activeSurfaceRef = useRef<RevisionSurfaceRegistration | null>(null);
  const [activeSurface, setActiveSurface] = useState<OverlaySurfaceMeta | null>(null);
  const [session, setSession] = useState<OverlaySessionState>(getInitialSessionState);
  const [dockMode, setDockMode] = useState<DockMode>("float");
  const [floatingPosition, setFloatingPositionState] = useState(getDefaultFloatingPosition);
  const [overlaySuppressed, setOverlaySuppressed] = useState(false);

  useEffect(() => {
    setFloatingPositionState(readStoredPosition());
  }, []);

  const setFloatingPosition = useCallback((position: { x: number; y: number }) => {
    setFloatingPositionState(position);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, []);

  const syncSessionFromSurface = useCallback((surface: OverlaySurfaceMeta) => {
    setSession((current) => ({
      ...current,
      topicId: surface.topicId,
      topicLabel: surface.topicLabel,
      modeGroup: surface.modeGroup,
      modeLabel: surface.modeLabel,
      prompt: surface.prompt,
      answerPreview: surface.answerPreview,
      wordCount: surface.wordCount,
      phase: current.phase === "idle" ? "ready" : current.phase === "checking" ? current.phase : "ready",
      statusLine:
        current.phase === "checking"
          ? current.statusLine
          : getReadyStatusLine(surface),
      note:
        current.phase === "checking"
          ? current.note
          : getReadyNote(surface),
      primaryAction: current.primaryAction ?? null,
      secondaryAction: current.secondaryAction ?? null,
    }));
  }, []);

  const registerRevisionSurface = useCallback(
    (surface: RevisionSurfaceRegistration) => {
      activeSurfaceRef.current = surface;
      const nextMeta: OverlaySurfaceMeta = {
        surfaceId: surface.surfaceId,
        topicId: surface.topicId,
        topicLabel: surface.topicLabel,
        modeGroup: surface.modeGroup ?? "Simple revision",
        modeLabel: surface.modeLabel ?? getDefaultModeLabel(surface.modeGroup ?? "Simple revision"),
        prompt: surface.prompt,
        answerPreview: "",
        wordCount: 0,
        canUndoEdits: false,
        canClearInsertedCues: false,
      };

      setActiveSurface(nextMeta);
      setSession((current) => ({
        ...current,
        topicId: nextMeta.topicId,
        topicLabel: nextMeta.topicLabel,
        modeGroup: nextMeta.modeGroup,
        modeLabel: nextMeta.modeLabel,
        prompt: nextMeta.prompt,
        answerPreview: "",
        wordCount: 0,
        phase: current.phase === "checking" ? "checking" : "ready",
        statusLine:
          current.phase === "checking"
            ? current.statusLine
            : getReadyStatusLine(nextMeta),
        note:
          current.phase === "checking"
            ? current.note
            : getReadyNote(nextMeta),
        scoreLabel: current.phase === "checking" ? current.scoreLabel : undefined,
        primaryAction: null,
        secondaryAction: null,
      }));
    },
    []
  );

  const unregisterRevisionSurface = useCallback((surfaceId: string) => {
    if (activeSurfaceRef.current?.surfaceId !== surfaceId) {
      return;
    }

    activeSurfaceRef.current = null;
    setActiveSurface(null);
    setDockMode("float");
    setSession((current) => ({
      ...current,
      statusLine:
        current.phase === "checking"
          ? current.statusLine
          : "Detached from the current task. Open any simple-revision or exam-questions route to snap back in.",
      note:
        current.phase === "checking"
          ? current.note
          : "The overlay is global, but it only becomes active when a revision surface registers itself.",
      primaryAction: null,
      secondaryAction: null,
    }));
  }, []);

  const syncRevisionSurface = useCallback(
    (input: RevisionSurfaceUpdate) => {
      setActiveSurface((current) => {
        if (!current || current.surfaceId !== input.surfaceId) {
          return current;
        }

        const nextMeta = {
          ...current,
          prompt: input.prompt ?? current.prompt,
          answerPreview: input.answer.trim(),
          wordCount: countWords(input.answer),
          canUndoEdits: input.canUndoEdits ?? current.canUndoEdits,
          canClearInsertedCues:
            input.canClearInsertedCues ?? current.canClearInsertedCues,
        };
        syncSessionFromSurface(nextMeta);
        return nextMeta;
      });
    },
    [syncSessionFromSurface]
  );

  const startRevisionCheck = useCallback((surfaceId: string) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "checking",
        statusLine: getCheckingStatusLine(current),
        scoreLabel: undefined,
        note: "Scanline is locked to the current response while the checker runs.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const setRevisionPrediction = useCallback((input: RevisionPredictionInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: getPhaseFromPredictionBand(input.band),
        statusLine: getPredictionStatusLine(input.band, input.source),
        scoreLabel: buildScoreLabel(input.score, input.maxScore, input.scorePercent),
        note:
          input.source === "revision-improve"
            ? "The improve pass is using the underlying deterministic score band before the final upgrade list lands."
            : "The colour changed from the deterministic score band, not from a hidden model token.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const streamRevisionProgress = useCallback((input: RevisionProgressInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        statusLine: input.statusLine ?? previous.statusLine,
        note: input.note ? shorten(input.note, 170) : previous.note,
      }));

      return current;
    });
  }, []);

  const completeRevisionCheck = useCallback((input: RevisionCheckCompleteInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      const phase = getPhaseFromScore(input.scorePercent);
      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase,
        statusLine:
          phase === "distinction"
            ? "Distinction signal. The answer is landing with strong coverage and clear development."
            : phase === "merit"
              ? "Merit signal. The core ideas are there, but a few marks are still sitting on the table."
              : "Fail signal. The checker found major coverage gaps or weak precision.",
        scoreLabel: buildScoreLabel(input.score, input.maxScore, input.scorePercent),
        note: input.feedback ? shorten(input.feedback, 150) : undefined,
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const failRevisionCheck = useCallback((input: RevisionCheckErrorInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "error",
        statusLine: input.message,
        note: "The overlay stayed attached so you can retry without losing context.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const startRevisionImprove = useCallback((surfaceId: string) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "checking",
        statusLine: "Finding upgrade spots and weak phrases in the current answer...",
        note: "Improvement mode stays in commentator/diff territory and does not rewrite the whole answer.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const completeRevisionImprove = useCallback((input: RevisionImproveCompleteInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase:
          previous.phase === "fail" ||
          previous.phase === "merit" ||
          previous.phase === "distinction"
            ? previous.phase
            : "ready",
        statusLine:
          input.outputMode === "diff"
            ? `Built ${input.changeCount} diff-style upgrade hints and marked ${input.highlightedCount} weak phrases.`
            : `Built ${input.changeCount} commentator suggestions and marked ${input.highlightedCount} weak phrases.`,
        note: "The original answer stays intact. Only upgrade spots and additions are suggested.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const failRevisionImprove = useCallback((input: RevisionCheckErrorInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: previous.phase === "fail" || previous.phase === "distinction" || previous.phase === "merit"
          ? previous.phase
          : "error",
        statusLine: input.message,
        note: "Improvement scan failed, but the answer and previous score state were kept in place.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const startGuidedSession = useCallback((input: GuidedSessionStartInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "checking",
        statusLine: input.statusLine,
        note: input.note,
        scoreLabel: undefined,
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const completeGuidedSession = useCallback((input: GuidedSessionCompleteInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: input.phase ?? "ready",
        statusLine: input.statusLine,
        note: input.note,
        scoreLabel: input.scoreLabel,
        primaryAction: input.primaryAction ?? null,
        secondaryAction: input.secondaryAction ?? null,
      }));

      return current;
    });
  }, []);

  const failGuidedSession = useCallback((input: GuidedSessionErrorInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "error",
        statusLine: input.message,
        note: input.note ?? previous.note,
        primaryAction: input.primaryAction ?? null,
        secondaryAction: input.secondaryAction ?? null,
      }));

      return current;
    });
  }, []);

  const setSurfaceRecommendations = useCallback((input: SurfaceRecommendationsInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setSession((previous) => ({
        ...previous,
        primaryAction: input.primaryAction ?? null,
        secondaryAction: input.secondaryAction ?? null,
      }));

      return current;
    });
  }, []);

  const undoLastEdit = useCallback((surfaceId: string) => {
    if (activeSurfaceRef.current?.surfaceId !== surfaceId) {
      return;
    }

    activeSurfaceRef.current.onUndoLastEdit?.();
  }, []);

  const clearInsertedCues = useCallback((surfaceId: string) => {
    if (activeSurfaceRef.current?.surfaceId !== surfaceId) {
      return;
    }

    activeSurfaceRef.current.onClearInsertedCues?.();
  }, []);

  const value = useMemo<AiOverlayContextValue>(
    () => ({
      registerRevisionSurface,
      unregisterRevisionSurface,
      syncRevisionSurface,
      startRevisionCheck,
      setRevisionPrediction,
      streamRevisionProgress,
      completeRevisionCheck,
      failRevisionCheck,
      startRevisionImprove,
      completeRevisionImprove,
      failRevisionImprove,
      startGuidedSession,
      completeGuidedSession,
      failGuidedSession,
      setSurfaceRecommendations,
      undoLastEdit,
      clearInsertedCues,
      setOverlaySuppressed,
    }),
    [
      completeGuidedSession,
      completeRevisionCheck,
      completeRevisionImprove,
      clearInsertedCues,
      failGuidedSession,
      failRevisionCheck,
      failRevisionImprove,
      registerRevisionSurface,
      setOverlaySuppressed,
      setRevisionPrediction,
      setSurfaceRecommendations,
      startGuidedSession,
      startRevisionCheck,
      startRevisionImprove,
      streamRevisionProgress,
      syncRevisionSurface,
      undoLastEdit,
      unregisterRevisionSurface,
    ]
  );

  return (
    <AiOverlayContext.Provider value={value}>
      {children}
      {!overlaySuppressed ? (
        <AiRevisionOverlay
          dockMode={dockMode}
          setDockMode={setDockMode}
          floatingPosition={floatingPosition}
          setFloatingPosition={setFloatingPosition}
          activeSurface={activeSurface}
          activeSurfaceRef={activeSurfaceRef}
          session={session}
          onUndoLastEdit={() => {
            if (activeSurface) {
              undoLastEdit(activeSurface.surfaceId);
            }
          }}
          onClearInsertedCues={() => {
            if (activeSurface) {
              clearInsertedCues(activeSurface.surfaceId);
            }
          }}
        />
      ) : null}
    </AiOverlayContext.Provider>
  );
}

export function useAiOverlay() {
  const context = useContext(AiOverlayContext);

  if (!context) {
    throw new Error("useAiOverlay must be used within AiOverlayProvider.");
  }

  return context;
}
