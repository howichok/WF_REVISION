"use client";

import { useRef } from "react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { TableGrid, TableRow, TableCell } from "../../primitives/table-grid";
import { ErrorBubble } from "../../primitives/error-bubble";
import type { SceneProps } from "../../registry";

/**
 * Live editing of a risk register. A specific risk is typed cell by cell; a
 * generic one is attempted and rejected.
 *
 * 0 empty row 1 highlighted
 * 1 Risk cell types "CSV data quality"
 * 2 Impact cell types "Build stalls if records missing"
 * 3 Mitigation cell types "Data audit in W1"
 * 4 row flashes valid
 * 5 row 2 auto-fills "Generic staff sick" — rejected with error
 * 6 row 2 cleared, types "Tester shared — regression may slip" (valid)
 */

interface Row {
  risk: string;
  impact: string;
  mitigation: string;
  valid?: boolean;
  rejected?: boolean;
}

function rowsAt(beat: number): Row[] {
  const rows: Row[] = [
    { risk: "", impact: "", mitigation: "" },
    { risk: "", impact: "", mitigation: "" },
  ];
  if (beat >= 1) rows[0]!.risk = "CSV data quality";
  if (beat >= 2) rows[0]!.impact = "Build stalls if records are missing";
  if (beat >= 3) rows[0]!.mitigation = "Data audit in W1; import blocked until clean";
  if (beat >= 4) rows[0]!.valid = true;
  if (beat === 5) {
    rows[1] = { risk: "Staff might be sick", impact: "Project delayed", mitigation: "Backup person", rejected: true };
  }
  if (beat >= 6) {
    rows[1] = {
      risk: "Tester shared 50%",
      impact: "Regression window may slip",
      mitigation: "Int. test starts W4 to give slack before W6",
      valid: true,
    };
  }
  return rows;
}

export function RiskTableScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const rows = rowsAt(beatIndex);
  const row1Ref = useRef<HTMLTableRowElement | null>(null);
  const row2Ref = useRef<HTMLTableRowElement | null>(null);
  useSceneCursor(beatIndex <= 4 ? row1Ref.current : row2Ref.current);

  return (
    <div className="space-y-3">
      <TableGrid
        caption="Risk register"
        columns={[
          { id: "risk",       label: "Risk",       widthClass: "w-[28%]" },
          { id: "impact",     label: "Impact",     widthClass: "w-[32%]" },
          { id: "mitigation", label: "Mitigation (in plan)" },
        ]}
      >
        <TableRow
          ref={row1Ref}
          active={beatIndex >= 1 && beatIndex <= 3}
          tone={rows[0]!.valid ? "pass" : "neutral"}
        >
          <TableCell
            state={rows[0]!.risk ? "filled" : "empty"}
            caretVisible={beatIndex === 1}
          >
            {rows[0]!.risk || "—"}
          </TableCell>
          <TableCell
            state={rows[0]!.impact ? "filled" : "empty"}
            caretVisible={beatIndex === 2}
          >
            {rows[0]!.impact || "—"}
          </TableCell>
          <TableCell
            state={rows[0]!.mitigation ? "filled" : "empty"}
            caretVisible={beatIndex === 3}
          >
            {rows[0]!.mitigation || "—"}
          </TableCell>
        </TableRow>
        <TableRow
          ref={row2Ref}
          active={beatIndex >= 5}
          tone={
            rows[1]!.rejected
              ? "fail"
              : rows[1]!.valid
                ? "pass"
                : "neutral"
          }
        >
          <TableCell state={rows[1]!.risk ? "filled" : "empty"}>{rows[1]!.risk || "—"}</TableCell>
          <TableCell state={rows[1]!.impact ? "filled" : "empty"}>{rows[1]!.impact || "—"}</TableCell>
          <TableCell state={rows[1]!.mitigation ? "filled" : "empty"}>{rows[1]!.mitigation || "—"}</TableCell>
        </TableRow>
      </TableGrid>
      <ErrorBubble
        visible={beatIndex === 5}
        message="“Staff might be sick” could apply to any project. Name a file, role or deadline from this brief."
      />
    </div>
  );
}

export const RISK_TABLE_BEATS = [
  { caption: "Two empty rows. Risk register lives next to the plan.", after: 900 },
  { caption: "Type the risk name — pull it from the brief, not a template.", after: 1000 },
  { caption: "Impact describes what happens if it fires.", after: 1000 },
  { caption: "Mitigation must be visible in the Gantt — not a wish.", after: 1000 },
  { caption: "Row valid — specific, scenario-bound, with a stage to point at.", after: 900 },
  { caption: "Try adding 'staff might be sick' — rejected. Too generic.", after: 1200 },
  { caption: "Correct: 'Tester shared 50%' ties to a real constraint in the brief.", after: 900 },
];
