"use client";

import type { ExtractedCommandWord } from "@/lib/command-words";

interface ExamPaperCommandWordProps {
  command: ExtractedCommandWord;
}

/**
 * Exam-style stem: bold opening word with richer hint on hover/focus (desktop) or a details block (touch).
 */
export function ExamPaperCommandWord({ command }: ExamPaperCommandWordProps) {
  const tooltipId = `exam-cmd-${command.id}`;

  return (
    <span className="inline">
      <span
        tabIndex={0}
        className="group/cmd relative inline cursor-help align-baseline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40 focus-visible:ring-offset-1"
        aria-describedby={tooltipId}
      >
        <strong className="font-semibold underline decoration-slate-500/45 decoration-dotted underline-offset-[3px]">
          {command.word}
        </strong>

        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[80] hidden w-[min(24rem,calc(100vw-2.5rem))] rounded-md border border-slate-800/20 bg-[#fffffe] p-3 text-left shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] group-hover/cmd:block group-focus-within/cmd:block max-sm:hidden"
        >
          <span className="mb-1.5 block font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            What examiners expect from “{command.word}”
          </span>
          <span className="block font-sans text-[12px] font-normal leading-snug text-slate-800">{command.examHint}</span>
          <span className="mt-2 block border-t border-slate-200/80 pt-2 font-sans text-[11px] italic text-slate-500">
            Short reminder: {command.guidance}
          </span>
        </span>
      </span>

      <details className="mt-2 border-t border-dotted border-slate-400/50 pt-2 sm:hidden">
        <summary className="cursor-pointer font-sans text-[11px] font-medium text-slate-700">
          What “{command.word}” means for markers
        </summary>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-slate-700">{command.examHint}</p>
        <p className="mt-1.5 font-sans text-[11px] italic text-slate-500">{command.guidance}</p>
      </details>
    </span>
  );
}
