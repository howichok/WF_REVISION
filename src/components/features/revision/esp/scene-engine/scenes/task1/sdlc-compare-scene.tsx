"use client";

import { forwardRef, useRef, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { CheckCircle2, ClipboardList, Infinity as InfinityIcon } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Balance-scale style comparison. Facts from the brief are dropped onto one
 * side; the scale tips; the winner gets a check mark.
 *
 * 0 two empty methodology cards on a scale
 * 1 "Fixed spec" fact drops on Waterfall — left tips
 * 2 "Hard deadline" fact drops on Waterfall — left tips further
 * 3 "Changing requirements" drops on Agile — slight correction
 * 4 scale settles on Waterfall; check mark appears
 */

const FACTS = [
  { id: "f1", text: "Fixed spec from client", side: "waterfall" as const },
  { id: "f2", text: "Hard 6-week deadline", side: "waterfall" as const },
  { id: "f3", text: "Small scope-change risk", side: "agile" as const },
];

export function SdlcCompareScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const factRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const factOn = (id: string): boolean => {
    const idx = FACTS.findIndex((f) => f.id === id);
    return beatIndex > idx;
  };

  const waterfallWeight = FACTS.filter((f) => f.side === "waterfall" && factOn(f.id)).length;
  const agileWeight = FACTS.filter((f) => f.side === "agile" && factOn(f.id)).length;
  const tiltDeg = Math.max(-8, Math.min(8, (agileWeight - waterfallWeight) * 4));
  const winner = beatIndex >= 4 ? "waterfall" : null;

  const activeFactIdx = beatIndex >= 1 && beatIndex <= 3 ? beatIndex - 1 : -1;
  const activeFactId = activeFactIdx >= 0 ? FACTS[activeFactIdx]!.id : null;
  const activeSide = activeFactIdx >= 0 ? FACTS[activeFactIdx]!.side : null;
  const cursorEl =
    activeFactId && beatIndex > 0
      ? activeSide === "waterfall"
        ? leftRef.current
        : rightRef.current
      : null;
  useSceneCursor(cursorEl);

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <motion.div
          animate={{ rotate: tiltDeg }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="relative mx-auto flex w-full max-w-[520px] items-start justify-between"
        >
          <PanCard
            ref={leftRef}
            title="Waterfall"
            desc="Sequential phases, locked scope"
            icon={<ClipboardList className="size-3.5" />}
            color="#16a34a"
            facts={FACTS.filter((f) => f.side === "waterfall" && factOn(f.id))}
            picked={winner === "waterfall"}
          />
          <div className="mt-6 w-4 self-center border-t-2 border-dashed border-border/70" />
          <PanCard
            ref={rightRef}
            title="Agile"
            desc="Short cycles, changing scope"
            icon={<InfinityIcon className="size-3.5" />}
            color="#6366f1"
            facts={FACTS.filter((f) => f.side === "agile" && factOn(f.id))}
            picked={false}
          />
        </motion.div>
        <div className="mx-auto h-3 w-32 rounded-b-xl bg-gradient-to-b from-muted to-muted/60" />

        {/* Fact pool */}
        <div className="flex flex-wrap justify-center gap-2">
          {FACTS.map((f) => {
            if (factOn(f.id)) return null;
            return (
              <motion.div
                key={f.id}
                ref={(el) => {
                  factRefs.current[f.id] = el;
                }}
                layoutId={`fact-${f.id}`}
                animate={{ scale: activeFactId === f.id ? 1.05 : 1 }}
                className={cn(
                  "rounded-full border bg-card px-3 py-1 text-[11px] font-medium",
                  activeFactId === f.id
                    ? "border-accent/60 text-accent"
                    : "border-border/60 text-foreground"
                )}
              >
                {f.text}
              </motion.div>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}

interface PanCardProps {
  title: string;
  desc: string;
  icon: ReactNode;
  color: string;
  facts: { id: string; text: string }[];
  picked: boolean;
}

const PanCard = forwardRef<HTMLDivElement, PanCardProps>(function PanCard(
  { title, desc, icon, color, facts, picked },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("relative w-[45%] rounded-xl border-2 bg-card p-3 shadow-sm")}
      style={{ borderColor: picked ? color : `${color}55` }}
    >
      <AnimatePresence>
        {picked ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            <CheckCircle2 className="size-3.5" />
          </motion.span>
        ) : null}
      </AnimatePresence>
      <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
        {icon}
        {title}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">{desc}</p>
      <ul className="mt-2 space-y-1">
        <AnimatePresence initial={false}>
          {facts.map((f) => (
            <motion.li
              key={f.id}
              layoutId={`fact-${f.id}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-md bg-background/70 px-2 py-1 text-[10px] font-medium text-foreground ring-1 ring-border/40"
            >
              {f.text}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
});

export const SDLC_COMPARE_BEATS = [
  { caption: "Two methodologies sit on an empty scale. We weigh the brief's facts.", after: 900 },
  { caption: "A fixed spec drops on Waterfall — the scale tilts left.", after: 1000 },
  { caption: "A hard deadline adds more weight to Waterfall.", after: 1000 },
  { caption: "A small scope-change risk lands on Agile, nudging it slightly.", after: 1000 },
  { caption: "Weight settles: Waterfall wins — justified by scenario facts.", after: 800 },
];
