"use client";

import { useRef } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { TableGrid, TableRow, TableCell } from "../../primitives/table-grid";
import type { SceneProps } from "../../registry";

interface Row {
  req: string;
  tests: string[];
  reached: number; // at what beat this cell turns green
}

const ROWS: Row[] = [
  { req: "Accurate counts",    tests: ["test_count_booked", "test_count_cancelled"], reached: 1 },
  { req: "Handles empty file", tests: ["test_empty_file"],                          reached: 2 },
  { req: "Validates dates",    tests: ["test_invalid_date"],                        reached: 3 },
  { req: "Menu navigation",    tests: ["test_menu_navigation"],                     reached: 4 },
];

export function CoverageTableScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const refs = useRef<Array<HTMLTableRowElement | null>>([]);
  const activeIdx = beatIndex >= 1 && beatIndex <= ROWS.length ? beatIndex - 1 : -1;
  useSceneCursor(activeIdx >= 0 ? refs.current[activeIdx] ?? null : null);

  return (
    <TableGrid
      caption="Requirements × tests coverage"
      columns={[
        { id: "req",   label: "Requirement", widthClass: "w-[36%]" },
        { id: "tests", label: "Backing tests" },
        { id: "cov",   label: "Coverage",   widthClass: "w-[18%]" },
      ]}
    >
      {ROWS.map((r, i) => {
        const covered = beatIndex > i;
        const active = beatIndex === i + 1;
        return (
          <TableRow
            key={r.req}
            ref={(el) => {
              refs.current[i] = el;
            }}
            active={active}
            tone={covered ? "pass" : "neutral"}
          >
            <TableCell state="filled">{r.req}</TableCell>
            <TableCell state={covered ? "filled" : "empty"}>
              {covered ? (
                <div className="flex flex-wrap gap-1">
                  {r.tests.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-success/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-success"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell state={covered ? "pass" : "empty"}>
              {covered ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <CheckCircle2 className="size-3" /> yes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-danger/70">
                  <XCircle className="size-3" /> no
                </span>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableGrid>
  );
}

export const COVERAGE_TABLE_BEATS = [
  { caption: "Four system requirements. Empty Coverage column.", after: 900 },
  { caption: "Tests for 'accurate counts' arrive — coverage goes green.", after: 1000 },
  { caption: "'Handles empty file' is evidenced by test_empty_file.", after: 1000 },
  { caption: "'Validates dates' covered by test_invalid_date.", after: 1000 },
  { caption: "'Menu navigation' covered — every requirement has tests.", after: 900 },
];
