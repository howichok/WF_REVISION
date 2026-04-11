"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  PenLine,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import {
  mergeHlQuotesIntoHighlightSpans,
  type AnswerHighlightSpans,
  type ExamConditionsSession,
  type ExamConditionsSessionResult,
  type ExaminerWalkthroughBeat,
} from "@/lib/exam-conditions";
import { extractCommandWord } from "@/lib/command-words";
import { cn } from "@/lib/utils";

const EXAM_TOPIC_LIST_HREF = "/revision/topics?mode=exam";

/* ── Animated score ring ──────────────────────────────────── */
function ScoreRing({ percent, size = 120, strokeWidth = 8, delay = 0.3 }: { percent: number; size?: number; strokeWidth?: number; delay?: number }) {
  const reduced = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = percent >= 70 ? "#10b981" : percent >= 40 ? "#f59e0b" : "#ef4444";
  const bgColor = percent >= 70 ? "#d1fae5" : percent >= 40 ? "#fef3c7" : "#fee2e2";

  return (
    <svg width={size} height={size} className="score-ring-svg" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (circumference * percent) / 100 }}
        transition={reduced ? { duration: 0 } : { delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* ── Count-up number ──────────────────────────────────────── */
function CountUp({ to, delay = 0.3, duration = 0.8 }: { to: number; delay?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) { setDisplay(to); return; }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = (now - start) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * to));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [to, delay, duration, reduced]);

  return <>{display}</>;
}

/* ── Celebration particles ────────────────────────────────── */
function CelebrationParticles({ count = 24 }: { count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 280,
      y: -(Math.random() * 160 + 60),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 0.5,
      color: ["#10b981", "#f59e0b", "#8b5cf6", "#f472b6", "#38bdf8", "#fb923c"][i % 6],
    })),
  [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0, rotate: p.rotate }}
          transition={{ delay: 0.4 + p.delay, duration: 1.4, ease: "easeOut" }}
          style={{ width: 8, height: 8, borderRadius: p.id % 3 === 0 ? "50%" : "2px", background: p.color }}
        />
      ))}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Results View — redesigned with animations & compact layout
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

type ExaminerScriptStep = { label?: string; text: string; reviewIndex?: number };

function ExaminerScriptTheatre({
  opening,
  walkthrough,
  whatWentWell,
  targetsToImprove,
  onJumpToQuestion,
  onReturnToPaper,
}: {
  opening: string;
  walkthrough: NonNullable<ExamConditionsSessionResult["examinerWalkthrough"]>;
  whatWentWell: string;
  targetsToImprove: string;
  onJumpToQuestion?: (reviewIndex: number) => void;
  /** Leave results and open the live answer sheet at the given question. */
  onReturnToPaper?: (reviewIndex: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [revealAll, setRevealAll] = useState(false);
  const skipTyping = reduceMotion || revealAll;

  const steps: ExaminerScriptStep[] = useMemo(() => {
    const out: ExaminerScriptStep[] = [{ text: opening }];
    walkthrough.forEach((beat, i) => {
      const block = [beat.line, beat.note].map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n\n");
      if (block) {
        out.push({ label: `Question ${i + 1}`, text: block, reviewIndex: i });
      }
    });
    out.push({ label: "What went well", text: whatWentWell });
    out.push({ label: "Targets to improve", text: targetsToImprove });
    return out.filter((s) => s.text.trim().length > 0);
  }, [opening, walkthrough, whatWentWell, targetsToImprove]);

  const [stepIndex, setStepIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (skipTyping) {
      setStepIndex(steps.length);
      setCharIndex(0);
      return;
    }

    setStepIndex(0);
    setCharIndex(0);
  }, [skipTyping, steps]);

  useEffect(() => {
    if (skipTyping || steps.length === 0) {
      return;
    }

    if (stepIndex >= steps.length) {
      return;
    }

    const text = steps[stepIndex]!.text;
    if (charIndex >= text.length) {
      const t = window.setTimeout(() => {
        setStepIndex((s) => s + 1);
        setCharIndex(0);
      }, 380);
      return () => window.clearTimeout(t);
    }

    const tick = window.setTimeout(() => {
      setCharIndex((c) => c + 1);
    }, 22);

    return () => window.clearTimeout(tick);
  }, [skipTyping, steps, stepIndex, charIndex]);

  if (steps.length === 0) {
    return null;
  }

  if (skipTyping) {
    return (
      <div
        role="region"
        aria-label="Examiner commentary"
        className="examiner-theatre mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#fdfcfa] to-[#f7f5f2] shadow-[0_8px_32px_-12px_rgba(60,50,30,0.1)] dark:border-slate-700/60 dark:from-slate-900 dark:to-slate-900/90 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
      >
        {/* Examiner report header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 dark:border-slate-100/10 dark:from-slate-950 dark:to-black sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <PenLine size={15} className="text-white/90" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-white/95">Examiner&apos;s Report</p>
              <p className="text-[9px] font-medium text-white/50">AI-assisted marking commentary</p>
            </div>
          </div>
          {!reduceMotion ? (
            <button
              type="button"
              onClick={() => setRevealAll(false)}
              className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              Replay
            </button>
          ) : null}
        </div>

        <div className="px-5 py-6 sm:px-7">
          <div className="space-y-5 text-[14px] leading-[1.75] text-slate-800 dark:text-slate-300">
            {steps.map((s, i) => (
              <div key={`ex-${i}`}>
                {s.label ? (
                  <p className="examiner-section-label mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    <span className="inline-block h-px w-4 bg-slate-300 dark:bg-slate-600" />
                    {s.label}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{s.text}</p>
                {s.reviewIndex != null && (onJumpToQuestion || onReturnToPaper) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {onReturnToPaper ? (
                      <button
                        type="button"
                        onClick={() => onReturnToPaper(s.reviewIndex!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent shadow-sm transition-colors hover:bg-accent/15"
                      >
                        <PenLine size={11} className="shrink-0 opacity-80" aria-hidden />
                        Back to answer sheet
                      </button>
                    ) : null}
                    {onJumpToQuestion ? (
                      <button
                        type="button"
                        onClick={() => onJumpToQuestion(s.reviewIndex!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/90 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition-colors hover:border-accent/40 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-accent/40 dark:hover:bg-slate-800"
                      >
                        <ArrowRight size={11} className="shrink-0 opacity-70" aria-hidden />
                        Jump to transcript
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const done = stepIndex >= steps.length;

  return (
    <motion.div
      role="region"
      aria-label="Examiner commentary"
      aria-busy={!done}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="examiner-theatre mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#fdfcfa] to-[#f7f5f2] shadow-[0_8px_32px_-12px_rgba(60,50,30,0.1)] dark:border-slate-700/60 dark:from-slate-900 dark:to-slate-900/90 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
    >
      {/* Examiner report header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 dark:border-slate-100/10 dark:from-slate-950 dark:to-black sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <PenLine size={15} className="text-white/90" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-white/95">Examiner&apos;s Report</p>
            <p className="text-[9px] font-medium text-white/50">AI-assisted marking commentary</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!done ? (
            <button
              type="button"
              onClick={() => setRevealAll(true)}
              className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              Show all
            </button>
          ) : null}
          {!done ? (
            <span className="text-[10px] font-medium tabular-nums text-white/50">
              {Math.min(stepIndex + 1, steps.length)}/{steps.length}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-emerald-400">Complete</span>
          )}
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7">
        <div
          className="space-y-5 text-[14px] leading-[1.75] text-slate-700 dark:text-slate-300"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {steps.slice(0, stepIndex).map((s, i) => (
            <div key={`ex-done-${i}`}>
              {s.label ? (
                <p className="examiner-section-label mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-px w-4 bg-slate-300 dark:bg-slate-600" />
                  {s.label}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{s.text}</p>
              {s.reviewIndex != null && (onJumpToQuestion || onReturnToPaper) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {onReturnToPaper ? (
                    <button
                      type="button"
                      onClick={() => onReturnToPaper(s.reviewIndex!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent shadow-sm transition-colors hover:bg-accent/15"
                    >
                      <PenLine size={11} className="shrink-0 opacity-80" aria-hidden />
                      Back to answer sheet
                    </button>
                  ) : null}
                  {onJumpToQuestion ? (
                    <button
                      type="button"
                      onClick={() => onJumpToQuestion(s.reviewIndex!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/90 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition-colors hover:border-accent/40 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-accent/40 dark:hover:bg-slate-800"
                    >
                      <ArrowRight size={11} className="shrink-0 opacity-70" aria-hidden />
                      Jump to transcript
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}

          {!done && stepIndex < steps.length ? (
            <div>
              {steps[stepIndex]!.label ? (
                <p className="examiner-section-label mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-px w-4 bg-slate-300 dark:bg-slate-600" />
                  {steps[stepIndex]!.label}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {steps[stepIndex]!.text.slice(0, charIndex)}
                <span className="examiner-cursor ml-0.5 inline-block w-[2px] animate-pulse bg-slate-800 dark:bg-slate-200" aria-hidden>
                  &nbsp;
                </span>
              </p>
              {steps[stepIndex]!.reviewIndex != null && (onJumpToQuestion || onReturnToPaper) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {onReturnToPaper ? (
                    <button
                      type="button"
                      onClick={() => onReturnToPaper(steps[stepIndex]!.reviewIndex!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent shadow-sm transition-colors hover:bg-accent/15"
                    >
                      <PenLine size={11} className="shrink-0 opacity-80" aria-hidden />
                      Back to answer sheet
                    </button>
                  ) : null}
                  {onJumpToQuestion ? (
                    <button
                      type="button"
                      onClick={() => onJumpToQuestion(steps[stepIndex]!.reviewIndex!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/90 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition-colors hover:border-accent/40 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-accent/40 dark:hover:bg-slate-800"
                    >
                      <ArrowRight size={11} className="shrink-0 opacity-70" aria-hidden />
                      Jump to transcript
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

type HighlightRange = { start: number; end: number; kind: "credit" | "improve" };

function rangesFromHighlightSpans(text: string, hl: AnswerHighlightSpans): HighlightRange[] {
  const n = text.length;
  const toRange = (pair: [number, number], kind: HighlightRange["kind"]): HighlightRange | null => {
    const a = Math.round(pair[0]);
    const b = Math.round(pair[1]);
    const lo = Math.max(0, Math.min(Math.min(a, b), n));
    const hi = Math.max(lo, Math.min(Math.max(a, b), n));
    if (hi <= lo) {
      return null;
    }
    return { start: lo, end: hi, kind };
  };

  const credit = (hl.c ?? [])
    .map((p) => (Array.isArray(p) && p.length === 2 ? toRange(p as [number, number], "credit") : null))
    .filter(Boolean) as HighlightRange[];
  const improveRaw = (hl.i ?? [])
    .map((p) => (Array.isArray(p) && p.length === 2 ? toRange(p as [number, number], "improve") : null))
    .filter(Boolean) as HighlightRange[];
  const improve = improveRaw.filter(
    (ir) => !credit.some((cr) => ir.start < cr.end && ir.end > cr.start)
  );

  return [...credit, ...improve].sort((x, y) => x.start - y.start || x.end - y.end);
}

function collectHighlightRanges(
  text: string,
  phrases: string[],
  kind: HighlightRange["kind"],
  blocked: Array<{ start: number; end: number }>
): HighlightRange[] {
  const lower = text.toLowerCase();
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  const ranges: HighlightRange[] = [];
  const forbid = [...blocked];

  for (const raw of sorted) {
    const p = raw.trim();
    if (p.length < 4) {
      continue;
    }
    const pl = p.toLowerCase();
    const idx = lower.indexOf(pl);
    if (idx === -1) {
      continue;
    }
    const end = idx + p.length;
    const overlaps = forbid.some((b) => idx < b.end && end > b.start);
    if (overlaps) {
      continue;
    }
    ranges.push({ start: idx, end, kind });
    forbid.push({ start: idx, end });
  }

  return ranges;
}

function renderHighlightedAnswerBody(
  text: string,
  beat?: ExaminerWalkthroughBeat | null,
  options?: { hideLegend?: boolean },
): ReactNode {
  /** Must match marking payload: `gemini-exam-session-mark` compact `a` uses trim only. */
  const trimmed = text.trim();
  if (!trimmed) {
    return (
      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed italic text-slate-400 dark:text-slate-500">
        No answer submitted.
      </p>
    );
  }
  const hlResolved = beat ? mergeHlQuotesIntoHighlightSpans(trimmed, beat.hl, beat.hlQuotes) : undefined;
  if (hlResolved && ((hlResolved.c?.length ?? 0) > 0 || (hlResolved.i?.length ?? 0) > 0)) {
    const all = rangesFromHighlightSpans(trimmed, hlResolved);
    if (all.length > 0) {
      const parts: ReactNode[] = [];
      let cursor = 0;
      all.forEach((seg, ix) => {
        if (seg.start > cursor) {
          parts.push(<span key={`t-${ix}-${cursor}`}>{trimmed.slice(cursor, seg.start)}</span>);
        }
        const slice = trimmed.slice(seg.start, seg.end);
        parts.push(
          <mark
            key={`h-${ix}-${seg.start}-${seg.kind}`}
            className={
              seg.kind === "credit"
                ? "rounded-sm bg-emerald-200/90 px-0.5 text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50"
                : "rounded-sm bg-amber-200/90 px-0.5 text-amber-950 dark:bg-amber-500/40 dark:text-amber-50"
            }
          >
            {slice}
          </mark>
        );
        cursor = seg.end;
      });
      if (cursor < trimmed.length) {
        parts.push(<span key={`t-end-${cursor}`}>{trimmed.slice(cursor)}</span>);
      }

      const hasImprove = all.some((s) => s.kind === "improve");
      const showLegend = !options?.hideLegend && hasImprove;

      return (
        <>
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
            {parts}
          </p>
          {showLegend ? (
            <p className="mt-2 text-[9px] leading-snug text-slate-500 dark:text-slate-400">
              <span className="mr-2 inline-block rounded-sm bg-emerald-200/90 px-1 py-px text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50">
                Credit
              </span>
              <span className="inline-block rounded-sm bg-amber-200/90 px-1 py-px text-amber-950 dark:bg-amber-500/40 dark:text-amber-50">
                Improve
              </span>
              <span className="ml-1.5">— highlighted spans from examiner review.</span>
            </p>
          ) : null}
        </>
      );
    }
  }

  const credit = beat?.credit ?? [];
  const improve = beat?.improve ?? [];
  if (credit.length === 0 && improve.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
        {trimmed}
      </p>
    );
  }

  const creditRanges = collectHighlightRanges(trimmed, credit, "credit", []);
  const improveRanges = collectHighlightRanges(trimmed, improve, "improve", creditRanges);
  const all = [...creditRanges, ...improveRanges].sort((a, b) => a.start - b.start || a.end - b.end);
  if (all.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
        {trimmed}
      </p>
    );
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  all.forEach((seg, ix) => {
    if (seg.start > cursor) {
      parts.push(<span key={`t-${ix}-${cursor}`}>{trimmed.slice(cursor, seg.start)}</span>);
    }
    const slice = trimmed.slice(seg.start, seg.end);
    parts.push(
      <mark
        key={`h-${ix}-${seg.start}-${seg.kind}`}
        className={
          seg.kind === "credit"
            ? "rounded-sm bg-emerald-200/90 px-0.5 text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50"
            : "rounded-sm bg-amber-200/90 px-0.5 text-amber-950 dark:bg-amber-500/40 dark:text-amber-50"
        }
      >
        {slice}
      </mark>
    );
    cursor = seg.end;
  });
  if (cursor < trimmed.length) {
    parts.push(<span key={`t-end-${cursor}`}>{trimmed.slice(cursor)}</span>);
  }

  const legacyShowLegend = !options?.hideLegend && improveRanges.length > 0;

  return (
    <>
      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">{parts}</p>
      {legacyShowLegend ? (
        <p className="mt-2 text-[9px] leading-snug text-slate-500 dark:text-slate-400">
          <span className="mr-2 inline-block rounded-sm bg-emerald-200/90 px-1 py-px text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50">
            Credit
          </span>
          <span className="inline-block rounded-sm bg-amber-200/90 px-1 py-px text-amber-950 dark:bg-amber-500/40 dark:text-amber-50">
            Improve
          </span>
          <span className="ml-1.5">— phrase match from saved marking data.</span>
        </p>
      ) : null}
    </>
  );
}

function isGenericMarkSchemeLine(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim().toLowerCase();
  return t.length === 0 || /^meets the mark scheme\.?$/.test(t) || /^partial match to the scheme\.?$/.test(t);
}

function ReviewCard({
  review,
  index,
  markingProvider,
  walkthroughBeat,
  pinnedReviewQuestionId,
  onReturnToPaper,
}: {
  review: ExamConditionsSessionResult["reviews"][number];
  index: number;
  markingProvider?: string;
  walkthroughBeat?: ExaminerWalkthroughBeat | null;
  pinnedReviewQuestionId?: string | null;
  onReturnToPaper?: (reviewIndex: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const reviewCommandWord = extractCommandWord(review.question.prompt);
  const reviewParts = reviewCommandWord
    ? {
        highlighted: review.question.prompt.slice(0, reviewCommandWord.word.length),
        rest: review.question.prompt.slice(reviewCommandWord.word.length),
      }
    : null;

  const scoreColor =
    review.score === review.maxScore
      ? "text-emerald-500 dark:text-emerald-400"
      : review.score > 0
        ? "text-amber-500 dark:text-amber-400"
        : "text-slate-400 dark:text-slate-500";

  const scoreUnderline =
    review.score === review.maxScore
      ? "border-emerald-500/85"
      : review.score > 0
        ? "border-amber-500/85"
        : "border-slate-300 dark:border-slate-600";

  const hasDetail = !!(review.geminiMarking && review.answer.trim());
  const isFullMarks = review.maxScore > 0 && review.score >= review.maxScore;
  const feedbackTrim = review.evaluation.feedback.replace(/\s+/g, " ").trim();
  const whyTrim = (review.geminiMarking?.why ?? "").replace(/\s+/g, " ").trim();
  const hideSecondaryPanels =
    isFullMarks &&
    markingProvider === "gemini" &&
    !review.geminiMarking?.lowConfidence &&
    (review.geminiMarking?.evidence?.length ?? 0) === 0 &&
    (isGenericMarkSchemeLine(feedbackTrim) ||
      feedbackTrim === whyTrim ||
      (isGenericMarkSchemeLine(whyTrim) && feedbackTrim.length < 80));

  const showSlotGrid =
    review.evaluation.missingSlots.length > 0 ||
    (!isFullMarks && review.evaluation.matchedSlots.length > 0);

  useEffect(() => {
    if (pinnedReviewQuestionId && pinnedReviewQuestionId === review.question.id) {
      setOpen(true);
    }
  }, [pinnedReviewQuestionId, review.question.id]);

  return (
    <motion.div
      id={`exam-paper-review-${review.question.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "results-review-card group scroll-mt-28 rounded-xl border-b border-slate-200/90 pb-6 pt-2 first:pt-0 last:border-b-0 dark:border-slate-800/80",
        pinnedReviewQuestionId === review.question.id &&
          "ring-2 ring-accent/50 ring-offset-2 ring-offset-[#faf9f7] transition-shadow dark:ring-offset-[#0f1118]"
      )}
    >
      {/* Compact header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 py-2 text-left"
      >
        {/* Q number — editorial margin marker */}
        <span className="mt-0.5 w-6 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
          {index + 1}.
        </span>

        {/* Question text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-sm">
            {reviewParts ? (
              <>
                <span className="command-word-highlight">{reviewParts.highlighted}</span>
                {reviewParts.rest}
              </>
            ) : (
              review.question.prompt
            )}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span className="tabular-nums text-slate-600 dark:text-slate-400">{review.maxScore} marks</span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span
              className={
                review.question.difficulty === "hard"
                  ? "text-red-600 dark:text-red-400"
                  : review.question.difficulty === "medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {review.question.difficulty}
            </span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span
              className={
                review.score === review.maxScore
                  ? "text-emerald-600 dark:text-emerald-400"
                  : review.score > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-400 dark:text-slate-500"
              }
            >
              {review.evaluation.verdictLabel}
            </span>
          </p>
          {(review.question.stemOrigin === "past-paper" ||
            review.question.stemOrigin === "paper-set" ||
            review.question.sourceLabel ||
            review.question.year != null) && (
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              {review.question.stemOrigin === "past-paper"
                ? "Past paper stem"
                : review.question.stemOrigin === "paper-set"
                  ? "Paper-style set"
                  : "Practice"}
              {review.question.sourceLabel ? ` · ${review.question.sourceLabel}` : ""}
              {review.question.year != null ? ` · ${review.question.year}` : ""}
            </p>
          )}
        </div>

        {/* Score + chevron */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className={`min-w-[3.25rem] border-b-2 px-1 pb-1 text-center ${scoreUnderline}`}>
            <p className={`font-mono text-base font-bold tabular-nums leading-none ${scoreColor}`}>
              {review.score}<span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">/{review.maxScore}</span>
            </p>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
          </motion.div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 pb-2 pt-4 pl-9 dark:border-slate-800">
              {onReturnToPaper ? (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => onReturnToPaper(index)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/15"
                  >
                    <PenLine size={12} className="shrink-0 opacity-80" aria-hidden />
                    Back to answer sheet (Q{index + 1})
                  </button>
                </div>
              ) : null}
              {/* Answer + Feedback — second column dropped for clean full-marks Gemini rows */}
              <div className={cn("grid gap-5", hideSecondaryPanels ? "grid-cols-1" : "lg:grid-cols-2")}>
                <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    <PenLine size={10} />
                    Your answer
                  </p>
                  <div className="mt-2.5">
                    {renderHighlightedAnswerBody(review.answer, walkthroughBeat ?? null, {
                      hideLegend: isFullMarks || hideSecondaryPanels,
                    })}
                  </div>
                </div>
                {!hideSecondaryPanels ? (
                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      <Sparkles size={10} />
                      Feedback
                    </p>
                    <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {review.evaluation.feedback}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Model answer */}
              {!hideSecondaryPanels && review.question.expectation ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 }}
                  className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                >
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                    <BookOpen size={10} />
                    Expected answer
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-emerald-900/80 dark:text-emerald-100/85">
                    {review.question.expectation}
                  </p>
                </motion.div>
              ) : null}

              {/* Examiner detail */}
              {!hideSecondaryPanels && hasDetail && review.geminiMarking ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/30 p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <GraduationCap size={13} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                      {markingProvider === "gemini" ? "Examiner\u2019s note" : "Mark breakdown"}
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium capitalize text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700/80">
                      {review.geminiMarking.level}
                    </span>
                    {review.geminiMarking.lowConfidence ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/40">
                        Review — differs from local check
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.geminiMarking.why}
                  </p>
                  {review.geminiMarking.evidence.length > 0 ? (
                    <div className="mt-3 border-t border-amber-200/50 pt-3 dark:border-amber-500/20">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600/80 dark:text-amber-400/80">
                        Evidence from your answer
                      </p>
                      <ul className="mt-1.5 list-none space-y-1 text-[11.5px] text-slate-600 dark:text-slate-400">
                        {review.geminiMarking.evidence.map((line, evIndex) => (
                          <li key={`${review.question.id}-ev-${evIndex}`} className="flex items-start gap-1.5">
                            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-400 dark:bg-amber-500" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}

              {/* Covered / Missing */}
              {showSlotGrid ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {review.evaluation.matchedSlots.length > 0 ? (
                    <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/30 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={11} />
                        Points covered
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {review.evaluation.matchedSlots.slice(0, 6).map((item) => (
                          <span key={`${review.question.id}-c-${item}`} className="results-slot-badge rounded-lg bg-emerald-100/80 px-2.5 py-1 text-[10.5px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {review.evaluation.missingSlots.length > 0 ? (
                    <div className="rounded-xl border border-red-200/50 bg-red-50/25 p-3.5 dark:border-red-500/30 dark:bg-red-500/10">
                      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-red-500 dark:text-red-400">
                        <XCircle size={11} />
                        Points missing
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {review.evaluation.missingSlots.slice(0, 6).map((item) => (
                          <span key={`${review.question.id}-m-${item}`} className="results-slot-badge rounded-lg bg-red-100/70 px-2.5 py-1 text-[10.5px] font-medium text-red-700 dark:bg-red-500/20 dark:text-red-300">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ExamConditionsResultsView({
  results,
  session,
  topicIcon,
  topicLabel,
  startSession,
  onReturnToPaper,
}: {
  results: ExamConditionsSessionResult;
  session: ExamConditionsSession;
  topicIcon?: string;
  topicLabel: string;
  startSession: () => void;
  onReturnToPaper?: (questionIndex: number) => void;
}) {
  const isGreat = results.scorePercent >= 70;
  const showExaminerTheatre =
    results.markingProvider === "gemini" &&
    (results.examinerWalkthrough?.length ?? 0) > 0 &&
    Boolean(results.sessionClosingFeedback);

  const [pinnedReviewQuestionId, setPinnedReviewQuestionId] = useState<string | null>(null);

  const handleJumpToQuestion = useCallback(
    (reviewIndex: number) => {
      const rev = results.reviews[reviewIndex];
      if (!rev) {
        return;
      }
      setPinnedReviewQuestionId(rev.question.id);
      window.requestAnimationFrame(() => {
        document.getElementById(`exam-paper-review-${rev.question.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    },
    [results.reviews]
  );

  useEffect(() => {
    if (!pinnedReviewQuestionId) {
      return;
    }
    const t = window.setTimeout(() => setPinnedReviewQuestionId(null), 4500);
    return () => window.clearTimeout(t);
  }, [pinnedReviewQuestionId]);

  const fullMarksCount = results.reviews.filter((r) => r.score === r.maxScore).length;
  const partialCount = results.reviews.filter((r) => r.score > 0 && r.score < r.maxScore).length;
  const zeroCount = results.reviews.filter((r) => r.score === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="results-view min-h-screen bg-gradient-to-b from-[#faf9f7] to-[#f3f1ed] dark:from-[#0f1118] dark:to-[#131621]"
    >
      <div className="mx-auto w-full max-w-[min(100%,88rem)] px-5 py-8 sm:px-8 lg:px-14 xl:px-24 sm:py-10">

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <p className="results-session-label text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
            Session complete
          </p>
          <h1 className="mt-1 text-[1.5rem] font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[1.75rem]">
            {topicIcon ? `${topicIcon} ` : ""}{topicLabel}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={EXAM_TOPIC_LIST_HREF}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
          >
            <ArrowLeft size={13} />
            Topics
          </Link>
          {onReturnToPaper ? (
            <Button size="sm" variant="outline" onClick={() => onReturnToPaper(0)}>
              <PenLine size={13} />
              Your paper
            </Button>
          ) : null}
          <Button size="sm" onClick={startSession}>
            <RotateCcw size={13} />
            Again
          </Button>
        </div>
      </motion.div>

      {/* ── Score hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <div
          className={`results-hero-card relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-[0_12px_40px_-16px_rgba(60,50,30,0.12)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)] ${
            isGreat
              ? "border-l-[4px] border-l-emerald-500"
              : results.scorePercent >= 40
                ? "border-l-[4px] border-l-amber-500"
                : "border-l-[4px] border-l-red-400"
          }`}
        >
          {isGreat ? <CelebrationParticles /> : null}

          <div className="flex flex-col items-center gap-5 px-5 py-7 sm:flex-row sm:gap-8 sm:px-8 sm:py-8">
            {/* Score ring */}
            <div className="relative flex shrink-0 items-center justify-center">
              <ScoreRing percent={results.scorePercent} size={120} strokeWidth={8} delay={0.35} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-950 dark:text-slate-50">
                  <CountUp to={results.totalScore} delay={0.5} />
                  <span className="text-lg text-slate-400 dark:text-slate-500">/{results.totalMaxScore}</span>
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                  <CountUp to={results.scorePercent} delay={0.6} />%
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Result</p>
                {results.overallBand ? (
                  <Badge variant={isGreat ? "success" : results.scorePercent >= 40 ? "warning" : "default"}>
                    {results.overallBand}
                  </Badge>
                ) : null}
                <Badge variant="default">
                  {results.markingProvider === "gemini" ? "AI rubric pass" : "Fast checker"}
                </Badge>
              </div>

              <p className="mt-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                {results.answeredCount}/{session.questionCount} questions answered
              </p>

              {results.overallSummary ? (
                <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{results.overallSummary}</p>
              ) : null}

              <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
                For revision only — use this to spot gaps, not as a predicted grade. If a mark feels wrong, check the
                question source and ask your teacher.
              </p>

              {results.examMarkingMeta?.aiSkippedNote ? (
                <p className="mt-2 max-w-xl rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  {results.examMarkingMeta.aiSkippedNote}
                </p>
              ) : null}
            </div>
          </div>

          {/* Score breakdown stats */}
          <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start sm:gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{fullMarksCount}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Full marks</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
                  <ArrowRight size={13} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tabular-nums text-amber-700 dark:text-amber-400">{partialCount}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Partial</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                  <XCircle size={13} className="text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tabular-nums text-red-600 dark:text-red-400">{zeroCount}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">No marks</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Marking info note */}
        {results.markingProvider === "gemini" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-3 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400"
          >
            <span className="font-semibold text-slate-600 dark:text-slate-300">Note:</span> Marks and percentages are calculated; the band label is examiner-style guidance.
            This is an approximation, not a replacement for a real examiner.
            {results.examMarkingMeta?.markingResponseRecovered ? (
              <span className="ml-1 text-amber-700 dark:text-amber-400">Some wording was rebuilt after an incomplete model reply — marks are unchanged.</span>
            ) : null}
            {results.bandOverriddenToMatchMarks ? (
              <span className="ml-1 text-amber-700 dark:text-amber-400">Band adjusted to match your numeric score.</span>
            ) : null}
            {results.examinerNote ? (
              <span className="ml-1 italic text-slate-500 dark:text-slate-400">{results.examinerNote}</span>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>

      {showExaminerTheatre && results.sessionClosingFeedback && results.examinerWalkthrough ? (
        <ExaminerScriptTheatre
          opening={results.examinerOpening ?? ""}
          walkthrough={results.examinerWalkthrough}
          whatWentWell={results.sessionClosingFeedback.whatWentWell}
          targetsToImprove={results.sessionClosingFeedback.targetsToImprove}
          onJumpToQuestion={handleJumpToQuestion}
          onReturnToPaper={onReturnToPaper}
        />
      ) : results.sessionClosingFeedback ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">What went well</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
              {results.sessionClosingFeedback.whatWentWell}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="rounded-2xl border border-violet-200/60 bg-violet-50/35 px-4 py-4 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-800 dark:text-violet-300">Targets to improve</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
              {results.sessionClosingFeedback.targetsToImprove}
            </p>
          </motion.div>
        </div>
      ) : null}

      {/* ── Paper transcript ────────────────────────────── */}
      <div className="mt-10 flex items-center gap-3">
        <GraduationCap size={14} className="text-slate-400 dark:text-slate-500" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Your paper — question by question</p>
      </div>
      <div className="mt-3 space-y-0 rounded-2xl border border-slate-200/70 bg-white/60 px-5 py-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 sm:px-6">
        {results.reviews.map((review, index) => (
          <ReviewCard
            key={review.question.id}
            review={review}
            index={index}
            markingProvider={results.markingProvider}
            walkthroughBeat={results.examinerWalkthrough?.[index] ?? null}
            pinnedReviewQuestionId={pinnedReviewQuestionId}
            onReturnToPaper={onReturnToPaper}
          />
        ))}
      </div>

      </div>
    </motion.div>
  );
}
