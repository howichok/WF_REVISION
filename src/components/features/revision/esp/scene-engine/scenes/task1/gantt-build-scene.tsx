"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import type { SceneProps } from "../../registry";

/**
 * Real week-grid Gantt. Each beat drags a stage bar onto its row and sizes it
 * to span the correct weeks.
 */

interface BarPlan {
  id: string;
  label: string;
  startWeek: number;
  span: number;
  color: string;
}

const WEEKS = 6;

const BARS: BarPlan[] = [
  { id: "req",     label: "Requirements",    startWeek: 1, span: 1, color: "#2563eb" },
  { id: "data",    label: "Data design",     startWeek: 2, span: 1, color: "#16a34a" },
  { id: "ui",      label: "UI design",       startWeek: 2, span: 1, color: "#0ea5e9" },
  { id: "build",   label: "Build",           startWeek: 3, span: 2, color: "#9333ea" },
  { id: "test",    label: "Integration test",startWeek: 4, span: 1, color: "#f59e0b" },
  { id: "regress", label: "Regression",      startWeek: 5, span: 1, color: "#ea580c" },
  { id: "hand",    label: "Handover",        startWeek: 6, span: 1, color: "#dc2626" },
];

export function GanttBuildScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeBar = beatIndex >= 1 && beatIndex <= BARS.length ? BARS[beatIndex - 1]! : null;
  const cursorTarget = activeBar ? cellRefs.current[`${activeBar.id}-start`] ?? null : null;
  useSceneCursor(cursorTarget);

  return (
    <div
      ref={gridRef}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-card"
    >
      {/* Header row */}
      <div
        className="grid border-b border-border/40 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        style={{ gridTemplateColumns: `160px repeat(${WEEKS}, 1fr)` }}
      >
        <div className="px-2 py-1.5">Stage</div>
        {Array.from({ length: WEEKS }).map((_, i) => (
          <div key={i} className="border-l border-border/30 px-2 py-1.5 text-center">
            W{i + 1}
          </div>
        ))}
      </div>
      {/* Body */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `160px repeat(${WEEKS}, 1fr)` }}
      >
        {BARS.map((b, i) => {
          const placed = beatIndex > i;
          const isActive = beatIndex === i + 1;
          return (
            <div key={b.id} className="contents">
              <div
                className={`border-b border-r border-border/30 px-2 py-2 text-[11px] font-medium ${
                  placed ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {b.label}
              </div>
              {Array.from({ length: WEEKS }).map((_, w) => {
                const weekIdx = w + 1;
                const isStart = weekIdx === b.startWeek;
                const isInside = weekIdx >= b.startWeek && weekIdx < b.startWeek + b.span;
                return (
                  <div
                    key={w}
                    ref={
                      isStart
                        ? (el) => {
                            cellRefs.current[`${b.id}-start`] = el;
                          }
                        : undefined
                    }
                    className={`relative h-[34px] border-b border-l border-border/30 ${
                      isActive && isInside ? "bg-accent/5" : ""
                    }`}
                  >
                    {isStart ? (
                      <AnimatePresence>
                        {placed || isActive ? (
                          <motion.div
                            key="bar"
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{
                              opacity: 1,
                              scaleX: 1,
                              width: `calc(${b.span * 100}% + ${(b.span - 1) * 1}px)`,
                            }}
                            exit={{ opacity: 0, scaleX: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              backgroundColor: b.color,
                              transformOrigin: "left center",
                            }}
                            className="absolute left-1 top-1.5 flex h-[22px] items-center rounded px-2 text-[10px] font-semibold text-white shadow-sm"
                          >
                            <span className="truncate">{b.label}</span>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const GANTT_BUILD_BEATS = [
  { caption: "An empty six-week calendar waits for stage bars.", after: 800 },
  { caption: "Requirements sits alone in week 1.", after: 900 },
  { caption: "Data design fills week 2.", after: 900 },
  { caption: "UI design runs in parallel to data — same week.", after: 900 },
  { caption: "Build spans weeks 3 and 4 — the longest block.", after: 900 },
  { caption: "Integration test occupies week 4, overlapping the end of build.", after: 900 },
  { caption: "Regression takes week 5, ring-fencing the handover.", after: 900 },
  { caption: "Handover closes out week 6. The Gantt is real, not a guess.", after: 900 },
];
