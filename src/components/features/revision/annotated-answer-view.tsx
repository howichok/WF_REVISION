"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ExamImproveCallouts } from "@/components/features/revision/exam-improve-callouts";
import { MarkedExamAnswerInline, MarkedExamAnswerReadonly } from "@/components/features/revision/exam-marked-answer";
import type { ExamAnnotation, ExaminerWalkthroughBeat } from "@/lib/exam-conditions";
import type { MarkedAnswerDensity } from "@/components/features/revision/exam-marked-answer";

const CIRCLE_NUM = ["①", "②", "③", "④", "⑤", "⑥"];

type ConnectorPath = {
  d: string;
  key: string;
  kind: "credit" | "improve";
  /** Origin dot — the point on the mark where the line starts. */
  ox: number;
  oy: number;
};

/** Build a cubic bezier path between two points (works for both directions). */
function buildBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mid = (x1 + x2) / 2;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${mid.toFixed(1)} ${y1.toFixed(1)}, ${mid.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** Bounding rect relative to an ancestor (correct inside nested scroll containers). */
function relativeRect(el: Element, ancestor: Element) {
  const er = el.getBoundingClientRect();
  const ar = ancestor.getBoundingClientRect();
  return {
    top: er.top - ar.top,
    right: er.right - ar.left,
    bottom: er.bottom - ar.top,
    left: er.left - ar.left,
    width: er.width,
    height: er.height,
  };
}

// ── Split annotation cards ───────────────────────────────────────────────────

function CreditCard({
  ann,
  globalIdx,
  displayIdx,
}: {
  ann: ExamAnnotation;
  globalIdx: number;
  displayIdx: number;
}) {
  return (
    <div
      id={`annotation-card-${globalIdx}`}
      data-annotation-card={String(globalIdx)}
      data-annotation-card-credit={String(globalIdx)}
      className="rounded-xl border border-emerald-300/80 bg-emerald-50/80 px-3 py-2.5 text-[11px] leading-relaxed shadow-sm dark:border-emerald-500/35 dark:bg-emerald-500/10"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="mr-1 font-normal text-emerald-700 dark:text-emerald-400">
          {CIRCLE_NUM[displayIdx] ?? `${displayIdx + 1}.`}
        </span>
        Credit
      </p>
      <p className="mt-1.5 text-[12px] font-medium leading-snug text-emerald-950 dark:text-emerald-50">
        {ann.why}
      </p>
      <p className="mt-1 border-t border-emerald-200/50 pt-1.5 font-serif text-[11px] italic leading-snug text-emerald-800/70 dark:border-emerald-500/20 dark:text-emerald-300/80">
        &ldquo;{ann.quote}&rdquo;
      </p>
    </div>
  );
}

function ImproveCard({
  ann,
  globalIdx,
  displayIdx,
}: {
  ann: ExamAnnotation;
  globalIdx: number;
  displayIdx: number;
}) {
  return (
    <div
      id={`annotation-card-${globalIdx}`}
      data-annotation-card={String(globalIdx)}
      data-annotation-card-improve={String(globalIdx)}
      className="rounded-xl border border-amber-400/70 bg-amber-50/80 px-3 py-2.5 text-[11px] leading-relaxed shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="mr-1 font-normal text-amber-700 dark:text-amber-400">
          {CIRCLE_NUM[displayIdx] ?? `${displayIdx + 1}.`}
        </span>
        Improve
      </p>
      <p className="mt-1.5 text-[12px] font-medium leading-snug text-amber-950 dark:text-amber-50">
        {ann.why}
      </p>
      <p className="mt-1 border-t border-amber-300/40 pt-1.5 font-serif text-[11px] italic leading-snug text-amber-800/70 dark:border-amber-500/25 dark:text-amber-300/80">
        &ldquo;{ann.quote}&rdquo;
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnnotatedAnswerView({
  answerText,
  walkthroughBeat,
  fallbackFeedback,
  density = "paper",
  className,
}: {
  answerText: string;
  walkthroughBeat?: ExaminerWalkthroughBeat | null;
  fallbackFeedback?: string;
  density?: MarkedAnswerDensity;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<ConnectorPath[]>([]);

  const annotations = walkthroughBeat?.annotations?.filter((a) => a.quote.trim().length >= 4) ?? [];
  const creditAnnotations = annotations
    .map((a, i) => ({ ann: a, globalIdx: i }))
    .filter(({ ann }) => ann.kind === "c");
  const improveAnnotations = annotations
    .map((a, i) => ({ ann: a, globalIdx: i }))
    .filter(({ ann }) => ann.kind === "i");
  const hasAnnotations = annotations.length > 0;
  const hasBothSides = creditAnnotations.length > 0 && improveAnnotations.length > 0;

  // lead / note for legacy-compat header
  const lead = walkthroughBeat?.line?.trim();
  const note = walkthroughBeat?.note?.trim();

  useLayoutEffect(() => {
    const container = wrapRef.current;
    if (!container || typeof window === "undefined") return;

    function measure() {
      const el = wrapRef.current;
      if (!el) return;
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      if (!wide) { setPaths([]); return; }

      const cr = el.getBoundingClientRect();
      if (cr.width < 10 || cr.height < 10) { setPaths([]); return; }

      const next: ConnectorPath[] = [];

      // Credit marks → LEFT side cards (mark's LEFT edge to card's RIGHT edge)
      el.querySelectorAll<HTMLElement>('mark[data-ann-kind="credit"][data-ann-idx]').forEach((mark, ix) => {
        const idx = mark.getAttribute("data-ann-idx");
        if (!idx) return;
        const card = el.querySelector<HTMLElement>(`[data-annotation-card-credit="${idx}"]`);
        if (!card) return;
        const m = relativeRect(mark, el);
        const c = relativeRect(card, el);
        const ox = m.left - 2;
        const oy = m.top + m.height / 2;
        const x2 = c.right + 2;
        const y2 = c.top + c.height / 2;
        if (ox <= x2 + 4) return; // card must be to the left
        next.push({ key: `credit-${idx}-${ix}`, d: buildBezierPath(ox, oy, x2, y2), kind: "credit", ox, oy });
      });

      // Improve marks → RIGHT side cards (mark's RIGHT edge to card's LEFT edge)
      el.querySelectorAll<HTMLElement>('mark[data-ann-kind="improve"][data-ann-idx]').forEach((mark, ix) => {
        const idx = mark.getAttribute("data-ann-idx");
        if (!idx) return;
        const card = el.querySelector<HTMLElement>(`[data-annotation-card-improve="${idx}"]`);
        if (!card) return;
        const m = relativeRect(mark, el);
        const c = relativeRect(card, el);
        const ox = m.right + 2;
        const oy = m.top + m.height / 2;
        const x2 = c.left - 2;
        const y2 = c.top + c.height / 2;
        if (x2 <= ox + 4) return; // card must be to the right
        next.push({ key: `improve-${idx}-${ix}`, d: buildBezierPath(ox, oy, x2, y2), kind: "improve", ox, oy });
      });

      setPaths(next);
    }

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    window.addEventListener("resize", measure);
    let node: Element | null = container.parentElement;
    const scrollTargets: Element[] = [];
    while (node) { scrollTargets.push(node); node = node.parentElement; }
    scrollTargets.forEach((t) => t.addEventListener("scroll", measure, { passive: true }));

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      scrollTargets.forEach((t) => t.removeEventListener("scroll", measure));
    };
  }, [answerText, walkthroughBeat]);

  // ── When annotations exist: 3-column layout at lg: ──────────────────────
  if (hasAnnotations) {
    return (
      <div
        ref={wrapRef}
        className={cn("relative", density === "compact" ? className : undefined)}
      >
        {/* Lead comment spanning full width */}
        {lead ? (
          <div className="mb-3 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-[12px] leading-snug text-slate-700 shadow-sm dark:border-slate-600/80 dark:bg-slate-900/60 dark:text-slate-200">
            <span className="font-semibold text-amber-700 dark:text-amber-400">↳ </span>
            {lead}
          </div>
        ) : null}

        {/* 3-column: credit | answer | improve */}
        <div className={cn(
          "flex flex-col gap-4",
          hasBothSides ? "lg:grid lg:grid-cols-[200px_1fr_200px] lg:gap-5" :
          creditAnnotations.length > 0 ? "lg:grid lg:grid-cols-[200px_1fr] lg:gap-5" :
          "lg:grid lg:grid-cols-[1fr_200px] lg:gap-5"
        )}>
          {/* Credit cards — left column (only on lg:) */}
          {creditAnnotations.length > 0 ? (
            <aside className={cn(
              "order-3 space-y-2 lg:order-1",
              !hasBothSides && improveAnnotations.length > 0 && "hidden lg:block"
            )}>
              {creditAnnotations.map(({ ann, globalIdx }, di) => (
                <CreditCard key={globalIdx} ann={ann} globalIdx={globalIdx} displayIdx={di} />
              ))}
            </aside>
          ) : hasBothSides ? <div className="hidden lg:block" /> : null}

          {/* Answer — centre */}
          <div className={cn(
            "min-w-0 flex-1",
            hasBothSides ? "order-1 lg:order-2" : "order-1"
          )}>
            {density === "paper" ? (
              <MarkedExamAnswerReadonly
                answerText={answerText}
                walkthroughBeat={walkthroughBeat}
                hideLegend={false}
              />
            ) : (
              <MarkedExamAnswerInline
                answerText={answerText}
                walkthroughBeat={walkthroughBeat}
                hideLegend={false}
                className={!hasBothSides ? className : undefined}
              />
            )}
          </div>

          {/* Improve cards — right column */}
          {improveAnnotations.length > 0 ? (
            <aside className={cn(
              "space-y-2",
              hasBothSides ? "order-2 lg:order-3" : "order-2"
            )}>
              {improveAnnotations.map(({ ann, globalIdx }, di) => (
                <ImproveCard key={globalIdx} ann={ann} globalIdx={globalIdx} displayIdx={di} />
              ))}
            </aside>
          ) : hasBothSides ? <div className="hidden lg:block" /> : null}
        </div>

        {/* Note footer */}
        {note ? (
          <div className="mt-3 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-[12px] leading-relaxed text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
            <span className="font-semibold text-slate-600 dark:text-slate-400">↳ Note</span>
            <p className="mt-1">{note}</p>
          </div>
        ) : null}

        {/* SVG connector lines — desktop only */}
        {paths.length > 0 ? (
          <svg
            className="pointer-events-none absolute inset-0 z-[1] hidden h-full min-h-full w-full overflow-visible lg:block"
            aria-hidden
          >
            {paths.map((p) => (
              <g key={p.key} className={cn(
                "animate-connector-in",
                p.kind === "credit"
                  ? "text-emerald-500 dark:text-emerald-400/80"
                  : "text-amber-500 dark:text-amber-400/70"
              )}>
                {/* Outer ring */}
                <circle
                  cx={p.ox}
                  cy={p.oy}
                  r={5}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeOpacity={0.55}
                />
                {/* Inner filled dot */}
                <circle
                  cx={p.ox}
                  cy={p.oy}
                  r={2.5}
                  fill="currentColor"
                  fillOpacity={0.7}
                />
                {/* Bezier line */}
                <path
                  d={p.d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeOpacity={0.45}
                  strokeDasharray="4 3"
                />
              </g>
            ))}
          </svg>
        ) : null}
      </div>
    );
  }

  // ── Legacy fallback: 2-column (answer + improve callouts) ────────────────
  return (
    <div
      ref={wrapRef}
      className={cn("relative", density === "compact" ? className : undefined)}
    >
      <div className="flex min-h-0 flex-col gap-5 lg:flex-row lg:gap-6">
        <div className="min-h-0 min-w-0 flex-1">
          {density === "paper" ? (
            <MarkedExamAnswerReadonly
              answerText={answerText}
              walkthroughBeat={walkthroughBeat}
              hideLegend={false}
            />
          ) : (
            <MarkedExamAnswerInline
              answerText={answerText}
              walkthroughBeat={walkthroughBeat}
              hideLegend={false}
            />
          )}
        </div>
        <div className="shrink-0 lg:w-[min(100%,300px)]">
          <ExamImproveCallouts beat={walkthroughBeat} fallbackFeedback={fallbackFeedback} />
        </div>
      </div>

      {paths.length > 0 ? (
        <svg
          className="pointer-events-none absolute inset-0 z-[1] hidden h-full min-h-full w-full overflow-visible lg:block"
          aria-hidden
        >
          {paths.map((p) => (
            <g key={p.key} className="animate-connector-in text-amber-500 dark:text-amber-400/70">
              <circle cx={p.ox} cy={p.oy} r={5} fill="none" stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.55} />
              <circle cx={p.ox} cy={p.oy} r={2.5} fill="currentColor" fillOpacity={0.7} />
              <path d={p.d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.45} strokeDasharray="4 3" />
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
