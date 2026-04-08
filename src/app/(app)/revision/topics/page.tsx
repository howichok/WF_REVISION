"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Sparkles, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionFocusNav } from "@/components/revision/revision-focus-nav";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Card } from "@/components/ui";
import { getPracticeSetId } from "@/lib/practice";
import { getPracticeSetProgress, getSubtopicProgressForTopic } from "@/lib/progress";
import { TOPICS, getTopicTree } from "@/lib/types";
import { cn } from "@/lib/utils";

function RevisionTopicsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { revisionProgress } = useAppData();
  const topics = TOPICS.filter((topic) => topic.id !== "esp");

  const rawMode = searchParams.get("mode");
  const examMode = rawMode === "exam-conditions";
  const focusMode = examMode ? "exam" : "simple";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (rawMode === null) {
      router.replace("/revision/topics?mode=simple", { scroll: false });
    } else if (rawMode !== "simple" && rawMode !== "exam-conditions") {
      router.replace("/revision/topics?mode=simple", { scroll: false });
    }
  }, [rawMode, router]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [examMode]);

  const toggleTopic = useCallback(
    (topicId: string) => {
      setSelectedIds((prev) => {
        if (examMode) {
          const next = new Set<string>();
          if (!prev.has(topicId)) {
            next.add(topicId);
          }
          return next;
        }
        const next = new Set(prev);
        if (next.has(topicId)) {
          next.delete(topicId);
        } else {
          next.add(topicId);
        }
        return next;
      });
    },
    [examMode]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(topics.map((t) => t.id)));
  }, [topics]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;
  const maxTopics = topics.length;

  const startSimpleSession = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const q = encodeURIComponent(ids.join(","));
    router.push(`/revision/quick-quiz?topics=${q}&autoStart=1`);
  }, [router, selectedIds]);

  const openExamForSelection = useCallback(() => {
    const id = [...selectedIds][0];
    if (!id) return;
    router.push(`/revision/${id}/exam-conditions?autoStart=1`);
  }, [router, selectedIds]);

  const titleSubtitle = useMemo(() => {
    if (examMode) {
      return {
        title: "Pick one topic",
        subtitle: "Timed session — one topic, then marking at the end.",
      };
    }
    return {
      title: "What do you want to study?",
      subtitle: "Tick topics, run a quick Q/A mix, or open one topic for coach and recall.",
    };
  }, [examMode]);

  return (
    <PageContainer size="lg">
      <div className="space-y-8 sm:space-y-10">
        <RevisionFocusNav activeMode={focusMode} />

        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {titleSubtitle.title}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {titleSubtitle.subtitle}
          </p>
        </header>

        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
          )}
        >
          <p className="text-sm text-foreground">
            {!examMode && selectedCount > 0
              ? `${selectedCount} / ${maxTopics} selected`
              : examMode && selectedCount === 1
                ? "Ready to start"
                : examMode
                  ? "Choose one topic"
                  : "Select topics or open a single hub below"}
          </p>
          <div className="flex flex-wrap gap-2">
            {!examMode ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                  All
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={selectedCount === 0}>
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  disabled={selectedCount === 0}
                  onClick={startSimpleSession}
                >
                  <Sparkles size={14} />
                  Quick Q/A
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={selectedCount !== 1}
                onClick={openExamForSelection}
              >
                <Target size={14} />
                Start exam
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const tree = getTopicTree(topic.id);
            const topicProgress = getSubtopicProgressForTopic(revisionProgress, topic.id);
            const quizProgress =
              getPracticeSetProgress(
                revisionProgress,
                topic.id,
                getPracticeSetId(topic.id, "quiz")
              )?.progressPercent ?? 0;
            const isSelected = selectedIds.has(topic.id);

            return (
              <Card
                key={topic.id}
                variant="navigation"
                className={cn(
                  "relative flex flex-col rounded-2xl border p-4 transition-colors",
                  isSelected
                    ? "border-accent/40 bg-accent/[0.06] ring-1 ring-accent/20"
                    : "border-border/60 bg-card hover:border-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:border-accent/30 hover:text-foreground"
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Deselect ${topic.label}` : `Select ${topic.label}`}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border-2",
                      isSelected ? "border-accent bg-accent text-white" : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                </button>

                <div className="flex gap-3 pr-11">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/20 text-xl">
                    {topic.icon}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-semibold leading-snug text-foreground">{topic.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tree?.subtopics.length ?? 0} subtopics · {topicProgress.progressPercent}% topic · {quizProgress}%
                      quiz
                    </p>
                  </div>
                </div>

                {tree?.description ? (
                  <p className="mt-3 line-clamp-2 text-left text-xs leading-relaxed text-muted-foreground">
                    {tree.description}
                  </p>
                ) : null}

                {!examMode ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                    <Link
                      href={`/revision/${topic.id}/practice`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:flex-none"
                    >
                      Open hub
                      <ArrowRight size={12} />
                    </Link>
                    <Link
                      href={`/revision/${topic.id}/overview`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center rounded-lg border border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/25 hover:text-foreground"
                    >
                      Overview
                    </Link>
                  </div>
                ) : null}
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
