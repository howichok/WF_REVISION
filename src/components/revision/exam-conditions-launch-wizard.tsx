"use client";

import { useEffect, useMemo, useState } from "react";
import { Target } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  EXAM_CONDITIONS_SESSION_MAX_QUESTIONS,
  getExamConditionsPoolStats,
  resolveExamConditionsQuestionCount,
  type ExamConditionsDifficultyMode,
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
  topicId: string;
  onStart: (options: { questionCount: number; difficultyMode: ExamConditionsDifficultyMode }) => void;
}

export function ExamConditionsLaunchWizard({ topicId, onStart }: ExamConditionsLaunchWizardProps) {
  const { sharedCurriculum } = useAppData();
  const poolStats = useMemo(
    () => getExamConditionsPoolStats(topicId, sharedCurriculum),
    [topicId, sharedCurriculum]
  );
  const [difficultyMode, setDifficultyMode] = useState<ExamConditionsDifficultyMode>("mixed");
  const [userQuestionCount, setUserQuestionCount] = useState<number | undefined>(undefined);

  const modeMaxQuestions = useMemo(() => {
    switch (difficultyMode) {
      case "easy":
        return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolStats.easyCount);
      case "medium":
        return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolStats.mediumCount);
      case "hard":
        return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolStats.hardCount);
      default:
        return poolStats.maxSessionQuestions;
    }
  }, [difficultyMode, poolStats]);

  const defaultCountForMode = useMemo(
    () => resolveExamConditionsQuestionCount(modeMaxQuestions),
    [modeMaxQuestions]
  );

  const resolvedDisplayCount = userQuestionCount ?? defaultCountForMode;

  useEffect(() => {
    setDifficultyMode("mixed");
    setUserQuestionCount(undefined);
  }, [topicId]);

  useEffect(() => {
    if (userQuestionCount === undefined || modeMaxQuestions === 0) {
      return;
    }
    if (userQuestionCount > modeMaxQuestions) {
      setUserQuestionCount(modeMaxQuestions);
    }
  }, [modeMaxQuestions, userQuestionCount]);

  const topicInfo = getTopicById(topicId);
  const previewMinutes = useMemo(() => {
    const n = Math.max(1, Math.min(modeMaxQuestions, resolvedDisplayCount));
    return Math.max(25, Math.round(n * 2.4));
  }, [modeMaxQuestions, resolvedDisplayCount]);

  function handleStart() {
    if (modeMaxQuestions === 0) {
      return;
    }
    const count = Math.max(1, Math.min(modeMaxQuestions, resolvedDisplayCount));
    onStart({ questionCount: count, difficultyMode });
  }

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
            Configure exam session
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {topicInfo?.icon ? `${topicInfo.icon} ` : ""}
            <span className="font-medium text-foreground">{topicInfo?.label ?? topicId}</span>
            {" · ~"}
            {previewMinutes} min timer
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Difficulty</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { mode: "mixed" as const, label: "Mixed", count: poolStats.poolSize },
              { mode: "easy" as const, label: "Easy", count: poolStats.easyCount },
              { mode: "medium" as const, label: "Medium", count: poolStats.mediumCount },
              { mode: "hard" as const, label: "Hard", count: poolStats.hardCount },
            ] as const
          ).map(({ mode, label, count }) => {
            const active = difficultyMode === mode;
            const disabled = mode === "mixed" ? poolStats.poolSize === 0 : count === 0;
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
                  {count} in topic
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <Input
          type="number"
          label="Number of questions"
          min={1}
          max={Math.max(1, modeMaxQuestions)}
          value={modeMaxQuestions === 0 ? "" : resolvedDisplayCount}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setUserQuestionCount(undefined);
              return;
            }
            const value = parseInt(raw, 10);
            if (!Number.isFinite(value)) {
              return;
            }
            setUserQuestionCount(Math.max(1, Math.min(modeMaxQuestions, value)));
          }}
          disabled={modeMaxQuestions === 0}
          hint={
            poolStats.poolSize === 0
              ? "No questions in this topic yet."
              : difficultyMode === "mixed"
                ? `Between 1 and ${modeMaxQuestions} (full topic pool).`
                : `Between 1 and ${modeMaxQuestions} for ${difficultyModeLabel(difficultyMode).toLowerCase()} questions.`
          }
          className="tabular-nums"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border/50 pt-6">
        <div className="flex min-w-[5rem] flex-1 flex-col rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {modeMaxQuestions === 0 ? "—" : Math.min(modeMaxQuestions, resolvedDisplayCount)}
          </span>
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

      <Button type="button" className="mt-6 w-full gap-2 sm:w-auto" disabled={modeMaxQuestions === 0} onClick={handleStart}>
        <Target size={16} />
        Start exam
      </Button>
    </div>
  );
}
