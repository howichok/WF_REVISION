"use client";

import type { ExtractedCommandWord } from "@/lib/command-words";

interface ExamPaperCommandWordProps {
  command: ExtractedCommandWord;
  /** Substring from the live prompt (keeps casing as shown to the student). */
  stemDisplayText?: string;
  /**
   * When true, omit the mobile `<details>` block (invalid inside headings) and
   * show the tooltip on hover/focus at all breakpoints.
   */
  embeddedInHeading?: boolean;
}

/**
 * Exam-style stem: bold opening word with richer hint on hover/focus (desktop) or a details block (touch).
 */
export function ExamPaperCommandWord({
  command,
  stemDisplayText,
  embeddedInHeading = false,
}: ExamPaperCommandWordProps) {
  const tooltipId = `exam-cmd-${command.id}`;
  const displayWord = stemDisplayText ?? command.word;
  const tooltipClass = embeddedInHeading
    ? "pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[80] hidden w-[min(24rem,calc(100vw-2.5rem))] rounded-md border border-border bg-card p-3 text-left shadow-[0_12px_40px_-12px_rgba(17,24,39,0.18)] group-hover/cmd:block group-focus-within/cmd:block"
    : "pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[80] hidden w-[min(24rem,calc(100vw-2.5rem))] rounded-md border border-border bg-card p-3 text-left shadow-[0_12px_40px_-12px_rgba(17,24,39,0.18)] group-hover/cmd:block group-focus-within/cmd:block max-sm:hidden";

  return (
    <span className="inline">
      <span
        tabIndex={0}
        className="group/cmd relative inline cursor-help align-baseline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1"
        aria-describedby={tooltipId}
      >
        <strong className="font-semibold underline decoration-muted-foreground/60 decoration-dotted underline-offset-[3px]">
          {displayWord}
        </strong>

        <span id={tooltipId} role="tooltip" className={tooltipClass}>
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            What examiners expect from “{command.word}”
          </span>
          <span className="block text-[12px] font-normal leading-snug text-foreground">{command.examHint}</span>
          <span className="mt-2 block border-t border-border pt-2 text-[11px] italic text-muted-foreground">
            Short reminder: {command.guidance}
          </span>
        </span>
      </span>

      {embeddedInHeading ? null : (
        <details className="mt-2 border-t border-dotted border-border pt-2 sm:hidden">
          <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
            What “{command.word}” means for markers
          </summary>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground">{command.examHint}</p>
          <p className="mt-1.5 text-[11px] italic text-muted-foreground">{command.guidance}</p>
        </details>
      )}
    </span>
  );
}
