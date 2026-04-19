"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Beaker, Database, ClipboardCheck, Check } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * A 2×2 live workspace. Each beat exercises one quadrant with real activity:
 * Code types in; Tests run; CSV rows preview; Eval ticks requirements.
 */

const CODE = [
  "import csv",
  "from collections import Counter",
  "",
  "rows = list(csv.DictReader(open('appointments.csv')))",
  "print(Counter(r['status'] for r in rows))",
];

const TESTS = [
  "test_count_booked",
  "test_count_cancelled",
  "test_empty_file",
];

const ROWS = [
  ["1", "2024-04-01", "booked"],
  ["2", "2024-04-02", "cancelled"],
  ["3", "2024-04-03", "booked"],
];

const REQS = [
  "Accurate counts",
  "Handles empty CSV",
  "Menu-driven",
];

/** Beats:
 * 0 all quadrants quiet
 * 1 Code: types
 * 2 Tests: runs, greens
 * 3 Data: CSV rows preview
 * 4 Eval: requirement ticks
 * 5 all four complete
 */
export function BuildQuadrantScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  useSceneCursor(
    beatIndex === 1
      ? refs.current["code"] ?? null
      : beatIndex === 2
        ? refs.current["tests"] ?? null
        : beatIndex === 3
          ? refs.current["data"] ?? null
          : beatIndex === 4
            ? refs.current["eval"] ?? null
            : null
  );

  const codeLines = beatIndex >= 1 ? CODE : [];
  const testsRun = beatIndex >= 2;
  const showData = beatIndex >= 3;
  const evalDone = beatIndex >= 4;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {/* Code */}
      <Quadrant
        innerRef={(el) => {
          refs.current["code"] = el;
        }}
        title="Code"
        icon={<Code2 className="size-3.5" />}
        color="#9333ea"
      >
        <div className="rounded-md border border-border/60 bg-[#1e1e1e] p-2 font-mono text-[10px] text-[#cccccc]">
          <AnimatePresence initial={false}>
            {codeLines.length === 0 ? (
              <span className="text-[#5c5c5c]">// empty</span>
            ) : (
              codeLines.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="mr-2 inline-block w-3 text-right text-[9px] text-[#5c5c5c]">{i + 1}</span>
                  <span className={l.startsWith("import") ? "text-[#569cd6]" : ""}>{l || "\u00A0"}</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Quadrant>

      {/* Tests */}
      <Quadrant
        innerRef={(el) => {
          refs.current["tests"] = el;
        }}
        title="Tests"
        icon={<Beaker className="size-3.5" />}
        color="#f59e0b"
      >
        <ul className="space-y-1">
          {TESTS.map((t, i) => {
            const done = testsRun;
            return (
              <li
                key={t}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] font-mono transition-colors",
                  done ? "bg-success/10 text-success" : "bg-muted/30 text-muted-foreground"
                )}
              >
                <motion.span
                  animate={{ scale: done ? 1 : 0.8, opacity: done ? 1 : 0.5 }}
                  transition={{ delay: done ? i * 0.12 : 0 }}
                  className="inline-flex size-3.5 items-center justify-center rounded-full"
                >
                  {done ? (
                    <Check className="size-3 text-success" />
                  ) : (
                    <span className="size-2 rounded-full bg-muted" />
                  )}
                </motion.span>
                {t}
              </li>
            );
          })}
        </ul>
      </Quadrant>

      {/* Data */}
      <Quadrant
        innerRef={(el) => {
          refs.current["data"] = el;
        }}
        title="Data"
        icon={<Database className="size-3.5" />}
        color="#16a34a"
      >
        <table className="w-full text-left text-[10px]">
          <thead className="text-muted-foreground">
            <tr>
              <th className="border-b border-border/30 py-0.5">id</th>
              <th className="border-b border-border/30 py-0.5">date</th>
              <th className="border-b border-border/30 py-0.5">status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {showData
                ? ROWS.map((r, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {r.map((cell, j) => (
                        <td key={j} className="py-0.5 font-mono">
                          {cell}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                : null}
            </AnimatePresence>
          </tbody>
        </table>
      </Quadrant>

      {/* Evaluate */}
      <Quadrant
        innerRef={(el) => {
          refs.current["eval"] = el;
        }}
        title="Evaluate"
        icon={<ClipboardCheck className="size-3.5" />}
        color="#dc2626"
      >
        <ul className="space-y-1">
          {REQS.map((r, i) => (
            <li
              key={r}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] transition-colors",
                evalDone ? "bg-success/10 text-success" : "bg-muted/30 text-muted-foreground"
              )}
            >
              <motion.span
                animate={{ scale: evalDone ? 1 : 0.7, opacity: evalDone ? 1 : 0.6 }}
                transition={{ delay: evalDone ? i * 0.15 : 0 }}
              >
                {evalDone ? <Check className="size-3 text-success" /> : <span className="inline-block size-2.5 rounded border border-muted-foreground/50" />}
              </motion.span>
              {r}
            </li>
          ))}
        </ul>
      </Quadrant>
    </div>
  );
}

function Quadrant({
  innerRef,
  title,
  icon,
  color,
  children,
}: {
  innerRef: (el: HTMLDivElement | null) => void;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={innerRef}
      className="rounded-xl border-2 bg-card p-3"
      style={{ borderColor: `${color}55` }}
    >
      <p
        className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

export const BUILD_QUADRANT_BEATS = [
  { caption: "Four empty panels: Code, Tests, Data, Evaluate. No activity yet.", after: 900 },
  { caption: "Code: a CSV reader types into the editor line by line.", after: 1100 },
  { caption: "Tests: the runner ticks each test case green.", after: 1100 },
  { caption: "Data: the CSV opens — real rows preview.", after: 1100 },
  { caption: "Evaluate: each requirement gets a check once evidence is present.", after: 1100 },
];
