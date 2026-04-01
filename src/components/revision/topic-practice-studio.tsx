"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, ClipboardList, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui";
import { getPracticeSetId, getTopicPracticeBundle } from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { useAppData } from "@/components/providers/app-data-provider";

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

export function TopicPracticeStudio({
  topicId,
  topicLabel,
}: TopicPracticeStudioProps) {
  const { revisionProgress } = useAppData();
  const bundle = getTopicPracticeBundle(topicId);
  const recallProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "recall"))
      ?.progressPercent ?? 0;
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "exam-drill"))
      ?.progressPercent ?? 0;
  const quizProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "quiz"))
      ?.progressPercent ?? 0;

  const suggested =
    recallProgress < 30
      ? "recall"
      : examProgress < 30
        ? "exam-drill"
        : "answer-check";

  const modes = [
    {
      id: "recall",
      href: `/revision/${topicId}/recall`,
      title: "Active Recall",
      description: `Recall ${bundle.recallCards.length} terms and points from memory.`,
      icon: BrainCircuit,
      progress: recallProgress,
    },
    {
      id: "exam-drill",
      href: `/revision/${topicId}/exam-drill`,
      title: "Exam Drill",
      description: `Plan answers for ${bundle.examDrills.length} exam-style prompts.`,
      icon: ClipboardList,
      progress: examProgress,
    },
    {
      id: "answer-check",
      href: `/revision/${topicId}/answer-check`,
      title: "Answer Check",
      description: "Write an answer and check it against the rubric.",
      icon: Sparkles,
      progress: null,
    },
    {
      id: "quiz",
      href: `/revision/${topicId}/quiz`,
      title: "Quick Quiz",
      description: `${bundle.quizQuestions.length} fast retrieval questions.`,
      icon: Target,
      progress: quizProgress,
    },
  ];

  const avgProgress = Math.round((recallProgress + examProgress + quizProgress) / 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Practice {topicLabel}
        </h2>
        {avgProgress > 0 ? (
          <Badge variant="accent">{avgProgress}%</Badge>
        ) : null}
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSuggested = mode.id === suggested;

          return (
            <Link
              key={mode.id}
              href={mode.href}
              className="group flex items-center gap-4 px-4 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-card/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Icon size={16} className="text-accent" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{mode.title}</span>
                  {isSuggested ? (
                    <Badge variant="accent" className="text-[10px]">Suggested</Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{mode.description}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {typeof mode.progress === "number" ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${progressDot(mode.progress)}`} />
                    <span className="text-xs tabular-nums text-muted-foreground">{mode.progress}%</span>
                  </div>
                ) : null}
                <ArrowRight size={14} className="text-muted-foreground transition-colors group-hover:text-accent" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
