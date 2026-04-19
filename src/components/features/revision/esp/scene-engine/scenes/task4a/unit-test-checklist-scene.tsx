"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

const TESTS = [
  "test_count_booked",
  "test_count_cancelled",
  "test_empty_file",
  "test_invalid_date",
  "test_menu_navigation",
];

export function UnitTestChecklistScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const refs = useRef<Array<HTMLLIElement | null>>([]);
  useSceneCursor(beatIndex >= 1 && beatIndex <= TESTS.length ? refs.current[beatIndex - 1] ?? null : null);

  const stateOf = (i: number): "idle" | "running" | "pass" => {
    if (beatIndex === i + 1) return "running";
    if (beatIndex > i + 1 || beatIndex > TESTS.length) return "pass";
    return "idle";
  };

  const passed = TESTS.filter((_, i) => stateOf(i) === "pass").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Unit-test runner
        </p>
        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-accent">
          {passed} / {TESTS.length}
        </span>
      </div>
      <ul className="divide-y divide-border/40 rounded-xl border border-border/60 bg-card">
        {TESTS.map((t, i) => {
          const st = stateOf(i);
          return (
            <motion.li
              key={t}
              ref={(el) => {
                refs.current[i] = el;
              }}
              animate={{
                backgroundColor:
                  st === "pass"
                    ? "rgba(34,197,94,0.08)"
                    : st === "running"
                      ? "rgba(99,102,241,0.08)"
                      : "rgba(0,0,0,0)",
              }}
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono"
            >
              <span className="inline-flex size-5 shrink-0 items-center justify-center">
                {st === "pass" ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : st === "running" ? (
                  <Loader2 className="size-4 animate-spin text-accent" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/50" />
                )}
              </span>
              <span className={cn(st === "pass" ? "text-success" : "text-foreground")}>{t}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {st === "pass" ? "pass" : st === "running" ? "running…" : "—"}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export const UNIT_TEST_CHECKLIST_BEATS = [
  { caption: "Five unit tests queued. Nothing has run yet.", after: 900 },
  { caption: "test_count_booked — spins up, then turns green.", after: 900 },
  { caption: "test_count_cancelled runs next.", after: 900 },
  { caption: "Edge case: test_empty_file — handled by the fix upstream.", after: 900 },
  { caption: "test_invalid_date — the validator rejects bad dates.", after: 900 },
  { caption: "test_menu_navigation closes out — all five pass.", after: 900 },
];
