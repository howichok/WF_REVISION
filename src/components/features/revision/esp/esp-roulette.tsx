"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, Play } from "lucide-react";
import { ESP_SCENARIOS } from "@/data/esp/scenarios";
import { ESP_TASK_STEPS, getEspScenarioTaskHref } from "@/components/features/revision/esp/esp-task-meta";
import type { EspTask } from "@/data/curriculum";
import { Button } from "@/components/ui";
import { SPRING, SPRING_SNAP } from "@/components/features/revision/esp/native/micro";

const TASK_IDS: EspTask[] = ["pre_release", "task_1", "task_2", "task_3", "task_4a", "task_4b"];

const SPIN_MS = 1500;

export function EspRoulette() {
  const [phase, setPhase] = useState<"idle" | "spinning" | "revealed">("idle");
  const [pick, setPick] = useState<{ scenarioId: string; taskId: EspTask } | null>(null);
  const [tick, setTick] = useState(0);

  const scenarios = ESP_SCENARIOS;
  const taskLabels = useMemo(
    () =>
      Object.fromEntries(ESP_TASK_STEPS.map((s) => [s.id, s.label])) as Record<EspTask, string>,
    []
  );

  function spin() {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const taskId = TASK_IDS[Math.floor(Math.random() * TASK_IDS.length)]!;
    if (!scenario) return;
    setPick({ scenarioId: scenario.id, taskId });
    setPhase("spinning");
    setTick((t) => t + 1);
    window.setTimeout(() => setPhase("revealed"), SPIN_MS);
  }

  const href = pick ? getEspScenarioTaskHref(pick.scenarioId, pick.taskId) : "/revision/esp";
  const scenarioTitle = scenarios.find((s) => s.id === pick?.scenarioId)?.title ?? "—";
  const taskLabel = pick ? taskLabels[pick.taskId] : "—";

  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card via-card/95 to-muted/15 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">ESP roulette</p>
          <h3 className="mt-1 text-lg font-bold text-foreground sm:text-xl">Random scenario + task</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Spin for a surprise practice path. You’ll work in real Word / Excel on your machine, then upload here.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={phase === "spinning" || scenarios.length === 0}
          onClick={spin}
        >
          <Dices className="size-4" />
          {phase === "spinning" ? "Spinning…" : "Spin"}
        </Button>
      </div>

      <div className="mt-4 h-[120px] overflow-hidden rounded-xl border border-border/40 bg-muted/25 shadow-inner">
        <AnimatePresence mode="wait">
          {phase === "spinning" ? (
            <motion.div
              key={`spin-${tick}`}
              initial={{ y: 0 }}
              animate={{ y: [0, -160, -320, -80, -200, 0] }}
              transition={{ duration: SPIN_MS / 1000, ease: "easeInOut" }}
              className="space-y-2 p-4 text-center text-sm font-medium text-foreground"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="text-muted-foreground">
                  {scenarios[i % scenarios.length]?.title ?? "…"} · {taskLabels[TASK_IDS[i % TASK_IDS.length]!]}
                </div>
              ))}
            </motion.div>
          ) : phase === "revealed" && pick ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={SPRING}
              className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected</p>
              <p className="text-base font-bold text-foreground">{scenarioTitle}</p>
              <p className="text-sm text-accent">{taskLabel}</p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING_SNAP}>
                <Link
                  href={href}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(103,92,241,0.5)] transition-colors hover:opacity-95"
                >
                  <Play className="size-4" />
                  Go
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground"
            >
              Press Spin to draw a scenario and task.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
