"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { ActiveLearningLayout } from "@/components/revision/active-learning/active-learning-layout";
import { buildLinearRailItems } from "@/components/revision/active-learning/rail-builders";
import { TaskContextStrip } from "@/components/revision/active-learning/task-context-strip";
import { TaskFeedbackPanel } from "@/components/revision/active-learning/task-feedback-panel";
import { TaskPanel } from "@/components/revision/active-learning/task-panel";
import { TaskResponsePanel } from "@/components/revision/active-learning/task-response-panel";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { extractCommandWord } from "@/lib/command-words";
import {
  getPracticeQuestionForTopic,
  getPracticeQuestionsForTopic,
} from "@/lib/intelligence/catalog";
import type { RevisionAnswerEvaluation } from "@/lib/intelligence/types";

interface WrittenAnswerCheckerProps {
  topicId: string;
  topicLabel: string;
  topicIcon?: string;
}

function getScoreTone(scorePercent: number) {
  if (scorePercent >= 70) {
    return "success" as const;
  }

  if (scorePercent >= 40) {
    return "warning" as const;
  }

  return "danger" as const;
}

function softenHint(value: string) {
  const cleaned = value
    .replace(/^(Explain|Describe|Discuss|Evaluate|Identify|State|Show|Link|Use)\s+(that\s+)?/i, "")
    .replace(/\.$/, "")
    .trim();

  if (!cleaned) {
    return value.trim();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function WrittenAnswerChecker({
  topicId,
  topicLabel,
  topicIcon,
}: WrittenAnswerCheckerProps) {
  const availableQuestions = useMemo(() => getPracticeQuestionsForTopic(topicId), [topicId]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = useMemo(
    () => getPracticeQuestionForTopic(topicId, questionIndex),
    [topicId, questionIndex]
  );
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<RevisionAnswerEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDirtySinceLastCheck, setIsDirtySinceLastCheck] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  useEffect(() => {
    setQuestionIndex(0);
  }, [topicId]);

  useEffect(() => {
    setAnswer("");
    setResult(null);
    setError("");
    setIsDirtySinceLastCheck(false);
    setHintLevel(0);
  }, [question?.id]);

  async function handleEvaluate() {
    if (!question || !answer.trim()) {
      setError("Write a short answer before running the checker.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/intelligence/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "revision-answer",
          questionId: question.id,
          answer,
        }),
      });

      const payload = (await response.json()) as
        | RevisionAnswerEvaluation
        | { error?: string };
      const errorMessage = "error" in payload ? payload.error : undefined;

      if (!response.ok || errorMessage) {
        throw new Error(errorMessage ?? "Unable to evaluate the answer right now.");
      }

      setResult(payload as RevisionAnswerEvaluation);
      setIsDirtySinceLastCheck(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to evaluate the answer right now."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoadAnotherQuestion() {
    if (availableQuestions.length <= 1) {
      return;
    }

    setQuestionIndex((current) => (current + 1) % availableQuestions.length);
  }

  if (!question) {
    return (
      <div className="py-12 text-center">
        <ClipboardList
          size={40}
          className="mx-auto mb-3 text-muted-foreground opacity-50"
        />
        <p className="mb-2 text-sm text-muted-foreground">
          Structured written checks are being prepared for {topicLabel}.
        </p>
        <p className="text-xs text-muted-foreground/70">
          The intelligence engine is ready, but this topic does not have a public practice prompt yet.
        </p>
      </div>
    );
  }

  const scorePercent = result
    ? Math.round((result.score / result.maxScore) * 100)
    : 0;
  const scoreTone = getScoreTone(scorePercent);
  const stageLabel = result ? "Analysis" : "Response";
  const railItems = buildLinearRailItems(
    [
      {
        id: "prompt",
        label: "Prompt",
        description: "Read the written-response question carefully.",
      },
      {
        id: "response",
        label: "Response",
        description: "Write your answer before checking it.",
      },
      {
        id: "analysis",
        label: "Analysis",
        description: "Review your score, gaps, and misconceptions.",
      },
    ],
    result ? "analysis" : "response",
    result ? ["prompt", "response"] : ["prompt"]
  );

  const railSummary = result
    ? [
        { label: "Marks", value: `${result.score}/${result.maxScore}` },
        {
          label: "Confidence",
          value: `${Math.round(result.confidence * 100)}%`,
          tone: "accent" as const,
        },
        {
          label: "Coverage",
          value: `${result.matchedConcepts.length}/${result.conceptBreakdown.length}`,
          tone: scoreTone,
        },
      ]
    : [{ label: "Marks", value: `${question.maxScore}` }];

  const feedbackTone = result
    ? isDirtySinceLastCheck
      ? "warning"
      : scoreTone
    : "analysis";
  const commandWord = extractCommandWord(question.prompt);
  const hintBullets = [
    commandWord
      ? `Start with the command word: ${commandWord.guidance}`
      : "Start with a direct point, then explain it and link it to the scenario.",
    ...question.rubricSummary.map((line) => `Cover this area: ${softenHint(line)}.`),
    "Finish with a consequence, example, or impact sentence so the answer feels applied rather than generic.",
  ];
  const visibleHints = hintBullets.slice(0, Math.min(hintBullets.length, hintLevel));
  const hasMoreHints = hintLevel < hintBullets.length;

  return (
    <ActiveLearningLayout
      backHref={`/revision/${topicId}/practice`}
      railTitle={`${topicLabel} answer check`}
      railSubtitle="Structured written response against the deterministic mark-scheme checker."
      railIcon={
        <span className="flex items-center gap-2 text-foreground">
          {topicIcon ? <span className="text-lg leading-none">{topicIcon}</span> : null}
          <BrainCircuit size={18} className="text-accent" />
        </span>
      }
      railItems={railItems}
      railSummary={railSummary}
      mobileSummaryLabel="Answer check"
      contextStrip={
        <TaskContextStrip
          eyebrow="Answer Check"
          breadcrumb={
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
              {topicIcon ? <span>{topicIcon}</span> : null}
              <span>{topicLabel}</span>
              {question.subtopicId ? (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-muted">{question.subtopicId}</span>
                </>
              ) : null}
            </div>
          }
          meta="Compare your written explanation against the deterministic rubric checker."
          status={
            <span className="tabular-nums text-xs font-medium uppercase tracking-[0.18em] text-muted">
              {stageLabel}
            </span>
          }
        >
          <div className="flex flex-wrap gap-2">
            {availableQuestions.length > 1 ? (
              <Badge variant="default">
                Prompt {questionIndex + 1} of {availableQuestions.length}
              </Badge>
            ) : null}
            <Badge variant="accent">{question.maxScore} marks</Badge>
            <Badge variant="default">Written response</Badge>
          </div>
        </TaskContextStrip>
      }
      task={
        (
          <TaskPanel
            title={question.prompt}
            subtitle="Write a short structured answer. The checker looks for the key ideas, how clearly you explain them, and how well you link them to the scenario."
            commandWord={commandWord}
          />
        )
      }
      response={
        (() => {
          const placeholder = commandWord
            ? `Write your ${commandWord.word.toLowerCase()} response here. Mention the concept, ${commandWord.guidance.charAt(0).toLowerCase()}${commandWord.guidance.slice(1)}`
            : "Write a short structured answer. Mention the concept, explain it, and link it to the scenario.";
          return (
            <TaskResponsePanel
              label="Your response"
              description="Type your answer first, then run the checker to see score, matched ideas, missing concepts, and misconceptions."
            >
              <div className="space-y-3">
                {commandWord ? (
                  <p className="text-xs text-muted-foreground">
                    This question asks you to{" "}
                    <span className="font-medium text-accent">
                      {commandWord.word.toLowerCase()}
                    </span>
                    . {commandWord.guidance.charAt(0).toLowerCase()}
                    {commandWord.guidance.slice(1)}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setHintLevel((current) =>
                        current < hintBullets.length ? current + 1 : current
                      )
                    }
                    disabled={!hasMoreHints}
                  >
                    <Lightbulb size={14} />
                    {hintLevel === 0
                      ? "Need a hint?"
                      : hasMoreHints
                        ? "Show a stronger hint"
                        : "All hints shown"}
                  </Button>
                  {hintLevel > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setHintLevel(0)}
                    >
                      Hide hints
                    </Button>
                  ) : null}
                </div>
                {visibleHints.length > 0 ? (
                  <div className="rounded-3xl border border-warning/20 bg-warning/5 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
                      <Lightbulb size={12} />
                      Scaffold only
                    </div>
                    <div className="mt-3 space-y-2">
                      {visibleHints.map((hint) => (
                        <p
                          key={`${question.id}-${hint}`}
                          className="rounded-2xl border border-warning/15 bg-background/30 px-3 py-3 text-sm text-foreground/90"
                        >
                          {hint}
                        </p>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      These hints are designed to nudge your structure and coverage, not give you a ready-made answer.
                    </p>
                  </div>
                ) : null}
                <textarea
                  id={`written-answer-${question.id}`}
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setError("");
                    if (result) {
                      setIsDirtySinceLastCheck(true);
                    }
                  }}
                  rows={8}
                  placeholder={placeholder}
                  className="min-h-[220px] w-full rounded-3xl border border-border bg-surface/40 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />

            <div className="flex flex-col gap-2 text-xs">
              {error ? (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              ) : isDirtySinceLastCheck ? (
                <p className="text-warning">
                  Your answer changed after the last check. Run it again to refresh the analysis.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  The current engine is explainable and deterministic. It is not using a hosted AI model.
                </p>
              )}
              <p className="text-muted-foreground/70">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          </div>
        </TaskResponsePanel>
          );
        })()
      }
      feedback={
        result ? (
          <TaskFeedbackPanel
            tone={feedbackTone}
            title="Analytical result"
            summary={
              isDirtySinceLastCheck
                ? "The analysis below is from your previous check. Run it again to refresh the score and concept coverage."
                : result.feedback
            }
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-3 rounded-3xl border border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Score summary
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl font-semibold text-foreground">
                    {result.score}/{result.maxScore}
                  </span>
                  <Badge variant={scoreTone}>{scorePercent}%</Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.feedback}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Confidence
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {Math.round(result.confidence * 100)}%
                  </p>
                  <ProgressBar
                    value={Math.round(result.confidence * 100)}
                    size="sm"
                    className="mt-3"
                    color={
                      scoreTone === "danger"
                        ? "danger"
                        : scoreTone === "warning"
                          ? "warning"
                          : "success"
                    }
                  />
                </div>

                <div className="rounded-3xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Coverage
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.matchedConcepts.length}/{result.conceptBreakdown.length}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    concepts clearly matched
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <section className="rounded-3xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles size={12} className="text-success" />
                  Matched ideas
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.matchedConcepts.length > 0 ? (
                    result.matchedConcepts.map((concept) => (
                      <Badge key={concept} variant="success">
                        {concept}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No clear mark-scheme matches yet.
                    </span>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Target size={12} className="text-warning" />
                  Still missing
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.missingConcepts.length > 0 ? (
                    result.missingConcepts.map((concept) => (
                      <Badge key={concept} variant="warning">
                        {concept}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No major gaps detected.
                    </span>
                  )}
                </div>
              </section>

              <section
                className={
                  result.misconceptions.length > 0
                    ? "rounded-3xl border border-danger/20 bg-danger/5 p-4"
                    : "rounded-3xl border border-border p-4"
                }
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <AlertCircle
                    size={12}
                    className={
                      result.misconceptions.length > 0 ? "text-danger" : "text-muted-foreground"
                    }
                  />
                  Misconceptions
                </div>
                <div className="mt-3 space-y-2">
                  {result.misconceptionBreakdown.length > 0 ? (
                    result.misconceptionBreakdown.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border p-3"
                      >
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.explanation}
                        </p>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No flagged misconception signals.
                    </span>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-3xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Concept breakdown
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    See how each marking idea was scored instead of treating the result like one opaque number.
                  </p>
                </div>
                <Badge variant="default">{result.conceptBreakdown.length} concepts</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {result.conceptBreakdown.map((concept) => {
                  const tone =
                    concept.coverage >= 0.9
                      ? "success"
                      : concept.coverage > 0
                        ? "warning"
                        : "danger";

                  return (
                    <div
                      key={concept.id}
                      className="rounded-3xl border border-border p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {concept.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {concept.scoreAwarded}/{concept.maxScore} marks
                            </p>
                          </div>

                          {concept.matchedEvidence.length > 0 ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Evidence found
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {concept.matchedEvidence.map((evidence) => (
                                  <span
                                    key={`${concept.id}-${evidence}`}
                                    className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-foreground/90"
                                  >
                                    {evidence}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {concept.missingEvidence.length > 0 ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                Still missing
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {concept.missingEvidence.slice(0, 3).map((evidence) => (
                                  <span
                                    key={`${concept.id}-missing-${evidence}`}
                                    className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                                  >
                                    {evidence}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-[180px] space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Coverage</span>
                            <span>{Math.round(concept.coverage * 100)}%</span>
                          </div>
                          <ProgressBar
                            value={Math.round(concept.coverage * 100)}
                            size="sm"
                            color={
                              tone === "danger"
                                ? "danger"
                                : tone === "warning"
                                  ? "warning"
                                  : "success"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </TaskFeedbackPanel>
        ) : undefined
      }
      primaryAction={{
        label: result ? "Check revised answer" : "Check answer against mark scheme",
        onClick: () => void handleEvaluate(),
        loading: isLoading,
        disabled: !answer.trim(),
      }}
      secondaryAction={
        availableQuestions.length > 1
          ? {
              label: "Try another question",
              onClick: handleLoadAnotherQuestion,
              variant: "secondary",
            }
          : {
              label: "Open topic resources",
              href: `/revision/${topicId}/resources`,
              variant: "ghost",
            }
      }
      tertiaryAction={
        availableQuestions.length > 1
          ? {
              label: "Open topic resources",
              href: `/revision/${topicId}/resources`,
              variant: "ghost",
            }
          : undefined
      }
    />
  );
}
