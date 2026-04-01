"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { getTopicRouteItems, type TopicLearningMode } from "@/lib/revision-routes";
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

  return (
    <div className="space-y-5">
      <RevisionSubnav activeRoute="topics" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/revision/topics" className="mt-1">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
            </Button>
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent/90 mb-1">{eyebrow}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{topicInfo.icon}</span>
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {scorePercent !== null ? (
            <Badge variant={scorePercent >= 70 ? "success" : scorePercent >= 40 ? "warning" : "danger"}>
              {scorePercent}% diagnostic
            </Badge>
          ) : null}
          {progress.progressPercent > 0 ? (
            <span>{progress.completed}/{progress.totalSubtopics} reviewed</span>
          ) : null}
        </div>
      </div>

      <nav className="overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-xl border border-border bg-card/40 p-1">
          {topicRoutes.map((item) => {
            const isActive = item.id === activeMode || pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

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
