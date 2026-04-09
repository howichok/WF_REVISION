"use client";

import { useEffect, useMemo, useState } from "react";
import { Target } from "lucide-react";
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

function difficultyModeLabel(mode: ExamConditionsDifficultyMode): string {
  switch (mode) {
    case "mixed":
      return "Mixed";
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    default:
      return mode;
  }
}

export interface ExamConditionsLaunchWizardProps {
  /** Topic ids in the order the learner picked them (first = primary route segment). */
  selectedTopicIds: string[];
  onStart: (options: {
    setSize: ExamQuestionSetSize;
    difficultyMode: ExamConditionsDifficultyMode;
    allocations: ExamTopicAllocationInput[];
  }) => void;
}

export function ExamConditionsLaunchWizard({
  selectedTopicIds,
  onStart,
}: ExamConditionsLaunchWizardProps) {
  const { sharedCurriculum } = useAppData();
  const [difficultyMode, setDifficultyMode] = useState<ExamConditionsDifficultyMode>("mixed");
  const [setSize, setSetSize] = useState<ExamQuestionSetSize>(10);
  const [allocByTopic, setAllocByTopic] = useState<Record<string, number>>({});

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
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur-sm sm:p-8",
        "ring-1 ring-accent/10"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Step 2</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Configure exam questions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose paper length (10 / 20 / 30), split questions across your topics, then start a timed session.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paper length</p>
        <div className="flex flex-wrap gap-2">
          {EXAM_QUESTION_SET_SIZES.map((size) => {
            const active = setSize === size;
            const achievable = Math.min(size, totalPool);
            const disabled = totalPool === 0 || !examSessionMeetsMinimum(totalPool, achievable);
            return (
              <button
                key={size}
                type="button"
                disabled={disabled}
                onClick={() => setSetSize(size)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-left text-[13px] font-semibold transition-all",
                  disabled
                    ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
                    : active
                      ? "border-accent/50 bg-accent/[0.08] text-foreground shadow-sm ring-1 ring-accent/20"
                      : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                )}
              >
                {size} questions
                <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-muted-foreground">
                  min {EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} when the pool allows
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Difficulty</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { mode: "mixed" as const, label: "Mixed" },
              { mode: "easy" as const, label: "Easy" },
              { mode: "medium" as const, label: "Medium" },
              { mode: "hard" as const, label: "Hard" },
            ] as const
          ).map(({ mode, label }) => {
            const active = difficultyMode === mode;
            const poolForMode = selectedTopicIds.reduce((s, id) => {
              const c = getTopicExamAllocCap(id, mode, sharedCurriculum);
              return s + c;
            }, 0);
            const disabled = poolForMode === 0;
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() => setDifficultyMode(mode)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-left text-[12px] font-medium transition-all",
                  disabled
                    ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
                    : active
                      ? "border-accent/50 bg-accent/[0.08] text-foreground shadow-sm ring-1 ring-accent/20"
                      : "border-border/70 bg-background text-muted-foreground hover:border-accent/25 hover:bg-muted/20"
                )}
              >
                <span className="block text-foreground">{label}</span>
                <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-muted-foreground">
                  {poolForMode} available
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTopicIds.length > 1 ? (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Questions per topic
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total <span className="font-semibold tabular-nums text-foreground">{allocationSum}</span> /{" "}
                <span className="tabular-nums">{effectiveSize}</span>
                {effectiveSize < setSize ? (
                  <span className="text-muted-foreground"> (capped from {setSize} by pool)</span>
                ) : null}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setAllocByTopic(splitExamAllocationsEvenly(selectedTopicIds, effectiveSize))}>
              Split evenly
            </Button>
          </div>
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
            {selectedTopicIds.map((id) => {
              const topic = getTopicById(id);
              const cap = caps[id] ?? 0;
              return (
                <label key={id} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="min-w-[8rem] font-medium text-foreground">
                    {topic?.icon ? `${topic.icon} ` : ""}
                    {topic?.label ?? id}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={cap}
                    value={allocByTopic[id] ?? 0}
                    onChange={(e) => setTopicAlloc(id, Number.parseInt(e.target.value, 10) || 0)}
                    className="h-9 w-20 rounded-lg border border-border/80 bg-background px-2 text-center text-sm tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">max {cap}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : selectedTopicIds.length === 1 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          You will get {effectiveSize} question{effectiveSize === 1 ? "" : "s"} from{" "}
          <span className="font-medium text-foreground">{getTopicById(selectedTopicIds[0]!)?.label}</span>
          {effectiveSize < setSize ? ` (pool limit; you chose a ${setSize}-question paper).` : "."}
        </p>
      ) : null}

      {poolHint ? (
        <p className="mt-4 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs text-amber-900">
          {poolHint}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border/50 pt-6">
        <div className="flex min-w-[5rem] flex-1 flex-col rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{effectiveSize}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Questions</span>
        </div>
        <div className="flex min-w-[5rem] flex-1 flex-col rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{previewMinutes}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Minutes</span>
        </div>
        <div className="flex min-w-[5rem] flex-1 flex-col rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-center">
          <span className="text-lg font-bold text-foreground">
            {difficultyMode === "mixed" ? "Mix" : difficultyModeLabel(difficultyMode)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Level</span>
        </div>
      </div>

      <Button type="button" className="mt-6 w-full gap-2 sm:w-auto" disabled={!canStart} onClick={handleStart}>
        <Target size={16} />
        Start timed session
      </Button>
    </div>
  );
}
