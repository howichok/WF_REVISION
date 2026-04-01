"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { useAppData } from "@/components/providers/app-data-provider";
import { getRevisitQueue, getWeakestTopics } from "@/lib/progress";
import { getTopicById } from "@/lib/types";

function urgencyColor(urgency: string) {
  if (urgency === "due-now") return "border-l-red-500";
  if (urgency === "revisit-soon") return "border-l-amber-500";
  return "border-l-emerald-500";
}

function urgencyLabel(urgency: string) {
  if (urgency === "due-now") return "text-red-400";
  if (urgency === "revisit-soon") return "text-amber-400";
  return "text-emerald-400";
}

export default function WeakAreasPage() {
  const { activityHistory, diagnostic, onboarding, revisionProgress } = useAppData();
  const revisitQueue = getRevisitQueue(
    diagnostic,
    onboarding,
    revisionProgress,
    activityHistory,
    6
  );
  const weakestTopics = getWeakestTopics(diagnostic, 6);

  return (
    <PageContainer size="lg">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="weak-areas" />

        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Weak areas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Topics ranked by what needs the most attention right now.
          </p>

          <div className="mt-6 space-y-1">
            {revisitQueue.length > 0 ? (
              revisitQueue.map((item) => (
                <div
                  key={item.topicId}
                  className={`flex items-center gap-4 rounded-lg border-l-3 py-3 pl-4 pr-3 transition-colors hover:bg-white/3 ${urgencyColor(item.urgency)}`}
                >
                  <span className="shrink-0 text-lg">{item.topicIcon}</span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.topicLabel}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.nextAction}</p>
                  </div>

                  <span className={`shrink-0 text-[11px] font-medium ${urgencyLabel(item.urgency)}`}>
                    {item.urgency === "due-now"
                      ? "Due now"
                      : item.urgency === "revisit-soon"
                        ? "Revisit soon"
                        : "Keep warm"}
                  </span>

                  <Link
                    href={`/revision/${item.topicId}/practice`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-soft"
                  >
                    Practice
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))
            ) : diagnostic ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No revisit queue yet. Start practice on any topic to build one.
              </p>
            ) : weakestTopics.length > 0 ? (
              weakestTopics.map((topic) => {
                const pct = Math.round((topic.score / topic.maxScore) * 100);
                const topicInfo = getTopicById(topic.category);

                return (
                  <div
                    key={topic.category}
                    className="flex items-center gap-4 rounded-lg border-l-3 border-l-amber-500 py-3 pl-4 pr-3"
                  >
                    <span className="shrink-0 text-lg">{topicInfo?.icon}</span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Diagnostic score: {pct}%
                      </p>
                    </div>

                    <Link
                      href={`/revision/${topic.category}/practice`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-soft"
                    >
                      Practice
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <Target size={20} className="mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-foreground">No weak-area data yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run the diagnostic first so the system can rank your topics.
                </p>
                <Link
                  href="/revision/diagnostic"
                  className="mt-4 inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
                >
                  Start diagnostic
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
