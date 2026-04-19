"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, Layers, Sparkles, X } from "lucide-react";
import type { EspScenario } from "@/data/esp/scenarios/types";
import { ESP_TASK_STEPS } from "@/components/features/revision/esp/esp-task-meta";
import { getEspScenarioTaskHref } from "@/components/features/revision/esp/esp-task-meta";
import { SPRING } from "@/components/features/revision/esp/native/micro";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "wf-esp-scenario-wizard-v1-";

const STEP_COUNT = 4;

export function EspScenarioIntroWizard({
  scenario,
  currentTaskSlug,
}: {
  scenario: EspScenario;
  currentTaskSlug: string;
}) {
  const storageKey = `${STORAGE_PREFIX}${scenario.id}`;
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(storageKey)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [storageKey]);

  const goNext = () => {
    if (idx < STEP_COUNT - 1) setIdx((i) => i + 1);
    else finish();
  };

  const goBack = () => setIdx((i) => Math.max(0, i - 1));

  const openTour = () => {
    setIdx(0);
    setOpen(true);
  };

  const isLast = idx === STEP_COUNT - 1;

  const title =
    idx === 0
      ? "Welcome to this scenario"
      : idx === 1
        ? "Six stages, one journey"
        : idx === 2
          ? "Real files on your machine"
          : "You’re set";

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={openTour}>
        <Sparkles className="mr-1.5 size-3.5" />
        Scenario tour
      </Button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close wizard overlay"
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={finish}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="esp-wizard-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={SPRING}
              className="fixed left-1/2 top-1/2 z-[101] w-[min(100%-1.5rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-accent">
                  <Layers className="size-5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Scenario wizard</span>
                </div>
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 flex gap-1.5">
                {Array.from({ length: STEP_COUNT }).map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= idx ? "bg-accent" : "bg-muted")}
                  />
                ))}
              </div>

              <h2 id="esp-wizard-title" className="mt-5 text-xl font-bold text-foreground">
                {title}
              </h2>

              {idx === 0 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  You’re practising <strong className="text-foreground">{scenario.title}</strong>. {scenario.vocationalContext}
                </p>
              ) : null}

              {idx === 1 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Move through the same ESP chain as the exam: brief read → plan → fix → design → build → evaluate. Use the
                  stage wizard to jump when you need to.
                </p>
              ) : null}

              {idx === 2 ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Each stage ends with a practice step: download a Word or Excel template, complete it offline, then
                    upload here for feedback.
                  </p>
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs text-foreground">
                    <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>Marking reads your uploads — work in real Word / Excel / your editor, not inside the browser.</span>
                  </div>
                </>
              ) : null}

              {idx === 3 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  On large screens you’ll see a <strong className="text-foreground">vertical stage list</strong> on the left; on
                  phones use the horizontal strip. Open the rubric panel anytime to see checklist progress.
                </p>
              ) : null}

              {idx === 1 ? (
                <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-foreground">
                  {ESP_TASK_STEPS.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-[#21a366]" />
                      <span className="font-medium">{t.label}</span>
                      <span className="text-muted-foreground">— {t.action}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" disabled={idx === 0} onClick={goBack}>
                  Back
                </Button>
                {!isLast ? (
                  <Button type="button" size="sm" onClick={goNext} className="gap-1">
                    Next
                    <ArrowRight className="size-3.5" />
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={finish} className="gap-1">
                    Got it
                    <CheckCircle2 className="size-3.5" />
                  </Button>
                )}
              </div>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                <Link
                  href={getEspScenarioTaskHref(scenario.id, "pre_release")}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                  onClick={finish}
                >
                  Go to brief read
                </Link>
                {" · "}
                <button type="button" className="underline-offset-2 hover:underline" onClick={finish}>
                  Stay on {currentTaskSlug.replace(/-/g, " ")}
                </button>
              </p>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
