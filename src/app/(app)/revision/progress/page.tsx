"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Target, TrendingUp } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Card, ProgressBar } from "@/components/ui";
import {
  formatRelativeTime,
  getStudiedTopicCount,
  getThisWeekMinutes,
  getWeakestTopics,
} from "@/lib/progress";
import { getTopicById } from "@/lib/types";

export default function RevisionProgressPage() {
  const { activityHistory, diagnostic, revisionProgress } = useAppData();
  const weakestTopics = getWeakestTopics(diagnostic, 5);
  const minutesThisWeek = getThisWeekMinutes(activityHistory);
  const practiceEntries = revisionProgress.filter((entry) => entry.entityType === "practice-set");
  const subtopicEntries = revisionProgress.filter((entry) => entry.entityType === "subtopic");

  return (
    <PageContainer size="lg">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="progress" />

        <Card variant="support" className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Progress
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            See what has been learned and what still needs attention
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This route is for summary, not task execution. Use it to read your saved diagnostic state,
            practice progress, and recent activity without mixing it into diagnostic or practice flows.
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card variant="support" className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Overall diagnostic
            </p>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {diagnostic?.overallScore ?? "\u2014"}{diagnostic ? "%" : ""}
            </p>
          </Card>
          <Card variant="support" className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Topics covered
            </p>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {getStudiedTopicCount(diagnostic)}
            </p>
          </Card>
          <Card variant="support" className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Practice sets saved
            </p>
            <p className="mt-3 text-3xl font-bold text-foreground">{practiceEntries.length}</p>
          </Card>
          <Card variant="support" className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Time this week
            </p>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {minutesThisWeek > 0 ? `${(minutesThisWeek / 60).toFixed(1)}h` : "\u2014"}
            </p>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card variant="navigation" className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Topic performance</h2>
            </div>
            <div className="mt-4 space-y-3">
              {diagnostic?.topicScores?.length ? (
                [...diagnostic.topicScores]
                  .sort((left, right) => left.score / left.maxScore - right.score / right.maxScore)
                  .map((topic) => {
                    const pct = Math.round((topic.score / topic.maxScore) * 100);

                    return (
                      <div
                        key={topic.category}
                        className="surface-cutout rounded-xl px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span>{getTopicById(topic.category)?.icon}</span>
                            <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                          </div>
                          <Badge
                            variant={pct >= 75 ? "success" : pct >= 50 ? "warning" : "danger"}
                          >
                            {pct}%
                          </Badge>
                        </div>
                        <ProgressBar value={pct} className="mt-3" size="sm" />
                        <div className="mt-4">
                          <Link href={`/revision/${topic.category}/progress`}>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                              Open topic progress
                              <ArrowRight size={12} />
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run the diagnostic to start building your progress data.
                </p>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card variant="warning" className="p-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-warning" />
                <h2 className="text-sm font-semibold text-foreground">Weakest topics</h2>
              </div>
              <div className="mt-4 space-y-3">
                {weakestTopics.length > 0 ? (
                  weakestTopics.map((topic) => {
                    const pct = Math.round((topic.score / topic.maxScore) * 100);

                    return (
                      <div key={topic.category} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">{topic.topic}</span>
                          <Badge variant={pct >= 50 ? "warning" : "danger"}>{pct}%</Badge>
                        </div>
                        <ProgressBar value={pct} size="sm" />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No diagnostic scores yet.</p>
                )}
              </div>
            </Card>

            <Card variant="support" className="p-5">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-accent" />
                <h2 className="text-sm font-semibold text-foreground">Saved activity</h2>
              </div>
              <div className="mt-4 space-y-3">
                <div className="surface-cutout rounded-xl px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Subtopic reviews
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{subtopicEntries.length}</p>
                </div>
                <div className="surface-cutout rounded-xl px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Practice sets
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{practiceEntries.length}</p>
                </div>
              </div>
            </Card>

            <Card variant="support" className="p-5">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
              </div>
              <div className="mt-4 space-y-2">
                {activityHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="surface-cutout rounded-xl px-3 py-3"
                  >
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(item.occurredAt)}
                    </p>
                  </div>
                ))}
                {activityHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground">No saved activity yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
