"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Beaker, CheckCircle2 } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import type { SceneProps } from "../../registry";

/**
 * Start with a single giant "Build" block across weeks 3–6. Each beat slices
 * in a new test block, shrinking Build. A coverage meter climbs with each
 * insertion.
 */

interface Block {
  id: string;
  label: string;
  color: string;
  start: number;
  span: number;
}

const WEEKS = 6;

function stateAtBeat(beat: number): { blocks: Block[]; coverage: number } {
  // Always start with requirements + design + build + handover
  const base: Block[] = [
    { id: "req",   label: "Requirements", color: "#2563eb", start: 1, span: 1 },
    { id: "des",   label: "Design",       color: "#0ea5e9", start: 2, span: 1 },
    { id: "build", label: "Build",        color: "#9333ea", start: 3, span: 4 }, // weeks 3-6
    { id: "hand",  label: "Handover",     color: "#dc2626", start: 6, span: 1 },
  ];

  if (beat === 0) return { blocks: base, coverage: 0 };

  const blocks = base.map((b) => ({ ...b }));
  const buildBlock = blocks.find((b) => b.id === "build")!;

  // Beat 1: Integration test in week 4 → Build becomes 3 + 5-only (span 1, start 3) +
  // but we keep it simple: Build splits into Build_a (W3-4) + shrinks; insert "Int test" W4
  // Easier: shrink Build to start 3 span 1 (only W3), add blocks for W4=IntTest, W5=Build2, W6=Handover
  if (beat >= 1) {
    buildBlock.span = 1; // only W3
    blocks.push({ id: "int", label: "Int. test", color: "#f59e0b", start: 4, span: 1 });
    // Build continues W5
    blocks.push({ id: "build2", label: "Build", color: "#9333ea", start: 5, span: 1 });
  }
  if (beat >= 2) {
    // Insert Regression W5 -> remove build2 by shrinking the handover already at W6
    const b2 = blocks.find((b) => b.id === "build2");
    if (b2) b2.span = 0; // hide
    blocks.push({ id: "reg", label: "Regression", color: "#ea580c", start: 5, span: 1 });
  }
  if (beat >= 3) {
    // Insert UAT W6 start -> handover shrinks
    const hand = blocks.find((b) => b.id === "hand");
    if (hand) hand.span = 0;
    blocks.push({ id: "uat",  label: "UAT",       color: "#14b8a6", start: 6, span: 1 });
  }

  const testCount = blocks.filter(
    (b) => b.span > 0 && /test|regression|uat/i.test(b.label)
  ).length;
  const coverage = Math.min(100, testCount * 33);
  return { blocks, coverage };
}

export function TestingLaneScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const state = stateAtBeat(beatIndex);
  const meterRef = useRef<HTMLDivElement | null>(null);
  useSceneCursor(beatIndex > 0 && beatIndex < 4 ? meterRef.current : null);

  return (
    <div className="space-y-3">
      {/* Timeline */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div
          className="grid border-b border-border/40 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}
        >
          {Array.from({ length: WEEKS }).map((_, i) => (
            <div key={i} className="border-l border-border/30 px-2 py-1.5 text-center first:border-l-0">
              Week {i + 1}
            </div>
          ))}
        </div>
        <div
          className="relative grid h-14"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}
        >
          {Array.from({ length: WEEKS }).map((_, i) => (
            <div key={i} className="border-l border-border/20 first:border-l-0" />
          ))}
          <AnimatePresence>
            {state.blocks
              .filter((b) => b.span > 0)
              .map((b) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="absolute top-1.5 flex h-[44px] items-center justify-center rounded-md px-2 text-[10px] font-semibold text-white shadow-sm"
                  style={{
                    left: `calc(${((b.start - 1) / WEEKS) * 100}% + 4px)`,
                    width: `calc(${(b.span / WEEKS) * 100}% - 8px)`,
                    backgroundColor: b.color,
                  }}
                >
                  {b.label}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Coverage meter */}
      <div ref={meterRef} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2">
        <Shield className="size-4 text-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Testing coverage
        </span>
        <div className="ml-2 h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            animate={{ width: `${state.coverage}%` }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#14b8a6]"
          />
        </div>
        <span className="min-w-9 text-right text-[11px] font-bold tabular-nums text-foreground">
          {state.coverage}%
        </span>
        {state.coverage >= 90 ? <CheckCircle2 className="size-4 text-success" /> : <Beaker className="size-4 text-muted-foreground" />}
      </div>
    </div>
  );
}

export const TESTING_LANE_BEATS = [
  { caption: "A naïve plan: one giant Build block, testing only at the end. Coverage is 0%.", after: 1000 },
  { caption: "Slice Int. test into week 4 — it covers the import module before the rest is built.", after: 1000 },
  { caption: "Regression in week 5 catches bugs introduced by fixes.", after: 1000 },
  { caption: "UAT in week 6 gives the client a sign-off window before handover.", after: 1000 },
];
