"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { TableGrid, TableRow, TableCell } from "../../primitives/table-grid";
import type { SceneProps } from "../../registry";

interface Case {
  id: string;
  purpose: string;
  input: string;
  expected: string;
  actualBad: string;
  actualGood: string;
}

const CASES: Case[] = [
  { id: "t1", purpose: "Count booked",     input: '("booked")',    expected: "1", actualBad: "error", actualGood: "1" },
  { id: "t2", purpose: "Count cancelled",  input: '("cancelled")', expected: "1", actualBad: "error", actualGood: "1" },
  { id: "t3", purpose: "All rows",         input: "broken_count", expected: "2", actualBad: "2",    actualGood: "2" },
  { id: "t4", purpose: "Empty CSV",        input: 'empty file',   expected: "0", actualBad: "—",    actualGood: "0" },
];

/**
 * Beats:
 *  0 table shown, Actual all empty
 *  1..4 each row's Actual populates under buggy code → fail/pass
 *  5 fix applied → Actuals flip to good
 */
export function TestTableScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const activeIdx = beatIndex >= 1 && beatIndex <= CASES.length ? beatIndex - 1 : -1;
  const active = activeIdx >= 0 ? CASES[activeIdx] : null;
  useSceneCursor(active ? rowRefs.current[active.id] ?? null : null);

  const isFixed = beatIndex >= CASES.length + 1;

  return (
    <div className="space-y-2">
      <TableGrid
        caption="Test cases"
        columns={[
          { id: "purpose", label: "Purpose", widthClass: "w-[28%]" },
          { id: "input",   label: "Input",   widthClass: "w-[22%]" },
          { id: "expect",  label: "Expected",widthClass: "w-[16%]" },
          { id: "actual",  label: "Actual" },
          { id: "result",  label: "Result", widthClass: "w-[14%]" },
        ]}
      >
        {CASES.map((c, i) => {
          const populated = beatIndex > i || isFixed;
          const actual = isFixed ? c.actualGood : c.actualBad;
          const pass = populated && actual === c.expected;
          return (
            <TableRow
              key={c.id}
              ref={(el) => {
                rowRefs.current[c.id] = el;
              }}
              active={beatIndex === i + 1}
              tone={populated ? (pass ? "pass" : "fail") : "neutral"}
            >
              <TableCell state="filled">{c.purpose}</TableCell>
              <TableCell state="filled">
                <span className="font-mono text-[10px]">{c.input}</span>
              </TableCell>
              <TableCell state="filled">
                <span className="font-mono">{c.expected}</span>
              </TableCell>
              <TableCell state={!populated ? "empty" : pass ? "pass" : "fail"}>
                {populated ? <span className="font-mono">{actual}</span> : "—"}
              </TableCell>
              <TableCell state={!populated ? "empty" : pass ? "pass" : "fail"}>
                {populated ? (
                  pass ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="size-3" /> pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-danger">
                      <XCircle className="size-3" /> fail
                    </span>
                  )
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableGrid>

      <motion.p
        animate={{ opacity: isFixed ? 1 : 0.6 }}
        className="text-[11px] text-muted-foreground"
      >
        {isFixed
          ? "Fix applied — every row flips to pass."
          : "Row by row: each test runs against the buggy code."}
      </motion.p>
    </div>
  );
}

export const TEST_TABLE_BEATS = [
  { caption: "Four test cases waiting. Actual columns are blank.", after: 800 },
  { caption: "Run t1 — buggy code errors before producing a count.", after: 1000 },
  { caption: "t2 — same bug, same error.", after: 900 },
  { caption: "t3 runs successfully — this path dodges the bug.", after: 900 },
  { caption: "t4 returns '—' for an empty file — missing handling.", after: 900 },
  { caption: "Fix applied upstream. Every row re-runs and turns green.", after: 900 },
];
