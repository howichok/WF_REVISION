"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Target } from "lucide-react";
import { Button } from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  EXAM_CONDITIONS_SESSION_MIN_QUESTIONS,
  EXAM_QUESTION_SET_SIZES,
  examSessionMeetsMinimum,
  getTopicExamAllocCap,
  splitExamAllocationsEvenly,
  type ExamConditionsDifficultyMode,
  type ExamQuestionSetSize,
  type ExamTopicAllocationInput,
} from "@/lib/exam-conditions";
import { getTopicById } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ExamConditionsLaunchWizardProps {
  /** Topic ids in the order the learner picked them (first = primary route segment). */
  selectedTopicIds: string[];
  onStart: (options: {
    setSize: ExamQuestionSetSize;
    difficultyMode: ExamConditionsDifficultyMode;
    allocations: ExamTopicAllocationInput[];
  }) => void;
  /** Optional callback to clear the topic selection. */
  onClear?: () => void;
}

export function ExamConditionsLaunchWizard({
  selectedTopicIds,
  onStart,
  onClear,
}: ExamConditionsLaunchWizardProps) {
  const { sharedCurriculum } = useAppData();
  const [difficultyMode, setDifficultyMode] = useState<ExamConditionsDifficultyMode>("mixed");
  const [setSize, setSetSize] = useState<ExamQuestionSetSize>(10);
  const [allocByTopic, setAllocByTopic] = useState<Record<string, number>>({});
  const [splitOpen, setSplitOpen] = useState(false);

  const caps = useMemo(() => {
    const out: Record<string, number> = {};
    for (const id of selectedTopicIds) {
      out[id] = getTopicExamAllocCap(id, difficultyMode, sharedCurriculum);
    }
    return out;
  }, [selectedTopicIds, difficultyMode, sharedCurriculum]);

  const totalPool = useMemo(
    () => selectedTopicIds.reduce((s, id) => s + (caps[id] ?? 0), 0),
    [selectedTopicIds, caps]
  );

  const effectiveSize = Math.min(setSize, totalPool);

  const allocationSum = useMemo(
    () => selectedTopicIds.reduce((s, id) => s + (allocByTopic[id] ?? 0), 0),
    [selectedTopicIds, allocByTopic]
  );

  useEffect(() => {
    if (selectedTopicIds.length === 0) {
      return;
    }
    setAllocByTopic(splitExamAllocationsEvenly(selectedTopicIds, effectiveSize));
  }, [selectedTopicIds, effectiveSize]);

  useEffect(() => {
    setAllocByTopic((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of selectedTopicIds) {
        const cap = caps[id] ?? 0;
        const v = next[id] ?? 0;
        if (v > cap) {
          next[id] = cap;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [caps, selectedTopicIds]);

  useEffect(() => {
    if (selectedTopicIds.length <= 1) setSplitOpen(false);
  }, [selectedTopicIds.length]);

  const canStart = useMemo(() => {
    if (selectedTopicIds.length === 0 || totalPool === 0) {
      return false;
    }
    if (allocationSum !== effectiveSize) {
      return false;
    }
    if (!examSessionMeetsMinimum(totalPool, effectiveSize)) {
      return false;
    }
    for (const id of selectedTopicIds) {
      const cap = caps[id] ?? 0;
      const n = allocByTopic[id] ?? 0;
      if (n > cap || n < 0) {
        return false;
      }
    }
    return true;
  }, [selectedTopicIds, totalPool, allocationSum, effectiveSize, caps, allocByTopic]);

  const previewMinutes = useMemo(() => {
    return Math.max(25, Math.round(effectiveSize * 2.4));
  }, [effectiveSize]);

  function handleStart() {
    if (!canStart) {
      return;
    }
    const allocations: ExamTopicAllocationInput[] = selectedTopicIds.map((topicId) => ({
      topicId,
      count: allocByTopic[topicId] ?? 0,
    }));
    onStart({ setSize, difficultyMode, allocations });
  }

  function setTopicAlloc(topicId: string, value: number) {
    const cap = caps[topicId] ?? 0;
    const n = Math.max(0, Math.min(cap, Math.round(value)));
    setAllocByTopic((prev) => ({ ...prev, [topicId]: n }));
  }

  const poolHint =
    totalPool < EXAM_CONDITIONS_SESSION_MIN_QUESTIONS
      ? `Not enough questions in the selected topics for a full paper (need at least ${EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} in the pool).`
      : allocationSum !== effectiveSize
        ? `Counts must add up to ${effectiveSize}${effectiveSize < setSize ? ` (pool limit for a ${setSize}-question paper)` : ""}.`
        : !examSessionMeetsMinimum(totalPool, effectiveSize)
          ? `With this paper size you would get fewer than ${EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} questions — pick a smaller paper or more topics.`
          : null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-30 overflow-hidden rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur-md sm:bottom-4 sm:inset-x-6 sm:rounded-2xl lg:inset-x-10">
      {/* Per-topic split panel */}
      {selectedTopicIds.length > 1 && splitOpen ? (
        <div className="border-b border-border bg-card/60">
          <div className="px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {selectedTopicIds.map((id) => {
                const topic = getTopicById(id);
                const cap = caps[id] ?? 0;
                return (
                  <label key={id} className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      {topic?.icon ? `${topic.icon} ` : ""}
                      {topic?.label ?? id}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={cap}
                      value={allocByTopic[id] ?? 0}
                      onChange={(e) =>
                        setTopicAlloc(id, Number.parseInt(e.target.value, 10) || 0)
                      }
                      className="h-8 w-16 rounded-lg border border-border/80 bg-background px-2 text-center text-[13px] tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">/{cap}</span>
                  </label>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() =>
                  setAllocByTopic(
                    splitExamAllocationsEvenly(selectedTopicIds, effectiveSize)
                  )
                }
              >
                Even split
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Total:{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  allocationSum !== effectiveSize
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {allocationSum}
              </span>{" "}
              / {effectiveSize}
            </p>
          </div>
        </div>
      ) : null}

      {/* Validation message */}
      {poolHint ? (
        <div className="border-b border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="px-4 py-1.5 text-[11px] text-amber-900 dark:text-amber-200 sm:px-5">
            {poolHint}
          </p>
        </div>
      ) : null}

      {/* Main action row */}
      <div className="px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {/* Paper length buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {EXAM_QUESTION_SET_SIZES.map((size) => {
                const active = setSize === size;
                const achievable = Math.min(size, totalPool);
                const disabled =
                  totalPool === 0 || !examSessionMeetsMinimum(totalPool, achievable);
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSetSize(size)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-all",
                      disabled
                        ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
                        : active
                          ? "border-accent/50 bg-accent/[0.08] text-foreground ring-1 ring-accent/20"
                          : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-border/70" />

            {/* Difficulty buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {(
                [
                  { mode: "mixed" as const, label: "Mix" },
                  { mode: "easy" as const, label: "Easy" },
                  { mode: "medium" as const, label: "Med" },
                  { mode: "hard" as const, label: "Hard" },
                ] as const
              ).map(({ mode, label }) => {
                const active = difficultyMode === mode;
                const poolForMode = selectedTopicIds.reduce(
                  (s, id) => s + getTopicExamAllocCap(id, mode, sharedCurriculum),
                  0
                );
                const disabled = poolForMode === 0;
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDifficultyMode(mode)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all",
                      disabled
                        ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
                        : active
                          ? "border-accent/50 bg-accent/[0.08] text-foreground ring-1 ring-accent/20"
                          : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Split button — multi-topic only */}
            {selectedTopicIds.length > 1 ? (
              <>
                <div className="h-4 w-px bg-border/70" />
                <button
                  type="button"
                  onClick={() => setSplitOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all",
                    splitOpen
                      ? "border-accent/50 bg-accent/[0.08] text-foreground ring-1 ring-accent/20"
                      : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                  )}
                >
                  Split
                  <ChevronDown
                    size={12}
                    className={cn(
                      "transition-transform duration-200",
                      splitOpen && "rotate-180"
                    )}
                  />
                </button>
              </>
            ) : null}
          </div>

          {/* Desktop spacer */}
          <span className="hidden flex-1 sm:block" />

          {/* Stats + Clear + Start */}
          <div className="flex items-center gap-2.5">
            {onClear ? (
              <>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
                <span className="h-3.5 w-px bg-border/70" />
              </>
            ) : null}
            <span className="text-[12px] tabular-nums text-muted-foreground">
              {effectiveSize} q · {previewMinutes} min
            </span>
            <Button
              type="button"
              size="sm"
              disabled={!canStart}
              onClick={handleStart}
              className="gap-1.5"
            >
              <Target size={14} />
              <span className="hidden sm:inline">Start timed session</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
