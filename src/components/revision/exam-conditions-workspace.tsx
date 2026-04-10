"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useMotionValue, useTransform, animate as fmAnimate } from "framer-motion";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useAiOverlay } from "@/components/providers/ai-overlay-provider";
import { Badge, Button } from "@/components/ui";
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
import { extractCommandWord } from "@/lib/command-words";

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

/** Shown on each question — GCSE-style framing, not coaching. */
const EXAM_PAPER_RUBRIC_LINE =
  "Answer in the spaces provided. Figures in square brackets show the maximum marks for each question.";

const EXAM_PAPER_FOOTNOTE =
  "This is a timed practice paper on-screen. You will not see marking points until you finish the whole paper or the time runs out.";

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

/* ── Animated score ring ──────────────────────────────────── */
function ScoreRing({ percent, size = 120, strokeWidth = 8, delay = 0.3 }: { percent: number; size?: number; strokeWidth?: number; delay?: number }) {
  const reduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = percent >= 70 ? "#10b981" : percent >= 40 ? "#f59e0b" : "#ef4444";
  const bgColor = percent >= 70 ? "#d1fae5" : percent >= 40 ? "#fef3c7" : "#fee2e2";

  return (
    <svg width={size} height={size} className="score-ring-svg" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (circumference * percent) / 100 }}
        transition={reduced ? { duration: 0 } : { delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* ── Count-up number ──────────────────────────────────────── */
function CountUp({ to, delay = 0.3, duration = 0.8 }: { to: number; delay?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) { setDisplay(to); return; }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = (now - start) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * to));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [to, delay, duration, reduced]);

  return <>{display}</>;
}

/* ── Celebration particles ────────────────────────────────── */
function CelebrationParticles({ count = 24 }: { count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 280,
      y: -(Math.random() * 160 + 60),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 0.5,
      color: ["#10b981", "#f59e0b", "#8b5cf6", "#f472b6", "#38bdf8", "#fb923c"][i % 6],
    })),
  [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0, rotate: p.rotate }}
          transition={{ delay: 0.4 + p.delay, duration: 1.4, ease: "easeOut" }}
          style={{ width: 8, height: 8, borderRadius: p.id % 3 === 0 ? "50%" : "2px", background: p.color }}
        />
      ))}
    </div>
  );
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
    "relative flex min-h-screen flex-col bg-[#faf9f7] text-slate-900 dark:bg-[#0f1118] dark:text-slate-100";
  /** Wide stage with comfortable side margins — uses almost full viewport width. */
  const examStageGutter =
    "mx-auto w-full max-w-[min(100%,88rem)] px-5 sm:px-8 lg:px-14 xl:px-24";
  const examActiveRootClass =
    "relative flex min-h-[100dvh] w-full flex-col bg-gradient-to-b from-[#f0eeea] via-[#e9e7e2] to-[#e3e1dc] text-slate-950 dark:from-[#0f1118] dark:via-[#131621] dark:to-[#171b28] dark:text-slate-100";

  useEffect(() => {
    autoStartConsumedRef.current = false;
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

      const res = await fetch("/api/intelligence/exam-conditions-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: active.questions,
          answers: ans,
          topicLabel,
        }),
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
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 px-5 backdrop-blur-2xl dark:bg-slate-950/70"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="w-full max-w-lg rounded-[32px] border border-slate-200/70 bg-white/95 px-10 py-12 text-center shadow-[0_40px_100px_-48px_rgba(80,60,30,0.22)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-[0_40px_100px_-48px_rgba(0,0,0,0.6)]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-600 shadow-[0_8px_24px_-10px_rgba(217,119,6,0.2)] dark:border-amber-500/30 dark:from-amber-500/15 dark:to-amber-600/10 dark:text-amber-400">
                  <AlarmClock size={26} />
                </div>
                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600/80 dark:text-amber-400/80">
                  Starting exam questions
                </p>
                <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                  Everything else drops away now
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Loading the timed session, pinning the timer, and surfacing the first question.
                </p>
                <motion.div
                  className="mx-auto mt-9 h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80"
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
            <h1 className="text-[1.65rem] font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
              {topicIcon ? `${topicIcon} ` : ""}
              {topicLabel}
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              {difficultyMode === "mixed" ? "Mixed difficulty" : `${difficultyModeLabel(difficultyMode)} only`} ·{" "}
              {sessionPreview.questionCount} questions · {sessionPreview.estimatedMinutes} min · marked after you finish
            </p>
            {sessionPreview.topicMix && sessionPreview.topicMix.length > 1 ? (
              <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
                {sessionPreview.topicMix.map((m) => `${m.label}: ${m.count}`).join(" · ")}
              </p>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-slate-200/70 bg-white/92 p-7 shadow-[0_32px_80px_-48px_rgba(80,60,30,0.18)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_32px_80px_-48px_rgba(0,0,0,0.6)] sm:p-9">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50/80 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                <AlarmClock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                  No hints during the run. Write your answers first — feedback runs once at the end or when time expires.
                </p>
                {preferredQuestionId ? (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">First question pinned from your link.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Difficulty</p>
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
                          ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-700"
                          : active
                            ? "border-violet-300 bg-violet-50 text-violet-900 shadow-sm ring-1 ring-violet-200/60 dark:border-violet-500/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30"
                            : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="block">{label}</span>
                      <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
                        {count} in topic
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!urlAllocations ? (
              <div className="mt-6 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Paper length</p>
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
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-700"
                            : active
                              ? "border-violet-300 bg-violet-50 text-violet-900 shadow-sm ring-1 ring-violet-200/60 dark:border-violet-500/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30"
                              : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {size} questions
                        <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-slate-400 dark:text-slate-500">
                          min {EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} when the pool allows
                        </span>
                      </button>
                    );
                  })}
                </div>
                {poolStats.poolSize === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No questions in this topic yet.</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-[13px] text-slate-600 dark:text-slate-400">
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
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">{sessionPreview.questionCount}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Questions</p>
              </div>
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">{sessionPreview.estimatedMinutes}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Minutes</p>
              </div>
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {difficultyMode === "mixed" ? "Mix" : difficultyModeLabel(difficultyMode)}
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Level</p>
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
      <ResultsView
        results={results}
        session={session}
        topicIcon={topicIcon}
        topicLabel={topicLabel}
        startSession={startSession}
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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white/80 px-6 text-center backdrop-blur-2xl dark:bg-slate-950/85"
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
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Checking your session</p>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Marking with AI against the scheme. If the API is unavailable, you will see local scores instead.
              </p>
            </div>
            <motion.div
              className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80"
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

      {/* Compact sticky header */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-20 border-b border-slate-800/12 bg-[#f5f3ef]/90 backdrop-blur-md dark:border-slate-100/10 dark:bg-[#131621]/90"
      >
        <div className={`${examStageGutter} flex items-center justify-between py-2.5`}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2.5">
            <div className="flex items-center gap-2.5">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link href={EXAM_TOPIC_LIST_HREF}>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-medium text-slate-600 underline-offset-4 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                  >
                    <ArrowLeft size={15} />
                    <span className="hidden sm:inline">Leave paper</span>
                  </button>
                </Link>
              </motion.div>
              <div className="hidden h-4 w-px bg-slate-300 dark:bg-slate-700 sm:block" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Practice examination paper
                </p>
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                  {session.topicMix && session.topicMix.length > 1
                    ? `Mixed paper · ${session.topicMix.map((m) => m.label).join(" · ")}`
                    : `${topicIcon ? `${topicIcon} ` : ""}${topicLabel}`}
                </p>
              </div>
            </div>
            <motion.p
              key={`meta-${currentIndex}-${answeredCount}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="truncate pl-7 text-[11px] leading-snug text-slate-600 dark:text-slate-400 sm:pl-0"
            >
              You are on question {currentIndex + 1} of {session.questionCount}. Whole paper:{" "}
              {session.estimatedMinutes} minutes. Questions with a written response: {answeredCount}.
            </motion.p>
          </div>

          <motion.div
            layout
            className={`flex shrink-0 flex-col items-end gap-0.5 rounded-md border px-2.5 py-1.5 sm:flex-row sm:items-center sm:gap-2 sm:border-slate-800/20 sm:bg-white sm:px-3 dark:sm:border-slate-100/15 dark:sm:bg-slate-900 ${
              timerTone === "danger"
                ? "exam-timer-danger border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300"
                : timerTone === "warning"
                  ? "exam-timer-warning border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
                  : "border-slate-800/15 bg-white text-slate-800 dark:border-slate-100/15 dark:bg-slate-900 dark:text-slate-200"
            }`}
            animate={
              reduceMotion
                ? { scale: 1 }
                : timerTone === "danger"
                  ? { scale: [1, 1.04, 1] }
                  : timerTone === "warning"
                    ? { scale: [1, 1.02, 1] }
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
            <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:inline">
              Time remaining
            </span>
            <div className="flex items-center gap-1.5">
              <Clock3 size={13} className="opacity-50" />
              <span className="text-sm font-bold tabular-nums">{formatTime(secondsLeft)}</span>
            </div>
          </motion.div>
        </div>

        <div className="h-1 bg-slate-300/80 dark:bg-slate-800/80">
          <motion.div
            className="h-full bg-slate-800 dark:bg-slate-200"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / session.questionCount) * 100}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
                <div className="border-b border-slate-800/12 pb-4 dark:border-slate-100/10 sm:pb-5">
                  <p className="max-w-[68ch] text-[12px] leading-[1.65] text-slate-700 dark:text-slate-300 sm:text-[13px]">
                    {EXAM_PAPER_RUBRIC_LINE}
                  </p>
                  <p className="mt-2 max-w-[68ch] text-[11px] leading-[1.6] text-slate-500 dark:text-slate-500 sm:text-[12px]">
                    {EXAM_PAPER_FOOTNOTE}
                  </p>
                </div>

                <div className="border-b border-slate-800/10 py-6 dark:border-slate-100/10 sm:py-8 lg:py-9">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dotted border-slate-500/35 pb-3 dark:border-slate-400/25 sm:pb-4">
                    <p className="font-serif text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-lg">
                      Question {currentIndex + 1}
                    </p>
                    <p className="font-serif text-[15px] font-medium tabular-nums text-slate-800 dark:text-slate-200 sm:text-base">
                      [{currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}]
                    </p>
                  </div>

                  <motion.h2
                    className="mt-6 max-w-[72ch] text-pretty font-serif text-[1.125rem] font-normal leading-[1.62] text-slate-950 dark:text-slate-100 sm:mt-7 sm:text-xl sm:leading-[1.58] lg:text-[1.35rem] lg:leading-[1.55]"
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

                  {promptCommand ? (
                    <p className="mt-3 hidden max-w-[68ch] font-sans text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 sm:block">
                      Hover or keyboard-focus the underlined word for a fuller note on what markers look for.
                    </p>
                  ) : null}
                </div>

                <div className="flex min-h-0 flex-1 flex-col pt-5 sm:pt-7">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Space for your answer
                    </p>
                    <motion.span
                      key={currentWordCount}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400"
                    >
                      {currentWordCount} words (not marked)
                    </motion.span>
                  </div>

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
                      className="exam-paper-textarea exam-paper-textarea--immersive min-h-[min(42vh,18rem)] w-full flex-1 resize-y px-1 py-1 font-serif text-[16px] leading-[1.875rem] text-slate-950 dark:text-slate-100 sm:min-h-[min(44vh,22rem)] sm:px-2 sm:text-[17px]"
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
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="sticky bottom-0 z-20 border-t border-slate-800/12 bg-[#f5f3ef]/95 backdrop-blur-sm dark:border-slate-100/10 dark:bg-[#131621]/95"
      >
        <div className={`${examStageGutter} pt-3`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-400">
              <CheckCircle2 size={14} className="text-slate-500 dark:text-slate-400" aria-hidden />
              <span className="tabular-nums">
                Written responses: {answeredCount} of {session.questionCount}
              </span>
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Paper progress</span>
          </div>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full bg-slate-700 dark:bg-slate-300"
              initial={false}
              animate={{
                width: `${Math.min(100, (answeredCount / Math.max(1, session.questionCount)) * 100)}%`,
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className={`${examStageGutter} flex items-center justify-end gap-2 border-t border-slate-800/10 pb-3 pt-2 dark:border-slate-100/10`}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToPreviousQuestion}
            disabled={currentIndex === 0 || isMarking}
            className="rounded-md border-slate-800/25 bg-white text-slate-800 dark:border-slate-100/20 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Previous question
          </Button>
          {currentIndex + 1 >= session.questionCount ? (
            <Button
              size="sm"
              onClick={finishSession}
              disabled={isMarking}
              className="rounded-md border border-slate-900 bg-slate-900 text-white shadow-none hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              End of paper — submit for marking
              <Trophy size={14} />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isMarking}
              onClick={goToNextQuestion}
              className="rounded-md border border-slate-900 bg-slate-900 text-white shadow-none hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Next question
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </motion.footer>
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Results View — redesigned with animations & compact layout
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

type ExaminerScriptStep = { label?: string; text: string };

function ExaminerScriptTheatre({
  opening,
  walkthrough,
  whatWentWell,
  targetsToImprove,
}: {
  opening: string;
  walkthrough: NonNullable<ExamConditionsSessionResult["examinerWalkthrough"]>;
  whatWentWell: string;
  targetsToImprove: string;
}) {
  const reduceMotion = useReducedMotion();
  const [revealAll, setRevealAll] = useState(false);
  const skipTyping = reduceMotion || revealAll;

  const steps: ExaminerScriptStep[] = useMemo(() => {
    const out: ExaminerScriptStep[] = [{ text: opening }];
    walkthrough.forEach((beat, i) => {
      const block = [beat.line, beat.note].map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n\n");
      if (block) {
        out.push({ label: `Question ${i + 1}`, text: block });
      }
    });
    out.push({ label: "What went well", text: whatWentWell });
    out.push({ label: "Targets to improve", text: targetsToImprove });
    return out.filter((s) => s.text.trim().length > 0);
  }, [opening, walkthrough, whatWentWell, targetsToImprove]);

  const [stepIndex, setStepIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (skipTyping) {
      setStepIndex(steps.length);
      setCharIndex(0);
      return;
    }

    setStepIndex(0);
    setCharIndex(0);
  }, [skipTyping, steps]);

  useEffect(() => {
    if (skipTyping || steps.length === 0) {
      return;
    }

    if (stepIndex >= steps.length) {
      return;
    }

    const text = steps[stepIndex]!.text;
    if (charIndex >= text.length) {
      const t = window.setTimeout(() => {
        setStepIndex((s) => s + 1);
        setCharIndex(0);
      }, 380);
      return () => window.clearTimeout(t);
    }

    const tick = window.setTimeout(() => {
      setCharIndex((c) => c + 1);
    }, 22);

    return () => window.clearTimeout(tick);
  }, [skipTyping, steps, stepIndex, charIndex]);

  if (steps.length === 0) {
    return null;
  }

  if (skipTyping) {
    return (
      <div
        role="region"
        aria-label="Examiner commentary"
        className="examiner-theatre mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#fdfcfa] to-[#f7f5f2] shadow-[0_8px_32px_-12px_rgba(60,50,30,0.1)] dark:border-slate-700/60 dark:from-slate-900 dark:to-slate-900/90 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* Examiner report header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 dark:border-slate-100/10 dark:from-slate-950 dark:to-black sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <PenLine size={15} className="text-white/90" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-white/95">Examiner&apos;s Report</p>
              <p className="text-[9px] font-medium text-white/50">AI-assisted marking commentary</p>
            </div>
          </div>
          {!reduceMotion ? (
            <button
              type="button"
              onClick={() => setRevealAll(false)}
              className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              Replay
            </button>
          ) : null}
        </div>

        <div className="px-5 py-6 sm:px-7">
          <div className="space-y-5 font-serif text-[14px] leading-[1.75] text-slate-800 dark:text-slate-300">
            {steps.map((s, i) => (
              <div key={`ex-${i}`}>
                {s.label ? (
                  <p className="examiner-section-label mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    <span className="inline-block h-px w-4 bg-slate-300 dark:bg-slate-600" />
                    {s.label}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const done = stepIndex >= steps.length;

  return (
    <motion.div
      role="region"
      aria-label="Examiner commentary"
      aria-busy={!done}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="examiner-theatre mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#fdfcfa] to-[#f7f5f2] shadow-[0_8px_32px_-12px_rgba(60,50,30,0.1)] dark:border-slate-700/60 dark:from-slate-900 dark:to-slate-900/90 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
    >
      {/* Examiner report header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 dark:border-slate-100/10 dark:from-slate-950 dark:to-black sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <PenLine size={15} className="text-white/90" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-white/95">Examiner&apos;s Report</p>
            <p className="text-[9px] font-medium text-white/50">AI-assisted marking commentary</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!done ? (
            <button
              type="button"
              onClick={() => setRevealAll(true)}
              className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              Show all
            </button>
          ) : null}
          {!done ? (
            <span className="text-[10px] font-medium tabular-nums text-white/50">
              {Math.min(stepIndex + 1, steps.length)}/{steps.length}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-emerald-400">Complete</span>
          )}
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7">
        <div
          className="space-y-5 font-serif text-[14px] leading-[1.75] text-slate-700 dark:text-slate-300"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {steps.slice(0, stepIndex).map((s, i) => (
            <div key={`ex-done-${i}`}>
              {s.label ? (
                <p className="examiner-section-label mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-px w-4 bg-slate-300 dark:bg-slate-600" />
                  {s.label}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{s.text}</p>
            </div>
          ))}

          {!done && stepIndex < steps.length ? (
            <div>
              {steps[stepIndex]!.label ? (
                <p className="examiner-section-label mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-px w-4 bg-slate-300 dark:bg-slate-600" />
                  {steps[stepIndex]!.label}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {steps[stepIndex]!.text.slice(0, charIndex)}
                <span className="examiner-cursor ml-0.5 inline-block w-[2px] animate-pulse bg-slate-800 dark:bg-slate-200" aria-hidden>
                  &nbsp;
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function ReviewCard({
  review,
  index,
  markingProvider,
}: {
  review: ExamConditionsSessionResult["reviews"][number];
  index: number;
  markingProvider?: string;
}) {
  const [open, setOpen] = useState(false);
  const reviewCommandWord = extractCommandWord(review.question.prompt);
  const reviewParts = reviewCommandWord
    ? {
        highlighted: review.question.prompt.slice(0, reviewCommandWord.word.length),
        rest: review.question.prompt.slice(reviewCommandWord.word.length),
      }
    : null;

  const scoreColor =
    review.score === review.maxScore
      ? "text-emerald-500 dark:text-emerald-400"
      : review.score > 0
        ? "text-amber-500 dark:text-amber-400"
        : "text-slate-400 dark:text-slate-500";

  const scoreUnderline =
    review.score === review.maxScore
      ? "border-emerald-500/85"
      : review.score > 0
        ? "border-amber-500/85"
        : "border-slate-300 dark:border-slate-600";

  const hasDetail = !!(review.geminiMarking && review.answer.trim());
  const hasSlots = review.evaluation.matchedSlots.length > 0 || review.evaluation.missingSlots.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="results-review-card group border-b border-slate-200/90 pb-6 pt-2 first:pt-0 last:border-b-0 dark:border-slate-800/80"
    >
      {/* Compact header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 py-2 text-left"
      >
        {/* Q number — editorial margin marker */}
        <span className="mt-0.5 w-6 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
          {index + 1}.
        </span>

        {/* Question text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-sm">
            {reviewParts ? (
              <>
                <span className="command-word-highlight">{reviewParts.highlighted}</span>
                {reviewParts.rest}
              </>
            ) : (
              review.question.prompt
            )}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span className="tabular-nums text-slate-600 dark:text-slate-400">{review.maxScore} marks</span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span
              className={
                review.question.difficulty === "hard"
                  ? "text-red-600 dark:text-red-400"
                  : review.question.difficulty === "medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {review.question.difficulty}
            </span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span
              className={
                review.score === review.maxScore
                  ? "text-emerald-600 dark:text-emerald-400"
                  : review.score > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-400 dark:text-slate-500"
              }
            >
              {review.evaluation.verdictLabel}
            </span>
          </p>
        </div>

        {/* Score + chevron */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className={`min-w-[3.25rem] border-b-2 px-1 pb-1 text-center ${scoreUnderline}`}>
            <p className={`font-mono text-base font-bold tabular-nums leading-none ${scoreColor}`}>
              {review.score}<span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">/{review.maxScore}</span>
            </p>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
          </motion.div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 pb-2 pt-4 pl-9 dark:border-slate-800">
              {/* Answer + Feedback side by side */}
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    <PenLine size={10} />
                    Your answer
                  </p>
                  <p className="mt-2.5 whitespace-pre-wrap font-serif text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.answer.trim() || (
                      <span className="italic text-slate-400 dark:text-slate-500">No answer submitted.</span>
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    <Sparkles size={10} />
                    Feedback
                  </p>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.evaluation.feedback}
                  </p>
                </div>
              </div>

              {/* Model answer */}
              {review.question.expectation ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 }}
                  className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                >
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                    <BookOpen size={10} />
                    Expected answer
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-emerald-900/80 dark:text-emerald-100/85">
                    {review.question.expectation}
                  </p>
                </motion.div>
              ) : null}

              {/* Examiner detail */}
              {hasDetail && review.geminiMarking ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/30 p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <GraduationCap size={13} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                      {markingProvider === "gemini" ? "Examiner\u2019s note" : "Mark breakdown"}
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium capitalize text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700/80">
                      {review.geminiMarking.level}
                    </span>
                    {review.geminiMarking.lowConfidence ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/40">
                        Review — differs from local check
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.geminiMarking.why}
                  </p>
                  {review.geminiMarking.evidence.length > 0 ? (
                    <div className="mt-3 border-t border-amber-200/50 pt-3 dark:border-amber-500/20">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600/80 dark:text-amber-400/80">
                        Evidence from your answer
                      </p>
                      <ul className="mt-1.5 list-none space-y-1 text-[11.5px] text-slate-600 dark:text-slate-400">
                        {review.geminiMarking.evidence.map((line, evIndex) => (
                          <li key={`${review.question.id}-ev-${evIndex}`} className="flex items-start gap-1.5">
                            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-400 dark:bg-amber-500" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}

              {/* Covered / Missing */}
              {hasSlots ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {review.evaluation.matchedSlots.length > 0 ? (
                    <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/30 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={11} />
                        Points covered
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {review.evaluation.matchedSlots.slice(0, 6).map((item) => (
                          <span key={`${review.question.id}-c-${item}`} className="results-slot-badge rounded-lg bg-emerald-100/80 px-2.5 py-1 text-[10.5px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {review.evaluation.missingSlots.length > 0 ? (
                    <div className="rounded-xl border border-red-200/50 bg-red-50/25 p-3.5 dark:border-red-500/30 dark:bg-red-500/10">
                      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-red-500 dark:text-red-400">
                        <XCircle size={11} />
                        Points missing
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {review.evaluation.missingSlots.slice(0, 6).map((item) => (
                          <span key={`${review.question.id}-m-${item}`} className="results-slot-badge rounded-lg bg-red-100/70 px-2.5 py-1 text-[10.5px] font-medium text-red-700 dark:bg-red-500/20 dark:text-red-300">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResultsView({
  results,
  session,
  topicIcon,
  topicLabel,
  startSession,
}: {
  results: ExamConditionsSessionResult;
  session: ExamConditionsSession;
  topicIcon?: string;
  topicLabel: string;
  startSession: () => void;
}) {
  const isGreat = results.scorePercent >= 70;
  const showExaminerTheatre =
    results.markingProvider === "gemini" &&
    (results.examinerWalkthrough?.length ?? 0) > 0 &&
    Boolean(results.sessionClosingFeedback);

  const fullMarksCount = results.reviews.filter((r) => r.score === r.maxScore).length;
  const partialCount = results.reviews.filter((r) => r.score > 0 && r.score < r.maxScore).length;
  const zeroCount = results.reviews.filter((r) => r.score === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="results-view min-h-screen bg-gradient-to-b from-[#faf9f7] to-[#f3f1ed] dark:from-[#0f1118] dark:to-[#131621]"
    >
      <div className="mx-auto w-full max-w-[min(100%,88rem)] px-5 py-8 sm:px-8 lg:px-14 xl:px-24 sm:py-10">

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <p className="results-session-label text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
            Session complete
          </p>
          <h1 className="mt-1 text-[1.5rem] font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[1.75rem]">
            {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={EXAM_TOPIC_LIST_HREF}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
          >
            <ArrowLeft size={13} />
            Topics
          </Link>
          <Button size="sm" onClick={startSession}>
            <RotateCcw size={13} />
            Again
          </Button>
        </div>
      </motion.div>

      {/* ── Score hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <div
          className={`results-hero-card relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-[0_12px_40px_-16px_rgba(60,50,30,0.12)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)] ${
            isGreat
              ? "border-l-[4px] border-l-emerald-500"
              : results.scorePercent >= 40
                ? "border-l-[4px] border-l-amber-500"
                : "border-l-[4px] border-l-red-400"
          }`}
        >
          {isGreat ? <CelebrationParticles /> : null}

          <div className="flex flex-col items-center gap-5 px-5 py-7 sm:flex-row sm:gap-8 sm:px-8 sm:py-8">
            {/* Score ring */}
            <div className="relative flex shrink-0 items-center justify-center">
              <ScoreRing percent={results.scorePercent} size={120} strokeWidth={8} delay={0.35} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-950 dark:text-slate-50">
                  <CountUp to={results.totalScore} delay={0.5} />
                  <span className="text-lg text-slate-400 dark:text-slate-500">/{results.totalMaxScore}</span>
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                  <CountUp to={results.scorePercent} delay={0.6} />%
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Result</p>
                {results.overallBand ? (
                  <Badge variant={isGreat ? "success" : results.scorePercent >= 40 ? "warning" : "default"}>
                    {results.overallBand}
                  </Badge>
                ) : null}
                <Badge variant="default">
                  {results.markingProvider === "gemini" ? "AI rubric pass" : "Fast checker"}
                </Badge>
              </div>

              <p className="mt-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                {results.answeredCount}/{session.questionCount} questions answered
              </p>

              {results.overallSummary ? (
                <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{results.overallSummary}</p>
              ) : null}

              {results.examMarkingMeta?.aiSkippedNote ? (
                <p className="mt-2 max-w-xl rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  {results.examMarkingMeta.aiSkippedNote}
                </p>
              ) : null}
            </div>
          </div>

          {/* Score breakdown stats */}
          <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start sm:gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{fullMarksCount}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Full marks</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
                  <ArrowRight size={13} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tabular-nums text-amber-700 dark:text-amber-400">{partialCount}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Partial</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                  <XCircle size={13} className="text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tabular-nums text-red-600 dark:text-red-400">{zeroCount}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">No marks</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Marking info note */}
        {results.markingProvider === "gemini" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-3 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400"
          >
            <span className="font-semibold text-slate-600 dark:text-slate-300">Note:</span> Marks and percentages are calculated; the band label is examiner-style guidance.
            This is an approximation, not a replacement for a real examiner.
            {results.examMarkingMeta?.markingResponseRecovered ? (
              <span className="ml-1 text-amber-700 dark:text-amber-400">Some wording was rebuilt after an incomplete model reply — marks are unchanged.</span>
            ) : null}
            {results.bandOverriddenToMatchMarks ? (
              <span className="ml-1 text-amber-700 dark:text-amber-400">Band adjusted to match your numeric score.</span>
            ) : null}
            {results.examinerNote ? (
              <span className="ml-1 italic text-slate-500 dark:text-slate-400">{results.examinerNote}</span>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>

      {showExaminerTheatre && results.sessionClosingFeedback && results.examinerWalkthrough ? (
        <ExaminerScriptTheatre
          opening={results.examinerOpening ?? ""}
          walkthrough={results.examinerWalkthrough}
          whatWentWell={results.sessionClosingFeedback.whatWentWell}
          targetsToImprove={results.sessionClosingFeedback.targetsToImprove}
        />
      ) : results.sessionClosingFeedback ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">What went well</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
              {results.sessionClosingFeedback.whatWentWell}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="rounded-2xl border border-violet-200/60 bg-violet-50/35 px-4 py-4 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-800 dark:text-violet-300">Targets to improve</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
              {results.sessionClosingFeedback.targetsToImprove}
            </p>
          </motion.div>
        </div>
      ) : null}

      {/* ── Paper transcript ────────────────────────────── */}
      <div className="mt-10 flex items-center gap-3">
        <GraduationCap size={14} className="text-slate-400 dark:text-slate-500" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Your paper — question by question</p>
      </div>
      <div className="mt-3 space-y-0 rounded-2xl border border-slate-200/70 bg-white/60 px-5 py-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 sm:px-6">
        {results.reviews.map((review, index) => (
          <ReviewCard
            key={review.question.id}
            review={review}
            index={index}
            markingProvider={results.markingProvider}
          />
        ))}
      </div>

      </div>
    </motion.div>
  );
}
