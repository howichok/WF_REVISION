"use client";

import { useRef } from "react";
import { useSceneBeat, useSceneStageRef, useSceneCursor } from "../../scene-stage";
import { ConnectorArrow } from "../../primitives/connector-arrow";
import { ErrorBubble } from "../../primitives/error-bubble";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Arrows between stage bars. Beat plan:
 *  0 bars placed, no arrows
 *  1 draw req -> data
 *  2 draw data -> build
 *  3 attempt to draw test -> build earlier (rejected with error)
 *  4 draw build -> test (correct)
 *  5 draw test -> regress
 *  6 draw regress -> hand
 */

interface Node {
  id: string;
  label: string;
  col: number;
  row: number;
}

const NODES: Node[] = [
  { id: "req",     label: "Requirements", col: 0, row: 0 },
  { id: "data",    label: "Data design",  col: 1, row: 0 },
  { id: "build",   label: "Build",        col: 2, row: 0 },
  { id: "test",    label: "Int. test",    col: 3, row: 0 },
  { id: "regress", label: "Regression",   col: 4, row: 0 },
  { id: "hand",    label: "Handover",     col: 5, row: 0 },
];

interface Arrow {
  from: string;
  to: string;
  reveal: number; // beat index
  rejected?: boolean;
}

const ARROWS: Arrow[] = [
  { from: "req",     to: "data",    reveal: 1 },
  { from: "data",    to: "build",   reveal: 2 },
  { from: "test",    to: "build",   reveal: 3, rejected: true },
  { from: "build",   to: "test",    reveal: 4 },
  { from: "test",    to: "regress", reveal: 5 },
  { from: "regress", to: "hand",    reveal: 6 },
];

export function DepArrowsScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const stageRef = useSceneStageRef();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeArrow = ARROWS.find((a) => a.reveal === beatIndex) ?? null;
  useSceneCursor(activeArrow ? refs.current[activeArrow.to] ?? null : null);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {NODES.map((n, i) => (
          <div
            key={n.id}
            ref={(el) => {
              refs.current[n.id] = el;
            }}
            className={cn(
              "relative z-10 flex min-h-[40px] min-w-[70px] items-center justify-center rounded-lg border-2 bg-card px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm",
              activeArrow && (activeArrow.from === n.id || activeArrow.to === n.id)
                ? "border-accent"
                : "border-border/60"
            )}
          >
            <span className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-accent/15 text-[9px] text-accent">
              {i + 1}
            </span>
            {n.label}
          </div>
        ))}
      </div>

      {/* Arrows — each one draws when the beat reaches its reveal point */}
      {ARROWS.map((a) => {
        const drawn =
          beatIndex >= a.reveal && !(a.rejected && beatIndex === a.reveal) && !a.rejected;
        const fromRef = { current: refs.current[a.from] } as React.RefObject<HTMLElement | null>;
        const toRef = { current: refs.current[a.to] } as React.RefObject<HTMLElement | null>;
        return (
          <ConnectorArrow
            key={`${a.from}->${a.to}`}
            stageRef={stageRef}
            fromRef={fromRef}
            toRef={toRef}
            drawn={drawn}
            color={a.rejected && beatIndex === a.reveal ? "var(--color-danger)" : "var(--color-accent)"}
          />
        );
      })}

      <div className="mt-3 min-h-[28px]">
        <ErrorBubble
          visible={beatIndex === 3}
          message="Cannot start Build before Int. test is even built. Dependency rejected."
        />
      </div>
    </div>
  );
}

export const DEP_ARROWS_BEATS = [
  { caption: "Bars are placed. Now we wire the must-finish-before chain.", after: 900 },
  { caption: "Requirements feeds Data design.", after: 900 },
  { caption: "Data design feeds Build.", after: 900 },
  { caption: "Try to start Build before Int. test exists — rejected.", after: 1200 },
  { caption: "Correct arrow: Build feeds Int. test.", after: 900 },
  { caption: "Int. test feeds Regression.", after: 900 },
  { caption: "Regression feeds Handover — the chain is complete.", after: 900 },
];
