"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ExtractedCommandWord } from "@/lib/command-words";

interface CommandWordChipProps {
  commandWord: ExtractedCommandWord;
  showGuidance?: boolean;
  className?: string;
}

function CommandWordChip({ commandWord, showGuidance = false, className }: CommandWordChipProps) {
  const [hovered, setHovered] = useState(false);
  const guidanceVisible = showGuidance || hovered;

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="inline-flex items-center rounded-lg border border-accent/25 bg-accent/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent"
      >
        {commandWord.word}
      </span>

      {guidanceVisible && (
        <span className="text-xs text-muted-foreground animate-in fade-in-0 duration-150">
          {commandWord.guidance}
        </span>
      )}
    </span>
  );
}

export { CommandWordChip };
export type { CommandWordChipProps };
