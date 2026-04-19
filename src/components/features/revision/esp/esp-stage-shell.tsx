"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  ClipboardList,
  Wrench,
  PencilRuler,
  Code2,
  ClipboardCheck,
  Gauge,
  X,
  ListChecks,
  ChevronLeft,
} from "lucide-react";
import type { EspTask } from "@/data/curriculum";
import { getEspTaskLesson } from "@/data/esp/esp-task-lessons";
import type { EspScenario } from "@/data/esp/scenarios/types";
import { ESP_STAGE_ORDER } from "@/data/esp/scenarios/types";
import { ESP_TASK_STEPS, getEspScenarioTaskHref } from "@/components/features/revision/esp/esp-task-meta";
import { rubricForTask } from "@/lib/esp/rubric";
import { getEspStoreSnapshotForRubric } from "@/store/esp-session-store";
import { AnimatedNumber, SPRING, SPRING_SNAP } from "@/components/features/revision/esp/native/micro";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EspStageShellProps {
  scenario: EspScenario;
  taskId: EspTask;
  children: ReactNode;
}

const STAGE_ICONS: Record<EspTask, typeof FileText> = {
  pre_release: FileText,
  task_1: ClipboardList,
  task_2: Wrench,
  task_3: PencilRuler,
  task_4a: Code2,
  task_4b: ClipboardCheck,
};

export function EspStageShell({ scenario, taskId, children }: EspStageShellProps) {
  const lesson = getEspTaskLesson(taskId);
  const step = ESP_TASK_STEPS.find((s) => s.id === taskId);
  const rubric = rubricForTask(taskId, scenario, getEspStoreSnapshotForRubric(taskId, scenario.id));
  const pct = rubric.max > 0 ? Math.round((rubric.score / rubric.max) * 100) : 0;
  const currentIndex = ESP_STAGE_ORDER.indexOf(taskId);
  const prev = ESP_STAGE_ORDER[currentIndex - 1];
  const next = ESP_STAGE_ORDER[currentIndex + 1];
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-background p-5 shadow-sm sm:p-6"
      >
        <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 size-72 rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-success/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{scenario.title}</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {step?.label}: {step?.action}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{scenario.vocationalContext}</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_SNAP}
              type="button"
              onClick={() => setDrawerOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-colors",
                drawerOpen ? "border-accent bg-accent/15 text-accent" : "border-border/70 bg-card text-foreground hover:bg-muted/60"
              )}
            >
              <Gauge className="size-4" />
              Rubric
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
                <AnimatedNumber value={rubric.score} />/{rubric.max}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Rubric strip */}
        <div className="relative mt-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Progress on this stage</span>
            <span className="tabular-nums text-foreground">
              <AnimatedNumber value={pct} />%
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="relative h-full rounded-full bg-gradient-to-r from-success via-accent to-warning"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                aria-hidden
                className="absolute inset-y-0 -right-1 w-3 rounded-full bg-white/70 blur-sm"
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Desktop: vertical stage wizard */}
        <aside className="hidden shrink-0 lg:block lg:w-56 xl:w-60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stage wizard</p>
          <p className="mt-1 text-xs text-muted-foreground">Click a stage to jump. You’re on step {currentIndex + 1} of 6.</p>
          <nav aria-label="ESP stages — vertical" className="sticky top-4 mt-4 space-y-1 rounded-2xl border border-border/60 bg-card/70 p-2 shadow-sm">
            {ESP_STAGE_ORDER.map((tid, i) => {
              const meta = ESP_TASK_STEPS.find((s) => s.id === tid);
              const active = tid === taskId;
              const done = i < currentIndex;
              const Icon = STAGE_ICONS[tid];
              const href = getEspScenarioTaskHref(scenario.id, tid);
              return (
                <Link
                  key={tid}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-accent bg-accent/12 text-foreground shadow-[0_6px_20px_-12px_rgba(139,92,246,0.45)]"
                      : done
                        ? "border-success/35 bg-success/8 text-foreground hover:border-success/50"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      active && "bg-accent text-white",
                      done && !active && "bg-success/25 text-success",
                      !active && !done && "bg-muted text-muted-foreground"
                    )}
                  >
                    {done && !active ? <CheckCircle2 className="size-4" /> : <span className="tabular-nums">{i + 1}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-foreground">
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{meta?.label ?? tid}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{meta?.action}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          {/* Mobile / tablet: horizontal stepper */}
          <nav aria-label="ESP stages — horizontal" className="relative lg:hidden">
            <div className="flex items-stretch gap-1.5 overflow-x-auto rounded-2xl border border-border/60 bg-card/60 p-2 shadow-sm backdrop-blur sm:gap-2">
              {ESP_STAGE_ORDER.map((tid, i) => {
                const meta = ESP_TASK_STEPS.find((s) => s.id === tid);
                const active = tid === taskId;
                const done = i < currentIndex;
                const Icon = STAGE_ICONS[tid];
                const href = getEspScenarioTaskHref(scenario.id, tid);
                return (
                  <motion.div
                    key={tid}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, ...SPRING }}
                    whileHover={active ? undefined : { y: -2 }}
                    className="flex-1"
                  >
                    <Link
                      href={href}
                      className={cn(
                        "group relative flex min-w-[9.5rem] items-center gap-3 overflow-hidden rounded-xl border px-3 py-2 transition-colors",
                        active
                          ? "border-accent bg-gradient-to-br from-accent/12 to-accent/5 text-foreground shadow-[0_8px_24px_-14px_rgba(139,92,246,0.5)]"
                          : done
                            ? "border-success/40 bg-success/10 text-foreground hover:border-success/60"
                            : "border-border/70 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <motion.span
                        animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                        transition={active ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : SPRING}
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          active && "bg-accent text-white shadow-[0_6px_18px_-6px_rgba(139,92,246,0.55)]",
                          done && !active && "bg-success/20 text-success",
                          !active && !done && "bg-muted text-muted-foreground"
                        )}
                      >
                        {done && !active ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                      </motion.span>
                      <div className="min-w-0">
                        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", active ? "text-accent" : "text-muted-foreground")}>
                          Stage {i + 1}
                        </p>
                        <p className="truncate text-[13px] font-medium">{meta?.label ?? tid}</p>
                      </div>
                      {active ? <motion.span layoutId="stage-bar" className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
                      {!active ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                        />
                      ) : null}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </nav>

          <motion.div
            key={taskId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-card/80 to-muted/20 px-4 py-3 text-sm shadow-sm">
        {prev ? (
          <Link
            href={getEspScenarioTaskHref(scenario.id, prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous:</span>
            {ESP_TASK_STEPS.find((s) => s.id === prev)?.label}
          </Link>
        ) : (
          <span />
        )}
        <p className="text-xs text-muted-foreground">
          {step?.deliverable} · {lesson.introLead.slice(0, 92)}…
        </p>
        {next ? (
          <Link
            href={getEspScenarioTaskHref(scenario.id, next)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:translate-x-0.5"
          >
            <span className="hidden sm:inline">Next:</span>
            {ESP_TASK_STEPS.find((s) => s.id === next)?.label}
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <Link
            href={`/revision/esp`}
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Finish scenario
            <CheckCircle2 className="size-4" />
          </Link>
        )}
          </div>
        </div>
      </div>

      {/* Floating rubric drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              aria-hidden
            />
            <motion.aside
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-card/98 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.35)] backdrop-blur-md"
            >
              <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Gauge className="size-4 text-accent" />
                    Rubric · {step?.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rubric.score}/{rubric.max} points · {pct}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  aria-label="Close rubric drawer"
                >
                  <X className="size-4" />
                </button>
              </header>
              <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-success via-accent to-warning"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>

                {rubric.hits.length > 0 ? (
                  <section>
                    <p className="flex items-center gap-2 text-xs font-semibold text-success">
                      <CheckCircle2 className="size-3.5" />
                      Evidence captured
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {rubric.hits.map((h) => (
                        <li key={h} className="flex gap-2 rounded-md border border-success/20 bg-success/10 px-2 py-1.5 text-xs text-foreground">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {rubric.missing.length > 0 ? (
                  <section>
                    <p className="flex items-center gap-2 text-xs font-semibold text-warning">
                      <ListChecks className="size-3.5" />
                      Next actions
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {rubric.missing.map((m) => (
                        <li key={m} className="flex gap-2 rounded-md border border-warning/25 bg-warning/10 px-2 py-1.5 text-xs text-foreground">
                          <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-warning" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="border-t border-border/60 pt-4">
                  <p className="text-xs font-semibold text-foreground">Deliverable</p>
                  <p className="mt-1 text-xs text-muted-foreground">{step?.deliverable}</p>
                </section>

                <section className="rounded-lg bg-muted/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Why this stage</p>
                  <p className="mt-1 text-xs italic text-muted-foreground">{lesson.introLead}</p>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source grounding</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{scenario.sourceNote}</p>
                </section>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

