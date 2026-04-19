"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { ErrorBubble } from "../../primitives/error-bubble";
import { SuccessState } from "../../primitives/success-state";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

interface FixCard {
  id: string;
  diff: string;
  correct: boolean;
}

const CARDS: FixCard[] = [
  { id: "a", diff: "if row[\"status\"] = wanted:   →   if row[\"status\"] == wanted:", correct: true },
  { id: "b", diff: "n += 1                       →   n = n + 1", correct: false },
  { id: "c", diff: "for row in reader             →   for row in list(reader)", correct: false },
];

/**
 * Buggy line shown at top. Three fix cards below. Cursor picks card by card.
 * Wrong drops bounce back; correct one snaps into the code.
 *
 * 0 initial
 * 1 cursor drags card B onto buggy line → rejected
 * 2 card B bounces back
 * 3 cursor drags card C → rejected
 * 4 card C bounces back
 * 5 cursor drags card A → accepted
 * 6 success
 */
export function FixCardsScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const codeRef = useRef<HTMLDivElement | null>(null);

  const step =
    beatIndex === 1
      ? { cardId: "b", placed: false }
      : beatIndex === 2
        ? { cardId: "b", placed: false, reject: true }
        : beatIndex === 3
          ? { cardId: "c", placed: false }
          : beatIndex === 4
            ? { cardId: "c", placed: false, reject: true }
            : beatIndex === 5
              ? { cardId: "a", placed: true }
              : beatIndex >= 6
                ? { cardId: "a", placed: true, done: true }
                : null;

  const cursorTarget = step ? codeRef.current : null;
  useSceneCursor(cursorTarget);

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <div
          ref={codeRef}
          className={cn(
            "overflow-hidden rounded-xl border-2 bg-[#1e1e1e] p-3 font-mono text-[11px] text-[#ff6b6b] transition-colors",
            step?.placed ? "border-success/60" : step?.reject ? "border-danger/60" : "border-danger/40"
          )}
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Buggy line</p>
          <p className="mt-1">
            <AnimatePresence mode="wait" initial={false}>
              {step?.placed ? (
                <motion.span
                  key="fixed"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[#5ee09c]"
                >
                  if row[&quot;status&quot;] == wanted:
                </motion.span>
              ) : (
                <motion.span
                  key="buggy"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  if row[&quot;status&quot;] = wanted:
                </motion.span>
              )}
            </AnimatePresence>
          </p>
        </div>

        {/* Fix cards */}
        <div className="grid gap-2 sm:grid-cols-3">
          {CARDS.map((c) => {
            const isRejected = (beatIndex === 2 && c.id === "b") || (beatIndex === 4 && c.id === "c");
            const isLifting =
              (beatIndex === 1 && c.id === "b") ||
              (beatIndex === 3 && c.id === "c") ||
              (beatIndex === 5 && c.id === "a");
            const locked = beatIndex >= 6 && c.id === "a";
            return (
              <motion.div
                key={c.id}
                ref={(el) => {
                  cardRefs.current[c.id] = el;
                }}
                animate={{
                  y: isLifting ? -4 : 0,
                  rotate: isRejected ? [0, -3, 3, 0] : 0,
                  scale: isLifting ? 1.03 : 1,
                  borderColor: locked
                    ? "var(--color-success)"
                    : isRejected
                      ? "var(--color-danger)"
                      : isLifting
                        ? "var(--color-accent)"
                        : "rgba(127,127,127,0.35)",
                  opacity: locked ? 0.5 : 1,
                }}
                className={cn(
                  "rounded-lg border-2 bg-card p-2 text-[10px] font-mono shadow-sm"
                )}
              >
                <p className="mb-1 text-[9px] font-sans font-bold uppercase tracking-wider text-muted-foreground">
                  Fix #{c.id.toUpperCase()}
                </p>
                {c.diff}
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ErrorBubble visible={beatIndex === 2 || beatIndex === 4} message="That fix changes style, not the bug. Rejected." />
          <SuccessState visible={beatIndex >= 6} message="Defect fixed — '=' was assignment, not comparison." />
        </div>
      </div>
    </LayoutGroup>
  );
}

export const FIX_CARDS_BEATS = [
  { caption: "A buggy line sits at the top; three candidate fixes wait below.", after: 800 },
  { caption: "Try fix B — a stylistic rewrite that doesn't fix the bug.", after: 900 },
  { caption: "Rejected. The line still uses a single '='.", after: 1000 },
  { caption: "Try fix C — materialising the iterator. Still not the bug.", after: 900 },
  { caption: "Rejected. Two out of three fixes are red herrings.", after: 900 },
  { caption: "Fix A replaces '=' with '==' — the real comparison operator.", after: 900 },
  { caption: "Accepted. The editor turns green; suite runs clean.", after: 900 },
];
