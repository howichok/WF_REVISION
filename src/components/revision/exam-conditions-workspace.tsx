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
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
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
  const pageRootClass =
    "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(249,245,238,1)_38%,rgba(242,235,224,1))] text-slate-900";
  const strongPanelClass =
    "rounded-[34px] border border-slate-200/90 bg-white/90 shadow-[0_30px_90px_-52px_rgba(80,60,30,0.22)] backdrop-blur-xl";

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.78),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.1),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.08),transparent_30%)]" />
        <AnimatePresence>
          {isLaunching ? (
            <motion.div
              key="exam-launch-overlay"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/72 px-6 backdrop-blur-2xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl rounded-[36px] border border-slate-200/90 bg-white/92 px-8 py-10 text-center shadow-[0_30px_90px_-50px_rgba(80,60,30,0.28)]"
              >
                <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                  <AlarmClock size={28} />
                </div>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">
                  Entering exam conditions
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  Everything else drops away now
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Loading the timed session, pinning the timer, and surfacing the first question.
                </p>
                <motion.div
                  className="mx-auto mt-8 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-200"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-indigo-500 to-amber-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.48, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-10 sm:px-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href={EXAM_TOPIC_LIST_HREF}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} />
                Topics
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {topicIcon ? `${topicIcon} ` : ""}
              {topicLabel}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Timed session · {previewSession.questionCount} questions · {previewSession.estimatedMinutes} minutes ·
              marking after you finish.
            </p>
          </div>

          <Card variant="warning" className={`p-6 ${strongPanelClass}`}>
            <p className="text-sm leading-relaxed text-slate-600">
              No hints during the run. Write answers first; feedback runs once at the end (or when time runs out).
            </p>
            {preferredQuestionId ? (
              <p className="mt-2 text-xs text-slate-500">First question is pinned from your link.</p>
            ) : null}
            <Button className="mt-6 w-full" onClick={startSession}>
              <AlarmClock size={14} />
              Start
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="space-y-6 px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">
              Exam conditions complete
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={EXAM_TOPIC_LIST_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-card/80 hover:text-foreground"
            >
              Topics
            </Link>
            <Button onClick={startSession}>
              <RotateCcw size={14} />
              Again
            </Button>
          </div>
        </div>

        <Card variant={results.scorePercent >= 70 ? "success" : results.scorePercent >= 40 ? "warning" : "danger"} className={`p-6 ${strongPanelClass}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Session result
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                {results.totalScore}/{results.totalMaxScore}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {results.answeredCount}/{session.questionCount} questions answered
              </p>
              {results.overallSummary ? (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700">{results.overallSummary}</p>
              ) : null}
            </div>
            <div className="min-w-[220px] space-y-3">
              <ProgressBar value={results.scorePercent} className="w-full" />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Overall score</span>
                <span className="font-medium text-slate-900">{results.scorePercent}%</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {results.reviews.map((review, index) => (
            <Card key={review.question.id} variant="task" className="rounded-[24px] border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_52px_-40px_rgba(80,60,30,0.16)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">Question {index + 1}</Badge>
                    <Badge variant="warning">{review.maxScore} marks</Badge>
                    <Badge variant={getDifficultyBadgeVariant(review.question)}>
                      {review.question.difficulty}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{review.question.prompt}</h2>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Marks
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {review.score}/{review.maxScore}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-600">{review.evaluation.verdictLabel}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Your answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {review.answer.trim() || "No answer submitted."}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Feedback
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-800">
                    {review.evaluation.feedback}
                  </p>
                  {(review.evaluation.matchedSlots.length > 0 || review.evaluation.missingSlots.length > 0) ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
                          Covered
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.evaluation.matchedSlots.length > 0 ? (
                            review.evaluation.matchedSlots.slice(0, 4).map((item) => (
                              <span key={`${review.question.id}-covered-${item}`} className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] text-success">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No strong coverage signals yet.</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
                          Missing
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.evaluation.missingSlots.length > 0 ? (
                            review.evaluation.missingSlots.slice(0, 4).map((item) => (
                              <span key={`${review.question.id}-missing-${item}`} className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] text-warning">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No major missing slots detected.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white/85 px-6 text-center backdrop-blur-md"
          >
            <Loader2 className="h-10 w-10 animate-spin text-amber-600" aria-hidden />
            <div>
              <p className="text-base font-semibold text-slate-900">Checking your session</p>
              <p className="mt-1 max-w-sm text-sm text-slate-600">
                One Gemini pass against the mark schemes — usually a few seconds.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href={EXAM_TOPIC_LIST_HREF}>
              <Button variant="ghost" size="sm" className="shrink-0 px-2 sm:px-3">
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {topicIcon ? `${topicIcon} ` : ""}
                {topicLabel}
              </p>
              <p className="text-xs text-slate-500">
                {currentIndex + 1}/{session.questionCount} · {answeredCount} answered · {session.estimatedMinutes} min
                session
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">Time</p>
            <div className="flex items-center justify-end gap-1.5">
              <Clock3
                size={14}
                className={
                  timerTone === "danger" ? "text-danger" : timerTone === "warning" ? "text-warning" : "text-accent"
                }
              />
              <span className="text-base font-semibold tabular-nums text-slate-950">{formatTime(secondsLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {currentQuestion ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-medium text-slate-500">
                Question {currentIndex + 1} of {session.questionCount} · {currentQuestion.marks} marks ·{" "}
                {currentQuestion.difficulty}
              </p>

              <h2 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-slate-950 sm:text-2xl">
                {currentQuestion.prompt}
              </h2>

              {commandWord ? (
                <p className="mt-3 text-sm italic text-slate-600">
                  {commandWord.word}: {commandWord.guidance}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your answer</p>
                <span className="text-xs text-slate-400">
                  {(answers[currentQuestion.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <textarea
                value={answers[currentQuestion.id] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentQuestion.id]: event.target.value,
                  }))
                }
                rows={14}
                placeholder="Write here…"
                className="min-h-[280px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-7 text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/25"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                <CheckCircle2 size={14} className="mr-1 inline text-success align-text-bottom" />
                {answeredCount} / {session.questionCount} with text
              </p>

              <div className="flex flex-wrap justify-end gap-2">
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
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
