"use client";

import Link from "next/link";
import { Suspense, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  Sparkles,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout/page-container";
import { ExamConditionsLaunchWizard } from "@/components/features/revision/exam-conditions-launch-wizard";
import { RevisionFocusNav } from "@/components/features/revision/revision-focus-nav";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui";
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
    color: "accent" as const,
    gradient: "from-accent/20 via-accent/8 to-transparent",
    borderSelected: "border-accent/50",
    ringSelected: "ring-accent/25",
    shadowSelected: "shadow-[0_16px_48px_-16px_rgba(99,102,241,0.45)]",
    badgeBg: "bg-accent/15 text-accent border-accent/25",
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
    color: "warning" as const,
    gradient: "from-warning/20 via-warning/8 to-transparent",
    borderSelected: "border-warning/50",
    ringSelected: "ring-warning/25",
    shadowSelected: "shadow-[0_16px_48px_-16px_rgba(245,158,11,0.4)]",
    badgeBg: "bg-warning/15 text-warning border-warning/25",
    icon: ClipboardList,
  },
] as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.045 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-border/40">
      <div
        className="h-full rounded-full bg-accent/60 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

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
        title: "Exam paper",
        subtitle:
          "Start with Paper 1 or Paper 2. Use individual topics for a custom drill.",
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
        {/* ── Back / nav ── */}
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

        {/* ── Page header ── */}
        <motion.header
          className="space-y-1.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {titleSubtitle.title}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {titleSubtitle.subtitle}
          </p>
        </motion.header>

        {/* ── Simple mode toolbar ── */}
        {!examMode ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid size={15} className="text-muted-foreground" />
              <p className="text-sm text-foreground">
                {selectedCount > 0
                  ? <><span className="font-semibold text-accent">{selectedCount}</span> <span className="text-muted-foreground">/ {maxTopics} selected</span></>
                  : <span className="text-muted-foreground">Select topics or open a hub below</span>}
              </p>
            </div>
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
                <Sparkles size={13} />
                Quick Q/A
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* ── Paper picker (exam mode) ── */}
        {examMode ? (
          <motion.section
            className="space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choose a paper</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Best starting point for a timed session.</p>
              </div>
              {selectedPaperId ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {EXAM_PAPER_GROUPS.map((paper) => {
                const Icon = paper.icon;
                const selected = selectedPaperId === paper.id;
                return (
                  <motion.button
                    key={paper.id}
                    type="button"
                    onClick={() => selectExamPaper(paper.topicIds)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6",
                      selected
                        ? cn(
                            "ring-2 ring-offset-0",
                            paper.borderSelected,
                            paper.ringSelected,
                            paper.shadowSelected,
                            "bg-gradient-to-br",
                            paper.gradient
                          )
                        : "border-border/50 bg-card/90 hover:border-border/90 hover:bg-card hover:shadow-md"
                    )}
                  >
                    {/* Shine on hover */}
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                        paper.id === "paper-1"
                          ? "bg-gradient-to-r from-transparent via-accent/50 to-transparent"
                          : "bg-gradient-to-r from-transparent via-warning/50 to-transparent"
                      )}
                    />

                    <div className="flex items-start justify-between gap-4">
                      {/* Left: code badge + title */}
                      <div className="flex items-start gap-4">
                        <span
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-base font-extrabold shadow-sm transition-all",
                            selected
                              ? paper.badgeBg
                              : "border-border/60 bg-muted/30 text-foreground"
                          )}
                        >
                          {paper.code}
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {paper.eyebrow}
                          </p>
                          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            {paper.label}
                          </h3>
                        </div>
                      </div>

                      {/* Checkmark / arrow */}
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                          selected
                            ? cn(paper.badgeBg, "shadow-sm")
                            : "border-border/60 bg-background/70 text-muted-foreground group-hover:border-border group-hover:text-foreground"
                        )}
                      >
                        {selected ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <ArrowRight size={16} className="opacity-70 transition-opacity group-hover:opacity-100" />
                        )}
                      </span>
                    </div>

                    <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                      {paper.description}
                    </p>

                    {/* Topic chips */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {paper.topicLine.split(" / ").map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-snug transition-colors",
                            selected
                              ? cn(paper.badgeBg, "opacity-90")
                              : "border-border/50 bg-muted/20 text-muted-foreground"
                          )}
                        >
                          <Icon size={10} className="shrink-0 opacity-70" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        ) : null}

        {/* ── "Optional" divider ── */}
        {examMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="flex items-center gap-3 border-t border-border/50 pt-7"
          >
            <span className="flex items-center gap-1.5 rounded-full border border-dashed border-border/70 bg-muted/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Zap size={10} />
              Optional
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Custom topic drill</h2>
              <p className="text-xs text-muted-foreground">Pick individual topics for a narrower timed run.</p>
            </div>
          </motion.div>
        ) : null}

        {/* ── Topic grid ── */}
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", examMode && "sm:gap-4")}
        >
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
              <motion.div
                key={topic.id}
                variants={fadeUp}
                transition={{ duration: 0.38 }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200",
                  "hover:shadow-md focus-within:ring-2 focus-within:ring-accent/20",
                  isSelected
                    ? "border-accent/50 bg-accent/[0.06] shadow-[0_8px_28px_-12px_rgba(99,102,241,0.35)] ring-1 ring-accent/15"
                    : inActivePaper
                      ? paper1
                        ? "border-accent/25 bg-accent/[0.03]"
                        : "border-warning/25 bg-warning/[0.03]"
                      : "border-border/55 hover:border-border/90"
                )}
              >
                {/* Top colour strip for active-paper topics */}
                {inActivePaper && !isSelected ? (
                  <div
                    className={cn(
                      "h-0.5 w-full",
                      paper1 ? "bg-gradient-to-r from-accent/50 via-accent/30 to-transparent" : "bg-gradient-to-r from-warning/50 via-warning/30 to-transparent"
                    )}
                  />
                ) : null}
                {isSelected ? (
                  <div className="h-0.5 w-full bg-gradient-to-r from-accent/60 via-accent/40 to-transparent" />
                ) : null}

                <div className="flex flex-1 flex-col p-4">
                  {/* Header row */}
                  <div className="flex items-start gap-3 pr-10">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl shadow-inner transition-all",
                        isSelected
                          ? "border-accent/30 bg-accent/12"
                          : inActivePaper
                            ? paper1
                              ? "border-accent/20 bg-accent/[0.08]"
                              : "border-warning/20 bg-warning/[0.08]"
                            : "border-border/50 bg-muted/20"
                      )}
                    >
                      {topic.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-foreground">{topic.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {tree?.subtopics.length ?? 0} subtopics
                      </p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Topic</span>
                      <span className={cn("font-medium", topicProgress.progressPercent > 0 && "text-accent")}>
                        {topicProgress.progressPercent}%
                      </span>
                    </div>
                    <ProgressBar value={topicProgress.progressPercent} />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Quiz</span>
                      <span className={cn("font-medium", quizProgress > 0 && "text-accent")}>
                        {quizProgress}%
                      </span>
                    </div>
                    <ProgressBar value={quizProgress} />
                  </div>

                  {/* Description */}
                  {tree?.description ? (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {tree.description}
                    </p>
                  ) : null}

                  {/* Simple-mode action buttons */}
                  {!examMode ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                      <Link
                        href={`/revision/${topic.id}/practice`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:flex-none"
                      >
                        Open hub
                        <ArrowRight size={11} />
                      </Link>
                      <Link
                        href={`/revision/${topic.id}/overview`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center rounded-xl border border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/25 hover:text-foreground"
                      >
                        Overview
                      </Link>
                    </div>
                  ) : null}
                </div>

                {/* Select toggle button */}
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl border shadow-sm transition-all",
                    "hover:border-accent/40 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    isSelected
                      ? "border-accent/50 bg-accent text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]"
                      : "border-border/70 bg-background/90 text-muted-foreground backdrop-blur-sm"
                  )}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Deselect ${topic.label}` : `Select ${topic.label}`}
                >
                  {isSelected ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <span className="block h-3.5 w-3.5 rounded-sm border-2 border-muted-foreground/30 transition-colors group-hover:border-accent/40" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Launch wizard ── */}
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
