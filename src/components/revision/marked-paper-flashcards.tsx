"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import type { MarkedPaperFlashcard } from "@/lib/marked-papers-storage";
import { cn } from "@/lib/utils";

export function MarkedPaperFlashcards({ cards, title }: { cards: MarkedPaperFlashcard[]; title: string }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i] ?? null;

  const go = useCallback(
    (dir: -1 | 1) => {
      setFlipped(false);
      setI((x) => Math.max(0, Math.min(cards.length - 1, x + dir)));
    },
    [cards.length]
  );

  const empty = cards.length === 0;

  useEffect(() => {
    if (empty) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [empty, go]);

  if (empty) {
    return (
      <p className="text-sm text-muted-foreground">
        No flashcards could be built from this paper (try a session with fuller feedback).
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <p className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Card {i + 1} / {cards.length} · {title}
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "relative min-h-[200px] w-full rounded-2xl border border-border/80 bg-card p-6 text-left shadow-md transition-[transform,box-shadow] duration-300 hover:shadow-lg",
          flipped && "ring-2 ring-accent/30"
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{flipped ? "Back" : "Front"}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{flipped ? card!.back : card!.front}</p>
        <p className="mt-4 text-[10px] text-muted-foreground">Tap or press Space to flip · ← → to move</p>
      </button>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" disabled={i === 0} onClick={() => go(-1)} className="gap-1">
          <ChevronLeft size={16} />
          Prev
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setFlipped(false)}>
          <RotateCcw size={14} />
          Reset card
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={i >= cards.length - 1} onClick={() => go(1)} className="gap-1">
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
