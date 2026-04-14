"use client";

import type { ExaminerWalkthroughBeat } from "@/lib/exam-conditions";

/** Margin-style “arrow” notes for improve phrases + examiner note. */
export function ExamImproveCallouts({
  beat,
  fallbackFeedback,
}: {
  beat?: ExaminerWalkthroughBeat | null;
  fallbackFeedback?: string;
}) {
  const improve = beat?.improve?.filter((s) => s.trim().length > 0) ?? [];
  const lead = beat?.line?.trim();
  const note = beat?.note?.trim();
  const fallback = fallbackFeedback?.trim();

  if (improve.length === 0 && !note && !lead && !fallback) {
    return null;
  }

  return (
    <aside className="space-y-3 lg:pl-2" aria-label="Examiner comments">
      {lead ? (
        <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-[12px] leading-snug text-slate-700 shadow-sm dark:border-slate-600/80 dark:bg-slate-900/60 dark:text-slate-200">
          <span className="font-semibold text-amber-700 dark:text-amber-400">↳ </span>
          {lead}
        </div>
      ) : null}
      {improve.map((phrase, i) => (
        <div
          key={`imp-${i}-${phrase.slice(0, 24)}`}
          className="relative rounded-lg border-l-[3px] border-l-amber-500 bg-amber-50/60 pl-3 pr-2 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm dark:border-l-amber-400 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <span className="absolute -left-1 top-2 block h-0 w-0 border-y-4 border-y-transparent border-r-4 border-r-amber-500 dark:border-r-amber-400" aria-hidden />
          <p className="font-bold uppercase tracking-wide text-[9px] text-amber-800 dark:text-amber-300">
            Point {i + 1}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-snug">“{phrase}”</p>
          <p className="mt-0.5 text-[10px] text-amber-900/80 dark:text-amber-200/90">Worth tightening or expanding for full marks.</p>
        </div>
      ))}
      {note ? (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-[12px] leading-relaxed text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
          <span className="font-semibold text-slate-600 dark:text-slate-400">↳ Note</span>
          <p className="mt-1">{note}</p>
        </div>
      ) : null}
      {!note && improve.length === 0 && fallback ? (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] leading-relaxed text-foreground">
          <span className="font-semibold">↳ Feedback</span>
          <p className="mt-1">{fallback}</p>
        </div>
      ) : null}
    </aside>
  );
}
