"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useAiOverlay } from "@/components/providers/ai-overlay-provider";
import { Badge, Button, Input, ProgressBar } from "@/components/ui";
import {
  evaluateExamConditionsSession,
  generateExamConditionsSession,
  getExamConditionsPoolStats,
  type ExamConditionsQuestion,
  type ExamConditionsSession,
  type ExamConditionsSessionResult,
} from "@/lib/exam-conditions";
import { useAppData } from "@/components/providers/app-data-provider";
import { extractCommandWord } from "@/lib/command-words";

interface ExamConditionsWorkspaceProps {
  topicId: string;
  topicLabel: string;
  topicIcon?: string;
  preferredQuestionId?: string;
  autoStart?: boolean;
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

const EXAM_TOPIC_LIST_HREF = "/revision/topics?mode=exam-conditions";

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

function getDifficultyBadgeVariant(question: ExamConditionsQuestion) {
  if (question.difficulty === "hard") {
    return "danger" as const;
  }
  if (question.difficulty === "medium") {
    return "warning" as const;
  }
  return "default" as const;
}

export function ExamConditionsWorkspace({
  topicId,
  topicLabel,
  topicIcon,
  preferredQuestionId,
  autoStart = false,
}: ExamConditionsWorkspaceProps) {
  const overlay = useAiOverlay();
  const { sharedCurriculum } = useAppData();
  const reduceMotion = useReducedMotion();
  const poolStats = useMemo(
    () => getExamConditionsPoolStats(topicId, sharedCurriculum),
    [topicId, sharedCurriculum]
  );
  const [userQuestionCount, setUserQuestionCount] = useState<number | undefined>(undefined);
  const optionalQuestionCount =
    userQuestionCount === undefined ? undefined : userQuestionCount;
  const resolvedDisplayCount = userQuestionCount ?? poolStats.defaultQuestionCount;

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

  sessionRef.current = session;
  answersRef.current = answers;

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const totalSeconds = (session?.estimatedMinutes ?? 0) * 60;
  const answeredCount = session
    ? session.questions.filter((question) => (answers[question.id] ?? "").trim().length > 0).length
    : 0;
  const timerTone = getTimerTone(secondsLeft, totalSeconds);
  const commandWord = currentQuestion ? extractCommandWord(currentQuestion.prompt) : null;
  const promptParts = currentQuestion && commandWord
    ? {
        highlighted: currentQuestion.prompt.slice(0, commandWord.word.length),
        rest: currentQuestion.prompt.slice(commandWord.word.length),
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
    "relative flex min-h-screen flex-col bg-[#faf9f7] text-slate-900";
  const examActiveRootClass =
    "relative flex min-h-screen flex-col bg-gradient-to-b from-slate-100/95 via-[#f6f4f1] to-slate-200/35 text-slate-900";

  useEffect(() => {
    setUserQuestionCount(undefined);
  }, [topicId]);

  useEffect(() => {
    const shouldSuppress = Boolean(session);
    overlay.setOverlaySuppressed(shouldSuppress);

    return () => {
      overlay.setOverlaySuppressed(false);
    };
  }, [overlay, session]);

  useEffect(() => {
    if (!autoStart || session || isLaunching) {
      return;
    }

    startSession();
  }, [autoStart, isLaunching, session]);

  const runMarking = useCallback(async (active: ExamConditionsSession, ans: Record<string, string>) => {
    setIsMarking(true);
    try {
      const res = await fetch("/api/intelligence/exam-conditions-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: active.questions,
          answers: ans,
        }),
      });
      const data = (await res.json()) as { result?: ExamConditionsSessionResult };
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
  }, []);

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
    const nextSession = generateExamConditionsSession(topicId, {
      preferredQuestionId,
      snapshot: sharedCurriculum,
      questionCount: optionalQuestionCount,
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
    const previewSession = generateExamConditionsSession(topicId, {
      preferredQuestionId,
      snapshot: sharedCurriculum,
      questionCount: optionalQuestionCount,
    });

    return (
      <div className={pageRootClass}>

        <AnimatePresence>
          {isLaunching ? (
            <motion.div
              key="exam-launch-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 px-5 backdrop-blur-2xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="w-full max-w-lg rounded-[32px] border border-slate-200/70 bg-white/95 px-10 py-12 text-center shadow-[0_40px_100px_-48px_rgba(80,60,30,0.22)] backdrop-blur-xl"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-600 shadow-[0_8px_24px_-10px_rgba(217,119,6,0.2)]">
                  <AlarmClock size={26} />
                </div>
                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600/80">
                  Entering exam conditions
                </p>
                <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Everything else drops away now
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Loading the timed session, pinning the timer, and surfacing the first question.
                </p>
                <motion.div
                  className="mx-auto mt-9 h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-200/80"
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
            <h1 className="text-[1.65rem] font-bold tracking-tight text-slate-950 sm:text-3xl">
              {topicIcon ? `${topicIcon} ` : ""}
              {topicLabel}
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">
              Timed session · {previewSession.questionCount} questions · {previewSession.estimatedMinutes} min ·
              marked after you finish
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200/70 bg-white/92 p-7 shadow-[0_32px_80px_-48px_rgba(80,60,30,0.18)] backdrop-blur-xl sm:p-9">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50/80 text-amber-600">
                <AlarmClock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-relaxed text-slate-700">
                  No hints during the run. Write your answers first — feedback runs once at the end or when time expires.
                </p>
                {preferredQuestionId ? (
                  <p className="mt-2 text-xs text-slate-400">First question pinned from your link.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <Input
                type="number"
                label="Number of questions"
                min={1}
                max={Math.max(1, poolStats.maxSessionQuestions)}
                value={poolStats.maxSessionQuestions === 0 ? "" : resolvedDisplayCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setUserQuestionCount(undefined);
                    return;
                  }
                  const value = parseInt(raw, 10);
                  if (!Number.isFinite(value)) {
                    return;
                  }
                  setUserQuestionCount(
                    Math.max(1, Math.min(poolStats.maxSessionQuestions, value))
                  );
                }}
                disabled={poolStats.maxSessionQuestions === 0}
                hint={
                  poolStats.poolSize === 0
                    ? "No questions in this topic yet."
                    : `Between 1 and ${poolStats.maxSessionQuestions} (${poolStats.poolSize} available in this topic).`
                }
                className="tabular-nums"
              />
            </div>

            <div className="mt-7 flex gap-3">
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
                <p className="text-lg font-bold tabular-nums text-slate-900">{previewSession.questionCount}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Questions</p>
              </div>
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
                <p className="text-lg font-bold tabular-nums text-slate-900">{previewSession.estimatedMinutes}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Minutes</p>
              </div>
              <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-center">
                <p className="text-lg font-bold text-slate-900">AI</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Marking</p>
              </div>
            </div>

            <Button
              className="mt-7 w-full"
              onClick={startSession}
              disabled={poolStats.maxSessionQuestions === 0}
            >
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-12"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600">
              Session complete
            </p>
            <h1 className="mt-1.5 text-[1.65rem] font-bold tracking-tight text-slate-950 sm:text-3xl">
              {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={EXAM_TOPIC_LIST_HREF}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft size={14} />
              Topics
            </Link>
            <Button size="sm" onClick={startSession}>
              <RotateCcw size={14} />
              Again
            </Button>
          </div>
        </div>

        {/* Score hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-8"
        >
          <div className={`relative overflow-hidden rounded-[28px] border bg-white/95 p-7 shadow-[0_32px_80px_-48px_rgba(80,60,30,0.16)] backdrop-blur-xl sm:p-9 ${
            results.scorePercent >= 70
              ? "border-emerald-200/60"
              : results.scorePercent >= 40
                ? "border-amber-200/60"
                : "border-red-200/60"
          }`}>
            {/* Top accent */}
            <div className={`absolute inset-x-0 top-0 h-[3px] ${
              results.scorePercent >= 70
                ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                : results.scorePercent >= 40
                  ? "bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
                  : "bg-gradient-to-r from-transparent via-red-400/50 to-transparent"
            }`} />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Result
                  </p>
                  {results.overallBand ? (
                    <Badge variant={results.scorePercent >= 70 ? "success" : results.scorePercent >= 40 ? "warning" : "default"}>
                      {results.overallBand}
                    </Badge>
                  ) : null}
                  {results.markingProvider === "gemini" ? (
                    <Badge variant="default">Mark scheme check</Badge>
                  ) : (
                    <Badge variant="default">Local marker</Badge>
                  )}
                </div>

                <motion.p
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                  className="mt-3 text-5xl font-bold tabular-nums tracking-tight text-slate-950"
                >
                  {results.totalScore}<span className="text-3xl text-slate-400">/{results.totalMaxScore}</span>
                </motion.p>

                <p className="mt-1.5 text-[13px] text-slate-500">
                  {results.answeredCount}/{session.questionCount} questions answered
                </p>

                {results.overallSummary ? (
                  <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-slate-600">{results.overallSummary}</p>
                ) : null}

                {results.markingProvider === "gemini" ? (
                  <div className="mt-4 max-w-2xl space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-[12px] leading-relaxed text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-700">How to read this:</span> Percentages and marks are
                      what we keep; the band label is examiner-style guidance. It is an approximation, not a replacement
                      for a real examiner.
                    </p>
                    {results.bandOverriddenToMatchMarks ? (
                      <p className="text-amber-800">
                        The overall band was adjusted to match your numeric score because the model band and marks did
                        not line up.
                      </p>
                    ) : null}
                    {results.examinerNote ? (
                      <p className="text-slate-500 italic">{results.examinerNote}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="min-w-[200px] space-y-2.5 lg:min-w-[240px]">
                <ProgressBar value={results.scorePercent} className="w-full" />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Overall score</span>
                  <span className="font-semibold tabular-nums text-slate-700">{results.scorePercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Review cards */}
        <div className="mt-8 space-y-5">
          {results.reviews.map((review, index) => {
            const reviewCommandWord = extractCommandWord(review.question.prompt);
            const reviewParts = reviewCommandWord
              ? {
                  highlighted: review.question.prompt.slice(0, reviewCommandWord.word.length),
                  rest: review.question.prompt.slice(reviewCommandWord.word.length),
                }
              : null;

            return (
              <motion.div
                key={review.question.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.07, duration: 0.35 }}
                className="rounded-[24px] border border-slate-200/70 bg-white/90 shadow-[0_20px_56px_-40px_rgba(80,60,30,0.12)] backdrop-blur-xl"
              >
                {/* Question header section */}
                <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-7">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                        Q{index + 1}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600">
                        {review.maxScore} marks
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        review.question.difficulty === "hard"
                          ? "bg-red-50 text-red-600"
                          : review.question.difficulty === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {review.question.difficulty}
                      </span>
                    </div>
                    <h2 className="mt-3 text-base font-semibold leading-snug tracking-tight text-slate-950 sm:text-lg">
                      {reviewParts ? (
                        <>
                          <span className="command-word-highlight">{reviewParts.highlighted}</span>
                          {reviewParts.rest}
                        </>
                      ) : (
                        review.question.prompt
                      )}
                    </h2>
                  </div>

                  <div className={`shrink-0 rounded-2xl border px-4 py-2.5 text-center ${
                    review.score === review.maxScore
                      ? "border-emerald-200/70 bg-emerald-50/80"
                      : review.score > 0
                        ? "border-amber-200/70 bg-amber-50/80"
                        : "border-slate-200/70 bg-slate-50/80"
                  }`}>
                    <p className={`text-xl font-bold tabular-nums ${
                      review.score === review.maxScore
                        ? "text-emerald-600"
                        : review.score > 0
                          ? "text-amber-600"
                          : "text-slate-400"
                    }`}>
                      {review.score}<span className="text-sm font-medium text-slate-400">/{review.maxScore}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">{review.evaluation.verdictLabel}</p>
                  </div>
                </div>

                {/* Answer + Feedback panels */}
                <div className="mt-5 grid gap-[1px] overflow-hidden rounded-b-[24px] border-t border-slate-100 bg-slate-100/80 lg:grid-cols-2">
                  <div className="bg-white/90 px-6 py-5 sm:px-8 sm:py-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Your answer
                    </p>
                    <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                      {review.answer.trim() || "No answer submitted."}
                    </p>
                  </div>
                  <div className="bg-white/90 px-6 py-5 sm:px-8 sm:py-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Feedback
                    </p>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-slate-700">
                      {review.evaluation.feedback}
                    </p>

                    {results.markingProvider === "gemini" && review.geminiMarking && review.answer.trim() ? (
                      <div className="mt-4 space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Examiner-style detail
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 ring-1 ring-slate-200/80">
                            {review.geminiMarking.level}
                          </span>
                          {review.geminiMarking.lowConfidence ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                              Review — differs from quick local check
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[12px] leading-relaxed text-slate-700">
                          <span className="font-semibold text-slate-800">Why this mark: </span>
                          {review.geminiMarking.why}
                        </p>
                        {review.geminiMarking.evidence.length > 0 ? (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Evidence from your answer
                            </p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] text-slate-600">
                              {review.geminiMarking.evidence.map((line, evIndex) => (
                                <li key={`${review.question.id}-ev-${evIndex}`}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {(review.evaluation.matchedSlots.length > 0 || review.evaluation.missingSlots.length > 0) ? (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                            Covered
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {review.evaluation.matchedSlots.length > 0 ? (
                              review.evaluation.matchedSlots.slice(0, 4).map((item) => (
                                <span key={`${review.question.id}-covered-${item}`} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">None detected</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                            Missing
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {review.evaluation.missingSlots.length > 0 ? (
                              review.evaluation.missingSlots.slice(0, 4).map((item) => (
                                <span key={`${review.question.id}-missing-${item}`} className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">None detected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white/80 px-6 text-center backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100/80 shadow-[0_12px_40px_-16px_rgba(217,119,6,0.3)]"
            >
              <Loader2 className="h-9 w-9 animate-spin text-amber-600" aria-hidden />
            </motion.div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Checking your session</p>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
                Marking against the mark schemes — usually a few seconds.
              </p>
            </div>
            <motion.div
              className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200/80"
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
        className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/80 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.12)] backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2.5">
            <div className="flex items-center gap-2.5">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link href={EXAM_TOPIC_LIST_HREF}>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-slate-400 transition-colors hover:bg-slate-100/90 hover:text-slate-600"
                  >
                    <ArrowLeft size={15} />
                    <span className="hidden text-[13px] font-medium sm:inline">Exit</span>
                  </button>
                </Link>
              </motion.div>
              <div className="hidden h-4 w-px bg-slate-200 sm:block" />
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {topicIcon ? `${topicIcon} ` : ""}
                {topicLabel}
              </p>
            </div>
            <motion.p
              key={`meta-${currentIndex}-${answeredCount}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="truncate pl-7 text-[11px] text-slate-400 sm:pl-0"
            >
              {currentIndex + 1}/{session.questionCount} · {answeredCount} answered · {session.estimatedMinutes}{" "}
              min
            </motion.p>
          </div>

          <motion.div
            layout
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 shadow-sm ring-1 ring-black/[0.04] transition-colors duration-300 ${
              timerTone === "danger"
                ? "exam-timer-danger bg-red-50 text-red-600 ring-red-200/40"
                : timerTone === "warning"
                  ? "exam-timer-warning bg-amber-50 text-amber-700 ring-amber-200/40"
                  : "bg-white text-slate-600 ring-slate-200/60"
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
            <Clock3 size={13} className="opacity-60" />
            <span className="text-sm font-semibold tabular-nums">{formatTime(secondsLeft)}</span>
          </motion.div>
        </div>

        <div className="h-[3px] bg-slate-100/90">
          <motion.div
            className="h-full rounded-r-full bg-gradient-to-r from-violet-500 via-accent to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / session.questionCount) * 100}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.header>

      {/* Main workspace — single unified card */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
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
              className="relative overflow-hidden rounded-[26px] border border-slate-200/70 bg-white/95 shadow-[0_32px_64px_-28px_rgba(30,27,75,0.18),0_0_0_1px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm"
            >
              <motion.div
                className="absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r from-violet-500 via-accent to-sky-500"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />

              <div className="border-b border-slate-100/90 px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
                <motion.div
                  className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: {
                      transition: { staggerChildren: 0.05, delayChildren: 0.08 },
                    },
                  }}
                >
                  <motion.span
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                    className="text-slate-400"
                  >
                    Question {currentIndex + 1} of {session.questionCount}
                  </motion.span>
                  <span className="text-slate-300">·</span>
                  <motion.span
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                    className="text-amber-600"
                  >
                    {currentQuestion.marks} marks
                  </motion.span>
                  <span className="text-slate-300">·</span>
                  <motion.span
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                    className={
                      currentQuestion.difficulty === "hard"
                        ? "text-red-500"
                        : currentQuestion.difficulty === "medium"
                          ? "text-amber-500"
                          : "text-emerald-600"
                    }
                  >
                    {currentQuestion.difficulty}
                  </motion.span>
                </motion.div>

                <motion.h2
                  className="mt-4 text-[1.2rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.35rem]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {promptParts ? (
                    <>
                      <span className="command-word-highlight">{promptParts.highlighted}</span>
                      {promptParts.rest}
                    </>
                  ) : (
                    currentQuestion.prompt
                  )}
                </motion.h2>

                {commandWord ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.32 }}
                    className="mt-4 inline-flex items-center gap-2.5 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/90 to-indigo-50/40 px-3.5 py-2.5 shadow-sm"
                  >
                    <span className="command-word-badge !py-1 !px-2.5">
                      <span className="command-word-highlight text-[12px]">{commandWord.word}</span>
                    </span>
                    <p className="text-[12px] leading-snug text-slate-600">{commandWord.guidance}</p>
                  </motion.div>
                ) : null}
              </div>

              <div className="px-6 pb-6 pt-4 sm:px-8 sm:pb-7 sm:pt-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Your answer</p>
                  <motion.span
                    key={currentWordCount}
                    initial={{ scale: 1.2, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="text-[11px] tabular-nums text-slate-400"
                  >
                    {currentWordCount} words
                  </motion.span>
                </div>

                <motion.div
                  initial={{ opacity: 0.92, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <textarea
                    value={answers[currentQuestion.id] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [currentQuestion.id]: event.target.value,
                      }))
                    }
                    rows={10}
                    placeholder="Write here…"
                    className="exam-textarea-focus w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 text-[15px] leading-7 text-slate-900 shadow-inner placeholder:text-slate-300 transition-shadow duration-200 focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] sm:min-h-[260px]"
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <motion.footer
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="sticky bottom-0 z-20 border-t border-slate-200/50 bg-white/85 shadow-[0_-12px_40px_-20px_rgba(15,23,42,0.1)] backdrop-blur-xl"
      >
        <div className="mx-auto w-full max-w-2xl px-4 pt-3 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <motion.span
                key={answeredCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <CheckCircle2 size={14} className="text-emerald-500" />
              </motion.span>
              <span className="tabular-nums">
                {answeredCount} / {session.questionCount} with text
              </span>
            </p>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Progress</span>
          </div>
          <ProgressBar value={answeredCount} max={session.questionCount} size="md" color="accent" className="mb-3" />
        </div>
        <div className="mx-auto flex w-full max-w-2xl items-center justify-end gap-2 px-4 pb-3 sm:px-6">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goToPreviousQuestion}
              disabled={currentIndex === 0 || isMarking}
              className="rounded-xl transition-transform"
            >
              Back
            </Button>
          </motion.div>
          {currentIndex + 1 >= session.questionCount ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" onClick={finishSession} disabled={isMarking} className="rounded-xl shadow-md shadow-violet-500/15">
                Finish &amp; check
                <Trophy size={14} />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                disabled={isMarking}
                onClick={goToNextQuestion}
                className="rounded-xl shadow-md shadow-violet-500/15"
              >
                Next
                <ArrowRight size={14} />
              </Button>
            </motion.div>
          )}
        </div>
      </motion.footer>
    </motion.div>
  );
}
