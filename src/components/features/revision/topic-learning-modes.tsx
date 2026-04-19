"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { TopicNextSteps } from "@/components/features/revision/topic-next-steps";
import { Badge, Button, Card } from "@/components/ui";
import { extractCommandWord } from "@/lib/command-words";
import {
  getExamDrillNextStepRecommendations,
  getRecallNextStepRecommendations,
  type TopicNextStepRecommendation,
} from "@/lib/topic-progression";
import type { RevisionProgressEntry } from "@/lib/types";
import type {
  PracticeExamDrill,
  PracticeRecallCard,
  PracticeResourceStep,
} from "@/lib/practice";
import { LearningOutcomePanel } from "@/components/features/revision/learning-outcome-panel";
import { ActiveLearningLayout } from "@/components/features/revision/active-learning/active-learning-layout";
import { buildIndexedRailItems } from "@/components/features/revision/active-learning/rail-builders";
import { TaskContextStrip } from "@/components/features/revision/active-learning/task-context-strip";
import { TaskFeedbackPanel } from "@/components/features/revision/active-learning/task-feedback-panel";
import { TaskPanel } from "@/components/features/revision/active-learning/task-panel";
import { TaskResponsePanel } from "@/components/features/revision/active-learning/task-response-panel";

type RecallRating = "again" | "almost" | "got-it";
type ExamRating = "needs-work" | "ready";

const RECALL_SCORES: Record<RecallRating, number> = {
  again: 25,
  almost: 70,
  "got-it": 100,
};

const EXAM_SCORES: Record<ExamRating, number> = {
  "needs-work": 35,
  ready: 100,
};

function getAveragePercent<T extends string>(
  ids: string[],
  ratings: Record<string, T>,
  scoreMap: Record<T, number>
) {
  if (ids.length === 0) {
    return 0;
  }

  const total = ids.reduce((sum, id) => sum + (ratings[id] ? scoreMap[ratings[id]] : 0), 0);
  return Math.round(total / ids.length);
}

function getRatedCount<T extends string>(ratings: Record<string, T>) {
  return Object.keys(ratings).length;
}

function getDrillPointId(drill: PracticeExamDrill) {
  const match =
    drill.questionId.match(/^point-([a-z0-9-]+)-\d+$/i) ??
    drill.id.match(/^exam-drill-point-([a-z0-9-]+)-\d+$/i);

  return match?.[1] ?? null;
}

function findFirstUnratedIndex<T extends { id: string }>(
  items: T[],
  ratings: Record<string, string>
) {
  return items.findIndex((item) => !ratings[item.id]);
}

function toSentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function softenChecklistHint(value: string) {
  return value
    .replace(/^(Explain|Describe|Discuss|Evaluate|Identify|State|Show|Use|Link)\s+(that\s+)?/i, "")
    .replace(/\.$/, "")
    .trim();
}

function getPercentTone(percent: number): "success" | "warning" | "danger" {
  if (percent >= 70) {
    return "success";
  }

  if (percent >= 40) {
    return "warning";
  }

  return "danger";
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
      <AlertCircle size={14} className="shrink-0" />
      {message}
    </div>
  );
}

function ResourceStepCard({
  label,
  title,
  summary,
  kind,
  why,
}: {
  label: string;
  title: string;
  summary: string;
  kind: string;
  why: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/30 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {label}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{summary}</p>
        </div>
        <Badge
          variant={
            kind === "mark-scheme"
              ? "warning"
              : kind === "past-paper" || kind === "question-bank"
                ? "accent"
                : "default"
          }
        >
          {kind.replace("-", " ")}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-muted-foreground/80">{why}</p>
    </div>
  );
}

export function TopicSupportResourcesCard({
  title,
  description,
  resourceSteps,
}: {
  title: string;
  description: string;
  resourceSteps: PracticeResourceStep[];
}) {
  return (
    <Card variant="support" className="p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-accent" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        {resourceSteps.map((step) =>
          step.resource ? (
            <ResourceStepCard
              key={step.id}
              label={step.label}
              title={step.resource.title}
              summary={step.resource.summary}
              kind={step.resource.kind}
              why={step.why}
            />
          ) : (
            <div
              key={step.id}
              className="rounded-2xl border border-dashed border-border bg-surface/20 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {step.label}
              </p>
              <p className="mt-2 text-sm text-foreground">No mapped resource yet</p>
              <p className="mt-2 text-xs text-muted-foreground">{step.why}</p>
            </div>
          )
        )}

        <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-warning" />
            <p className="text-sm font-medium text-foreground">Best next step</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Use support material after you see a real gap, not before you try recalling or planning the answer yourself.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function RecallPanel({
  topicId,
  topicLabel,
  topicIcon,
  cards,
  progressPercent,
  onComplete,
}: {
  topicId: string;
  topicLabel: string;
  topicIcon: string;
  cards: PracticeRecallCard[];
  progressPercent: number;
  onComplete: (percent: number) => Promise<unknown>;
}) {
  const { recordRecallCoaching, revisionProgress, topicCoachingMemory } = useAppData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, RecallRating>>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentCard = cards[currentIndex] ?? null;
  const ratedCount = getRatedCount(ratings);
  const masteryPercent = getAveragePercent(
    cards.map((card) => card.id),
    ratings,
    RECALL_SCORES
  );
  const completedIndexes = cards.flatMap((card, index) =>
    ratings[card.id] ? [index] : []
  );
  const railItems = buildIndexedRailItems(
    cards.map((card) => ({
      label: card.title,
      description:
        card.kind === "term"
          ? "Recall the key term from memory."
          : "Recall the curriculum point before revealing the answer.",
      meta: card.kind === "term" ? "term" : "point",
    })),
    currentIndex,
    completedIndexes
  );
  const railSummary = [
    { label: "Progress", value: `${ratedCount}/${cards.length}`, tone: "accent" as const },
    {
      label: "Mastery",
      value: `${masteryPercent}%`,
      tone: getPercentTone(masteryPercent),
    },
    {
      label: "Saved",
      value: `${progressPercent}%`,
      tone: progressPercent > 0 ? getPercentTone(progressPercent) : "default" as const,
    },
  ];
  const recallNextSteps = useMemo(
    () =>
      sessionComplete
        ? getRecallNextStepRecommendations({
            topicId,
            masteryPercent,
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          })
        : { primary: null, secondary: null },
    [masteryPercent, revisionProgress, sessionComplete, topicCoachingMemory, topicId]
  );

  async function handleRateCard(rating: RecallRating) {
    if (!currentCard) {
      return;
    }

    const nextRatings = {
      ...ratings,
      [currentCard.id]: rating,
    };
    const nextRatedCount = getRatedCount(nextRatings);
    const nextIndex = findFirstUnratedIndex(cards, nextRatings);
    const nextMastery = getAveragePercent(
      cards.map((card) => card.id),
      nextRatings,
      RECALL_SCORES
    );

    setRatings(nextRatings);
    setError("");

    if (nextRatedCount >= cards.length || nextIndex === -1) {
      setSessionComplete(true);
      setRevealed(false);
      setIsSaving(true);

      const recommendations = getRecallNextStepRecommendations({
        topicId,
        masteryPercent: nextMastery,
        revisionProgress,
        coachingMemory: topicCoachingMemory,
      });

      try {
        await onComplete(nextMastery);
        recordRecallCoaching({
          topicId,
          masteryPercent: nextMastery,
          recommendedAction: recommendations.primary?.reasonCode ?? null,
          recommendedHref: recommendations.primary?.href ?? null,
        });
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to save recall progress."
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    setCurrentIndex(nextIndex);
    setRevealed(false);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setRevealed(false);
    setRatings({});
    setSessionComplete(false);
    setIsSaving(false);
    setError("");
  }

  if (cards.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          No structured recall cards are mapped for this topic yet.
        </p>
      </Card>
    );
  }

  if (sessionComplete) {
    return (
      <div>
        <LearningOutcomePanel
        eyebrow="Active Recall"
        title="Recall round complete"
        summary={`You rated ${cards.length} cards. Use the mastery signal to decide whether to move into written answers or repeat the deck.`}
        tone={getPercentTone(masteryPercent)}
        progressLabel="Current mastery"
        progressValue={masteryPercent}
        badges={[
          {
            label:
              masteryPercent >= 70
                ? "Strong recall"
                : masteryPercent >= 40
                  ? "Partial recall"
                  : "Needs repetition",
            variant: getPercentTone(masteryPercent),
          },
        ]}
        primaryAction={
          recallNextSteps.primary?.actionKind === "route"
            ? {
                label: recallNextSteps.primary.label,
                href: recallNextSteps.primary.href,
              }
            : {
                label: "Check this topic against the mark scheme",
                href: `/revision/${topicId}/exam-questions`,
              }
        }
        secondaryAction={
          recallNextSteps.secondary?.actionKind === "route"
            ? {
                label: recallNextSteps.secondary.label,
                href: recallNextSteps.secondary.href,
                variant: "secondary",
              }
            : {
                label: "Run the recall cycle again",
                onClick: handleRestart,
                variant: "secondary",
              }
        }
      >
          <div className="space-y-4">
            {error ? (
              <ErrorMessage message={error} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Use the mastery signal to decide whether you should practise a written answer next or repeat the cards that still felt weak.
              </p>
            )}
            <TopicNextSteps
              primary={recallNextSteps.primary}
              secondary={recallNextSteps.secondary}
              title="Same-topic next step"
            />
          </div>
        </LearningOutcomePanel>
      </div>
    );
  }

  if (!currentCard) {
    return null;
  }

  return (
    <div>
      <ActiveLearningLayout
      backHref={`/revision/${topicId}/practice`}
      railTitle={`${topicLabel} recall`}
      railSubtitle="Recall the idea first, then reveal the model answer and rate what you genuinely knew."
      railIcon={<span className="text-lg">{topicIcon}</span>}
      railItems={railItems}
      railSummary={railSummary}
      mobileSummaryLabel="Recall"
      contextStrip={
        <TaskContextStrip
          eyebrow="Active recall"
          breadcrumb={topicLabel}
          meta={`Card ${currentIndex + 1} of ${cards.length}`}
          status={
            <Badge
              variant={
                progressPercent >= 70
                  ? "success"
                  : progressPercent >= 40
                    ? "warning"
                    : "default"
              }
            >
              Saved {progressPercent}%
            </Badge>
          }
        />
      }
      task={
        <TaskPanel title={currentCard.title} subtitle={currentCard.prompt}>
          {currentCard.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {currentCard.tags.slice(0, 4).map((tag) => (
                <span
                  key={`${currentCard.id}-${tag}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </TaskPanel>
      }
      response={
        <TaskResponsePanel
          label={revealed ? "Reveal and compare" : "Think before you reveal"}
          description={
            revealed
              ? "Compare what you remembered with the model answer, then rate the quality of your recall."
              : "Say the answer aloud or outline it briefly before you reveal the model answer."
          }
        >
          {revealed ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
                  Model answer
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {currentCard.answer}
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Next when you review
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {currentCard.nextStep}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-foreground/90">
                Stop and retrieve the answer from memory before you reveal it. The goal is to test recall, not recognition.
              </p>
              {currentCard.hint ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Hint: {currentCard.hint}
                </p>
              ) : null}
            </div>
          )}
        </TaskResponsePanel>
      }
      feedback={
        revealed ? (
          <TaskFeedbackPanel
            tone="analysis"
            title="Rate the quality of your recall"
            summary="Choose the option that best matches what you knew before you revealed the answer."
          />
        ) : undefined
      }
      primaryAction={
        revealed
          ? {
              label: "I could recall this confidently",
              onClick: () => void handleRateCard("got-it"),
              loading: isSaving,
            }
          : {
              label: "Reveal answer",
              onClick: () => setRevealed(true),
            }
      }
      secondaryAction={
        revealed
          ? {
              label: "Mostly recalled it",
              onClick: () => void handleRateCard("almost"),
              disabled: isSaving,
              variant: "secondary",
            }
          : undefined
      }
      tertiaryAction={
        revealed
          ? {
              label: "Repeat this card",
              onClick: () => void handleRateCard("again"),
              disabled: isSaving,
              variant: "ghost",
            }
          : undefined
      }
      />
    </div>
  );
}

export function ExamDrillPanel({
  topicId,
  topicLabel,
  topicIcon,
  drills,
  progressPercent,
  revisionProgress,
  preferredDrillId,
  onComplete,
}: {
  topicId: string;
  topicLabel: string;
  topicIcon: string;
  drills: PracticeExamDrill[];
  progressPercent: number;
  revisionProgress: RevisionProgressEntry[];
  preferredDrillId?: string;
  onComplete: (percent: number) => Promise<unknown>;
}) {
  const { recordExamDrillCoaching, topicCoachingMemory } = useAppData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [notes, setNotes] = useState("");
  const [ratings, setRatings] = useState<Record<string, ExamRating>>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastRating, setLastRating] = useState<ExamRating | null>(null);

  const currentDrill = drills[currentIndex] ?? null;
  const ratedCount = getRatedCount(ratings);
  const readinessPercent = getAveragePercent(
    drills.map((drill) => drill.id),
    ratings,
    EXAM_SCORES
  );
  const completedIndexes = drills.flatMap((drill, index) =>
    ratings[drill.id] ? [index] : []
  );
  const railItems = buildIndexedRailItems(
    drills.map((drill, index) => ({
      label: drill.title || `Prompt ${index + 1}`,
      description: "Plan your answer before you reveal the checklist.",
      meta: drill.marks ? `${drill.marks}m` : undefined,
    })),
    currentIndex,
    completedIndexes
  );
  const railSummary = [
    { label: "Progress", value: `${ratedCount}/${drills.length}`, tone: "accent" as const },
    {
      label: "Readiness",
      value: `${readinessPercent}%`,
      tone: getPercentTone(readinessPercent),
    },
    {
      label: "Saved",
      value: `${progressPercent}%`,
      tone: progressPercent > 0 ? getPercentTone(progressPercent) : "default" as const,
    },
  ];
  const nextSteps = useMemo(
    () =>
      sessionComplete
        ? getExamDrillNextStepRecommendations({
            topicId,
            drillId: currentDrill?.id ?? preferredDrillId,
            lastRating: lastRating ?? undefined,
            readinessPercent,
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          })
        : { primary: null, secondary: null },
    [currentDrill?.id, lastRating, preferredDrillId, readinessPercent, revisionProgress, sessionComplete, topicCoachingMemory, topicId]
  );

  useEffect(() => {
    if (!preferredDrillId) {
      return;
    }

    const preferredIndex = drills.findIndex((drill) => drill.id === preferredDrillId);
    if (preferredIndex < 0) {
      return;
    }

    setCurrentIndex(preferredIndex);
    setShowChecklist(false);
    setHintLevel(0);
    setNotes("");
    setError("");
    setLastRating(null);
  }, [drills, preferredDrillId]);

  function toLearningAction(
    recommendation: TopicNextStepRecommendation | null,
    variant?: "secondary" | "ghost"
  ) {
    if (!recommendation || recommendation.actionKind !== "route") {
      return undefined;
    }

    return {
      label: recommendation.label,
      href: recommendation.href,
      variant,
    };
  }

  async function handleRateDrill(rating: ExamRating) {
    if (!currentDrill) {
      return;
    }

    const nextRatings = {
      ...ratings,
      [currentDrill.id]: rating,
    };
    const nextRatedCount = getRatedCount(nextRatings);
    const nextIndex = findFirstUnratedIndex(drills, nextRatings);
    const nextReadiness = getAveragePercent(
      drills.map((drill) => drill.id),
      nextRatings,
      EXAM_SCORES
    );

    setRatings(nextRatings);
    setLastRating(rating);
    setNotes("");
    setError("");

    if (nextRatedCount >= drills.length || nextIndex === -1) {
      setSessionComplete(true);
      setShowChecklist(false);
      setIsSaving(true);

      const recommendations = getExamDrillNextStepRecommendations({
        topicId,
        drillId: currentDrill.id,
        lastRating: rating,
        readinessPercent: nextReadiness,
        revisionProgress,
        coachingMemory: topicCoachingMemory,
      });

      try {
        await onComplete(nextReadiness);
        recordExamDrillCoaching({
          topicId,
          drillId: currentDrill.id,
          pointId: getDrillPointId(currentDrill) ?? currentDrill.questionId,
          readinessPercent: nextReadiness,
          rating,
          recommendedAction: recommendations.primary?.reasonCode ?? null,
          recommendedHref: recommendations.primary?.href ?? null,
        });
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to save exam-question planning progress."
        );
      } finally {
        setIsSaving(false);
      }

      return;
    }

    setCurrentIndex(nextIndex);
    setShowChecklist(false);
    setHintLevel(0);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setShowChecklist(false);
    setHintLevel(0);
    setNotes("");
    setRatings({});
    setSessionComplete(false);
    setIsSaving(false);
    setError("");
    setLastRating(null);
  }

  if (drills.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          No mapped exam-question planning prompts are available for this topic yet.
        </p>
      </Card>
    );
  }

  if (sessionComplete) {
    return (
      <LearningOutcomePanel
        eyebrow="Exam questions"
        title="Planning round complete"
        summary={`You worked through ${drills.length} planned exam prompts. Use the readiness signal to decide whether to move into the final written answer or repeat guided planning.`}
        tone={getPercentTone(readinessPercent)}
        progressLabel="Readiness signal"
        progressValue={readinessPercent}
        badges={[
          {
            label:
              readinessPercent >= 70
                ? "Ready for exam wording"
                : readinessPercent >= 40
                  ? "Some gaps remain"
                  : "Needs guided review",
            variant: getPercentTone(readinessPercent),
          },
        ]}
        primaryAction={
          toLearningAction(nextSteps.primary) ?? {
            label: "Check this topic against the mark scheme",
            href: `/revision/${topicId}/exam-questions`,
          }
        }
        secondaryAction={
          toLearningAction(nextSteps.secondary, "secondary") ?? {
            label: "Run another planning round",
            onClick: handleRestart,
            variant: "secondary",
          }
        }
      >
        <div className="space-y-4">
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Use the readiness signal to decide whether to move into the final written answer or spend another round planning exam responses.
            </p>
          )}
          <TopicNextSteps
            primary={nextSteps.primary}
            secondary={nextSteps.secondary}
            title="Same-topic next step"
          />
        </div>
      </LearningOutcomePanel>
    );
  }

  if (!currentDrill) {
    return null;
  }

  const commandWord = extractCommandWord(currentDrill.prompt);
  const hintBullets = [
    commandWord
      ? `Start with the command word: ${commandWord.guidance}`
      : "Plan the answer in a clear order before you write full sentences.",
    currentDrill.marks
      ? `This is a ${currentDrill.marks}-mark style prompt, so aim for ${currentDrill.marks >= 6 ? "multiple developed points" : "two or three clear linked points"}.`
      : "Aim for a few linked points instead of one isolated sentence.",
    ...currentDrill.checklist
      .slice(0, 3)
      .map((item) => `Cover this area: ${softenChecklistHint(item)}.`),
    "Save one line for a consequence, example, trade-off, or impact in context.",
  ];
  const visibleHints = hintBullets.slice(0, Math.min(hintBullets.length, hintLevel));
  const hasMoreHints = hintLevel < hintBullets.length;

  return (
    <div>
      <ActiveLearningLayout
      backHref={`/revision/${topicId}/practice`}
      railTitle={`${topicLabel} exam questions`}
      railSubtitle="Step 1: plan the answer first, then compare it with the checklist and decide whether you are ready for the final written response."
      railIcon={<span className="text-lg">{topicIcon}</span>}
      railItems={railItems}
      railSummary={railSummary}
      mobileSummaryLabel="Exam questions"
      contextStrip={
        <TaskContextStrip
          eyebrow="Exam questions"
          breadcrumb={topicLabel}
          meta={`Prompt ${currentIndex + 1} of ${drills.length}`}
          status={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="default">{currentDrill.sourceLabel}</Badge>
              {currentDrill.marks ? (
                <Badge variant="warning">{currentDrill.marks} marks</Badge>
              ) : null}
            </div>
          }
        />
      }
      task={
        (
          <TaskPanel
            title={currentDrill.title}
            subtitle={currentDrill.prompt}
            commandWord={commandWord}
          />
        )
      }
      response={
        (() => {
          const placeholder = commandWord
            ? `Plan your ${commandWord.word.toLowerCase()} response here...`
            : "Plan your answer here...";
          return (
            <TaskResponsePanel
              label="Plan your answer"
              description="Outline the structure you would use, the key ideas to include, and one example or consequence you would mention before you compare it with the checklist."
            >
              <div className="space-y-3">
                {commandWord ? (
                  <p className="text-xs text-muted-foreground">
                    This question asks you to{" "}
                    <span className="font-medium text-accent">
                      {commandWord.word.toLowerCase()}
                    </span>
                    . {commandWord.guidance}
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
                      ? "Need a planning hint?"
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
                          key={`${currentDrill.id}-${hint}`}
                          className="rounded-2xl border border-warning/15 bg-background/30 px-3 py-3 text-sm text-foreground/90"
                        >
                          {hint}
                        </p>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      These hints are meant to steer your structure and coverage without giving you a ready-made answer.
                    </p>
                  </div>
                ) : null}
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={6}
                  placeholder={placeholder}
                  className="w-full rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </TaskResponsePanel>
          );
        })()
      }
      feedback={
        showChecklist ? (
          <TaskFeedbackPanel
            tone="analysis"
            title="Mark-scheme checklist"
            summary="Use the checklist to self-check your plan. This route helps with planning and self-assessment; it does not give a formal score."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
                  Answer focus
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {currentDrill.answerFocus}
                </p>
              </div>

              <div className="space-y-2">
                {currentDrill.checklist.map((item) => (
                  <div
                    key={`${currentDrill.id}-${item}`}
                    className="rounded-xl border border-border px-3 py-3 text-sm text-foreground/90"
                  >
                    {toSentenceCase(item)}
                  </div>
                ))}
              </div>
            </div>
          </TaskFeedbackPanel>
        ) : undefined
      }
      primaryAction={
        showChecklist
          ? {
              label: "Continue to next exam prompt",
              onClick: () => void handleRateDrill("ready"),
              loading: isSaving,
            }
          : {
              label: "Show mark-scheme checklist",
              onClick: () => setShowChecklist(true),
            }
      }
      secondaryAction={
        showChecklist
          ? {
              label: "Mark for another round",
              onClick: () => void handleRateDrill("needs-work"),
              disabled: isSaving,
              variant: "secondary",
            }
          : undefined
      }
      />
    </div>
  );
}
