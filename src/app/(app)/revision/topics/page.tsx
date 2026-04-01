"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { getTopicContentBundle } from "@/lib/content";
import { getPracticeSetId } from "@/lib/practice";
import { getPracticeSetProgress, getSubtopicProgressForTopic } from "@/lib/progress";
import { TOPICS, getTopicTree } from "@/lib/types";

function getScoreVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}

export default function RevisionTopicsPage() {
  const { diagnostic, revisionProgress } = useAppData();
  const topics = TOPICS.filter((topic) => topic.id !== "esp");

  return (
    <PageContainer size="lg">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="topics" />

        <Card variant="navigation" className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Practice by topic
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            Open one topic and stay in that lane
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Use this route when you already know which topic you want to revise. Each topic now has
            its own overview, practice hub, recall mode, exam drill, answer checker, quiz, resources, and progress page.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const tree = getTopicTree(topic.id);
            const content = getTopicContentBundle(topic.id);
            const diagnosticScore = diagnostic?.topicScores.find((score) => score.category === topic.id);
            const diagnosticPercent = diagnosticScore
              ? Math.round((diagnosticScore.score / diagnosticScore.maxScore) * 100)
              : null;
            const topicProgress = getSubtopicProgressForTopic(revisionProgress, topic.id);
            const quizProgress =
              getPracticeSetProgress(
                revisionProgress,
                topic.id,
                getPracticeSetId(topic.id, "quiz")
              )?.progressPercent ?? 0;
            const mappedPapers = Array.from(
              new Set(
                content.questions
                  .map((question) => question.paper)
                  .filter((paper): paper is "Paper 1" | "Paper 2" => Boolean(paper))
              )
            );

            return (
              <Card key={topic.id} variant="navigation" className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-2xl">
                        {topic.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {tree?.subtopics.length ?? 0} subtopics
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {tree?.description}
                    </p>
                  </div>
                  {diagnosticPercent !== null && (
                    <Badge variant={getScoreVariant(diagnosticPercent)}>
                      {diagnosticPercent}%
                    </Badge>
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="surface-cutout rounded-xl px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Topic progress
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {topicProgress.progressPercent}%
                    </p>
                    <ProgressBar value={topicProgress.progressPercent} className="mt-3" size="sm" />
                  </div>
                  <div className="surface-cutout rounded-xl px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Quick quiz progress
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{quizProgress}%</p>
                    <ProgressBar value={quizProgress} className="mt-3" size="sm" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {mappedPapers.length > 0 ? (
                    mappedPapers.map((paper) => (
                      <Badge
                        key={`${topic.id}-${paper}`}
                        variant={paper === "Paper 1" ? "paper-1" : "paper-2"}
                      >
                        {paper}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="default">Mixed topic coverage</Badge>
                  )}
                  <Badge variant="default">{content.questions.length} mapped questions</Badge>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/revision/${topic.id}/overview`}>
                    <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface/30 px-3 py-2 text-sm text-foreground transition-colors hover:border-accent/20 hover:bg-card">
                      <BookOpen size={14} />
                      Overview
                    </span>
                  </Link>
                  <Link href={`/revision/${topic.id}/practice`}>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft">
                      <Target size={14} />
                      Open topic
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
