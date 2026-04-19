"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * A stack of "issue tickets". Each beat inspects one and applies its fix —
 * the ticket flips to Resolved.
 */

interface Ticket {
  id: string;
  issue: string;
  fix: string;
}

const TICKETS: Ticket[] = [
  { id: "t1", issue: "No testing stage in plan", fix: "Insert Int. test W4 + Regression W5" },
  { id: "t2", issue: "Rationale only describes", fix: "Rewrite each sentence with 'because'" },
  { id: "t3", issue: "PM assigned to Build",    fix: "Match roles to brief's skills list" },
  { id: "t4", issue: "No dependency arrows",    fix: "Add ≥ 3 'must finish before' links" },
  { id: "t5", issue: "Generic 'staff sick' risk", fix: "Name a file / role / deadline from this brief" },
];

export function MistakeCardsScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeIdx = beatIndex >= 1 && beatIndex <= TICKETS.length ? beatIndex - 1 : -1;
  const active = activeIdx >= 0 ? TICKETS[activeIdx] : null;
  useSceneCursor(active ? refs.current[active.id] ?? null : null);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {TICKETS.map((t, i) => {
        const resolved = beatIndex > i;
        const beingInspected = beatIndex === i + 1;
        return (
          <motion.div
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            animate={{
              scale: beingInspected ? 1.015 : 1,
              borderColor: resolved
                ? "var(--color-success)"
                : beingInspected
                  ? "var(--color-accent)"
                  : "rgba(127,127,127,0.4)",
            }}
            className={cn(
              "relative overflow-hidden rounded-lg border-2 bg-card p-3",
              resolved ? "bg-success/5" : ""
            )}
          >
            <div className="flex items-start gap-2 text-[11px] font-semibold">
              {resolved ? (
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
              ) : (
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-danger" />
              )}
              <span className={cn(resolved ? "text-success line-through" : "text-danger")}>{t.issue}</span>
            </div>
            <AnimatePresence>
              {beingInspected || resolved ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-1 text-[11px] text-foreground"
                >
                  <span className="mr-1 font-mono text-[9px] uppercase text-muted-foreground">fix:</span>
                  {t.fix}
                </motion.p>
              ) : null}
            </AnimatePresence>
            <span
              className={cn(
                "absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                resolved ? "bg-success/20 text-success" : "bg-danger/10 text-danger"
              )}
            >
              {resolved ? "Resolved" : "Open"}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export const MISTAKE_CARDS_BEATS = [
  { caption: "Five open tickets — the mistakes examiners see most often.", after: 800 },
  { caption: "Ticket #1: No test stage. Fix: slot Int. test and Regression in.", after: 1100 },
  { caption: "Ticket #2: Descriptive rationale. Rewrite with 'because'.", after: 1100 },
  { caption: "Ticket #3: PM shouldn't build. Rematch against the brief skills.", after: 1100 },
  { caption: "Ticket #4: No dependencies. Add at least three 'must finish' arrows.", after: 1100 },
  { caption: "Ticket #5: Generic risks. Name a file, role or deadline from the brief.", after: 1100 },
];
