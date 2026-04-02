"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
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

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const totalSeconds = (session?.estimatedMinutes ?? 0) * 60;
  const completionPercent = session
    ? Math.round(((currentIndex + 1) / Math.max(session.questionCount, 1)) * 100)
    : 0;
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

  useEffect(() => {
    if (!session || !startedAt || results) {
      return;
    }

    const update = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const nextSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      setSecondsLeft(nextSeconds);

      if (nextSeconds === 0) {
        setResults(evaluateExamConditionsSession(session.questions, answers));
      }
    };

    update();
    const interval = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [answers, results, session, startedAt, totalSeconds]);

  function activateSession() {
    const nextSession = generateExamConditionsSession(topicId, {
      preferredQuestionId,
      snapshot: sharedCurriculum,
    });

    setSession(nextSession);
    setAnswers({});
    setCurrentIndex(0);
    setResults(null);
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

  function resetSession() {
    setSession(null);
    setAnswers({});
    setCurrentIndex(0);
    setResults(null);
    setStartedAt(null);
    setSecondsLeft(0);
    setIsLaunching(false);
  }

  function finishSession() {
    if (!session) {
      return;
    }

    setResults(evaluateExamConditionsSession(session.questions, answers));
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

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href={`/revision/${topicId}/practice`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} />
                Back
              </Button>
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">
                Exam conditions
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
                This is a separate exam feature, not a topic widget. Once it launches, the normal revision UI drops away and you only keep the timer, the current question, and your answer box.
              </p>
            </div>
          </div>

        <Card variant="warning" className={`mt-6 p-6 sm:p-8 ${strongPanelClass}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">Separate exam feature</Badge>
                <Badge variant="default">Random 10-20 questions</Badge>
                {preferredQuestionId ? <Badge variant="accent">Pinned first prompt</Badge> : null}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                One clean timed session, then the checker runs once at the end
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>When the session starts, the extra interface gets out of the way and you only see the timer, the current question, and the answer area.</p>
                <p>The question count is random between 10 and 20. Fewer questions creates a harder overall mix; more questions creates a broader and easier spread.</p>
                <p>You answer first. The AI-style checker only runs after you finish or the timer expires.</p>
              </div>
            </div>

            <div className="min-w-[240px] rounded-3xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-[0_18px_45px_-36px_rgba(180,120,30,0.25)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                Next generated session
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Questions</span>
                  <span className="text-sm font-semibold text-slate-900">{previewSession.questionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Timer</span>
                  <span className="text-sm font-semibold text-slate-900">{previewSession.estimatedMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Finish</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {previewSession.questions.at(-1)?.difficulty === "hard" ? "Hard end" : "Mixed end"}
                  </span>
                </div>
              </div>
              <Button className="mt-5 w-full shadow-[0_16px_35px_-24px_rgba(99,102,241,0.55)]" onClick={startSession}>
                <AlarmClock size={14} />
                Start exam conditions
              </Button>
            </div>
          </div>
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
          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetSession}>
              Exit
            </Button>
            <Button onClick={startSession}>
              <RotateCcw size={14} />
              New session
            </Button>
          </div>
        </div>

        <Card variant={results.scorePercent >= 70 ? "success" : results.scorePercent >= 40 ? "warning" : "danger"} className={`p-6 ${strongPanelClass}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Session result
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                {results.totalScore}/{results.totalMaxScore}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {results.answeredCount}/{session.questionCount} questions answered
              </p>
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
                    Score
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {review.score}/{review.maxScore}
                  </p>
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
                    Checker feedback
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
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link href={`/revision/${topicId}/practice`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft size={14} />
                  Exit
                </Button>
              </Link>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">
                  Exam conditions
                </p>
                <p className="text-sm font-semibold text-slate-950">
                  {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Question {currentIndex + 1} of {session.questionCount}. Answer first; checking only happens after the session ends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden min-w-[180px] sm:block">
              <ProgressBar value={completionPercent} />
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-right shadow-[0_18px_45px_-28px_rgba(245,158,11,0.2)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                Time left
              </p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <Clock3 size={14} className={timerTone === "danger" ? "text-danger" : timerTone === "warning" ? "text-warning" : "text-accent"} />
                <span className="text-lg font-semibold text-slate-950">{formatTime(secondsLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
        {currentQuestion ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_340px]">
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200/90 bg-white/88 p-7 shadow-[0_28px_80px_-54px_rgba(80,60,30,0.18)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">
                    <FileText size={12} className="mr-1" />
                    Question {currentIndex + 1}
                  </Badge>
                  <Badge variant={getDifficultyBadgeVariant(currentQuestion)}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="warning">{currentQuestion.marks} marks</Badge>
                  {currentQuestion.paper ? <Badge variant="default">{currentQuestion.paper}</Badge> : null}
                </div>

                <h2 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-950">
                  {currentQuestion.prompt}
                </h2>

                {commandWord ? (
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Command word: <span className="font-medium text-accent">{commandWord.word.toLowerCase()}</span>. {commandWord.guidance}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[32px] border border-indigo-200/80 bg-indigo-50/50 p-7 shadow-[0_24px_70px_-42px_rgba(99,102,241,0.2)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                      Your answer
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Write the full response here. Nothing gets checked until you finish the session.
                    </p>
                  </div>
                  <Badge variant="default">{(answers[currentQuestion.id] ?? "").trim().split(/\s+/).filter(Boolean).length} words</Badge>
                </div>

                <textarea
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion.id]: event.target.value,
                    }))
                  }
                  rows={18}
                  placeholder="Write your exam answer here..."
                  className="mt-5 min-h-[420px] w-full rounded-[28px] border border-slate-200/90 bg-white px-6 py-5 text-[17px] leading-8 text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={14} className="text-success" />
                  {answeredCount} / {session.questionCount} questions answered
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
                    disabled={currentIndex === 0}
                  >
                    Previous
                  </Button>
                  {currentIndex + 1 >= session.questionCount ? (
                    <Button onClick={finishSession}>
                      Finish and check
                      <Trophy size={14} />
                    </Button>
                  ) : (
                    <Button onClick={() => setCurrentIndex((current) => Math.min(session.questionCount - 1, current + 1))}>
                      Save and continue
                      <ArrowRight size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/84 p-5 shadow-[0_18px_45px_-36px_rgba(80,60,30,0.16)] backdrop-blur-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Session focus
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  No hints, no overlay coaching, no checklist reveal. Answer the question as if this were the real paper, then check everything at the end.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-white/84 p-5 shadow-[0_18px_45px_-36px_rgba(80,60,30,0.16)] backdrop-blur-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Session stats
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Questions</span>
                    <span className="font-semibold text-slate-950">{session.questionCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Answered</span>
                    <span className="font-semibold text-slate-950">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Estimated time</span>
                    <span className="font-semibold text-slate-950">{session.estimatedMinutes} min</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
