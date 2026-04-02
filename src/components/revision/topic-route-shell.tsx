"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { getTopicNavMode, getTopicRouteItems, type TopicLearningMode } from "@/lib/revision-routes";
import { getTopicById } from "@/lib/types";
import { useAppData } from "@/components/providers/app-data-provider";
import { getSubtopicProgressForTopic } from "@/lib/progress";
import { cn } from "@/lib/utils";

interface TopicRouteShellProps {
  topicId: string;
  activeMode: TopicLearningMode;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export function TopicRouteShell({
  topicId,
  activeMode,
  eyebrow,
  title,
  description,
  children,
  aside,
}: TopicRouteShellProps) {
  const pathname = usePathname();
  const { diagnostic, revisionProgress } = useAppData();
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  const topicScore = diagnostic?.topicScores.find((score) => score.category === topicId);
  const scorePercent = topicScore
    ? Math.round((topicScore.score / topicScore.maxScore) * 100)
    : null;
  const progress = getSubtopicProgressForTopic(revisionProgress, topicId);
  const topicRoutes = getTopicRouteItems(topicId);
  const activeNavMode = getTopicNavMode(activeMode);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-background/85 p-4 shadow-[0_20px_55px_-36px_rgba(15,23,42,0.35)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/revision/topics" className="mt-1">
              <Button variant="ghost" size="sm" className="border border-border/60 bg-background/80 shadow-sm">
                <ArrowLeft size={14} />
              </Button>
            </Link>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/90">
                {eyebrow}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl">{topicInfo.icon}</span>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {scorePercent !== null ? (
              <Badge variant={scorePercent >= 70 ? "success" : scorePercent >= 40 ? "warning" : "danger"}>
                {scorePercent}% diagnostic
              </Badge>
            ) : null}
            {progress.progressPercent > 0 ? (
              <Badge variant="default">
                {progress.completed}/{progress.totalSubtopics} reviewed
              </Badge>
            ) : null}
          </div>
        </div>

        <nav className="mt-5 overflow-x-auto">
          <div className="flex min-w-max gap-1.5 rounded-2xl border border-border/70 bg-card/70 p-1.5 shadow-sm">
          {topicRoutes.map((item) => {
            const isActive = item.id === activeNavMode || pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border border-accent/20 bg-accent/12 text-accent shadow-sm"
                    : "text-muted-foreground hover:border-border/70 hover:bg-background/70 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          </div>
        </nav>
      </div>

      {aside ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>{children}</div>
          <div className="space-y-4">{aside}</div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
