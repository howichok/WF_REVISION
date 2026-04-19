"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, Ban, Folder, Target, X } from "lucide-react";
import { useSceneBeat, useSceneStageRef, useSceneCursor } from "../scene-stage";
import { FocusRing } from "../primitives/focus-ring";
import { SuccessState } from "../primitives/success-state";
import { CATEGORY_COLOR, CATEGORY_LABEL, pickSegmentsForScene } from "@/data/esp/scene-samples";
import type { BriefSegmentCategory } from "@/data/esp/scenarios/types";
import type { SceneProps } from "../registry";
import { cn } from "@/lib/utils";

/**
 * Object-led brief triage.
 *
 * Every beat shows a concrete UI transition, not animated text:
 *  - cursor glides onto a line;
 *  - a scan band sweeps across the sentence;
 *  - the sentence is extracted into a compact chip;
 *  - the chip physically flies along a drawn Bezier arc to the correct bucket;
 *  - the bucket counter bumps and the card glows;
 *  - the original line is left behind as dim "residue" with a stamped tag.
 *
 * One line is refused on purpose — no bucket change, a diagonal SKIP stamp
 * plus a red strike-through draw across it, so the decision is visible.
 */

const CATS: BriefSegmentCategory[] = ["aim", "constraint", "file", "risk", "user"];

const BUCKET_META: {
  cat: BriefSegmentCategory;
  title: string;
  icon: ReactNode;
}[] = [
  { cat: "aim",        title: "Aim",         icon: <Target className="size-3.5" /> },
  { cat: "constraint", title: "Constraints", icon: <Ban className="size-3.5" /> },
  { cat: "file",       title: "Assets",      icon: <Folder className="size-3.5" /> },
  { cat: "risk",       title: "Risks",       icon: <AlertTriangle className="size-3.5" /> },
];

type LineStatus = "pristine" | "flying" | "stamped" | "skipping" | "skipped";
const DANGER = "#dc2626";

function shortExcerpt(text: string, maxWords = 4): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.replace(/[.,;:]$/, "");
  return words.slice(0, maxWords).join(" ") + "…";
}

export function BriefTriageScene({ scenario }: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const stageRef = useSceneStageRef();
  const segments = useMemo(() => pickSegmentsForScene(scenario, CATS), [scenario]);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bucketRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Cursor choreography — parks on header at beat 0, then hovers active line.
  const activeLineIdx = beatIndex >= 1 && beatIndex <= 5 ? beatIndex - 1 : -1;
  const activeLineEl = activeLineIdx >= 0 ? lineRefs.current[activeLineIdx] ?? null : null;
  const cursorTarget = beatIndex === 0 ? headerRef.current : activeLineEl;
  useSceneCursor(cursorTarget, { offsetX: -18, offsetY: -6 });

  function statusFor(i: number, cat: BriefSegmentCategory): LineStatus {
    const isSkippable = cat === "user" || cat === "neutral";
    const myBeat = i + 1;
    if (beatIndex < myBeat) return "pristine";
    if (beatIndex === myBeat) return isSkippable ? "skipping" : "flying";
    return isSkippable ? "skipped" : "stamped";
  }

  type Chip = { id: string; text: string; category: BriefSegmentCategory };
  const bucketItems: Record<BriefSegmentCategory, Chip[]> = {
    aim: [], constraint: [], file: [], risk: [], user: [], neutral: [],
  };
  segments.forEach((seg, i) => {
    if (seg.category === "user" || seg.category === "neutral") return;
    if (beatIndex > i + 1) {
      bucketItems[seg.category].push({
        id: seg.id,
        text: shortExcerpt(seg.text),
        category: seg.category,
      });
    }
  });

  const showSuccess = beatIndex >= 6;
  const extractedCount = Math.min(Math.max(0, beatIndex), 4);
  const glowCat =
    activeLineIdx >= 0 && activeLineIdx < 4
      ? segments[activeLineIdx]!.category
      : null;

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {/* Document (main source object) */}
        <div className="min-w-0 flex-[3]">
          <BriefPaper
            headerRef={headerRef}
            scenarioTitle={scenario.title}
            doneCount={extractedCount}
            totalCount={segments.length}
            showSuccess={showSuccess}
          >
            {segments.map((seg, i) => (
              <BriefLine
                key={seg.id}
                index={i + 1}
                text={seg.text}
                category={seg.category}
                status={statusFor(i, seg.category)}
                innerRef={(el) => {
                  lineRefs.current[i] = el;
                }}
              />
            ))}
          </BriefPaper>
        </div>

        {/* Bucket tray */}
        <div className="flex min-w-0 flex-[2] flex-col gap-2">
          {BUCKET_META.map((meta, idx) => (
            <BucketStackItem
              key={meta.cat}
              title={meta.title}
              icon={meta.icon}
              color={CATEGORY_COLOR[meta.cat]}
              items={bucketItems[meta.cat]}
              glow={glowCat === meta.cat}
              pulse={beatIndex === 6}
              pulseIndex={idx}
              innerRef={(el) => {
                bucketRefs.current[meta.cat] = el;
              }}
            />
          ))}
        </div>
      </div>

      {/* Focus ring tracks the active line */}
      <FocusRing stageRef={stageRef} target={activeLineEl} color="var(--color-accent)" pad={4} />

      {/* Flight chips + drawn trail — one per extractable line, active only during its beat */}
      {segments.map((seg, i) => {
        if (seg.category === "user" || seg.category === "neutral") return null;
        const active = beatIndex === i + 1;
        return (
          <FlightChip
            key={`flight-${seg.id}`}
            stageRef={stageRef}
            fromEl={lineRefs.current[i] ?? null}
            toEl={bucketRefs.current[seg.category] ?? null}
            active={active}
            category={seg.category}
            text={shortExcerpt(seg.text)}
          />
        );
      })}
    </LayoutGroup>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Brief paper — printed page, dominant source object

function BriefPaper({
  headerRef,
  scenarioTitle,
  doneCount,
  totalCount,
  showSuccess,
  children,
}: {
  headerRef: RefObject<HTMLDivElement | null>;
  scenarioTitle: string;
  doneCount: number;
  totalCount: number;
  showSuccess: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#fdfdfb] shadow-[0_12px_32px_-18px_rgba(15,23,42,0.35)] ring-1 ring-black/5 dark:bg-[#f5f4ee]">
      <div
        ref={headerRef}
        className="flex items-center gap-2 border-b border-black/10 px-4 py-2.5"
      >
        <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden />
        <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#1f2937]">
          Brief
        </p>
        <span className="truncate text-[11px] text-[#4b5563]">— {scenarioTitle}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-md bg-black/5 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[#4b5563]">
            {doneCount} / {totalCount}
          </span>
          <AnimatePresence>
            {showSuccess ? (
              <motion.span
                key="s"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                <SuccessState visible message="Triaged" />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      <div className="relative divide-y divide-black/5 px-2 py-2">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Brief line — one sentence row on the paper

function BriefLine({
  index,
  text,
  category,
  status,
  innerRef,
}: {
  index: number;
  text: string;
  category: BriefSegmentCategory;
  status: LineStatus;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  const isSkip = status === "skipping" || status === "skipped";
  const effectiveColor = isSkip ? DANGER : CATEGORY_COLOR[category];
  const dim = status === "stamped" || status === "skipped";
  const active = status === "flying" || status === "skipping";
  const barVisible = status !== "pristine";

  return (
    <motion.div
      ref={innerRef}
      animate={{
        opacity: dim ? 0.45 : 1,
        backgroundColor: active ? `${effectiveColor}14` : "rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.3 }}
      className="relative flex items-start gap-2 rounded-md px-2 py-1.5"
    >
      {/* Left colour bar */}
      <motion.span
        aria-hidden
        animate={{
          opacity: barVisible ? 1 : 0,
          backgroundColor: effectiveColor,
        }}
        transition={{ duration: 0.25 }}
        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
      />
      <span className="w-6 shrink-0 pl-1 pt-0.5 font-mono text-[10px] font-semibold tabular-nums text-[#94a3b8]">
        {String(index).padStart(2, "0")}.
      </span>
      <div className="relative min-w-0 flex-1">
        <p
          className={cn(
            "font-serif text-[13px] leading-relaxed text-[#1f2937]",
            status === "skipped" && "italic"
          )}
        >
          {text}
        </p>
        {/* Red strike-through during skip */}
        {isSkip ? (
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
            className="pointer-events-none absolute left-0 top-[calc(50%-1px)] h-[2px] w-full origin-left rounded-full"
            style={{ backgroundColor: DANGER }}
          />
        ) : null}
        {/* Scan band during the active beat */}
        {active ? (
          <motion.span
            key={`scan-${status}`}
            aria-hidden
            initial={{ x: "-100%" }}
            animate={{ x: "110%" }}
            transition={{ duration: 1.05, ease: "easeOut" }}
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-md"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${effectiveColor}45 50%, transparent 100%)`,
              mixBlendMode: "multiply",
            }}
          />
        ) : null}
        {/* Diagonal SKIP rubber-stamp during skipping */}
        <AnimatePresence>
          {status === "skipping" ? (
            <motion.span
              key="diag-skip"
              initial={{ opacity: 0, scale: 0.55, rotate: -8 }}
              animate={{ opacity: 0.92, scale: 1, rotate: -8 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.22 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-[2.5px] bg-white/70 px-3 py-0.5 font-mono text-[13px] font-black uppercase tracking-[0.3em]"
              style={{ borderColor: DANGER, color: DANGER }}
            >
              SKIP
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      {/* Stamp column */}
      <div className="min-h-[22px] w-[72px] shrink-0 pt-0.5 text-right">
        <AnimatePresence mode="wait">
          {status === "stamped" ? (
            <motion.span
              key="stamp"
              initial={{ opacity: 0, scale: 0.65, rotate: -10 }}
              animate={{ opacity: 0.88, scale: 1, rotate: -4 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
              className="inline-block rounded border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ borderColor: CATEGORY_COLOR[category], color: CATEGORY_COLOR[category] }}
            >
              {CATEGORY_LABEL[category]}
            </motion.span>
          ) : status === "skipped" ? (
            <motion.span
              key="skip-stamp"
              initial={{ opacity: 0, scale: 0.65, rotate: -10 }}
              animate={{ opacity: 0.85, scale: 1, rotate: -4 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
              className="inline-flex items-center gap-0.5 rounded border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ borderColor: `${DANGER}B3`, color: DANGER }}
            >
              <X className="size-2.5" /> skip
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bucket stack item — lighter: icon + title + counter on one row, chip below

function BucketStackItem({
  title,
  color,
  icon,
  items,
  glow,
  pulse,
  pulseIndex,
  innerRef,
}: {
  title: string;
  color: string;
  icon: ReactNode;
  items: { id: string; text: string; category: BriefSegmentCategory }[];
  glow: boolean;
  pulse: boolean;
  pulseIndex: number;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  const filled = items.length > 0;
  return (
    <motion.div
      ref={innerRef}
      animate={{
        boxShadow: glow
          ? `0 0 0 3px ${color}66, 0 10px 28px -14px ${color}55`
          : "0 0 0 0 transparent",
        borderColor: filled ? `${color}80` : "rgba(127,127,127,0.3)",
        scale: pulse ? [1, 1.04, 1] : 1,
      }}
      transition={
        pulse
          ? { duration: 0.6, delay: pulseIndex * 0.12, ease: "easeOut" }
          : { duration: 0.35, ease: "easeOut" }
      }
      className="relative rounded-xl border-2 bg-card/95 px-3 py-2"
      style={{ backgroundColor: filled ? `${color}0a` : undefined }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex size-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </span>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color }}
        >
          {title}
        </p>
        <motion.span
          key={items.length}
          initial={{ scale: 0.35 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
          className="ml-auto rounded-full px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums"
          style={{
            backgroundColor: filled ? `${color}26` : "rgba(127,127,127,0.12)",
            color: filled ? color : "var(--muted-foreground)",
          }}
        >
          {items.length}
        </motion.span>
      </div>
      <div className="mt-1.5 min-h-[26px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {filled ? (
            <motion.div
              key={items[items.length - 1]!.id}
              initial={{ opacity: 0, scale: 0.82, y: -3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <BriefChip
                text={items[items.length - 1]!.text}
                category={items[items.length - 1]!.category}
              />
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="select-none text-[9.5px] italic text-muted-foreground/70"
            >
              waiting…
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact brief chip — colour bar + excerpt only (no category label text)

function BriefChip({
  text,
  category,
  large,
}: {
  text: string;
  category: BriefSegmentCategory;
  large?: boolean;
}) {
  const color = CATEGORY_COLOR[category];
  return (
    <span
      className={cn(
        "relative inline-flex max-w-full items-center overflow-hidden rounded-md border bg-card pr-2.5 shadow-sm",
        large ? "h-[28px] pl-3.5" : "h-[24px] pl-3"
      )}
      style={{
        borderColor: `${color}4d`,
        backgroundColor: `${color}12`,
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[4px]"
        style={{ backgroundColor: color }}
      />
      <span
        className={cn(
          "truncate font-medium text-foreground/90",
          large ? "text-[11px]" : "text-[10.5px]"
        )}
      >
        {text}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FlightChip — measured chip flight with a drawn dashed-Bezier trail

function FlightChip({
  stageRef,
  fromEl,
  toEl,
  active,
  category,
  text,
}: {
  stageRef: RefObject<HTMLDivElement | null>;
  fromEl: HTMLElement | null;
  toEl: HTMLElement | null;
  active: boolean;
  category: BriefSegmentCategory;
  text: string;
}) {
  const [rects, setRects] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!active || !fromEl || !toEl || !stageRef.current) {
      setRects(null);
      return;
    }
    const compute = () => {
      const s = stageRef.current!.getBoundingClientRect();
      const f = fromEl.getBoundingClientRect();
      const t = toEl.getBoundingClientRect();
      setRects({
        // source = left-side of the line text (after index column)
        fromX: f.left - s.left + 28,
        // chip top-left so that chip centre aligns with line centre
        fromY: f.top - s.top + f.height / 2 - 14,
        // target = chip slot inside the bucket card
        toX: t.left - s.left + 12,
        toY: t.top - s.top + 30,
      });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(fromEl);
    ro.observe(toEl);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [active, fromEl, toEl, stageRef]);

  if (!active || !rects) return null;

  const color = CATEGORY_COLOR[category];
  const midX = (rects.fromX + rects.toX) / 2;
  // Chip follows a higher arc than the trail control to keep it above the line
  const chipPeakY = Math.min(rects.fromY, rects.toY) - 50;
  const svgControlY = Math.min(rects.fromY, rects.toY) - 90;
  const pathD = `M ${rects.fromX} ${rects.fromY + 14} Q ${midX} ${svgControlY} ${rects.toX + 20} ${rects.toY + 14}`;

  return (
    <>
      {/* Drawn dashed trail */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{ overflow: "visible" }}
      >
        <motion.path
          d={pathD}
          stroke={color}
          strokeWidth={1.8}
          strokeDasharray="3 4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.55 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
        />
      </svg>

      {/* Flying chip */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-30"
        initial={{ x: rects.fromX, y: rects.fromY, opacity: 0, scale: 0.92, rotate: 0 }}
        animate={{
          x: [rects.fromX, midX, rects.toX],
          y: [rects.fromY, chipPeakY, rects.toY],
          opacity: [0, 1, 1, 0],
          scale: [0.92, 1.15, 1],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 0.95,
          times: [0, 0.22, 0.8, 1],
          ease: [0.22, 1, 0.36, 1],
          delay: 0.18,
        }}
      >
        <BriefChip text={text} category={category} large />
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Beats — 7 narrated moments driving the stage timeline

export const BRIEF_TRIAGE_BEATS = [
  { caption: "A printed brief arrives on the left; four empty plan buckets wait on the right.", after: 1000 },
  { caption: "The cursor scans line 1 — a client success target. That sentence is an AIM.", after: 1450 },
  { caption: "Line 2 is a fixed rule or hard deadline — it lands in CONSTRAINTS.", after: 1400 },
  { caption: "Line 3 names files, datasets or roles — these are your ASSETS.", after: 1400 },
  { caption: "Line 4 is something that could derail delivery — a RISK.", after: 1400 },
  { caption: "Line 5 is UX detail, not plan evidence. The cursor refuses to extract it.", after: 1450 },
  { caption: "Four sentences extracted, one intentionally skipped. The brief is triaged.", after: 1000 },
];
