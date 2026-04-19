"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useSceneBeat, useSceneStageRef, useSceneCursor } from "../../scene-stage";
import { ConnectorArrow } from "../../primitives/connector-arrow";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Input / Process / Output boxes. Each beat drops items into the right box
 * and draws a connector between boxes once both endpoints have content.
 *
 * 0 three empty boxes
 * 1 drop CSV headers into Input
 * 2 drop "validate date" into Process
 * 3 drop "count by status" into Process
 * 4 drop report rows into Output
 * 5 connect Input → Process
 * 6 connect Process → Output (flow complete)
 */

const INPUT_ITEMS = ["appt_id", "date", "status"];
const PROCESS_ITEMS = ["validate date", "count by status"];
const OUTPUT_ITEMS = ["booked: N", "cancelled: N", "total: N"];

export function IpoFlowScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const stageRef = useSceneStageRef();
  const inRef = useRef<HTMLDivElement | null>(null);
  const procRef = useRef<HTMLDivElement | null>(null);
  const outRef = useRef<HTMLDivElement | null>(null);

  useSceneCursor(
    beatIndex === 1
      ? inRef.current
      : beatIndex >= 2 && beatIndex <= 3
        ? procRef.current
        : beatIndex === 4
          ? outRef.current
          : null
  );

  const inputItems = beatIndex >= 1 ? INPUT_ITEMS : [];
  const processItems =
    beatIndex >= 3 ? PROCESS_ITEMS : beatIndex === 2 ? [PROCESS_ITEMS[0]!] : [];
  const outputItems = beatIndex >= 4 ? OUTPUT_ITEMS : [];

  const arrow1 = beatIndex >= 5;
  const arrow2 = beatIndex >= 6;

  return (
    <LayoutGroup>
      <div className="relative flex flex-wrap items-stretch justify-between gap-4 sm:flex-nowrap">
        <Box label="Input" color="#2563eb" innerRef={inRef} items={inputItems} />
        <Box label="Process" color="#9333ea" innerRef={procRef} items={processItems} />
        <Box label="Output" color="#16a34a" innerRef={outRef} items={outputItems} />

        <ConnectorArrow
          stageRef={stageRef}
          fromRef={inRef as React.RefObject<HTMLElement | null>}
          toRef={procRef as React.RefObject<HTMLElement | null>}
          drawn={arrow1}
          color="var(--color-accent)"
        />
        <ConnectorArrow
          stageRef={stageRef}
          fromRef={procRef as React.RefObject<HTMLElement | null>}
          toRef={outRef as React.RefObject<HTMLElement | null>}
          drawn={arrow2}
          color="var(--color-accent)"
        />
      </div>
    </LayoutGroup>
  );
}

function Box({
  label,
  color,
  items,
  innerRef,
}: {
  label: string;
  color: string;
  items: string[];
  innerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={innerRef}
      className={cn(
        "relative min-h-[110px] w-full flex-1 rounded-xl border-2 bg-card p-3 shadow-sm"
      )}
      style={{ borderColor: items.length ? color : `${color}55` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it}
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="rounded-md bg-background/80 px-2 py-1 text-[10px] font-mono text-foreground ring-1 ring-border/40"
            >
              {it}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export const IPO_FLOW_BEATS = [
  { caption: "Three empty boxes: Input, Process, Output.", after: 900 },
  { caption: "CSV headers drop into Input — appt_id, date, status.", after: 900 },
  { caption: "Validate date lands in Process — first operation.", after: 900 },
  { caption: "Count by status joins the Process pipeline.", after: 900 },
  { caption: "Output receives the report schema.", after: 900 },
  { caption: "Connector draws: Input feeds Process.", after: 900 },
  { caption: "Process feeds Output — the IPO flow is complete.", after: 900 },
];
