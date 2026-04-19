"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  mergeHlQuotesIntoHighlightSpans,
  type AnswerHighlightSpans,
  type ExamAnnotation,
  type ExaminerWalkthroughBeat,
} from "@/lib/exam-conditions";

export type MarkedAnswerDensity = "paper" | "compact";

type HighlightRange = { start: number; end: number; kind: "credit" | "improve"; annIdx?: number };

function findAnnIdxForSegment(
  seg: HighlightRange,
  annotations: ExamAnnotation[] | undefined,
  text: string
): number | undefined {
  if (!annotations?.length) {
    return undefined;
  }
  for (let i = 0; i < annotations.length; i++) {
    const a = annotations[i]!;
    const wantKind = a.kind === "c" ? "credit" : "improve";
    if (wantKind !== seg.kind) {
      continue;
    }
    const q = a.quote.replace(/\s+/g, " ").trim();
    if (q.length < 4) {
      continue;
    }
    const at = text.indexOf(q);
    if (at === -1) {
      continue;
    }
    const aEnd = at + q.length;
    const overlap = Math.min(seg.end, aEnd) - Math.max(seg.start, at);
    const segLen = seg.end - seg.start;
    if (overlap >= Math.min(q.length, segLen) * 0.2) {
      return i;
    }
  }
  return undefined;
}

/** Merge same-kind ranges separated only by whitespace (or tiny punctuation gaps). */
function mergeAdjacentSameKind(text: string, ranges: HighlightRange[]): HighlightRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: HighlightRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (!last || last.kind !== r.kind) {
      out.push({ ...r });
      continue;
    }
    if (r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
      continue;
    }
    const gap = text.slice(last.end, r.start);
    const gapOnlyWs = gap.trim() === "";
    if (gapOnlyWs && gap.length <= 120) {
      last.end = r.end;
      continue;
    }
    if (gap.trim() === "" || gap.length <= 2) {
      last.end = r.end;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

/** Extend partial-word spans to full words so highlights don’t chop mid-token. */
function snapRangeToWordEdges(text: string, r: HighlightRange): HighlightRange {
  let s = Math.max(0, Math.min(r.start, text.length));
  let e = Math.max(s, Math.min(r.end, text.length));
  while (s > 0 && /\S/.test(text[s - 1]!)) {
    s--;
  }
  while (e < text.length && /\S/.test(text[e]!)) {
    e++;
  }
  return { start: s, end: e, kind: r.kind };
}

function clipImproveOutsideCredit(im: HighlightRange, credits: HighlightRange[]): HighlightRange[] {
  let parts: HighlightRange[] = [im];
  for (const cr of credits) {
    parts = parts.flatMap((p) => {
      if (p.end <= cr.start || p.start >= cr.end) {
        return [p];
      }
      const out: HighlightRange[] = [];
      if (p.start < cr.start) {
        out.push({ ...p, end: Math.min(p.end, cr.start) });
      }
      if (p.end > cr.end) {
        out.push({ ...p, start: Math.max(p.start, cr.end) });
      }
      return out.filter((x) => x.end > x.start);
    });
  }
  return parts;
}

/** Coalesce model spans so <mark> blocks align with whole words and aren’t fragmented. */
function normalizeHighlightRangesForDisplay(text: string, ranges: HighlightRange[]): HighlightRange[] {
  if (ranges.length === 0) {
    return [];
  }
  let m = mergeAdjacentSameKind(text, ranges);
  m = m.map((r) => snapRangeToWordEdges(text, r));
  m = mergeAdjacentSameKind(text, m);
  const credits = m.filter((r) => r.kind === "credit");
  const improves = m
    .filter((r) => r.kind === "improve")
    .flatMap((im) => clipImproveOutsideCredit(im, credits));
  return [...credits, ...improves].sort((a, b) => a.start - b.start || a.end - b.end);
}

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

/** Every non-overlapping occurrence of each phrase (longest phrases first). */
function collectAllHighlightRanges(
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
    let pos = 0;
    while (pos <= text.length) {
      const idx = lower.indexOf(pl, pos);
      if (idx === -1) {
        break;
      }
      const end = idx + p.length;
      const overlaps = forbid.some((b) => idx < b.end && end > b.start);
      if (!overlaps) {
        ranges.push({ start: idx, end, kind });
        forbid.push({ start: idx, end });
      }
      pos = idx + 1;
    }
  }

  return ranges;
}

function renderHighlightedAnswerNodes(
  text: string,
  beat?: ExaminerWalkthroughBeat | null,
  options?: { hideLegend?: boolean; density?: MarkedAnswerDensity },
): ReactNode {
  const density = options?.density ?? "compact";
  const bodyClass =
    density === "paper"
      ? "whitespace-pre-wrap text-[16px] leading-[1.875rem] text-slate-800 dark:text-slate-200 sm:text-[17px]"
      : "whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300";
  const trimmed = text.trim();
  if (!trimmed) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap italic text-slate-400 dark:text-slate-500",
          density === "paper"
            ? "text-[16px] leading-[1.875rem] sm:text-[17px]"
            : "text-[12.5px] leading-relaxed"
        )}
      >
        No answer submitted.
      </p>
    );
  }
  const hlResolved = beat
    ? mergeHlQuotesIntoHighlightSpans(trimmed, beat.hl, beat.hlQuotes, beat.annotations)
    : undefined;
  const spanRanges: HighlightRange[] =
    hlResolved && ((hlResolved.c?.length ?? 0) > 0 || (hlResolved.i?.length ?? 0) > 0)
      ? rangesFromHighlightSpans(trimmed, hlResolved)
      : [];

  const credit = beat?.credit ?? [];
  const improve = beat?.improve ?? [];
  const phraseCreditRects: Array<{ start: number; end: number }> = spanRanges.map((r) => ({
    start: r.start,
    end: r.end,
  }));
  const phraseCredit =
    credit.length > 0 ? collectAllHighlightRanges(trimmed, credit, "credit", phraseCreditRects) : [];
  const phraseImproveBlocked: Array<{ start: number; end: number }> = [
    ...spanRanges.map((r) => ({ start: r.start, end: r.end })),
    ...phraseCredit.map((r) => ({ start: r.start, end: r.end })),
  ];
  const phraseImprove =
    improve.length > 0 ? collectAllHighlightRanges(trimmed, improve, "improve", phraseImproveBlocked) : [];

  const combined =
    spanRanges.length > 0 || phraseCredit.length > 0 || phraseImprove.length > 0
      ? normalizeHighlightRangesForDisplay(trimmed, [...spanRanges, ...phraseCredit, ...phraseImprove])
      : [];

  if (combined.length > 0) {
    const all = combined.map((seg) => ({
      ...seg,
      annIdx: findAnnIdxForSegment(seg, beat?.annotations, trimmed),
    }));
    const parts: ReactNode[] = [];
    let cursor = 0;
    all.forEach((seg, ix) => {
      if (seg.start > cursor) {
        parts.push(<span key={`t-${ix}-${cursor}`}>{trimmed.slice(cursor, seg.start)}</span>);
      }
      const slice = trimmed.slice(seg.start, seg.end);
      const annIdxStr = seg.annIdx !== undefined ? String(seg.annIdx) : undefined;
      parts.push(
        <mark
          key={`h-${ix}-${seg.start}-${seg.kind}`}
          data-ann-idx={annIdxStr}
          data-ann-kind={seg.kind}
          aria-describedby={annIdxStr !== undefined ? `annotation-card-${annIdxStr}` : undefined}
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
        <p className={bodyClass}>
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
            <span className="ml-1.5">— AI-marked spans and matched credit phrases.</span>
          </p>
        ) : null}
      </>
    );
  }

  if (credit.length === 0 && improve.length === 0) {
    return <p className={bodyClass}>{trimmed}</p>;
  }

  const creditRanges = collectAllHighlightRanges(trimmed, credit, "credit", []);
  const improveRanges = collectAllHighlightRanges(trimmed, improve, "improve", creditRanges);
  const all = normalizeHighlightRangesForDisplay(
    trimmed,
    [...creditRanges, ...improveRanges].sort((a, b) => a.start - b.start || a.end - b.end)
  );
  if (all.length === 0) {
    return <p className={bodyClass}>{trimmed}</p>;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  all.forEach((seg, ix) => {
    if (seg.start > cursor) {
      parts.push(<span key={`t-${ix}-${cursor}`}>{trimmed.slice(cursor, seg.start)}</span>);
    }
    const slice = trimmed.slice(seg.start, seg.end);
    const annIdx = findAnnIdxForSegment(seg, beat?.annotations, trimmed);
    const annIdxStr = annIdx !== undefined ? String(annIdx) : undefined;
    parts.push(
      <mark
        key={`h-${ix}-${seg.start}-${seg.kind}`}
        data-ann-idx={annIdxStr}
        data-ann-kind={seg.kind}
        aria-describedby={annIdxStr !== undefined ? `annotation-card-${annIdxStr}` : undefined}
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
      <p className={bodyClass}>
        {parts}
      </p>
      {legacyShowLegend ? (
        <p className="mt-2 text-[9px] leading-snug text-slate-500 dark:text-slate-400">
          <span className="mr-2 inline-block rounded-sm bg-emerald-200/90 px-1 py-px text-emerald-950 dark:bg-emerald-500/40 dark:text-emerald-50">
            Credit
          </span>
          <span className="inline-block rounded-sm bg-amber-200/90 px-1 py-px text-amber-950 dark:bg-amber-500/40 dark:text-amber-50">
            Improve
          </span>
          <span className="ml-1.5">— phrase match from marking data.</span>
        </p>
      ) : null}
    </>
  );
}

/** Read-only answer with the same highlight rules as the results review card. */
export function MarkedExamAnswerReadonly({
  answerText,
  walkthroughBeat,
  hideLegend,
}: {
  answerText: string;
  walkthroughBeat?: ExaminerWalkthroughBeat | null;
  hideLegend?: boolean;
}) {
  return (
    <div
      className="exam-paper-textarea exam-paper-textarea--immersive min-h-[48vh] w-full flex-1 cursor-default select-text rounded-md border border-border/80 bg-muted/10 px-3 py-2 sm:min-h-[52vh] sm:px-4"
      aria-readonly="true"
    >
      {renderHighlightedAnswerNodes(answerText, walkthroughBeat ?? null, { hideLegend, density: "paper" })}
    </div>
  );
}

/** Inline block for review cards (matches previous typography). */
export function MarkedExamAnswerInline({
  answerText,
  walkthroughBeat,
  hideLegend,
  className,
}: {
  answerText: string;
  walkthroughBeat?: ExaminerWalkthroughBeat | null;
  hideLegend?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {renderHighlightedAnswerNodes(answerText, walkthroughBeat ?? null, { hideLegend, density: "compact" })}
    </div>
  );
}
