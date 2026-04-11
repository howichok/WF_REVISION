"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExamPaperCommandWord } from "@/components/revision/exam-paper-command-word";
import { CommandWordChip } from "@/components/ui/command-word-chip";
import { collectStemCommandWordSpans } from "@/lib/command-words";
import type { ExtractedCommandWord } from "@/lib/command-words";

interface TaskPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** When "hint", subtitle is visually quieter (e.g. quick micro-copy under a stem). */
  subtitleTone?: "default" | "hint";
  commandWord?: ExtractedCommandWord | null;
  /** "exam-inline" matches exam questions: dotted word + hover/focus tooltip, no chip row. */
  commandWordStyle?: "chip" | "exam-inline";
}

function highlightCommandWord(text: string, word: string): ReactNode {
  const lowerText = text.toLowerCase();
  const lowerWord = word.toLowerCase();
  const index = lowerText.indexOf(lowerWord);

  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + word.length);
  const after = text.slice(index + word.length);

  return (
    <>
      {before}
      <span className="font-medium text-foreground underline decoration-muted-foreground/55 decoration-dotted underline-offset-[3px]">
        {match}
      </span>
      {after}
    </>
  );
}

/** When the stem uses `\n\n`, show the first block as a muted lead-in above the main prompt. */
function splitTitleLeadBody(raw: string): { lead: string | null; body: string } {
  const trimmed = raw.trim();
  const parts = trimmed.split(/\n\n+/);
  if (parts.length >= 2) {
    const lead = parts[0].trim();
    const body = parts.slice(1).join("\n\n").trim();
    if (lead && body) {
      return { lead, body };
    }
  }
  return { lead: null, body: trimmed };
}

function renderStemWithExamCommandSpans(text: string, primary: ExtractedCommandWord | null): ReactNode {
  const spans = collectStemCommandWordSpans(text, primary);
  if (spans.length === 0) {
    return text;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) {
      nodes.push(text.slice(cursor, span.start));
    }
    const slice = text.slice(span.start, span.end);
    nodes.push(
      <ExamPaperCommandWord
        key={`cw-${span.start}-${span.end}-${span.command.id}`}
        command={span.command}
        stemDisplayText={slice}
        embeddedInHeading
      />,
    );
    cursor = span.end;
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return <>{nodes}</>;
}

export function TaskPanel({
  className,
  title,
  subtitle,
  subtitleTone = "default",
  commandWord,
  commandWordStyle = "chip",
  children,
  ...props
}: TaskPanelProps) {
  const reduceMotion = useReducedMotion();

  /** Same family as the rest of the app; exam-style sizing + line length only */
  const examPaperTitleClasses =
    "max-w-[60ch] text-pretty text-[1.35rem] font-normal leading-[1.5] text-foreground sm:text-[1.6rem] sm:leading-[1.5] lg:text-[1.75rem] lg:leading-[1.5]";

  const examPaperStemLeadClasses =
    "max-w-[60ch] text-pretty text-[13px] font-normal leading-relaxed text-muted-foreground sm:text-[14px]";

  const stringTitleSplit =
    typeof title === "string" ? splitTitleLeadBody(title) : { lead: null as string | null, body: "" };
  const isStemFocusLayout = Boolean(stringTitleSplit.lead);

  function renderStringTitleBlock(raw: string): ReactNode {
    const { lead, body } = splitTitleLeadBody(raw);
    const target = lead ? body : raw;

    const emphasized =
      commandWordStyle === "exam-inline"
        ? renderStemWithExamCommandSpans(target, commandWord ?? null)
        : commandWord && commandWordStyle === "chip"
          ? highlightCommandWord(target, commandWord.word)
          : target;

    const titleEase = [0.22, 1, 0.36, 1] as const;

    if (!lead) {
      return (
        <motion.h2
          className={examPaperTitleClasses}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : { delay: 0.06, duration: 0.3, ease: titleEase }
          }
        >
          {typeof emphasized === "string" ? (
            <span className="whitespace-pre-line">{emphasized}</span>
          ) : (
            emphasized
          )}
        </motion.h2>
      );
    }

    /* Same exam stem scale for both blocks; hierarchy = muted vs full ink only */
    const focusClasses = examPaperTitleClasses;

    return (
      <div className="space-y-2">
        <motion.p
          className={examPaperStemLeadClasses}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : { delay: 0.04, duration: 0.28, ease: titleEase }
          }
        >
          {lead}
        </motion.p>
        <motion.h2
          className={focusClasses}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : { delay: 0.1, duration: 0.3, ease: titleEase }
          }
        >
          {typeof emphasized === "string" ? (
            <span className="whitespace-pre-line">{emphasized}</span>
          ) : (
            emphasized
          )}
        </motion.h2>
      </div>
    );
  }

  return (
    <section
      className={cn("al-task-panel", isStemFocusLayout && "al-task-panel--split-stem", className)}
      {...props}
    >
      <motion.div
        className="contents"
        initial={
          isStemFocusLayout
            ? { opacity: 0 }
            : reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 10 }
        }
        animate={{ opacity: 1, y: 0 }}
        transition={
          isStemFocusLayout
            ? { duration: reduceMotion ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }
            : reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 320, damping: 28 }
        }
      >
        {commandWord && commandWordStyle === "chip" ? (
          <CommandWordChip commandWord={commandWord} />
        ) : null}

        {title || subtitle ? (
          <header className="space-y-2">
            {title ? (
              typeof title === "string" ? (
                renderStringTitleBlock(title)
              ) : (
                <h2 className={examPaperTitleClasses}>{title}</h2>
              )
            ) : null}
            {subtitle ? (
              <p
                className={
                  subtitleTone === "hint"
                    ? "max-w-3xl text-[11px] leading-5 text-muted-foreground/55 sm:text-xs sm:leading-5 sm:text-muted-foreground/60"
                    : "max-w-3xl text-sm leading-7 text-muted sm:text-base"
                }
              >
                {subtitle}
              </p>
            ) : null}
          </header>
        ) : null}

        {children}
      </motion.div>
    </section>
  );
}

export type { TaskPanelProps };
