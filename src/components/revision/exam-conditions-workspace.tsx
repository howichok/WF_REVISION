"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useMotionValue, useTransform, animate as fmAnimate } from "framer-motion";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Info,
  Loader2,
  Trophy,
} from "lucide-react";
import { useAiOverlay } from "@/components/providers/ai-overlay-provider";
import { Button } from "@/components/ui";
import {
  evaluateExamConditionsSession,
  EXAM_CONDITIONS_SESSION_MAX_QUESTIONS,
  EXAM_CONDITIONS_SESSION_MIN_QUESTIONS,
  EXAM_QUESTION_SET_SIZES,
  examSessionMeetsMinimum,
  generateExamConditionsSession,
  generateMultiTopicExamSession,
  getExamConditionsPoolStats,
  type ExamConditionsDifficultyMode,
  type ExamConditionsQuestion,
  type ExamConditionsSession,
  type ExamConditionsSessionResult,
  type ExamQuestionSetSize,
} from "@/lib/exam-conditions";
import {
  clientExamMarkCooldownMs,
  EXAM_MARK_CLIENT_STORAGE_KEY,
} from "@/lib/exam-mark-rate-limit";
import { useAppData } from "@/components/providers/app-data-provider";
import { ExamPaperCommandWord } from "@/components/revision/exam-paper-command-word";
import { ExamConditionsResultsView } from "@/components/revision/exam-conditions-workspace-results";
import { extractCommandWord } from "@/lib/command-words";
import { cn } from "@/lib/utils";

interface ExamConditionsWorkspaceProps {
  topicId: string;
  topicLabel: string;
  topicIcon?: string;
  preferredQuestionId?: string;
  autoStart?: boolean;
  /** From topics wizard (`?size=10|20|30`). */
  launchSetSize?: ExamQuestionSetSize;
  /** From topics wizard (`?alloc=topicA:4,topicB:8`). */
  launchTopicAllocations?: Record<string, number>;
  /** From URL (`?difficulty=`). */
  launchDifficultyMode?: ExamConditionsDifficultyMode;
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getTimerTone(secondsLeft: number, totalSeconds: number) {
  const ratio = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  if (ratio <= 0.15) {
    return "danger";
  }
  if (ratio <= 0.35) {
    return "warning";
  }
  return "accent";
}

const EXAM_TOPIC_LIST_HREF = "/revision/topics?mode=exam";

/** Shown on each question — exam-board style framing. */
const EXAM_PAPER_RUBRIC_LINE =
  "Answer in the spaces provided. Figures in square brackets show the maximum marks for each question.";

const EXAM_PAPER_FOOTNOTE =
  "No mark schemes until you finish — same pressure as an exam hall, but safe to practise here. “Past paper” items follow released papers (older Core, mapped to DSD). “Paper-style set” items match how Paper 1 / Paper 2 questions are usually phrased.";

const EXAM_QUESTION_TRANSITION = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

const examQuestionVariants = {
  enter: (dir: number) => ({
    x: dir * 44,
    opacity: 0,
    scale: 0.97,
    filter: "blur(6px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (dir: number) => ({
    x: dir * -32,
    opacity: 0,
    scale: 0.985,
    filter: "blur(5px)",
  }),
};

function difficultyModeLabel(mode: ExamConditionsDifficultyMode): string {
  switch (mode) {
    case "mixed":
      return "Mixed";
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    default:
      return mode;
  }
}

export function ExamConditionsWorkspace({
  topicId,
  topicLabel,
  topicIcon,
  preferredQuestionId,
  autoStart = false,
  launchSetSize,
  launchTopicAllocations,
  launchDifficultyMode,
}: ExamConditionsWorkspaceProps) {
  const overlay = useAiOverlay();
  const { sharedCurriculum } = useAppData();
  const reduceMotion = useReducedMotion();
  const poolStats = useMemo(
    () => getExamConditionsPoolStats(topicId, sharedCurriculum),
    [topicId, sharedCurriculum]
  );
  const [setSize, setSetSize] = useState<ExamQuestionSetSize>(() => launchSetSize ?? 10);
  const [difficultyMode, setDifficultyMode] = useState<ExamConditionsDifficultyMode>(
    () => launchDifficultyMode ?? "mixed"
  );

  const urlAllocations = useMemo((): Array<{ topicId: string; count: number }> | null => {
    if (!launchTopicAllocations) {
      return null;
    }
    const entries = Object.entries(launchTopicAllocations).filter(([, c]) => c > 0);
    if (entries.length === 0) {
      return null;
    }
    return entries.map(([tid, count]) => ({ topicId: tid, count }));
  }, [launchTopicAllocations]);
  const modeMaxQuestions = useMemo(() => {
    switch (difficultyMode) {
      case "easy":
        return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolStats.easyCount);
      case "medium":
        return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolStats.mediumCount);
      case "hard":
        return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolStats.hardCount);
      default:
        return poolStats.maxSessionQuestions;
    }
  }, [difficultyMode, poolStats]);

  const sessionPreview = useMemo(() => {
    if (urlAllocations && urlAllocations.length > 0) {
      return generateMultiTopicExamSession(urlAllocations, {
        setSize: launchSetSize ?? setSize,
        difficultyMode,
        snapshot: sharedCurriculum,
        preferredQuestionId,
      });
    }
    return generateExamConditionsSession(topicId, {
      setSize,
      difficultyMode,
      preferredQuestionId,
      snapshot: sharedCurriculum,
    });
  }, [
    urlAllocations,
    launchSetSize,
    setSize,
    difficultyMode,
    topicId,
    sharedCurriculum,
    preferredQuestionId,
  ]);

  const canStartSession = sessionPreview.questionCount >= EXAM_CONDITIONS_SESSION_MIN_QUESTIONS;

  const [session, setSession] = useState<ExamConditionsSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExamConditionsSessionResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  /** True once the NDJSON stream begins emitting model deltas (perceived progress). */
  const [markingStreamActive, setMarkingStreamActive] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  /** +1 = forward (Next), -1 = back — drives slide direction for question transitions */
  const [slideDirection, setSlideDirection] = useState(1);

  const sessionRef = useRef<ExamConditionsSession | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const markingSentRef = useRef(false);
  const autoStartConsumedRef = useRef(false);

  sessionRef.current = session;
  answersRef.current = answers;

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const totalSeconds = (session?.estimatedMinutes ?? 0) * 60;
  const answeredCount = session
    ? session.questions.filter((question) => (answers[question.id] ?? "").trim().length > 0).length
    : 0;
  const timerTone = getTimerTone(secondsLeft, totalSeconds);
  const promptCommand = currentQuestion ? extractCommandWord(currentQuestion.prompt) : null;
  const promptParts = currentQuestion && promptCommand
    ? {
        highlighted: currentQuestion.prompt.slice(0, promptCommand.word.length),
        rest: currentQuestion.prompt.slice(promptCommand.word.length),
      }
    : null;

  const currentWordCount = useMemo(() => {
    if (!currentQuestion) {
      return 0;
    }
    return (answers[currentQuestion.id] ?? "").trim().split(/\s+/).filter(Boolean).length;
  }, [answers, currentQuestion]);

  const goToPreviousQuestion = useCallback(() => {
    setSlideDirection(-1);
    setCurrentIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToNextQuestion = useCallback(() => {
    if (!session) {
      return;
    }
    setSlideDirection(1);
    setCurrentIndex((current) => Math.min(session.questionCount - 1, current + 1));
  }, [session]);

  const questionMotionVariants = useMemo(() => {
    if (reduceMotion) {
      return {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    return examQuestionVariants;
  }, [reduceMotion]);

  const pageRootClass =
    "relative flex min-h-screen flex-col bg-background text-foreground";
  /** Composed reading column — ~832px max width for the question + textarea stage. */
  const examStageGutter =
    "mx-auto w-full max-w-[52rem] px-5 sm:px-8 lg:px-10";
  const examActiveRootClass =
    "relative flex min-h-[100dvh] w-full flex-col bg-background text-foreground";

  /** Only reset auto-start guard when the route topic changes — not when launch query props update. */
  useEffect(() => {
    autoStartConsumedRef.current = false;
  }, [topicId]);

  useEffect(() => {
    if (launchSetSize) {
      setSetSize(launchSetSize);
    }
    setDifficultyMode(launchDifficultyMode ?? "mixed");
  }, [topicId, launchSetSize, launchDifficultyMode]);

  useEffect(() => {
    const shouldSuppress = Boolean(session);
    overlay.setOverlaySuppressed(shouldSuppress);

    return () => {
      overlay.setOverlaySuppressed(false);
    };
  }, [overlay, session]);

  useEffect(() => {
    if (!autoStart || session || isLaunching || autoStartConsumedRef.current) {
      return;
    }
    if (!canStartSession) {
      return;
    }

    autoStartConsumedRef.current = true;
    startSession();
  }, [autoStart, isLaunching, session, canStartSession]);

  const runMarking = useCallback(async (active: ExamConditionsSession, ans: Record<string, string>) => {
    setIsMarking(true);
    setMarkingStreamActive(false);
    try {
      if (typeof window !== "undefined") {
        const last = Number(window.sessionStorage.getItem(EXAM_MARK_CLIENT_STORAGE_KEY) ?? "0");
        if (last > 0 && Date.now() - last < clientExamMarkCooldownMs()) {
          const local = evaluateExamConditionsSession(active.questions, ans);
          setResults({
            ...local,
            examMarkingMeta: {
              usedGemini: false,
              aiSkippedNote: "Please wait a few seconds before requesting marking again.",
            },
          });
          return;
        }
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(EXAM_MARK_CLIENT_STORAGE_KEY, String(Date.now()));
      }

      const markBody = JSON.stringify({
        questions: active.questions,
        answers: ans,
        topicLabel,
      });

      const streamRes = await fetch("/api/intelligence/exam-conditions-mark/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: markBody,
      });

      if (streamRes.status === 429) {
        const data = (await streamRes.json()) as {
          error?: string;
          retryAfterSec?: number;
        };
        const local = evaluateExamConditionsSession(active.questions, ans);
        setResults({
          ...local,
          examMarkingMeta: {
            usedGemini: false,
            aiSkippedNote:
              data.error ??
              `Too many requests. Try again in ${data.retryAfterSec ?? 60} seconds.`,
          },
        });
        return;
      }

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }
            let msg: {
              type?: string;
              text?: string;
              result?: ExamConditionsSessionResult;
            };
            try {
              msg = JSON.parse(trimmed) as typeof msg;
            } catch {
              continue;
            }
            if (msg.type === "delta" && msg.text) {
              setMarkingStreamActive(true);
            }
            if (msg.type === "complete" && msg.result) {
              setResults(msg.result);
              return;
            }
          }
        }
        const tail = buffer.trim();
        if (tail) {
          try {
            const msg = JSON.parse(tail) as { type?: string; result?: ExamConditionsSessionResult };
            if (msg.type === "complete" && msg.result) {
              setResults(msg.result);
              return;
            }
          } catch {
            /* fall through */
          }
        }
      }

      const res = await fetch("/api/intelligence/exam-conditions-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: markBody,
      });
      const data = (await res.json()) as {
        result?: ExamConditionsSessionResult;
        error?: string;
        retryAfterSec?: number;
      };
      if (res.status === 429) {
        const local = evaluateExamConditionsSession(active.questions, ans);
        setResults({
          ...local,
          examMarkingMeta: {
            usedGemini: false,
            aiSkippedNote:
              data.error ??
              `Too many requests. Try again in ${data.retryAfterSec ?? 60} seconds.`,
          },
        });
        return;
      }
      if (res.ok && data.result) {
        setResults(data.result);
        return;
      }
    } catch {
      /* fall through */
    } finally {
      setIsMarking(false);
      setMarkingStreamActive(false);
    }
    setResults(evaluateExamConditionsSession(active.questions, ans));
  }, [topicLabel]);

  useEffect(() => {
    if (!session || !startedAt || results || markingSentRef.current) {
      return;
    }

    const update = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const nextSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      setSecondsLeft(nextSeconds);

      if (nextSeconds === 0 && !markingSentRef.current) {
        markingSentRef.current = true;
        const s = sessionRef.current;
        const a = answersRef.current;
        if (s) {
          void runMarking(s, a);
        }
      }
    };

    update();
    const interval = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [results, runMarking, session, startedAt, totalSeconds]);

  const returnToAnswerSheet = useCallback((questionIndex: number) => {
    setResults(null);
    if (session) {
      const max = session.questionCount - 1;
      setCurrentIndex(Math.max(0, Math.min(questionIndex, max)));
    }
  }, [session]);

  function activateSession() {
    const nextSession =
      urlAllocations && urlAllocations.length > 0
        ? generateMultiTopicExamSession(urlAllocations, {
            setSize: launchSetSize ?? setSize,
            difficultyMode,
            snapshot: sharedCurriculum,
            preferredQuestionId,
          })
        : generateExamConditionsSession(topicId, {
            setSize,
            difficultyMode,
            preferredQuestionId,
            snapshot: sharedCurriculum,
          });

    setSession(nextSession);
    setAnswers({});
    setCurrentIndex(0);
    setResults(null);
    markingSentRef.current = false;
    setIsMarking(false);
    setStartedAt(Date.now());
    setSecondsLeft(nextSession.estimatedMinutes * 60);
  }

  function startSession() {
    setIsLaunching(true);
    window.setTimeout(() => {
      activateSession();
      setIsLaunching(false);
    }, 520);
  }

  function finishSession() {
    if (!session || markingSentRef.current) {
      return;
    }

    markingSentRef.current = true;
    void runMarking(session, answers);
  }

  if (!session) {
    return (
      <div className={pageRootClass}>

        <AnimatePresence>
          {isLaunching ? (
            <motion.div
              key="exam-launch-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 px-5 backdrop-blur-2xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="w-full max-w-lg rounded-[32px] border border-border bg-card px-10 py-12 text-center shadow-lg backdrop-blur-xl"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-600 shadow-[0_8px_24px_-10px_rgba(217,119,6,0.2)] dark:border-amber-500/30 dark:from-amber-500/15 dark:to-amber-600/10 dark:text-amber-400">
                  <AlarmClock size={26} />
                </div>
                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600/80 dark:text-amber-400/80">
                  Starting exam questions
                </p>
                <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Everything else drops away now
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                  Loading the timed session, pinning the timer, and surfacing the first question.
                </p>
                <motion.div
                  className="mx-auto mt-9 h-1 w-full max-w-xs overflow-hidden rounded-full bg-muted"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-accent to-amber-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.48, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12 sm:px-8">
          <div className="mb-8">
            <Link href={EXAM_TOPIC_LIST_HREF}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} />
                Topics
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-[1.65rem] font-bold tracking-tight text-foreground sm:text-3xl">
              {topicIcon ? `${topicIcon} ` : ""}
              {topicLabel}
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
              {difficultyMode === "mixed" ? "Mixed difficulty" : `${difficultyModeLabel(difficultyMode)} only`} ·{" "}
              {sessionPreview.questionCount} questions · {sessionPreview.estimatedMinutes} min · marked after you finish
            </p>
            {sessionPreview.topicMix && sessionPreview.topicMix.length > 1 ? (
              <p className="mt-2 text-[12px] text-muted-foreground">
                {sessionPreview.topicMix.map((m) => `${m.label}: ${m.count}`).join(" · ")}
              </p>
            ) : null}
            {poolStats.examStyleStemCountInPool > 0 ? (
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {poolStats.examStyleStemCountInPool}
                </span>{" "}
                questions here are phrased like the real exam
                {poolStats.pastPaperStemCountInPool > 0 || poolStats.paperSetStemCountInPool > 0 ? (
                  <>
                    {" "}
                    (
                    {poolStats.pastPaperStemCountInPool > 0 ? (
                      <span>
                        {poolStats.pastPaperStemCountInPool} from past papers
                        {poolStats.paperSetStemCountInPool > 0 ? ", " : ""}
                      </span>
                    ) : null}
                    {poolStats.paperSetStemCountInPool > 0 ? (
                      <span>{poolStats.paperSetStemCountInPool} from Paper 1/2-style sets</span>
                    ) : null}
                    )
                  </>
                ) : null}
                . The rest use shorter practice wording — still worth doing.
              </p>
            ) : (
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                This topic mostly has practice-style prompts right now. Mix in another topic from Topics if you want
                more exam-like wording.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-9">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50/80 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                <AlarmClock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
                  No hints while the timer runs — that mirrors exam conditions. You get full feedback once you submit or
                  time runs out. If it helps, skim every question before you write.
                </p>
                {preferredQuestionId ? (
                  <p className="mt-2 text-xs text-muted-foreground/70">First question pinned from your link.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { mode: "mixed" as const, label: "Mixed", count: poolStats.poolSize },
                    { mode: "easy" as const, label: "Easy", count: poolStats.easyCount },
                    { mode: "medium" as const, label: "Medium", count: poolStats.mediumCount },
                    { mode: "hard" as const, label: "Hard", count: poolStats.hardCount },
                  ] as const
                ).map(({ mode, label, count }) => {
                  const active = difficultyMode === mode;
                  const disabled = mode === "mixed" ? poolStats.poolSize === 0 : count === 0;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={disabled}
                      onClick={() => setDifficultyMode(mode)}
                      className={`rounded-xl border px-3.5 py-2 text-left text-[12px] font-medium transition-all ${
                        disabled
                          ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
                          : active
                            ? "border-accent/50 bg-accent/[0.08] text-foreground shadow-sm ring-1 ring-accent/20"
                            : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                      }`}
                    >
                      <span className="block">{label}</span>
                      <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-muted-foreground/60">
                        {count} in topic
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!urlAllocations ? (
              <div className="mt-6 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paper length</p>
                <div className="flex flex-wrap gap-2">
                  {EXAM_QUESTION_SET_SIZES.map((size) => {
                    const active = setSize === size;
                    const achievable = Math.min(size, modeMaxQuestions);
                    const disabled =
                      modeMaxQuestions === 0 || !examSessionMeetsMinimum(modeMaxQuestions, achievable);
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSetSize(size)}
                        className={`rounded-xl border px-3.5 py-2 text-left text-[12px] font-semibold transition-all ${
                          disabled
                            ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
                            : active
                              ? "border-accent/50 bg-accent/[0.08] text-foreground shadow-sm ring-1 ring-accent/20"
                              : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                        }`}
                      >
                        {size} questions
                        <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-muted-foreground/60">
                          min {EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} when the pool allows
                        </span>
                      </button>
                    );
                  })}
                </div>
                {poolStats.poolSize === 0 ? (
                  <p className="text-xs text-muted-foreground">No questions in this topic yet.</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-[13px] text-muted-foreground">
                Paper length and topic split are set from the topics list
                {launchSetSize ? ` (target ${launchSetSize})` : ""}. You can still change difficulty here before
                starting.
              </p>
            )}

            {!canStartSession ? (
              <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                This configuration does not reach {EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} questions with the current
                pool — open{" "}
                <Link href={EXAM_TOPIC_LIST_HREF} className="font-semibold underline underline-offset-2">
                  Topics
                </Link>{" "}
                and pick a shorter paper, more topics, or a different difficulty.
              </p>
            ) : null}

            <div className="mt-7 flex gap-3">
              <div className="flex-1 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-center">
                <p className="text-lg font-bold tabular-nums text-foreground">{sessionPreview.questionCount}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Questions</p>
              </div>
              <div className="flex-1 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-center">
                <p className="text-lg font-bold tabular-nums text-foreground">{sessionPreview.estimatedMinutes}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Minutes</p>
              </div>
              <div className="flex-1 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-center">
                <p className="text-lg font-bold leading-tight text-foreground">
                  {difficultyMode === "mixed" ? "Mix" : difficultyModeLabel(difficultyMode)}
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Level</p>
              </div>
            </div>

            <Button className="mt-7 w-full" onClick={startSession} disabled={!canStartSession}>
              <AlarmClock size={15} />
              Start exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <ExamConditionsResultsView
        results={results}
        session={session}
        topicIcon={topicIcon}
        topicLabel={topicLabel}
        startSession={startSession}
        onReturnToPaper={returnToAnswerSheet}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={examActiveRootClass}
    >
      <AnimatePresence>
        {isMarking ? (
          <motion.div
            key="marking-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background/90 px-6 text-center backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100/80 shadow-[0_12px_40px_-16px_rgba(217,119,6,0.3)] dark:from-amber-500/15 dark:to-amber-600/10 dark:shadow-[0_12px_40px_-16px_rgba(217,119,6,0.5)]"
            >
              <Loader2 className="h-9 w-9 animate-spin text-amber-600 dark:text-amber-400" aria-hidden />
            </motion.div>
            <div>
              <p className="text-lg font-semibold text-foreground">Hang on — marking your paper</p>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                {markingStreamActive
                  ? "Receiving the examiner JSON stream — almost there."
                  : "We are matching your answers to the mark scheme (usually well under a minute). If the AI step is unavailable, you still get scores from the fast checker — nothing you wrote is lost."}
              </p>
            </div>
            <motion.div
              className="h-1.5 w-48 overflow-hidden rounded-full bg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-accent to-amber-400"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Compact sticky header — one row, question counter + paper label + info + timer */}
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md"
      >
        <div className={`${examStageGutter} relative flex items-center gap-3 py-2.5 sm:py-3`}>
          <Link
            href={EXAM_TOPIC_LIST_HREF}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Leave paper</span>
          </Link>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <p className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
            Q <span className="text-[15px] font-semibold text-foreground">{currentIndex + 1}</span>
            <span> / {session.questionCount}</span>
          </p>
          <p className="hidden min-w-0 flex-1 truncate text-[12px] text-muted-foreground sm:block">
            {session.topicMix && session.topicMix.length > 1
              ? `Mixed · ${session.topicMix.map((m) => m.label).join(" · ")}`
              : `${topicIcon ? `${topicIcon} ` : ""}${topicLabel}`}
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
            <button
              type="button"
              aria-label="Paper details"
              aria-expanded={isInfoOpen}
              onClick={() => setIsInfoOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Info size={15} />
            </button>
            <motion.div
              layout
              className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-semibold tabular-nums ${
                timerTone === "danger"
                  ? "exam-timer-danger border-danger/40 bg-danger/10 text-danger"
                  : timerTone === "warning"
                    ? "exam-timer-warning border-warning/40 bg-warning/10 text-warning"
                    : "border-border bg-card text-foreground"
              }`}
              animate={
                reduceMotion
                  ? { scale: 1 }
                  : timerTone === "danger"
                    ? { scale: [1, 1.02, 1] }
                    : timerTone === "warning"
                      ? { scale: [1, 1.015, 1] }
                      : { scale: 1 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : timerTone === "danger" || timerTone === "warning"
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
              }
            >
              <Clock3 size={13} className="opacity-60" />
              <span>{formatTime(secondsLeft)}</span>
            </motion.div>
          </div>

          <AnimatePresence>
            {isInfoOpen ? (
              <>
                <motion.button
                  key="info-backdrop"
                  type="button"
                  aria-label="Close paper details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setIsInfoOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <motion.div
                  key="info-panel"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-5 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2.5rem))] rounded-lg border border-border bg-card p-4 text-[12px] leading-relaxed text-muted-foreground shadow-[0_12px_40px_-16px_rgba(17,24,39,0.18)] sm:right-8 lg:right-10"
                >
                  <p className="text-[13px] font-semibold text-foreground">
                    {session.topicMix && session.topicMix.length > 1
                      ? `Mixed paper · ${session.topicMix.map((m) => m.label).join(" · ")}`
                      : `${topicIcon ? `${topicIcon} ` : ""}${topicLabel}`}
                  </p>
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {session.questionCount} questions · {session.estimatedMinutes} min
                    {typeof session.examStyleStemCount === "number" && session.examStyleStemCount > 0
                      ? ` · ${session.examStyleStemCount} exam-style phrasing`
                      : ""}
                    {typeof session.releasedPastPaperStemCount === "number" && session.releasedPastPaperStemCount > 0
                      ? ` · ${session.releasedPastPaperStemCount} past paper`
                      : ""}
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-[12px] leading-[1.55] text-muted-foreground">
                    {EXAM_PAPER_RUBRIC_LINE}
                  </p>
                  <p className="mt-2 text-[11px] leading-[1.55] text-muted-foreground/85">
                    {EXAM_PAPER_FOOTNOTE}
                  </p>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="h-[2px] bg-border">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / session.questionCount) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.header>

      {/* Main workspace — full-width stage, no floating “paper” card */}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className={`${examStageGutter} flex min-h-0 flex-1 flex-col py-5 sm:py-7 lg:py-9`}>
          <AnimatePresence mode="wait" custom={slideDirection}>
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                custom={slideDirection}
                variants={questionMotionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduceMotion ? { duration: 0.15 } : EXAM_QUESTION_TRANSITION}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div>
                  {(currentQuestion.sourceLabel || currentQuestion.year != null) && (
                    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground sm:text-[12px]">
                      {currentQuestion.sourceLabel}
                      {currentQuestion.year != null ? ` · ${currentQuestion.year}` : ""}
                      {currentQuestion.paper ? ` · ${currentQuestion.paper}` : ""}
                    </p>
                  )}

                  <div className={`${(currentQuestion.sourceLabel || currentQuestion.year != null) ? "mt-2 " : ""}flex items-start justify-between gap-4`}>
                    <motion.h2
                      className="max-w-[60ch] text-pretty text-[1.35rem] font-normal leading-[1.5] text-foreground sm:text-[1.6rem] sm:leading-[1.5] lg:text-[1.75rem] lg:leading-[1.5]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {promptCommand && promptParts ? (
                        <>
                          <ExamPaperCommandWord command={promptCommand} />
                          {promptParts.rest}
                        </>
                      ) : (
                        currentQuestion.prompt
                      )}
                    </motion.h2>
                    <p className="shrink-0 pt-2 text-[13px] font-medium tabular-nums text-muted-foreground sm:text-sm">
                      [{currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}]
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex min-h-0 flex-1 flex-col sm:mt-8">
                  <motion.div
                    className="flex min-h-0 flex-1 flex-col"
                    initial={{ opacity: 0.95, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <textarea
                      value={answers[currentQuestion.id] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [currentQuestion.id]: event.target.value,
                        }))
                      }
                      rows={14}
                      placeholder="Write your answer here."
                      className="exam-paper-textarea exam-paper-textarea--immersive min-h-[48vh] w-full flex-1 resize-y px-1 py-1 text-[16px] leading-[1.875rem] text-foreground sm:min-h-[52vh] sm:px-2 sm:text-[17px]"
                      spellCheck
                    />
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <motion.footer
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md"
      >
        <div className={`${examStageGutter} flex items-center justify-between gap-3 py-2.5 sm:py-3`}>
          <p className="min-w-0 truncate text-[12px] text-muted-foreground">
            <motion.span
              key={currentWordCount}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="tabular-nums"
            >
              {currentWordCount} words
            </motion.span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span className="tabular-nums">
              {answeredCount} / {session.questionCount} answered
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToPreviousQuestion}
              disabled={currentIndex === 0 || isMarking}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            {currentIndex + 1 >= session.questionCount ? (
              <Button size="sm" onClick={finishSession} disabled={isMarking}>
                <span className="hidden sm:inline">Submit for marking</span>
                <span className="sm:hidden">Submit</span>
                <Trophy size={14} />
              </Button>
            ) : (
              <Button size="sm" disabled={isMarking} onClick={goToNextQuestion}>
                <span className="hidden sm:inline">Next question</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
