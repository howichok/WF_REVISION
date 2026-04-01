"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CommandWordChip } from "@/components/ui/command-word-chip";
import type { ExtractedCommandWord } from "@/lib/command-words";

interface TaskPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  commandWord?: ExtractedCommandWord | null;
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
      <span className="font-bold text-accent">{match}</span>
      {after}
    </>
  );
}

export function TaskPanel({
  className,
  title,
  subtitle,
  commandWord,
  children,
  ...props
}: TaskPanelProps) {
  const renderedTitle =
    commandWord && typeof title === "string"
      ? highlightCommandWord(title, commandWord.word)
      : title;

  return (
    <section className={cn("al-task-panel", className)} {...props}>
      {commandWord ? (
        <CommandWordChip commandWord={commandWord} />
      ) : null}

      {renderedTitle || subtitle ? (
        <header className="space-y-2">
          {renderedTitle ? <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{renderedTitle}</h2> : null}
          {subtitle ? <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">{subtitle}</p> : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}

export type { TaskPanelProps };
