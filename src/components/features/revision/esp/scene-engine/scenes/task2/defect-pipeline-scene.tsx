"use client";

import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { AnimatedButton } from "../../primitives/animated-button";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Code editor + runner simulation.
 *
 * Beats:
 *  0 code shown, run button idle
 *  1 cursor hovers Run button (hover)
 *  2 Run pressed, test line 1 appears → FAIL on line with " = "
 *  3 editor highlights the faulty line
 *  4 cursor applies fix: "=" becomes "=="
 *  5 Run pressed again
 *  6 tests pass, green state
 */

const BUGGY_LINES = [
  "def count_status(lines, wanted):",
  "    n = 0",
  "    reader = csv.DictReader(StringIO(lines))",
  "    for row in reader:",
  "        if row[\"status\"] = wanted:",
  "            n += 1",
  "    return n",
];

const FIXED_LINES = [...BUGGY_LINES];
FIXED_LINES[4] = "        if row[\"status\"] == wanted:";

export function DefectPipelineScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const runBtnRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const faultyRef = useRef<HTMLDivElement | null>(null);

  const fixed = beatIndex >= 4;
  const lines = fixed ? FIXED_LINES : BUGGY_LINES;
  const faultyIdx = 4;

  const cursorTarget = useMemo(() => {
    if (beatIndex === 1 || beatIndex === 2) return runBtnRef.current;
    if (beatIndex === 3 || beatIndex === 4) return faultyRef.current;
    if (beatIndex === 5) return runBtnRef.current;
    return null;
  }, [beatIndex]);
  useSceneCursor(cursorTarget);

  const runHover = beatIndex === 1 || beatIndex === 5;
  const runActive = beatIndex === 2 || beatIndex === 5;
  const testPass = beatIndex >= 6;
  const testFail = beatIndex >= 2 && beatIndex <= 5;

  return (
    <div className="space-y-3">
      {/* Editor */}
      <div
        ref={editorRef}
        className="overflow-hidden rounded-xl border border-border/60 bg-[#1e1e1e] font-mono text-[11px]"
      >
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#252526] px-3 py-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[10px] text-[#cccccc]">task2.py</span>
          <div className="ml-auto">
            <div ref={runBtnRef}>
              <AnimatedButton
                label="Run tests"
                icon={<Play className="size-3" />}
                state={runActive ? "active" : runHover ? "hover" : "idle"}
                tone="primary"
                size="sm"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {lines.map((l, i) => {
            const isFaulty = i === faultyIdx && !fixed;
            return (
              <div
                key={i}
                ref={i === faultyIdx ? faultyRef : undefined}
                className={cn(
                  "flex items-start gap-2 px-2 py-0.5 transition-colors",
                  isFaulty && beatIndex >= 3 ? "bg-[#451d1d]" : "",
                  fixed && i === faultyIdx ? "bg-[#14532d]/40" : ""
                )}
              >
                <span className="w-5 shrink-0 select-none text-right text-[10px] text-[#5c5c5c]">{i + 1}</span>
                <span
                  className={cn(
                    "whitespace-pre text-[#cccccc]",
                    isFaulty && beatIndex >= 3 ? "text-[#ff6b6b]" : "",
                    fixed && i === faultyIdx ? "text-[#5ee09c]" : ""
                  )}
                >
                  {l}
                </span>
                {isFaulty && beatIndex === 3 ? (
                  <span className="ml-auto rounded bg-[#ff6b6b]/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#ff6b6b]">
                    assignment, not comparison
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Runner output */}
      <div className="rounded-xl border border-border/60 bg-card p-3">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Runner
        </p>
        <AnimatePresence mode="wait">
          {testFail ? (
            <motion.div
              key="fail"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-1.5 text-[11px] font-mono text-danger"
            >
              <XCircle className="size-3.5" />
              SyntaxError: cannot assign to subscript (line 5)
            </motion.div>
          ) : testPass ? (
            <motion.div
              key="pass"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[11px] font-mono text-success"
            >
              <CheckCircle2 className="size-3.5" />
              ok — count_status(RAW, "booked") == 1
            </motion.div>
          ) : (
            <motion.div key="idle" className="text-[11px] font-mono text-muted-foreground">
              waiting for run…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const DEFECT_PIPELINE_BEATS = [
  { caption: "Code editor and a Run button. Tests have not started.", after: 800 },
  { caption: "Cursor hovers Run — we are about to execute the test suite.", after: 800 },
  { caption: "Run pressed — the runner reports a SyntaxError on line 5.", after: 1000 },
  { caption: "The offending line is highlighted: '=' is assignment, not comparison.", after: 1100 },
  { caption: "Fix applied: '=' becomes '=='. Line turns green in the editor.", after: 1000 },
  { caption: "Run again — the runner kicks off a second attempt.", after: 900 },
  { caption: "Tests pass: count_status('booked') returns 1 as expected.", after: 900 },
];
