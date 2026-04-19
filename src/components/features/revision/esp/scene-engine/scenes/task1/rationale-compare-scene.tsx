"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { InputField } from "../../primitives/input-field";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Single rationale field + rubric checklist. Weak sentence is typed and
 * checklist stays empty. Clear, retype strong sentence, checklist ticks
 * one-by-one.
 */

const WEAK = "The plan has eight stages. First requirements, then design, then build. Testing is at the end.";
const STRONG =
  "Requirements precedes design because the CSV structure must be confirmed before the DBA schemas it. Testing is staged across W4–5 because the tester is shared. Junior dev handles build, cutting cost 15%.";

const RUBRIC = [
  { id: "why",      label: "Answers 'why?' not 'what?'", matches: "because" },
  { id: "scenario", label: "Cites the scenario facts",   matches: "tester" },
  { id: "sequence", label: "Explains sequencing",        matches: "before" },
  { id: "cost",     label: "Justifies cost trade-off",   matches: "cost" },
];

function typingProgress(full: string, pct: number): string {
  const n = Math.max(0, Math.min(full.length, Math.floor(full.length * pct)));
  return full.slice(0, n);
}

/**
 * Beats:
 *  0 empty field, rubric all red
 *  1 weak text types in
 *  2 field evaluated → invalid, rubric still 0/4
 *  3 field cleared
 *  4-7 strong text types in segment by segment, rubric ticks align
 *  8 all pass
 */
export function RationaleCompareScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const rubricRef = useRef<HTMLDivElement | null>(null);
  useSceneCursor(beatIndex <= 3 ? fieldRef.current : rubricRef.current);

  let value = "";
  let state: "neutral" | "typing" | "invalid" | "valid" = "neutral";
  let caret = false;

  if (beatIndex === 1) {
    value = typingProgress(WEAK, 1);
    state = "typing";
    caret = true;
  } else if (beatIndex === 2) {
    value = WEAK;
    state = "invalid";
  } else if (beatIndex === 3) {
    value = "";
    state = "neutral";
  } else if (beatIndex >= 4) {
    const progress = Math.min(1, (beatIndex - 3) / 5);
    value = typingProgress(STRONG, progress);
    state = beatIndex >= 8 ? "valid" : "typing";
    caret = beatIndex < 8;
  }

  const passed = (id: string): boolean => {
    if (state !== "valid" && beatIndex < 4) return false;
    const item = RUBRIC.find((r) => r.id === id);
    if (!item) return false;
    return value.toLowerCase().includes(item.matches.toLowerCase());
  };

  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <div ref={fieldRef}>
        <InputField
          label="Rationale — Task 1"
          placeholder="Explain the why, not the what."
          value={value}
          state={state}
          caretVisible={caret}
          multiline
          helper={beatIndex === 0 ? "Start typing in the next beat." : undefined}
          errorMessage={state === "invalid" ? "This only describes the plan — no 'because' found." : undefined}
        />
      </div>

      <div ref={rubricRef} className="rounded-xl border border-border/60 bg-card p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Marker rubric
        </p>
        <ul className="space-y-1.5">
          {RUBRIC.map((r) => {
            const ok = passed(r.id);
            return (
              <motion.li
                key={r.id}
                animate={{
                  backgroundColor: ok ? "rgba(34,197,94,0.12)" : "rgba(127,127,127,0.08)",
                  color: ok ? "var(--color-success)" : "inherit",
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-[11px]",
                  ok ? "font-semibold" : "text-muted-foreground"
                )}
              >
                {ok ? (
                  <CheckCircle2 className="size-3.5 text-success" />
                ) : (
                  <XCircle className="size-3.5 text-danger/60" />
                )}
                {r.label}
              </motion.li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-center gap-2 border-t border-border/40 pt-2 text-[11px] font-semibold">
          <span>Score:</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 tabular-nums",
              (beatIndex >= 8 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")
            )}
          >
            {RUBRIC.filter((r) => passed(r.id)).length}/4
          </span>
        </div>
      </div>
    </div>
  );
}

export const RATIONALE_COMPARE_BEATS = [
  { caption: "Empty rationale field; a rubric on the right scores every key idea.", after: 800 },
  { caption: "A weak rationale types in — describes the plan but doesn't explain why.", after: 1600 },
  { caption: "Rubric evaluates the field: 0/4. Descriptive — not justifying.", after: 1200 },
  { caption: "We clear the field and start again.", after: 900 },
  { caption: "Strong rationale starts — 'because' shows up in the first clause.", after: 1200 },
  { caption: "Scenario facts (tester shared) anchor the sentence to this brief.", after: 1200 },
  { caption: "Sequencing ('before') and cost trade-off land in place.", after: 1200 },
  { caption: "Rubric reaches 4/4 — the rationale justifies every call.", after: 900 },
];
