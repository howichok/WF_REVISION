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
    return `/revision/${topicId}/exam-conditions`;
  }

  return `/revision/${topicId}/exam-conditions?questionId=${encodeURIComponent(questionId)}`;
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
      className="group flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]"
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
            <span className={`h-2 w-2 rounded-full ${progressDot(item.progress)}`} />
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
  return (
    <div
      className={
        lane === "exam"
          ? "rounded-[28px] border border-warning/20 bg-warning/10 p-5 shadow-[0_18px_50px_-32px_rgba(245,158,11,0.38)]"
          : "rounded-[28px] border border-accent/20 bg-accent/10 p-5 shadow-[0_18px_50px_-32px_rgba(139,92,246,0.38)]"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-foreground">
              {icon}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-foreground">{title}</p>
              {recommended ? <Badge variant="accent">Recommended</Badge> : null}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {statLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{statValue}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-black/18 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Start here
        </p>
        <Link
          href={featured.href}
          className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition-colors hover:bg-white/[0.05]"
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
            className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition-colors hover:bg-white/[0.05]"
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
      id: "ask",
      href: `/revision/${topicId}/ask`,
      title: "Ask coach",
      description: "Use AI for hints, short explanations, official sources, or the next question.",
      suggested: suggested === "ask",
    },
    {
      id: "recall",
      href: `/revision/${topicId}/recall`,
      title: "Recall cards",
      description: `Retrieve ${bundle.recallCards.length} terms and points before you look at the answers.`,
      progress: recallProgress,
      suggested: suggested === "recall",
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
      id: "exam-conditions",
      href: `${finalAnswerHref}${finalAnswerHref.includes("?") ? "&" : "?"}autoStart=1`,
      title: "Launch exam conditions",
      description: `Start a separate timed session with ${bundle.examDrills.length} possible prompts, one question on screen, and end-of-session marking.`,
      progress: examProgress,
      suggested: suggested === "exam-drill" || suggested === "answer-check",
    },
  ];

  const simpleFeatured =
    simpleItems.find((item) => item.id === suggested) ?? simpleItems[0];
  const examFeatured =
    examItems.find((item) => item.id === suggested) ?? examItems[0];
  const simpleSecondary = simpleItems.find((item) => item.id !== simpleFeatured.id) ?? null;
  const examSecondary = null;
  const simpleRecommended = suggested === "ask" || suggested === "recall" || suggested === "quiz";
  const examRecommended = suggested === "exam-drill" || suggested === "answer-check";
  const avgSimpleProgress = Math.round((recallProgress + quizProgress) / 2);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">Two clear modes</Badge>
          <Badge variant="default">{topicLabel}</Badge>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Practice {topicLabel}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The whole topic now splits into two routes. <span className="font-medium text-foreground">Simple revision</span> is for fast Q/A, recall, and short explanations. <span className="font-medium text-foreground">Exam conditions</span> is for planning and then finishing with one fuller written answer that the AI checks.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{practiceRecommendation.why}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FocusLaneCard
          lane="simple"
          title="Simple revision"
          description="Quick questions, retrieval, and short AI help when you are still learning or warming up the topic."
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
          title="Exam conditions"
          description="A separate full-screen exam feature with timer, one question at a time, and final checking only at the end."
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
        <div className="rounded-2xl border border-border bg-card/40 px-4 py-4">
          <div className="flex items-center gap-2">
            <BrainCircuit size={15} className="text-accent" />
            <p className="text-sm font-semibold text-foreground">When to stay in Simple revision</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Stay here when you are still learning the concept, mixing up definitions, or only need quick Q/A without full marking pressure.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-warning" />
            <p className="text-sm font-semibold text-foreground">When to switch to Exam conditions</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Switch once you can explain the core idea and want a timed one-question-at-a-time session instead of guided revision widgets.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 px-4 py-4">
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
