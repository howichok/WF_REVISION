"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { ActiveLearningLayout } from "@/components/revision/active-learning/active-learning-layout";
import { buildIndexedRailItems } from "@/components/revision/active-learning/rail-builders";
import { TaskContextStrip } from "@/components/revision/active-learning/task-context-strip";
import { TaskFeedbackPanel } from "@/components/revision/active-learning/task-feedback-panel";
import { TaskPanel } from "@/components/revision/active-learning/task-panel";
import { TaskResponsePanel } from "@/components/revision/active-learning/task-response-panel";
import { useAppData } from "@/components/providers/app-data-provider";
import { useAiOverlay } from "@/components/providers/ai-overlay-provider";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { AnswerRipple } from "@/components/ui/answer-ripple";
import { getFilteredQuickQuizQuestionPool, getPracticeSetId } from "@/lib/practice";
import {
  evaluatePracticeShortAnswer,
  getAcceptedAnswerCues,
} from "@/lib/practice-evaluator";
import { extractCommandWord } from "@/lib/command-words";
import { getQuizNextStepRecommendations } from "@/lib/topic-progression";
import { cn } from "@/lib/utils";
import { TOPICS } from "@/lib/types";

type QuickQuizStage = "launcher" | "active" | "results";

type QuickQuizContext =
  | { kind: "mixed" }
  | { kind: "paper"; paperId: "paper-1" | "paper-2" }
  | { kind: "topic"; topicId: string }
  | { kind: "topics"; topicIds: string[] };

interface QuickQuizProps {
  topicId?: string;
  /** When set, the quiz pool is limited to these topics (1..n). */
  topicIds?: string[];
  paperId?: "paper-1" | "paper-2";
  autoStart?: boolean;
  onClose?: () => void;
  onStageChange?: (stage: QuickQuizStage) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const difficultyColor = {
  easy: "text-success bg-success/10 border-success/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  hard: "text-danger bg-danger/10 border-danger/20",
};

const typeIcon = {
  "multiple-choice": Zap,
  "short-answer": MessageSquare,
};

function normalizeContext(
  paperId?: "paper-1" | "paper-2",
  topicId?: string,
  selectedTopicId?: string | null,
  topicIds?: string[]
): QuickQuizContext {
  if (paperId) {
    return { kind: "paper", paperId };
  }

  if (topicIds?.length) {
    return { kind: "topics", topicIds };
  }

  const effectiveTopicId = selectedTopicId ?? topicId;
  if (effectiveTopicId) {
    return { kind: "topic", topicId: effectiveTopicId };
  }

  return { kind: "mixed" };
}

function getRouteMeta(context: QuickQuizContext) {
  if (context.kind === "paper" && context.paperId === "paper-1") {
    return {
      badgeVariant: "paper-1" as const,
      heroVariant: "paper-1" as const,
      taskVariant: "paper-1" as const,
      routeLabel: "Paper 1 route",
      routeTitle: "Test yourself with fast Paper 1 retrieval questions",
      routeFocus: "Simple revision for theory retrieval, terminology, and quick knowledge checks.",
      resultSummary:
        "Use this route for fast correction first, then move into Exam questions when you want full written marking.",
    };
  }

  if (context.kind === "paper" && context.paperId === "paper-2") {
    return {
      badgeVariant: "paper-2" as const,
      heroVariant: "paper-2" as const,
      taskVariant: "paper-2" as const,
      routeLabel: "Paper 2 route",
      routeTitle: "Test yourself with applied Paper 2 prompts",
      routeFocus: "Simple revision for applied scenarios, short written checks, and exam-style thinking before full marking.",
      resultSummary:
        "Use this route to warm up applied reasoning before you switch into Exam questions for a longer marked answer.",
    };
  }

  if (context.kind === "topic") {
    return {
      badgeVariant: "accent" as const,
      heroVariant: "accent" as const,
      taskVariant: "task" as const,
      routeLabel: "Topic quiz",
      routeTitle: "Test yourself inside one topic",
      routeFocus: "Simple revision inside one topic without mixing in unrelated paper prompts.",
      resultSummary:
        "This route is best when you want a tight same-topic score before moving into Exam questions.",
    };
  }

  if (context.kind === "topics") {
    const n = context.topicIds.length;
    return {
      badgeVariant: "accent" as const,
      heroVariant: "accent" as const,
      taskVariant: "task" as const,
      routeLabel: n > 1 ? "Multi-topic quiz" : "Topic quiz",
      routeTitle:
        n > 1 ? `Fast checks across ${n} topics` : "Fast checks for your selected topic",
      routeFocus:
        "Simple revision using only the topics you picked — good for a focused warm-up before deeper practice.",
      resultSummary:
        "When you are ready, open one topic for the full practice hub or switch into Exam questions for timed writing.",
    };
  }

  return {
    badgeVariant: "accent" as const,
    heroVariant: "accent" as const,
    taskVariant: "task" as const,
    routeLabel: "Quick quiz",
    routeTitle: "Test yourself with fast retrieval questions",
    routeFocus: "Simple revision across topics when you want a warm-up before narrowing down.",
    resultSummary:
      "This route is best when you want broad recall before switching into one topic or full Exam questions.",
  };
}

function getPrimaryResultsAction(context: QuickQuizContext) {
  if (context.kind === "topic") {
    return {
      label: "Open topic practice",
      href: `/revision/${context.topicId}/practice`,
    };
  }

  if (context.kind === "topics") {
    return {
      label: "Back to topic list",
      href: "/revision/topics?mode=simple",
    };
  }

  if (context.kind === "paper") {
    return {
      label: "Open topic practice",
      href: "/revision/topics?mode=simple",
    };
  }

  return {
    label: "Start weak-topic practice",
    href: "/revision/weak-areas",
  };
}

function QuickQuizLauncher({
  routeMeta,
  availableTopics,
  lockedTopic,
  lockedTopicCount,
  lockedPaper,
  lockedPaperCount,
  onStart,
}: {
  routeMeta: ReturnType<typeof getRouteMeta>;
  availableTopics: Array<(typeof TOPICS)[number] & { count: number }>;
  lockedTopic: (typeof TOPICS)[number] | null;
  lockedTopicCount: number;
  lockedPaper?: "Paper 1" | "Paper 2";
  lockedPaperCount: number;
  onStart: (topicId?: string | null) => void;
}) {
  if (lockedTopic) {
    return (
      <Card variant="accent" className="rounded-[32px] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              <Sparkles size={12} />
              Topic quiz
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                {lockedTopic.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{lockedTopic.label}</p>
                <p className="text-xs text-muted-foreground">
                  {lockedTopicCount} retrieval questions in this topic
                </p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {routeMeta.routeFocus}
            </p>
          </div>

          <Button size="lg" onClick={() => onStart(lockedTopic.id)}>
            Start topic quiz
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    );
  }

  if (lockedPaper) {
    return (
      <Card variant={routeMeta.heroVariant} className="rounded-[32px] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/85">
              <Zap size={12} />
              {routeMeta.routeLabel}
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{lockedPaper}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {routeMeta.routeFocus}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant={routeMeta.badgeVariant}>{lockedPaperCount} questions</Badge>
            </div>
          </div>

          <Button size="lg" onClick={() => onStart(null)}>
            {lockedPaper === "Paper 1" ? "Start Paper 1 quiz" : "Start Paper 2 quiz"}
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          <Zap size={12} />
          {routeMeta.routeLabel}
        </div>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{routeMeta.routeTitle}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {routeMeta.routeFocus}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onStart(null)}
          className="cursor-pointer rounded-3xl border border-accent/30 bg-accent/10 px-6 py-5 text-left transition-all hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_0_24px_-8px_rgba(139,92,246,0.3)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
              <Sparkles size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">All Topics Mix</p>
              <p className="text-xs text-muted-foreground">
                {getFilteredQuickQuizQuestionPool().length} questions across all topics
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {availableTopics.map((topic) => {
          if (topic.count === 0) {
            return null;
          }

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onStart(topic.id)}
              className="group cursor-pointer rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left transition-all hover:border-accent/20 hover:bg-card/80 hover:shadow-[0_4px_16px_-4px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-lg transition-colors group-hover:border-accent/20">
                    {topic.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                    <p className="text-xs text-muted-foreground">{topic.count} questions</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-muted-foreground transition-colors group-hover:text-accent" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickQuizResults({
  context,
  selectedTopicId,
  progressAnchorTopicId,
  score,
  totalQuestions,
  isSavingProgress,
  saveError,
  onRetry,
  routeMeta,
  primaryRecommendation,
  secondaryRecommendation,
}: {
  context: QuickQuizContext;
  selectedTopicId: string | null;
  /** Topic id used for progress save (e.g. first of a multi-topic set). */
  progressAnchorTopicId?: string | null;
  score: number;
  totalQuestions: number;
  isSavingProgress: boolean;
  saveError: string;
  onRetry: () => void;
  routeMeta: ReturnType<typeof getRouteMeta>;
  primaryRecommendation: ReturnType<typeof getQuizNextStepRecommendations>["primary"];
  secondaryRecommendation: ReturnType<typeof getQuizNextStepRecommendations>["secondary"];
}) {
  const scorePct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const variant = scorePct >= 70 ? "success" : scorePct >= 40 ? "warning" : "danger";
  const topicInfo = selectedTopicId ? TOPICS.find((topic) => topic.id === selectedTopicId) : null;
  const showProgressNote = Boolean(progressAnchorTopicId);
  const primaryAction = getPrimaryResultsAction(context);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6 py-4"
    >
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          <Trophy size={12} />
          Route complete
        </div>
        <h2 className="text-3xl font-bold text-foreground">Quiz complete</h2>
        <p className="mt-2 text-sm text-muted">
          {topicInfo ? `${topicInfo.icon} ${topicInfo.label}` : routeMeta.routeLabel}
        </p>
      </div>

      <Card
        variant={scorePct >= 70 ? "success" : scorePct >= 40 ? "warning" : "danger"}
        className="space-y-5 rounded-[32px] p-6 sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Final score
            </p>
            <div
              className="mt-2 text-5xl font-bold tabular-nums"
              style={{ color: `var(--color-${variant})` }}
            >
              {score}/{totalQuestions}
            </div>
          </div>
          <div className="min-w-[220px] space-y-3">
            <ProgressBar value={scorePct} className="w-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Score</span>
              <span className="font-medium text-foreground">{scorePct}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted">
            {scorePct >= 80
              ? "Strong recall. Move into exam wording or another round."
              : scorePct >= 60
                ? "Solid start. Review the items you missed and run it again."
                : scorePct >= 40
                  ? "Some ideas are there, but the retrieval is still patchy."
                  : "This route needs another repetition cycle before you move on."}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground/85">{routeMeta.resultSummary}</p>
        </div>
      </Card>

      {showProgressNote ? (
        <Card variant="support" className="rounded-3xl px-5 py-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Saved progress
          </p>
          <p className="mt-1 text-sm text-foreground">
            {isSavingProgress
              ? "Saving quiz result..."
              : saveError
                ? saveError
                : context.kind === "topics"
                  ? "Progress is recorded on your first selected topic as a quick anchor; open each topic for full tracking."
                  : "This quiz score has been recorded in your practice progress."}
          </p>
        </Card>
      ) : null}

      {(primaryRecommendation || secondaryRecommendation) && selectedTopicId ? (
        <Card variant="support" className="rounded-3xl px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Same-topic next step
          </p>
          <div className="mt-4 space-y-3">
            {primaryRecommendation ? (
              <Link
                href={primaryRecommendation.href}
                className="block rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3"
              >
                <p className="text-sm font-semibold text-foreground">{primaryRecommendation.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{primaryRecommendation.why}</p>
              </Link>
            ) : null}
            {secondaryRecommendation ? (
              <Link
                href={secondaryRecommendation.href}
                className="block rounded-2xl border border-border bg-card/40 px-4 py-3"
              >
                <p className="text-sm font-semibold text-foreground">{secondaryRecommendation.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{secondaryRecommendation.why}</p>
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="al-action-bar">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw size={14} />
            Try again
          </Button>

          <Link
            href={primaryRecommendation?.href ?? primaryAction.href}
            className="focus-ring inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-accent-soft hover:shadow-lg hover:shadow-accent/20"
          >
            {primaryRecommendation?.label ?? primaryAction.label}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function QuickQuiz({
  topicId,
  topicIds,
  paperId,
  autoStart = false,
  onClose,
  onStageChange,
}: QuickQuizProps) {
  const overlay = useAiOverlay();
  const {
    recordQuizCoaching,
    revisionProgress,
    topicCoachingMemory,
    trackPracticeSetProgress,
  } = useAppData();
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const lockedPaper =
    paperId === "paper-1" ? "Paper 1" : paperId === "paper-2" ? "Paper 2" : undefined;
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topicId ?? null);
  const [quizStarted, setQuizStarted] = useState(autoStart);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [rippleState, setRippleState] = useState<"correct" | "incorrect" | null>(null);

  const context = normalizeContext(paperId, topicId, selectedTopicId, topicIds);
  const routeMeta = getRouteMeta(context);
  const questions = useMemo(() => {
    const pool = getFilteredQuickQuizQuestionPool(
      topicIds?.length
        ? { topicIds, paper: lockedPaper }
        : {
            topicId: selectedTopicId ?? undefined,
            paper: lockedPaper,
          }
    );
    return shuffleArray(pool).slice(0, Math.min(pool.length, 8));
  }, [lockedPaper, selectedTopicId, topicIds]);

  const availableTopics = useMemo(
    () =>
      TOPICS.filter((topic) => topic.id !== "esp").map((topic) => ({
        ...topic,
        count: getFilteredQuickQuizQuestionPool({
          topicId: topic.id,
          paper: lockedPaper,
        }).length,
      })),
    [lockedPaper]
  );

  const currentQuestion = questions[currentIndex];
  const overlayTopicId =
    selectedTopicId ?? currentQuestion?.topicId ?? topicIds?.[0] ?? topicId ?? null;
  const overlayTopicInfo = overlayTopicId
    ? TOPICS.find((topic) => topic.id === overlayTopicId) ?? null
    : null;
  const totalQuestions = questions.length;
  const progressPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentCheck =
    currentQuestion?.type === "short-answer"
      ? evaluatePracticeShortAnswer(typedAnswer, currentQuestion)
      : null;

  const stage: QuickQuizStage = !quizStarted
    ? "launcher"
    : quizFinished
      ? "results"
      : "active";
  const overlaySurfaceId = useMemo(() => {
    if (topicIds?.length) {
      return `quick-quiz-topics-${topicIds.slice().sort().join("-")}`;
    }
    return `quick-quiz-${selectedTopicId ?? topicId ?? paperId ?? "mixed"}`;
  }, [paperId, selectedTopicId, topicId, topicIds]);
  const overlayModeLabel =
    currentQuestion?.type === "short-answer" && stage === "active"
      ? "Quick written check"
      : "Fast Q/A";
  const scorePercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const quizNextSteps = useMemo(
    () =>
      selectedTopicId && stage === "results"
        ? getQuizNextStepRecommendations({
            topicId: selectedTopicId,
            scorePercent,
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          })
        : { primary: null, secondary: null },
    [revisionProgress, scorePercent, selectedTopicId, stage, topicCoachingMemory]
  );

  useEffect(() => {
    onStageChange?.(stage);
  }, [onStageChange, stage]);

  useEffect(() => {
    if (stage === "launcher" || !overlayTopicId) {
      return;
    }

    overlay.registerRevisionSurface({
      surfaceId: overlaySurfaceId,
      topicId: overlayTopicId,
      topicLabel: overlayTopicInfo?.label ?? overlayTopicId,
      modeGroup: "Simple revision",
      modeLabel: overlayModeLabel,
      prompt:
        stage === "results"
          ? "Quiz complete"
          : currentQuestion?.question ?? routeMeta.routeTitle,
      anchorRef: surfaceRef,
    });

    return () => {
      overlay.unregisterRevisionSurface(overlaySurfaceId);
    };
  }, [
    currentQuestion?.question,
    overlay,
    overlayModeLabel,
    overlaySurfaceId,
    overlayTopicId,
    overlayTopicInfo?.label,
    routeMeta.routeTitle,
    stage,
  ]);

  useEffect(() => {
    if (stage === "launcher" || !overlayTopicId) {
      return;
    }

    overlay.syncRevisionSurface({
      surfaceId: overlaySurfaceId,
      prompt:
        stage === "results"
          ? "Quiz complete"
          : currentQuestion?.question ?? routeMeta.routeTitle,
      answer:
        currentQuestion?.type === "short-answer"
          ? typedAnswer
          : selectedAnswer ?? "",
      canUndoEdits: false,
      canClearInsertedCues: false,
    });
  }, [
    currentQuestion?.question,
    currentQuestion?.type,
    overlay,
    overlaySurfaceId,
    overlayTopicId,
    routeMeta.routeTitle,
    selectedAnswer,
    stage,
    typedAnswer,
  ]);

  useEffect(() => {
    if (stage === "launcher" || !overlayTopicId) {
      return;
    }

    overlay.streamRevisionProgress({
      surfaceId: overlaySurfaceId,
      statusLine:
        stage === "results"
          ? "Quiz complete. Use the score to choose the next same-topic task."
          : currentQuestion?.type === "short-answer"
            ? `Quick written check in progress. Question ${currentIndex + 1} of ${totalQuestions}.`
            : `Fast Q/A in progress. Question ${currentIndex + 1} of ${totalQuestions}.`,
      note:
        stage === "active"
          ? currentQuestion?.type === "short-answer"
            ? "This is still Simple revision. Switch to Exam questions when you want a longer marked answer and AI rubric feedback."
            : "Quiz mode keeps the overlay lightweight and uses it for progress and next-step guidance only."
          : undefined,
    });
  }, [currentIndex, currentQuestion?.type, overlay, overlaySurfaceId, overlayTopicId, stage, totalQuestions]);

  useEffect(() => {
    if (!selectedTopicId) {
      return;
    }

    overlay.setSurfaceRecommendations({
      surfaceId: overlaySurfaceId,
      primaryAction: quizNextSteps.primary
        ? {
            label: quizNextSteps.primary.label,
            href: quizNextSteps.primary.href,
            kind: quizNextSteps.primary.actionKind,
          }
        : null,
      secondaryAction: quizNextSteps.secondary
        ? {
            label: quizNextSteps.secondary.label,
            href: quizNextSteps.secondary.href,
            kind: quizNextSteps.secondary.actionKind,
          }
        : null,
    });
  }, [overlay, overlaySurfaceId, quizNextSteps.primary, quizNextSteps.secondary, selectedTopicId]);

  useEffect(() => {
    if (!overlayTopicId || stage !== "results") {
      return;
    }

    overlay.completeGuidedSession({
      surfaceId: overlaySurfaceId,
      phase: scorePercent >= 70 ? "merit" : scorePercent >= 40 ? "ready" : "fail",
      statusLine:
        scorePercent >= 70
          ? "Quiz complete. The next same-topic step can now be harder."
          : scorePercent >= 40
            ? "Quiz complete. Retrieval is partly there, but the topic still needs guided follow-up."
            : "Quiz complete. Stay inside the same topic before jumping to harder written work.",
      note: "Quiz mode keeps the overlay lightweight and routes you to the next best same-topic task.",
      primaryAction: quizNextSteps.primary
        ? {
            label: quizNextSteps.primary.label,
            href: quizNextSteps.primary.href,
            kind: quizNextSteps.primary.actionKind,
          }
        : null,
      secondaryAction: quizNextSteps.secondary
        ? {
            label: quizNextSteps.secondary.label,
            href: quizNextSteps.secondary.href,
            kind: quizNextSteps.secondary.actionKind,
          }
        : null,
    });
  }, [overlay, overlaySurfaceId, overlayTopicId, quizNextSteps.primary, quizNextSteps.secondary, scorePercent, stage]);

  async function persistTopicQuizProgress(finalScore: number, finalTotal: number) {
    const progressTopicId = selectedTopicId ?? topicIds?.[0];
    if (!progressTopicId || finalTotal === 0) {
      return;
    }

    const topicInfo = TOPICS.find((topic) => topic.id === progressTopicId);
    const progressPercent = Math.round((finalScore / finalTotal) * 100);

    setIsSavingProgress(true);
    setSaveError("");

    try {
      await trackPracticeSetProgress({
        practiceSetId: getPracticeSetId(progressTopicId, "quiz"),
        topicId: progressTopicId,
        title: `${topicInfo?.label ?? "Topic"} quick quiz`,
        progressPercent,
        minutesSpent: Math.max(8, finalTotal * 2),
      });
      const recommendations = getQuizNextStepRecommendations({
        topicId: progressTopicId,
        scorePercent: progressPercent,
        revisionProgress,
        coachingMemory: topicCoachingMemory,
      });
      recordQuizCoaching({
        topicId: progressTopicId,
        scorePercent: progressPercent,
        recommendedAction: recommendations.primary?.reasonCode ?? null,
        recommendedHref: recommendations.primary?.href ?? null,
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save quiz progress."
      );
    } finally {
      setIsSavingProgress(false);
    }
  }

  function resetQuestionState() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
    setScore(0);
    setAnsweredCount(0);
    setQuizFinished(false);
    setSaveError("");
  }

  function handleSelectAnswer(answer: string) {
    if (hasSubmitted) {
      return;
    }

    setSelectedAnswer(answer);
  }

  function handleSubmitAnswer() {
    if (!currentQuestion || hasSubmitted) {
      return;
    }

    const isCorrect =
      currentQuestion.type === "short-answer"
        ? evaluatePracticeShortAnswer(typedAnswer, currentQuestion).isCorrect
        : selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setRippleState(isCorrect ? "correct" : "incorrect");
    setHasSubmitted(true);
    setAnsweredCount((prev) => prev + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= totalQuestions) {
      setQuizFinished(true);
      void persistTopicQuizProgress(score, totalQuestions);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setHasSubmitted(false);
    setRippleState(null);
  }

  function restartCurrentQuiz() {
    resetQuestionState();
    setQuizStarted(true);
  }

  function returnToLauncher() {
    resetQuestionState();
    setSelectedTopicId(topicId ?? null);
    setQuizStarted(false);
  }

  function startQuiz(nextTopicId?: string | null) {
    resetQuestionState();
    setSelectedTopicId(nextTopicId ?? null);
    setQuizStarted(true);
  }

  const isCorrect = hasSubmitted
    ? currentQuestion?.type === "short-answer"
      ? currentCheck?.isCorrect
      : selectedAnswer === currentQuestion?.correctAnswer
    : false;

  if (stage === "launcher") {
    if (topicIds?.length) {
      const lockedMultiCount = getFilteredQuickQuizQuestionPool({
        topicIds,
        paper: lockedPaper,
      }).length;
      const topicLabels = topicIds
        .map((id) => TOPICS.find((t) => t.id === id))
        .filter(Boolean) as (typeof TOPICS)[number][];

      return (
        <div ref={surfaceRef}>
          <Card variant="accent" className="rounded-[32px] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                  <Sparkles size={12} />
                  Selected topics
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Quick quiz across {topicIds.length} topic{topicIds.length > 1 ? "s" : ""}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {routeMeta.routeFocus}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topicLabels.map((t) => (
                    <Badge key={t.id} variant="default" className="gap-1.5 py-1.5 pl-2 pr-3">
                      <span aria-hidden>{t.icon}</span>
                      {t.label}
                    </Badge>
                  ))}
                  <Badge variant="accent">{lockedMultiCount} questions in pool</Badge>
                </div>
              </div>
              <Button
                size="lg"
                className="shrink-0 self-start lg:self-center"
                disabled={lockedMultiCount === 0}
                onClick={() => startQuiz(null)}
              >
                Start quick quiz
                <ArrowRight size={14} />
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    const lockedTopic = topicId ? TOPICS.find((topic) => topic.id === topicId) ?? null : null;
    const lockedTopicCount = topicId
      ? getFilteredQuickQuizQuestionPool({ topicId, paper: lockedPaper }).length
      : 0;
    const lockedPaperCount = lockedPaper
      ? getFilteredQuickQuizQuestionPool({ paper: lockedPaper }).length
      : 0;

    return (
      <div ref={surfaceRef}>
        <QuickQuizLauncher
          routeMeta={routeMeta}
          availableTopics={availableTopics}
          lockedTopic={lockedTopic}
          lockedTopicCount={lockedTopicCount}
          lockedPaper={lockedPaper}
          lockedPaperCount={lockedPaperCount}
          onStart={startQuiz}
        />
      </div>
    );
  }

  if (stage === "results") {
    return (
      <div ref={surfaceRef}>
        <QuickQuizResults
          context={context}
          selectedTopicId={selectedTopicId}
          progressAnchorTopicId={selectedTopicId ?? topicIds?.[0] ?? null}
          score={score}
        totalQuestions={totalQuestions}
        isSavingProgress={isSavingProgress}
        saveError={saveError}
        onRetry={restartCurrentQuiz}
        routeMeta={routeMeta}
        primaryRecommendation={quizNextSteps.primary}
        secondaryRecommendation={quizNextSteps.secondary}
      />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <Card variant="support" className="space-y-4 rounded-[28px] px-5 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          No quiz questions are mapped for this route yet.
        </p>
        <div className="flex justify-center">
          <Button variant="outline" onClick={onClose ?? returnToLauncher}>
            {onClose ? "Exit route" : "Back to launcher"}
          </Button>
        </div>
      </Card>
    );
  }
  const TypeIcon = typeIcon[currentQuestion.type];
  const topicInfo = TOPICS.find((topic) => topic.id === currentQuestion.topicId);
  const examQuestionsHref = `/revision/${currentQuestion.topicId}/exam-questions`;
  const acceptedAnswerCues =
    currentQuestion.type === "short-answer"
      ? getAcceptedAnswerCues(currentQuestion)
      : [];
  const shortAnswerTone =
    currentQuestion.type === "short-answer" && currentCheck
      ? currentCheck.verdict === "strong" || currentCheck.verdict === "mostly-correct"
        ? "success"
        : currentCheck.verdict === "partial"
          ? "warning"
          : "danger"
      : isCorrect
        ? "success"
        : "danger";

  const railItems = buildIndexedRailItems(
    questions.map((question, index) => ({
      label: `Question ${index + 1}`,
      meta: question.type === "multiple-choice" ? "MCQ" : "Quick written",
      description:
        index === currentIndex
          ? question.subtopicLabel ?? question.sourceLabel
          : undefined,
    })),
    currentIndex
  );

  return (
    <div ref={surfaceRef}>
      <AnswerRipple state={rippleState} />
      <ActiveLearningLayout
      railTitle={
        context.kind === "paper"
          ? context.paperId === "paper-1"
            ? "Paper 1 practice"
            : "Paper 2 practice"
          : context.kind === "topic"
            ? topicInfo
              ? `${topicInfo.label} quiz`
              : "Topic quiz"
            : context.kind === "topics"
              ? context.topicIds.length > 1
                ? `${context.topicIds.length} topics`
                : "Topic quiz"
              : "Quick quiz"
      }
      railSubtitle={routeMeta.routeFocus}
      railIcon={<TypeIcon size={18} className="text-accent" />}
      railItems={railItems}
      railSummary={[
        { label: "Answered", value: `${answeredCount}/${totalQuestions}` },
        { label: "Correct", value: `${score}`, tone: "accent" },
        { label: "Progress", value: `${progressPct}%`, tone: "default" },
      ]}
      mobileSummaryLabel={routeMeta.routeLabel}
      contextStrip={
        <TaskContextStrip
          eyebrow={routeMeta.routeLabel}
          breadcrumb={
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
              {topicInfo ? (
                <>
                  <span>{topicInfo.icon}</span>
                  <span>{topicInfo.label}</span>
                </>
              ) : (
                <span>{routeMeta.routeTitle}</span>
              )}
              {currentQuestion.subtopicLabel ? (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-muted">{currentQuestion.subtopicLabel}</span>
                </>
              ) : null}
            </div>
          }
          meta={routeMeta.routeFocus}
          status={
            <span className="tabular-nums text-xs font-medium uppercase tracking-[0.18em] text-muted">
              {currentIndex + 1} / {totalQuestions}
            </span>
          }
        >
          <div className="flex flex-wrap gap-2">
            {currentQuestion.paper ? (
              <Badge
                variant={currentQuestion.paper === "Paper 1" ? "paper-1" : "paper-2"}
              >
                {currentQuestion.paper}
              </Badge>
            ) : null}
            <Badge variant="default">
              {currentQuestion.type === "multiple-choice" ? "Fast Q/A" : "Quick written"}
            </Badge>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
                difficultyColor[currentQuestion.difficulty]
              )}
            >
              {currentQuestion.difficulty}
            </span>
          </div>
        </TaskContextStrip>
      }
      task={
        (() => {
          const cw = currentQuestion.type === "short-answer"
            ? extractCommandWord(currentQuestion.question)
            : null;
          return (
            <TaskPanel
              title={currentQuestion.question}
              subtitle={
                currentQuestion.type === "multiple-choice"
                  ? "Choose the option that best fits the prompt."
                  : "Write a short answer in your own words, then compare it with the fast cue-based feedback. This is not the full Exam questions marker."
              }
              commandWord={cw}
            >
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="flex flex-wrap items-center gap-2 border-t border-border pt-4"
              >
                {currentQuestion.sourceLabel ? <Badge variant="default">{currentQuestion.sourceLabel}</Badge> : null}
                <Badge variant="default">
                  {currentQuestion.type === "multiple-choice" ? "Fast check" : "Simple revision"}
                </Badge>
                {currentQuestion.type === "short-answer" ? (
                  <Link
                    href={examQuestionsHref}
                    className="inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning transition-colors hover:bg-warning/15"
                  >
                    Open Exam questions
                    <ArrowRight size={12} />
                  </Link>
                ) : null}
              </motion.div>
            </TaskPanel>
          );
        })()
      }
      response={
        <TaskResponsePanel
          label={currentQuestion.type === "multiple-choice" ? "Your response" : "Quick response"}
          description={
            currentQuestion.type === "multiple-choice"
              ? "Select one option before checking the answer."
              : "Type a short answer for a fast check. Use Exam questions when you want a full written response and AI marking."
          }
        >
          <div className="space-y-3">
            {currentQuestion.type === "short-answer" ? (
              <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
                  Simple revision
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                  This route gives you a quick written check on one idea. For a fuller 6/8/12-mark style answer with AI rubric feedback, switch to Exam questions.
                </p>
                <div className="mt-3">
                  <Link
                    href={examQuestionsHref}
                    className="inline-flex items-center gap-1 text-xs font-medium text-warning hover:text-warning/80"
                  >
                    Open Exam questions
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ) : null}
            {currentQuestion.type === "multiple-choice" &&
              currentQuestion.options?.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const letter = String.fromCharCode(65 + index);

                let borderClass = "border-border hover:border-accent/25";
                let bgClass = "bg-surface/40 hover:bg-card/80";

                if (hasSubmitted) {
                  if (isCorrectOption) {
                    borderClass = "border-success/40";
                    bgClass = "bg-success/10";
                  } else if (isSelected && !isCorrectOption) {
                    borderClass = "border-danger/40";
                    bgClass = "bg-danger/10";
                  } else {
                    borderClass = "border-border/60";
                    bgClass = "bg-surface/20 opacity-65";
                  }
                } else if (isSelected) {
                  borderClass = "border-accent/35";
                  bgClass = "bg-accent/10";
                }

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectAnswer(option)}
                    disabled={hasSubmitted}
                    className={cn(
                      "w-full cursor-pointer rounded-2xl border px-4 py-3.5 text-left transition-all disabled:cursor-default",
                      borderClass,
                      bgClass
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                          hasSubmitted && isCorrectOption
                            ? "bg-success/20 text-success"
                            : hasSubmitted && isSelected && !isCorrectOption
                              ? "bg-danger/20 text-danger"
                              : isSelected
                                ? "bg-accent/20 text-accent"
                                : "bg-border/50 text-muted-foreground"
                        )}
                      >
                        {hasSubmitted && isCorrectOption ? (
                          <CheckCircle2 size={14} />
                        ) : hasSubmitted && isSelected && !isCorrectOption ? (
                          <XCircle size={14} />
                        ) : (
                          letter
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          hasSubmitted && !isCorrectOption && !isSelected
                            ? "text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}

            {currentQuestion.type === "short-answer" ? (
              <textarea
                value={typedAnswer}
                onChange={(event) => {
                  if (!hasSubmitted) {
                    setTypedAnswer(event.target.value);
                  }
                }}
                disabled={hasSubmitted}
                rows={6}
                placeholder="Type your answer here..."
                className={cn(
                  "w-full rounded-3xl border px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-1",
                  hasSubmitted
                    ? isCorrect
                      ? "border-success/40 bg-success/5 focus:ring-success/30"
                      : "border-danger/40 bg-danger/5 focus:ring-danger/30"
                    : "border-border bg-surface/40 focus:border-accent focus:ring-accent/30"
                )}
              />
            ) : null}
          </div>
        </TaskResponsePanel>
      }
      feedback={
        hasSubmitted ? (
          <TaskFeedbackPanel
            tone={shortAnswerTone}
            title={
              currentQuestion.type === "short-answer" && currentCheck
                ? currentCheck.verdictLabel
                : isCorrect
                  ? "Correct"
                  : "Not quite"
            }
            summary={
              currentQuestion.type === "short-answer" && currentCheck
                ? currentCheck.feedback
                : currentQuestion.explanation
            }
          >
            {currentQuestion.type === "short-answer" && currentCheck ? (
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="space-y-2 rounded-2xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Accepted cues
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {acceptedAnswerCues.length > 0 ? (
                      acceptedAnswerCues.slice(0, 6).map((cue) => (
                        <span
                          key={`${currentQuestion.id}-cue-${cue}`}
                          className="rounded-lg border border-border bg-surface/25 px-2.5 py-1 text-[11px] text-foreground/90"
                        >
                          {cue}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No explicit cues listed.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-success/20 bg-success/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Matched ideas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentCheck.matchedSlots.length > 0 ? (
                      currentCheck.matchedSlots.map((slot) => (
                        <span
                          key={`${currentQuestion.id}-matched-${slot}`}
                          className="rounded-lg bg-success/10 px-2.5 py-1 text-[11px] text-success"
                        >
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No rubric slots were clearly covered.</span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "space-y-2 rounded-2xl border p-4",
                    currentCheck.partialSlots.length > 0
                      ? "border-warning/20 bg-warning/5"
                      : "border-danger/20 bg-danger/5"
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Still missing
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...currentCheck.partialSlots, ...currentCheck.missingSlots].length > 0 ? (
                      [...currentCheck.partialSlots, ...currentCheck.missingSlots]
                        .slice(0, 4)
                        .map((slot) => (
                          <span
                            key={`${currentQuestion.id}-missing-${slot}`}
                            className="rounded-lg bg-warning/10 px-2.5 py-1 text-[11px] text-warning"
                          >
                            {slot}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No major gaps were detected.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : currentQuestion.type === "multiple-choice" && !isCorrect ? (
              <div className="rounded-2xl border border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Correct answer
                </p>
                <p className="mt-2 text-sm text-foreground">{currentQuestion.correctAnswer}</p>
              </div>
            ) : null}
          </TaskFeedbackPanel>
        ) : undefined
      }
      primaryAction={
        !hasSubmitted
          ? {
              label: currentQuestion.type === "short-answer" ? "Quick check" : "Check answer",
              onClick: handleSubmitAnswer,
              disabled:
                currentQuestion.type === "short-answer"
                  ? !typedAnswer.trim()
                  : !selectedAnswer,
            }
          : currentIndex + 1 >= totalQuestions
            ? {
                label: "View results",
                onClick: handleNext,
              }
            : {
                label: "Next question",
                onClick: handleNext,
              }
      }
      secondaryAction={
        onClose
          ? {
              label: "Exit route",
              onClick: onClose,
              variant: "ghost",
            }
          : {
              label: "Back to launcher",
              onClick: returnToLauncher,
              variant: "ghost",
            }
      }
      />
    </div>
  );
}

export type { QuickQuizContext, QuickQuizProps, QuickQuizStage };

