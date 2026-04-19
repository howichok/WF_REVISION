"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { SPRING_SNAP } from "@/components/features/revision/esp/native/micro";
import { cn } from "@/lib/utils";

export interface LessonStepMeta {
  id: string;
  label: string;
  emoji: string;
  practice?: boolean;
}

export function LessonStepProgress({
  trackTitle,
  steps,
  stepIdx,
  completed,
  onJump,
}: {
  trackTitle: string;
  steps: LessonStepMeta[];
  stepIdx: number;
  completed: Set<number>;
  onJump: (idx: number) => void;
}) {
  const total = steps.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{trackTitle}</span>
        <span className="tabular-nums">
          Step {stepIdx + 1} / {total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#21a366] to-accent"
          animate={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const done = completed.has(i);
          const active = i === stepIdx;
          const practice = s.practice;
          return (
            <motion.button
              key={s.id}
              whileHover={active ? undefined : { y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_SNAP}
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-accent bg-accent/15 text-accent shadow-[0_4px_12px_-6px_rgba(139,92,246,0.4)]"
                  : done
                    ? "border-[#21a366]/50 bg-[#21a366]/10 text-[#21a366]"
                    : practice
                      ? "border-warning/50 bg-warning/10 text-warning"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {done && !active ? <CheckCircle2 className="size-3" /> : <span>{s.emoji}</span>}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function StepTimerBar({ durationMs, stepKey }: { durationMs: number; stepKey: string }) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Step playthrough</span>
        <span className="tabular-nums">{Math.round(durationMs / 1000)}s</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/80">
        <motion.div
          key={stepKey}
          className="h-full rounded-full bg-accent/70"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: durationMs / 1000, ease: "linear" }}
        />
      </div>
    </div>
  );
}
