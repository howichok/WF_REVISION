"use client";

import Link from "next/link";
import { Suspense, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, ClipboardList, Sparkles } from "lucide-react";
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

const EXAM_PAPER_GROUPS = [
  {
    id: "paper-1",
    label: "Paper 1",
    eyebrow: "Theory and programming",
    description:
      "Problem solving, programming basics, emerging issues, and legislation.",
    topicIds: [
      "problem-solving",
      "intro-programming",
      "emerging-issues",
      "legislation",
    ],
    code: "P1",
    topicLine: "Problem Solving / Programming / Emerging Issues / Legislation",
    accentClass: "border-accent/25 bg-accent/[0.06] text-accent",
    selectedClass: "border-accent/45 bg-accent/[0.055] ring-accent/15",
    icon: BookOpenCheck,
  },
  {
    id: "paper-2",
    label: "Paper 2",
    eyebrow: "Applied digital context",
    description:
      "Business context, data, digital environments, and security scenarios.",
    topicIds: [
      "business",
      "data",
      "digital-environments",
      "security",
    ],
    code: "P2",
    topicLine: "Business / Data / Digital Environments / Security",
    accentClass: "border-warning/25 bg-warning/[0.07] text-warning",
    selectedClass: "border-warning/45 bg-warning/[0.055] ring-warning/15",
    icon: ClipboardList,
  },
] as const;

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

  const selectExamPaper = useCallback((topicIds: readonly string[]) => {
    setExamTopicOrder([...topicIds]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setExamTopicOrder([]);
  }, []);

  const selectedCount = examMode ? examTopicOrder.length : selectedIds.size;
  const maxTopics = topics.length;
  const selectedPaperId = useMemo(() => {
    const selectedKey = examTopicOrder.join(",");
    return EXAM_PAPER_GROUPS.find((paper) => paper.topicIds.join(",") === selectedKey)?.id;
  }, [examTopicOrder]);

  const selectedPaperTopicIdSet = useMemo(() => {
    if (!selectedPaperId) return null;
    const paper = EXAM_PAPER_GROUPS.find((p) => p.id === selectedPaperId);
    return paper ? new Set(paper.topicIds) : null;
  }, [selectedPaperId]);

  const startSimpleSession = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const q = encodeURIComponent(ids.join(","));
    router.push(`/revision/quick-quiz?topics=${q}&autoStart=1`);
  }, [router, selectedIds]);

  const primaryExamTopicId = examTopicOrder[0] ?? "";

  useEffect(() => {
    if (!examMode || !primaryExamTopicId) {
      return;
    }
    void router.prefetch(`/revision/${primaryExamTopicId}/exam-questions`);
  }, [examMode, primaryExamTopicId, router]);

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
      startTransition(() => {
        router.push(`/revision/${primaryExamTopicId}/exam-questions?${params.toString()}`);
      });
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
      <div className={cn("space-y-8 sm:space-y-10", examMode && examTopicOrder.length > 0 && "pb-28 sm:pb-24")}>
        {examMode ? (
          <Link
            href="/revision"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Revision home
          </Link>
        ) : (
          <RevisionFocusNav activeMode={focusMode} fromHub={fromHub} />
        )}

        {examMode ? (
          <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Exam paper
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Start with Paper 1 or Paper 2. Use single topics only when you want a custom drill.
            </p>
          </header>
        ) : (
          <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {titleSubtitle.title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {titleSubtitle.subtitle}
            </p>
          </header>
        )}

        {!examMode ? (
          <div
            className={cn(
              "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
            )}
          >
            <p className="text-sm text-foreground">
              {selectedCount > 0
                ? `${selectedCount} / ${maxTopics} selected`
                : "Select topics or open a single hub below"}
            </p>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>
        ) : null}

        {examMode ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Choose a paper
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Best starting point for a timed session.
                </p>
              </div>
              {selectedPaperId ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear paper
                </button>
              ) : null}
            </div>

            <div
              className={cn(
                "grid gap-3 rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/[0.04] p-3 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.28)] ring-1 ring-foreground/[0.03] sm:gap-4 sm:p-4 lg:grid-cols-2",
                fromHub && "ring-accent/[0.06]"
              )}
            >
              {EXAM_PAPER_GROUPS.map((paper) => {
                const Icon = paper.icon;
                const selected = selectedPaperId === paper.id;
                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => selectExamPaper(paper.topicIds)}
                    className={cn(
                      "group relative min-h-[168px] overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 sm:min-h-[176px] sm:p-5",
                      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      selected
                        ? cn(paper.selectedClass, "shadow-md ring-2 ring-offset-0")
                        : "border-border/45 bg-background/70 hover:border-border/80 hover:bg-background/90"
                    )}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100",
                        paper.id === "paper-1"
                          ? "bg-gradient-to-r from-transparent via-accent/35 to-transparent"
                          : "bg-gradient-to-r from-transparent via-warning/40 to-transparent"
                      )}
                    />
                    <div className="relative flex h-full flex-col justify-between gap-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold shadow-sm",
                              paper.accentClass,
                              selected && "shadow-md"
                            )}
                          >
                            {paper.code}
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {paper.eyebrow}
                            </p>
                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                              {paper.label}
                            </h3>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                            selected
                              ? cn(paper.accentClass, "border-current shadow-sm")
                              : "border-border/60 bg-card/90 text-muted-foreground shadow-sm group-hover:border-border group-hover:text-foreground"
                          )}
                        >
                          {selected ? <Check size={16} strokeWidth={3} /> : <ArrowRight size={17} className="opacity-70 group-hover:opacity-100" />}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-sm leading-relaxed text-muted-foreground">{paper.description}</p>
                        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/[0.06] px-2.5 py-1.5 text-xs text-muted-foreground">
                          <Icon size={14} className={cn("shrink-0", selected && paper.accentClass.split(" ").slice(-1)[0])} />
                          <span className="leading-snug">{paper.topicLine}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {examMode ? (
          <div className="flex flex-col gap-1.5 border-t border-border/50 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/60 bg-muted/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Optional
              </span>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Custom topic drill</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Pick individual topics for a narrower timed run.
            </p>
          </div>
        ) : null}

        <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", examMode && "gap-4 sm:gap-5")}>
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
            const inActivePaper = examMode && (selectedPaperTopicIdSet?.has(topic.id) ?? false);
            const paper1TopicIds = EXAM_PAPER_GROUPS[0].topicIds;
            const paper1 = (paper1TopicIds as readonly string[]).includes(topic.id);

            return (
              <Card
                key={topic.id}
                variant="navigation"
                className={cn(
                  "relative flex flex-col border p-3 transition-all duration-200 sm:p-4",
                  examMode
                    ? cn(
                        "rounded-2xl shadow-[0_14px_44px_-28px_rgba(15,23,42,0.22)] ring-1 ring-foreground/[0.02]",
                        "bg-gradient-to-b from-card to-card/90 hover:shadow-[0_18px_48px_-26px_rgba(15,23,42,0.26)]",
                        inActivePaper &&
                          (paper1
                            ? "border-accent/20 ring-accent/[0.07]"
                            : "border-warning/25 ring-warning/[0.08]")
                      )
                    : "rounded-lg border-border/60 bg-card hover:border-border",
                  examMode && !inActivePaper && !isSelected && "border-border/55 hover:border-border/90",
                  isSelected &&
                    "border-accent/45 bg-accent/[0.07] ring-2 ring-accent/20 shadow-[0_12px_36px_-20px_rgba(99,102,241,0.35)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border text-muted-foreground shadow-sm transition-all",
                    "hover:border-accent/35 hover:text-foreground hover:shadow",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    isSelected
                      ? "border-accent/50 bg-accent/[0.12] text-accent"
                      : examMode
                        ? "border-border/65 bg-background/95 backdrop-blur-sm"
                        : "border-border/80 bg-background/90"
                  )}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Deselect ${topic.label}` : `Select ${topic.label}`}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                      isSelected ? "border-accent bg-accent text-white shadow-sm" : "border-muted-foreground/35"
                    )}
                  >
                    {isSelected ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                </button>

                <div className="flex gap-3 pr-12">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl shadow-inner",
                      examMode
                        ? cn(
                            "border-border/50 bg-gradient-to-br from-muted/25 to-muted/5",
                            inActivePaper &&
                              (paper1
                                ? "from-accent/[0.12] to-accent/[0.02] ring-1 ring-accent/15"
                                : "from-warning/[0.14] to-warning/[0.03] ring-1 ring-warning/20")
                          )
                        : "h-11 w-11 border-border/60 bg-muted/20"
                    )}
                  >
                    {topic.icon}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-semibold leading-snug text-foreground">{topic.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                      {tree?.subtopics.length ?? 0} subtopics · {topicProgress.progressPercent}% topic · {quizProgress}%
                      quiz
                    </p>
                  </div>
                </div>

                {tree?.description ? (
                  <p
                    className={cn(
                      "mt-3 line-clamp-2 text-left text-xs leading-relaxed text-muted-foreground",
                      examMode && "rounded-lg bg-muted/[0.04] px-2 py-1.5 ring-1 ring-border/30"
                    )}
                  >
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
          <ExamConditionsLaunchWizard selectedTopicIds={examTopicOrder} onStart={openExamWithConfig} onClear={clearSelection} />
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
