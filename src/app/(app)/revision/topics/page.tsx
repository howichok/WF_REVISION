"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ExamConditionsLaunchWizard } from "@/components/revision/exam-conditions-launch-wizard";
import { RevisionFocusNav } from "@/components/revision/revision-focus-nav";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Card } from "@/components/ui";
import {
  serializeExamTopicAllocationsParam,
  type ExamConditionsDifficultyMode,
  type ExamQuestionSetSize,
  type ExamTopicAllocationInput,
} from "@/lib/exam-conditions";
import { getPracticeSetId } from "@/lib/practice";
import { getPracticeSetProgress, getSubtopicProgressForTopic } from "@/lib/progress";
import {
  REVISION_TOPICS_MODE_EXAM,
  isRevisionTopicsExamMode,
} from "@/lib/revision-routes";
import { TOPICS, getTopicTree } from "@/lib/types";
import { cn } from "@/lib/utils";

function RevisionTopicsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { revisionProgress } = useAppData();
  const topics = TOPICS.filter((topic) => topic.id !== "esp");

  const rawMode = searchParams.get("mode");
  const fromHub = searchParams.get("from") === "hub";
  const examMode = isRevisionTopicsExamMode(rawMode);
  const focusMode = examMode ? "exam" : "simple";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [examTopicOrder, setExamTopicOrder] = useState<string[]>([]);

  useEffect(() => {
    const hub = fromHub ? "&from=hub" : "";
    if (rawMode === "exam-conditions") {
      router.replace(`/revision/topics?mode=${REVISION_TOPICS_MODE_EXAM}${hub}`, { scroll: false });
      return;
    }
    if (rawMode === null) {
      router.replace(`/revision/topics?mode=simple${hub}`, { scroll: false });
    } else if (rawMode !== "simple" && rawMode !== REVISION_TOPICS_MODE_EXAM) {
      router.replace(`/revision/topics?mode=simple${hub}`, { scroll: false });
    }
  }, [rawMode, router, fromHub]);

  useEffect(() => {
    setSelectedIds(new Set());
    setExamTopicOrder([]);
  }, [examMode]);

  const toggleTopic = useCallback(
    (topicId: string) => {
      if (examMode) {
        setExamTopicOrder((prev) =>
          prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
        );
        return;
      }
      setSelectedIds((prev) => {
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
    setExamTopicOrder([]);
  }, []);

  const selectedCount = examMode ? examTopicOrder.length : selectedIds.size;
  const maxTopics = topics.length;

  const startSimpleSession = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const q = encodeURIComponent(ids.join(","));
    router.push(`/revision/quick-quiz?topics=${q}&autoStart=1`);
  }, [router, selectedIds]);

  const primaryExamTopicId = examTopicOrder[0] ?? "";

  const openExamWithConfig = useCallback(
    (options: {
      setSize: ExamQuestionSetSize;
      difficultyMode: ExamConditionsDifficultyMode;
      allocations: ExamTopicAllocationInput[];
    }) => {
      if (!primaryExamTopicId) {
        return;
      }
      const allocRecord = Object.fromEntries(
        options.allocations.filter((a) => a.count > 0).map((a) => [a.topicId, a.count])
      );
      const params = new URLSearchParams({
        autoStart: "1",
        size: String(options.setSize),
        difficulty: options.difficultyMode,
        alloc: serializeExamTopicAllocationsParam(allocRecord),
      });
      router.push(`/revision/${primaryExamTopicId}/exam-questions?${params.toString()}`);
    },
    [router, primaryExamTopicId]
  );

  const titleSubtitle = useMemo(() => {
    if (examMode) {
      return {
        title: "Exam questions — pick topics",
        subtitle:
          "Choose one or more topics, set a 10 / 20 / 30 question paper, split counts per topic, then run a timed session. Marking runs once at the end.",
      };
    }
    return {
      title: "What do you want to study?",
      subtitle: "Tick topics for a mixed Quick Q/A run, or open one topic hub for recall and quizzes.",
    };
  }, [examMode]);

  return (
    <PageContainer size="lg">
      <div className="space-y-8 sm:space-y-10">
        <RevisionFocusNav activeMode={focusMode} fromHub={fromHub} />

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
              : examMode && selectedCount > 0
                ? "Set paper length and topic split below."
                : examMode
                  ? "Select at least one topic"
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
            ) : selectedCount > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                Clear topics
              </Button>
            ) : null}
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
            const isSelected = examMode ? examTopicOrder.includes(topic.id) : selectedIds.has(topic.id);

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

        {examMode && examTopicOrder.length > 0 ? (
          <ExamConditionsLaunchWizard selectedTopicIds={examTopicOrder} onStart={openExamWithConfig} />
        ) : null}
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
