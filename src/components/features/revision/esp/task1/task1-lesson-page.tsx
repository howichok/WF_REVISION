"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  XCircle,
} from "lucide-react";
import type { EspScenario } from "@/data/esp/scenarios/types";
import { TASK1_STEPS } from "@/data/esp/task1-steps";
import { SceneRenderer } from "@/components/features/revision/esp/scene-engine/scene-renderer";
import { LessonStepProgress, StepTimerBar } from "@/components/features/revision/esp/lesson-step-progress";
import { UploadPracticePanel } from "@/components/features/revision/esp/upload-practice-panel";
import { SPRING, SPRING_SNAP } from "@/components/features/revision/esp/native/micro";
import { cn } from "@/lib/utils";

const TOTAL = TASK1_STEPS.length;
const DEFAULT_STEP_MS = 90_000;

export function Task1LessonPage({ scenario }: { scenario: EspScenario }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState<1 | -1>(1);
  const [replayKey, setReplayKey] = useState(0);

  const step = TASK1_STEPS[stepIdx]!;
  const isPractice = step.id === "practice";
  const wideStage = step.scene.data?.wide === true;

  const go = useCallback(
    (delta: 1 | -1) => {
      setDirection(delta);
      setCompleted((prev) => new Set([...prev, stepIdx]));
      setStepIdx((i) => Math.max(0, Math.min(TOTAL - 1, i + delta)));
      setReplayKey((k) => k + 1);
    },
    [stepIdx]
  );

  const jumpTo = useCallback(
    (idx: number) => {
      setDirection(idx > stepIdx ? 1 : -1);
      setCompleted((prev) => {
        const next = new Set(prev);
        for (let i = 0; i < idx; i++) next.add(i);
        return next;
      });
      setStepIdx(idx);
      setReplayKey((k) => k + 1);
    },
    [stepIdx]
  );

  const progressSteps = TASK1_STEPS.map((s) => ({
    id: s.id,
    label: s.label,
    emoji: s.emoji,
    practice: s.id === "practice",
  }));

  return (
    <div className="space-y-6">
      <LessonStepProgress
        trackTitle="Task 1: Plan the project"
        steps={progressSteps}
        stepIdx={stepIdx}
        completed={completed}
        onJump={jumpTo}
      />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.id}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 40, y: 8 }),
            center: { opacity: 1, x: 0, y: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -40, y: -8 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
          className={cn("grid gap-6", wideStage ? "lg:grid-cols-[1fr_2fr]" : "lg:grid-cols-2")}
        >
          {/* LEFT — teaching copy */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-background p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <motion.span
                  key={step.emoji}
                  initial={{ scale: 0.5, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={SPRING_SNAP}
                  className="text-3xl"
                >
                  {step.emoji}
                </motion.span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    Step {step.number} / {TOTAL} · {step.duration}
                  </p>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">{step.headline}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.lead}</p>
              {!isPractice ? <StepTimerBar durationMs={DEFAULT_STEP_MS} stepKey={step.id} /> : null}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key points</p>
              <ul className="space-y-2">
                {step.keyPoints.map((pt, i) => (
                  <motion.li
                    key={pt}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ...SPRING }}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-accent" />
                    {pt}
                  </motion.li>
                ))}
              </ul>
            </div>

            {step.weak && step.strong ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, ...SPRING }}
                  className="rounded-xl border-2 border-danger/40 bg-danger/8 p-3"
                >
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-danger">
                    <XCircle className="size-3.5" />
                    {step.weak.label}
                  </p>
                  <p className="text-xs italic leading-relaxed text-foreground/80">&ldquo;{step.weak.example}&rdquo;</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, ...SPRING }}
                  className="rounded-xl border-2 border-[#21a366]/40 bg-[#21a366]/8 p-3"
                >
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-[#21a366]">
                    <CheckCircle2 className="size-3.5" />
                    {step.strong.label}
                  </p>
                  <p className="text-xs italic leading-relaxed text-foreground/80">&ldquo;{step.strong.example}&rdquo;</p>
                </motion.div>
              </div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, ...SPRING }}
              className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3"
            >
              <span className="text-lg">💡</span>
              <p className="text-sm font-medium text-foreground">{step.takeaway}</p>
            </motion.div>

            {!isPractice ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={stepIdx === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-x-0.5 hover:bg-muted/50 disabled:opacity-40"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_SNAP}
                  type="button"
                  onClick={() => go(1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.5)] transition-all"
                >
                  {stepIdx === TOTAL - 2 ? "Start practising 🎯" : "Next step"}
                  <ArrowRight className="size-4" />
                </motion.button>
              </div>
            ) : null}
          </div>

          {/* RIGHT — object-based scene */}
          <div className="space-y-4">
            <SceneRenderer
              scenario={scenario}
              scene={step.scene}
              beats={step.beats}
              replayKey={`${step.id}-${replayKey}`}
              label={isPractice ? "Practice preview" : "Animated walkthrough"}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isPractice ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={SPRING}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-x-0.5 hover:bg-muted/50"
              >
                <ArrowLeft className="size-4" />
                Review lesson steps
              </button>
              <p className="text-sm font-semibold text-foreground">
                Scenario: <span className="text-accent">{scenario.title}</span>
              </p>
            </div>
            <UploadPracticePanel scenarioId={scenario.id} taskId="task_1" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
