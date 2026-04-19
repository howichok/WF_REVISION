"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, CircleCheck, CircleX } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { AnimatedButton } from "../../primitives/animated-button";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Shell-style pipeline. Three stages light up one at a time; one errors;
 * a one-character edit; green run.
 *
 *  0 pipeline idle
 *  1 Run pressed — parse step runs OK
 *  2 compute step runs OK
 *  3 print step errors (TypeError)
 *  4 editor fix (one char)
 *  5 re-run
 *  6 green end-to-end
 */

interface Stage {
  id: string;
  label: string;
  logOk: string;
  logFail?: string;
}

const STAGES: Stage[] = [
  { id: "parse",   label: "parse CSV",  logOk: "parsed 3 rows" },
  { id: "compute", label: "count",      logOk: "counter computed" },
  { id: "print",   label: "print",      logOk: "booked: 2, cancelled: 1", logFail: "TypeError: expected dict, got tuple" },
];

export function RunPipelineScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const btnRef = useRef<HTMLDivElement | null>(null);
  const codeRef = useRef<HTMLDivElement | null>(null);
  useSceneCursor(beatIndex === 0 || beatIndex === 5 ? btnRef.current : beatIndex === 4 ? codeRef.current : null);

  const stageReached = (id: string) => {
    const idx = STAGES.findIndex((s) => s.id === id);
    if (beatIndex === 0) return "idle" as const;
    if (beatIndex === 5) return "running" as const;
    if (beatIndex >= 6) return "ok" as const;
    if (beatIndex - 1 > idx) return "ok" as const;
    if (beatIndex - 1 === idx) return id === "print" && beatIndex === 3 ? "fail" : "running";
    return "idle" as const;
  };

  const runHover = beatIndex === 0;
  const runActive = beatIndex === 1 || beatIndex === 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Shell
        </p>
        <div ref={btnRef}>
          <AnimatedButton
            label="python task4a.py"
            icon={<Play className="size-3" />}
            state={runActive ? "active" : runHover ? "hover" : "idle"}
            size="sm"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-[#0f172a] p-3 font-mono text-[11px] text-[#cbd5e1]">
        <AnimatePresence initial={false}>
          {STAGES.map((s) => {
            const state = stageReached(s.id);
            if (state === "idle") return null;
            const isFail = state === "fail";
            return (
              <motion.div
                key={`${s.id}-${beatIndex}-${state}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-[#64748b]">$</span>
                <span>{s.label}</span>
                <span className="ml-auto inline-flex items-center gap-1">
                  {state === "running" ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block size-3 rounded-full border-2 border-white/20 border-t-white/80"
                    />
                  ) : isFail ? (
                    <CircleX className="size-3 text-[#ff6b6b]" />
                  ) : (
                    <CircleCheck className="size-3 text-[#5ee09c]" />
                  )}
                  <span className={cn("text-[10px]", isFail ? "text-[#ff6b6b]" : "text-[#5ee09c]")}>
                    {isFail ? s.logFail : s.logOk}
                  </span>
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Inline editor for the fix */}
      <div
        ref={codeRef}
        className={cn(
          "rounded-xl border-2 bg-[#1e1e1e] p-3 font-mono text-[11px] transition-colors",
          beatIndex === 3 ? "border-danger/60" : beatIndex >= 4 ? "border-success/60" : "border-white/10"
        )}
      >
        <p className="mb-1 text-[10px] uppercase tracking-wider text-[#94a3b8]">task4a.py — line 5</p>
        <AnimatePresence mode="wait" initial={false}>
          {beatIndex < 4 ? (
            <motion.code key="bad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[#ff6b6b]">
              print(Counter(r for r in rows))
            </motion.code>
          ) : (
            <motion.code key="good" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[#5ee09c]">
              print(Counter(r[&quot;status&quot;] for r in rows))
            </motion.code>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const RUN_PIPELINE_BEATS = [
  { caption: "Shell is ready. Run button waits.", after: 900 },
  { caption: "parse CSV — rows ingested successfully.", after: 1000 },
  { caption: "count — Counter reduces the rows.", after: 1000 },
  { caption: "print — TypeError. The iterator returns a tuple, not a field.", after: 1200 },
  { caption: "Editor: `r` becomes `r[\"status\"]`. One character changed.", after: 1000 },
  { caption: "Re-run — the shell executes cleanly from parse to print.", after: 1000 },
  { caption: "All three stages green. Done.", after: 900 },
];
