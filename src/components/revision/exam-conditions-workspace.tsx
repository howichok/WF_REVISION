"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { Badge, Button, ProgressBar } from "@/components/ui";
import {
  evaluateExamConditionsSession,
  generateExamConditionsSession,
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
  const [session, setSession] = useState<ExamConditionsSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExamConditionsSessionResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

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
  const pageRootClass =
    "relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.99),rgba(250,247,242,1)_40%,rgba(244,239,230,1))] text-slate-900";

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
    });

    return (
      <div className={pageRootClass}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.8),transparent_36%),radial-gradient(circle_at_20%_80%,rgba(251,191,36,0.07),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.06),transparent_35%)]" />

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

            <Button className="mt-7 w-full" onClick={startSession}>
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
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={pageRootClass}
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

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={EXAM_TOPIC_LIST_HREF}>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1 px-2.5">
                <ArrowLeft size={14} />
                <span className="hidden text-[13px] sm:inline">Exit</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-950">
                {topicIcon ? `${topicIcon} ` : ""}
                {topicLabel}
              </p>
              <p className="text-[11px] text-slate-400">
                {currentIndex + 1}/{session.questionCount} · {answeredCount} answered · {session.estimatedMinutes} min session
              </p>
            </div>
          </div>

          <div
            className={`shrink-0 rounded-2xl border px-4 py-2.5 transition-all duration-300 ${
              timerTone === "danger"
                ? "exam-timer-danger border-red-200/80 bg-red-50/80"
                : timerTone === "warning"
                  ? "exam-timer-warning border-amber-200/80 bg-amber-50/80"
                  : "border-slate-200/60 bg-slate-50/60"
            }`}
          >
            <p className={`text-[9px] font-semibold uppercase tracking-[0.15em] ${
              timerTone === "danger" ? "text-red-500" : timerTone === "warning" ? "text-amber-600" : "text-slate-400"
            }`}>Time</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Clock3
                size={13}
                className={
                  timerTone === "danger" ? "text-red-500" : timerTone === "warning" ? "text-amber-500" : "text-accent"
                }
              />
              <span className={`text-[15px] font-semibold tabular-nums leading-none ${
                timerTone === "danger" ? "text-red-600" : "text-slate-900"
              }`}>{formatTime(secondsLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress strip */}
        <div className="h-[2px] bg-slate-100/80">
          <motion.div
            className="exam-nav-progress h-full bg-gradient-to-r from-accent/80 via-indigo-400 to-accent/80"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / session.questionCount) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto w-full max-w-2xl px-5 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10">
        {currentQuestion ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-5"
          >
            {/* Question card */}
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_28px_72px_-44px_rgba(80,60,30,0.14)] backdrop-blur-xl">
              {/* Accent strip */}
              <div className="h-[2.5px] bg-gradient-to-r from-transparent via-accent/35 to-transparent" />

              <div className="px-7 pb-7 pt-6 sm:px-9 sm:pb-8 sm:pt-7">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-slate-100/80 px-2.5 py-[3px] text-[10px] font-semibold text-slate-500">
                    Question {currentIndex + 1} of {session.questionCount}
                  </span>
                  <span className="rounded-full bg-amber-50/80 px-2.5 py-[3px] text-[10px] font-semibold text-amber-600">
                    {currentQuestion.marks} marks
                  </span>
                  <span className={`rounded-full px-2.5 py-[3px] text-[10px] font-semibold ${
                    currentQuestion.difficulty === "hard"
                      ? "bg-red-50/80 text-red-600"
                      : currentQuestion.difficulty === "medium"
                        ? "bg-amber-50/80 text-amber-600"
                        : "bg-emerald-50/80 text-emerald-600"
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-slate-950 sm:text-[1.35rem]">
                  {promptParts ? (
                    <>
                      <span className="command-word-highlight">{promptParts.highlighted}</span>
                      {promptParts.rest}
                    </>
                  ) : (
                    currentQuestion.prompt
                  )}
                </h2>

                {commandWord ? (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-accent/10 bg-accent/[0.03] px-4 py-3">
                    <span className="command-word-badge">
                      <span className="command-word-highlight text-[13px]">{commandWord.word}</span>
                    </span>
                    <p className="text-[13px] italic leading-relaxed text-slate-500">
                      {commandWord.guidance}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Answer card */}
            <div className="rounded-[24px] border border-slate-200/70 bg-white shadow-[0_20px_52px_-40px_rgba(80,60,30,0.1)]">
              <div className="flex items-center justify-between px-7 pt-6 sm:px-9 sm:pt-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Your answer</p>
                <span className="rounded-full bg-slate-50 px-2.5 py-[3px] text-[11px] tabular-nums text-slate-400">
                  {(answers[currentQuestion.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div className="px-5 pb-5 pt-3 sm:px-7 sm:pb-7 sm:pt-4">
                <textarea
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion.id]: event.target.value,
                    }))
                  }
                  rows={12}
                  placeholder="Write here…"
                  className="exam-textarea-focus min-h-[260px] w-full resize-none rounded-2xl border border-slate-200/60 bg-slate-50/40 px-5 py-4 text-[15px] leading-7 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/50 bg-white/60 px-5 py-3.5 backdrop-blur-sm sm:px-7">
              <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
                <CheckCircle2 size={13} className="text-emerald-500" />
                {answeredCount} / {session.questionCount} with text
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
                  disabled={currentIndex === 0 || isMarking}
                >
                  Back
                </Button>
                {currentIndex + 1 >= session.questionCount ? (
                  <Button size="sm" onClick={finishSession} disabled={isMarking}>
                    Finish &amp; check
                    <Trophy size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isMarking}
                    onClick={() => setCurrentIndex((current) => Math.min(session.questionCount - 1, current + 1))}
                  >
                    Next
                    <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
