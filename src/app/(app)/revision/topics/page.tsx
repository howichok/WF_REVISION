"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function RevisionTopicsPageContent() {
  const searchParams = useSearchParams();
  const { diagnostic, revisionProgress, sharedCurriculum } = useAppData();
  const topics = TOPICS.filter((topic) => topic.id !== "esp");
  const mode = searchParams.get("mode");
  const examMode = mode === "exam-conditions";

  return (
    <PageContainer size="xl">
      <div className="space-y-8">
        <RevisionSubnav activeRoute="topics" />

        <Card
          variant="navigation"
          className="rounded-[2rem] border-border/70 bg-gradient-to-br from-card via-card to-background/80 p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.25)] sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Practice by topic</Badge>
            <Badge variant={examMode ? "warning" : "default"}>
              {examMode ? "Exam conditions mode" : "Topic navigation"}
            </Badge>
          </div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {examMode ? "Choose one topic and launch exam conditions" : "Open one topic and stay in that lane"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {examMode
                  ? "Pick the topic you want, then go straight into the separate timed exam feature instead of passing through the normal practice hub."
                  : "Use this route when you already know which topic you want to revise. Each topic now has its own overview, practice hub, recall mode, exam route, quiz, resources, and progress page."}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {examMode ? "What this does" : "Choose your flow"}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {examMode
                  ? "Launch straight into a full timed session for one topic."
                  : "Open a topic first, then decide whether to revise or write under exam conditions."}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const tree = getTopicTree(topic.id);
            const content = getTopicContentBundle(topic.id, sharedCurriculum);
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
              <Card
                key={topic.id}
                variant="navigation"
                className="group h-full overflow-hidden rounded-[2rem] border-border/70 bg-gradient-to-br from-card via-card to-background/75 p-5 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/12 text-2xl shadow-inner">
                        {topic.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-foreground">{topic.label}</p>
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
                  <div className="surface-cutout rounded-2xl border border-border/60 px-3 py-3">
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
                    <span className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground transition-colors hover:border-accent/20 hover:bg-background">
                      <BookOpen size={14} />
                      Overview
                    </span>
                  </Link>
                  <Link
                    href={
                      examMode
                        ? `/revision/${topic.id}/exam-conditions?autoStart=1`
                        : `/revision/${topic.id}/practice`
                    }
                  >
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft">
                      <Target size={14} />
                      {examMode ? "Launch exam conditions" : "Open topic"}
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

export default function RevisionTopicsPage() {
  return (
    <Suspense fallback={null}>
      <RevisionTopicsPageContent />
    </Suspense>
  );
}
