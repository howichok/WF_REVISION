"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui";
import { getPracticeQuestionsForTopic } from "@/lib/intelligence/catalog";
import { getTopicPracticeBundle, getPracticeSetId } from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { getTopicPracticeStudioRecommendation } from "@/lib/topic-progression";
import { cn } from "@/lib/utils";

interface TopicPracticeStudioProps {
  topicId: string;
  topicLabel: string;
}

function progressDot(percent: number) {
  if (percent >= 70) return "bg-success";
  if (percent >= 30) return "bg-warning";
  if (percent > 0) return "bg-accent";
  return "bg-border";
}

function buildAnswerCheckHref(topicId: string, questionId?: string) {
  if (!questionId) {
    return `/revision/${topicId}/exam-questions`;
  }

  return `/revision/${topicId}/exam-questions?questionId=${encodeURIComponent(questionId)}`;
}

type StudioLane = "simple" | "exam";

interface StudioLinkItem {
  id: string;
  href: string;
  title: string;
  description: string;
  progress?: number | null;
  suggested?: boolean;
}

function LaneLink({
  item,
}: {
  item: StudioLinkItem;
}) {
  return (
    <Link
      href={item.href}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/15 hover:bg-background"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          {item.suggested ? (
            <Badge variant="accent" className="text-[10px]">
              Suggested
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {typeof item.progress === "number" ? (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${progressDot(item.progress)} ring-4 ring-background`} />
            <span className="text-xs tabular-nums text-muted-foreground">{item.progress}%</span>
          </div>
        ) : null}
        <ArrowRight size={14} className="text-muted-foreground transition-colors group-hover:text-accent" />
      </div>
    </Link>
  );
}

function FocusLaneCard({
  lane,
  title,
  description,
  statLabel,
  statValue,
  icon,
  featured,
  secondary,
  items,
  recommended,
}: {
  lane: StudioLane;
  title: string;
  description: string;
  statLabel: string;
  statValue: string;
  icon: ReactNode;
  featured: StudioLinkItem;
  secondary?: StudioLinkItem | null;
  items: StudioLinkItem[];
  recommended: boolean;
}) {
  const isExamLane = lane === "exam";

  return (
    <div
      className={
        isExamLane
          ? "rounded-[2rem] border border-warning/25 bg-gradient-to-br from-warning/15 via-card to-background p-5 shadow-[0_24px_58px_-36px_rgba(245,158,11,0.28)]"
          : "rounded-[2rem] border border-accent/20 bg-gradient-to-br from-accent/14 via-card to-background p-5 shadow-[0_24px_58px_-36px_rgba(139,92,246,0.26)]"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl border shadow-inner",
                isExamLane
                  ? "border-warning/20 bg-warning/15 text-warning"
                  : "border-accent/20 bg-accent/15 text-accent"
              )}
            >
              {icon}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-foreground">{title}</p>
              {recommended ? <Badge variant="accent">Recommended</Badge> : null}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border px-3 py-2 text-right shadow-sm",
            isExamLane ? "border-warning/20 bg-warning/10" : "border-accent/20 bg-accent/10"
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {statLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{statValue}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-border/70 bg-background/72 p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Start here
        </p>
        <Link
          href={featured.href}
          className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/15 hover:bg-background"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{featured.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {featured.description}
            </p>
          </div>
          <ArrowRight size={16} className="mt-0.5 shrink-0 text-accent" />
        </Link>

        {secondary ? (
          <Link
            href={secondary.href}
            className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/90 hover:bg-background"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{secondary.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {secondary.description}
              </p>
            </div>
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-accent" />
          </Link>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Inside this mode
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <LaneLink key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TopicPracticeStudio({
  topicId,
  topicLabel,
}: TopicPracticeStudioProps) {
  const { revisionProgress, topicCoachingMemory, sharedCurriculum } = useAppData();
  const bundle = getTopicPracticeBundle(topicId, sharedCurriculum);
  const topicQuestions = getPracticeQuestionsForTopic(topicId);
  const recallProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "recall"))
      ?.progressPercent ?? 0;
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "exam-drill"))
      ?.progressPercent ?? 0;
  const quizProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "quiz"))
      ?.progressPercent ?? 0;

  const practiceRecommendation = getTopicPracticeStudioRecommendation(
    topicId,
    revisionProgress,
    topicCoachingMemory
  );
  const suggested = practiceRecommendation.suggestedMode;
  const highestMarkQuestion =
    [...topicQuestions].sort((left, right) => right.maxScore - left.maxScore)[0] ?? null;
  const finalAnswerHref = buildAnswerCheckHref(topicId, highestMarkQuestion?.id);

  const simpleItems: StudioLinkItem[] = [
    {
      id: "recall",
      href: `/revision/${topicId}/recall`,
      title: "Recall cards",
      description: `Retrieve ${bundle.recallCards.length} terms and points before you look at the answers.`,
      progress: recallProgress,
      suggested: suggested === "recall" || suggested === "ask",
    },
    {
      id: "quiz",
      href: `/revision/${topicId}/quiz`,
      title: "Quick Q/A",
      description: `${bundle.quizQuestions.length} fast checks, including short written prompts where needed.`,
      progress: quizProgress,
      suggested: suggested === "quiz",
    },
  ];

  const examItems: StudioLinkItem[] = [
    {
      id: "exam-questions",
      href: `${finalAnswerHref}${finalAnswerHref.includes("?") ? "&" : "?"}autoStart=1`,
      title: "Launch exam questions",
      description: `Timed full-screen session with ${bundle.examDrills.length} possible prompts, one question on screen, and marking at the end.`,
      progress: examProgress,
      suggested: suggested === "exam-drill" || suggested === "answer-check",
    },
  ];

  const simpleSuggestedId = suggested === "ask" ? "recall" : suggested;
  const simpleFeatured =
    simpleItems.find((item) => item.id === simpleSuggestedId) ?? simpleItems[0];
  const examFeatured =
    examItems.find((item) => item.id === suggested) ?? examItems[0];
  const simpleSecondary = simpleItems.find((item) => item.id !== simpleFeatured.id) ?? null;
  const examSecondary = null;
  const simpleRecommended = suggested === "ask" || suggested === "recall" || suggested === "quiz";
  const examRecommended = suggested === "exam-drill" || suggested === "answer-check";
  const avgSimpleProgress = Math.round((recallProgress + quizProgress) / 2);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-background/80 p-5 shadow-[0_18px_52px_-36px_rgba(15,23,42,0.3)] sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">Two clear modes</Badge>
          <Badge variant="default">{topicLabel}</Badge>
        </div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Practice {topicLabel}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The whole topic now splits into two routes.{" "}
              <span className="font-medium text-foreground">Simple revision</span> is for recall
              and fast Q/A.{" "}
              <span className="font-medium text-foreground">Exam questions</span> is for
              a timed paper-style run: several prompts, then AI marking once you finish.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Suggested next move
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{practiceRecommendation.why}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FocusLaneCard
          lane="simple"
          title="Simple revision"
          description="Quick questions and retrieval when you are still learning or warming up the topic."
          statLabel="Revision signal"
          statValue={`${avgSimpleProgress}%`}
          icon={<Search size={18} className="text-accent" />}
          featured={simpleFeatured}
          secondary={simpleSecondary}
          items={simpleItems}
          recommended={simpleRecommended}
        />

        <FocusLaneCard
          lane="exam"
          title="Exam questions"
          description="Full-screen timed session: paper-style questions one at a time, rubric marking only when the paper is done (or time runs out)."
          statLabel="Exam route"
          statValue={highestMarkQuestion ? `${highestMarkQuestion.maxScore}-mark finish` : `${examProgress}% ready`}
          icon={<ClipboardList size={18} className="text-warning" />}
          featured={examFeatured}
          secondary={examSecondary}
          items={examItems}
          recommended={examRecommended}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BrainCircuit size={15} className="text-accent" />
            <p className="text-sm font-semibold text-foreground">When to stay in Simple revision</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Stay here when you are still learning the concept, mixing up definitions, or only need quick Q/A without full marking pressure.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-warning" />
            <p className="text-sm font-semibold text-foreground">When to use Exam questions</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Use this when you are ready for exam-style pressure: timer on, several questions in sequence, and full marking at the end—not quick Q/A hints.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-background/75 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-success" />
            <p className="text-sm font-semibold text-foreground">Best exam finish</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {highestMarkQuestion
              ? `Your current longest mapped finish in this topic is a ${highestMarkQuestion.maxScore}-mark written answer.`
              : "Open the written-answer route to finish with a full response even when a long-mark prompt is not yet mapped."}
          </p>
        </div>
      </div>
    </div>
  );
}
