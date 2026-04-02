"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
}: ExamConditionsWorkspaceProps) {
  const overlay = useAiOverlay();
  const { sharedCurriculum } = useAppData();
  const [session, setSession] = useState<ExamConditionsSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExamConditionsSessionResult | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

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

  useEffect(() => {
    const shouldSuppress = Boolean(session);
    overlay.setOverlaySuppressed(shouldSuppress);

    return () => {
      overlay.setOverlaySuppressed(false);
    };
  }, [overlay, session]);

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

  function startSession() {
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

  function resetSession() {
    setSession(null);
    setAnswers({});
    setCurrentIndex(0);
    setResults(null);
    setStartedAt(null);
    setSecondsLeft(0);
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
      <div className="space-y-6">
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
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              This mode strips the topic page back to the essentials: timer, question, answer box, then one end-of-session AI check across the full paper run.
            </p>
          </div>
        </div>

        <Card variant="warning" className="rounded-[28px] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="warning">Real exam flow</Badge>
                <Badge variant="default">Random 10-20 questions</Badge>
                {preferredQuestionId ? <Badge variant="accent">Pinned first prompt</Badge> : null}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                One clean session, then the checker runs at the end
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>When the session starts, the extra interface gets out of the way and you only see the timer, the current question, and the answer area.</p>
                <p>The question count is random between 10 and 20. Fewer questions creates a harder overall mix; more questions creates a broader and easier spread.</p>
                <p>You answer first. The AI-style checker only runs after you finish or the timer expires.</p>
              </div>
            </div>

            <div className="min-w-[240px] rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Next generated session
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Questions</span>
                  <span className="text-sm font-semibold text-foreground">{previewSession.questionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Timer</span>
                  <span className="text-sm font-semibold text-foreground">{previewSession.estimatedMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Finish</span>
                  <span className="text-sm font-semibold text-foreground">
                    {previewSession.questions.at(-1)?.difficulty === "hard" ? "Hard end" : "Mixed end"}
                  </span>
                </div>
              </div>
              <Button className="mt-5 w-full" onClick={startSession}>
                <AlarmClock size={14} />
                Start exam conditions
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">
              Exam conditions complete
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
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

        <Card variant={results.scorePercent >= 70 ? "success" : results.scorePercent >= 40 ? "warning" : "danger"} className="rounded-[28px] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Session result
              </p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {results.totalScore}/{results.totalMaxScore}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {results.answeredCount}/{session.questionCount} questions answered
              </p>
            </div>
            <div className="min-w-[220px] space-y-3">
              <ProgressBar value={results.scorePercent} className="w-full" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall score</span>
                <span className="font-medium text-foreground">{results.scorePercent}%</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {results.reviews.map((review, index) => (
            <Card key={review.question.id} variant="task" className="rounded-[24px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">Question {index + 1}</Badge>
                    <Badge variant="warning">{review.maxScore} marks</Badge>
                    <Badge variant={getDifficultyBadgeVariant(review.question)}>
                      {review.question.difficulty}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-foreground">{review.question.prompt}</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Score
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {review.score}/{review.maxScore}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card/40 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Your answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {review.answer.trim() || "No answer submitted."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/40 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Checker feedback
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
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
    <div className="min-h-[calc(100vh-7rem)] bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={finishSession}>
                Finish now
              </Button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">
                  Exam conditions
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Question {currentIndex + 1} of {session.questionCount}. Answer first; checking only happens after the session ends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden min-w-[160px] sm:block">
              <ProgressBar value={completionPercent} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Time left
              </p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <Clock3 size={14} className={timerTone === "danger" ? "text-danger" : timerTone === "warning" ? "text-warning" : "text-accent"} />
                <span className="text-lg font-semibold text-foreground">{formatTime(secondsLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {currentQuestion ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-border bg-card/50 p-6 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.65)]">
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

              <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground">
                {currentQuestion.prompt}
              </h2>

              {commandWord ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Command word: <span className="font-medium text-accent">{commandWord.word.toLowerCase()}</span>. {commandWord.guidance}
                </p>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-accent/20 bg-accent/[0.04] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Your answer
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
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
                rows={16}
                placeholder="Write your exam answer here..."
                className="mt-5 min-h-[320px] w-full rounded-[24px] border border-border bg-background/80 px-5 py-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/55 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        ) : null}
      </div>
    </div>
  );
}
