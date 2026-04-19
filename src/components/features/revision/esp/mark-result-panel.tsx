"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Lightbulb,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { PlanMarkCriterion, PlanMarkResult } from "@/lib/esp/plan-marker";
import { SPRING, SPRING_SNAP } from "@/components/features/revision/esp/native/micro";
import { cn } from "@/lib/utils";
import { useState } from "react";

const BAND_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  distinction: { bg: "bg-[#21a366]/15 border-[#21a366]/40", text: "text-[#21a366]", label: "Distinction" },
  merit: { bg: "bg-accent/15 border-accent/40", text: "text-accent", label: "Merit" },
  pass: { bg: "bg-success/15 border-success/40", text: "text-success", label: "Pass" },
  borderline: { bg: "bg-warning/15 border-warning/40", text: "text-warning", label: "Borderline" },
  not_yet: { bg: "bg-danger/15 border-danger/40", text: "text-danger", label: "Not yet" },
};

export function MarkResultPanel({
  result,
  heading = "AI mark",
}: {
  result: PlanMarkResult;
  heading?: string;
}) {
  const band = BAND_STYLE[result.overallBand] ?? BAND_STYLE.not_yet!;
  const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={SPRING}
      className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-[0_16px_48px_-24px_rgba(17,24,39,0.2)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-accent" />
            <h3 className="text-lg font-bold text-foreground">{heading}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{result.summaryFeedback}</p>
        </div>
        <div className={cn("flex flex-col items-center rounded-xl border px-5 py-3 text-center", band.bg)}>
          <p className={cn("text-2xl font-bold tabular-nums", band.text)}>
            {result.totalScore}/{result.maxScore}
          </p>
          <p className={cn("text-xs font-semibold uppercase tracking-wider", band.text)}>{band.label}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Overall score</span>
          <span className="tabular-nums text-foreground">{pct}%</span>
        </div>
        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              pct >= 80 ? "from-[#21a366] to-success" : pct >= 60 ? "from-accent to-[#6ee7b7]" : "from-warning to-danger"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {result.criteria.map((c) => (
          <CriterionCard
            key={c.id}
            criterion={c}
            expanded={expanded === c.id}
            onToggle={() => setExpanded((prev) => (prev === c.id ? null : c.id))}
          />
        ))}
      </div>

      {result.improvementPriority.length > 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <Lightbulb className="size-4" />
            Top improvements (in order of impact)
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground/90">
            {result.improvementPriority.map((p, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, ...SPRING }}
              >
                {p}
              </motion.li>
            ))}
          </ol>
        </div>
      ) : null}
    </motion.div>
  );
}

function CriterionCard({
  criterion,
  expanded,
  onToggle,
}: {
  criterion: PlanMarkCriterion;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { verdict, score, maxScore, label, feedback, modelAnswer, cells } = criterion;
  const icon =
    verdict === "strong" ? (
      <CheckCircle2 className="size-4 shrink-0 text-success" />
    ) : verdict === "ok" ? (
      <CheckCircle2 className="size-4 shrink-0 text-[#21a366]" />
    ) : verdict === "weak" ? (
      <AlertTriangle className="size-4 shrink-0 text-warning" />
    ) : (
      <XCircle className="size-4 shrink-0 text-danger" />
    );

  const bg =
    verdict === "strong"
      ? "border-success/30 bg-success/8"
      : verdict === "ok"
        ? "border-[#21a366]/30 bg-[#21a366]/8"
        : verdict === "weak"
          ? "border-warning/30 bg-warning/8"
          : "border-danger/30 bg-danger/8";

  return (
    <motion.div layout transition={SPRING} className={cn("overflow-hidden rounded-xl border", bg)}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        {icon}
        <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
        {cells.length > 0 ? (
          <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            {cells.length} annotation{cells.length > 1 ? "s" : ""}
          </span>
        ) : null}
        <span className="ml-1 rounded-md bg-background/60 px-2 py-0.5 text-xs font-bold tabular-nums text-foreground">
          {score}/{maxScore}
        </span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={SPRING_SNAP} className="ml-1 text-muted-foreground">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-black/10 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feedback</p>
                <p className="mt-1 text-sm text-foreground">{feedback}</p>
              </div>
              {cells.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annotations</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cells.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-border/60 bg-background px-2 py-0.5 font-mono text-xs text-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {modelAnswer ? (
                <div className="rounded-lg border border-[#21a366]/30 bg-[#21a366]/10 px-3 py-2.5">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#21a366]">
                    <Sparkles className="size-3" />
                    Model answer
                  </p>
                  <p className="text-sm italic text-foreground/90">{modelAnswer}</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function MarkingPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center"
    >
      <CircleDot className="size-10 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}
