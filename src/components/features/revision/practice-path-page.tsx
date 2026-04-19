"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/features/revision/revision-subnav";
import { Badge, Button, Card } from "@/components/ui";
import { getPracticePathSummary, type PracticePathId } from "@/lib/practice";
import { TOPICS } from "@/lib/types";

const QuickQuiz = dynamic(
  () => import("./quick-quiz").then((m) => ({ default: m.QuickQuiz })),
  {
    loading: () => (
      <div
        className="min-h-[320px] rounded-2xl border border-border bg-card/50 animate-pulse"
        aria-hidden
      />
    ),
    ssr: false,
  }
);

interface PracticePathPageProps {
  pathId: PracticePathId;
}

function getPathMeta(pathId: PracticePathId) {
  if (pathId === "paper-1") {
    return {
      badgeVariant: "paper-1" as const,
      cardVariant: "paper-1" as const,
      focus: "Theory recall, terminology, and shorter exam-style knowledge checks.",
    };
  }

  if (pathId === "paper-2") {
    return {
      badgeVariant: "paper-2" as const,
      cardVariant: "paper-2" as const,
      focus: "Applied scenarios, written reasoning, and practical design choices.",
    };
  }

  return {
    badgeVariant: "accent" as const,
    cardVariant: "accent" as const,
    focus: "Broad retrieval before you commit to one paper or one topic.",
  };
}

export function PracticePathPage({ pathId }: PracticePathPageProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const summary = getPracticePathSummary(pathId);
  const meta = getPathMeta(pathId);
  const relatedTopics = useMemo(
    () =>
      summary.relatedTopicIds
        .map((topicId) => TOPICS.find((topic) => topic.id === topicId))
        .filter((topic): topic is (typeof TOPICS)[number] => Boolean(topic))
        .slice(0, 6),
    [summary.relatedTopicIds]
  );

  if (quizStarted) {
    return (
      <PageContainer size="lg">
        <div className="perf-fade-up">
          <QuickQuiz
            autoStart
            paperId={pathId === "mixed" ? undefined : pathId}
            onClose={() => setQuizStarted(false)}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md">
      <div className="perf-fade-up space-y-6">
        <RevisionSubnav activeRoute={pathId === "mixed" ? "mixed" : pathId} />

        <div className="flex items-center justify-between gap-3">
          <Link href="/revision">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
              Back
            </Button>
          </Link>
        </div>

        <Card variant={meta.cardVariant} className="p-6 sm:p-8">
          <div className="mx-auto max-w-2xl space-y-5 text-center">
            <div className="flex justify-center gap-2">
              {summary.paper ? (
                <Badge variant={meta.badgeVariant}>{summary.paper}</Badge>
              ) : null}
              <Badge variant="default">{summary.questionCount} questions</Badge>
            </div>

            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {summary.title}
            </h1>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {meta.focus}
            </p>

            {relatedTopics.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {relatedTopics.map((topic) => (
                  <span
                    key={topic.id}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    {topic.icon} {topic.shortLabel}
                  </span>
                ))}
              </div>
            ) : null}

            <Button onClick={() => setQuizStarted(true)} className="mx-auto">
              {summary.startLabel}
              <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
