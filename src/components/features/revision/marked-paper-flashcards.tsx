"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Shuffle,
  Clock,
  List,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { MarkedPaperFlashcard } from "@/lib/marked-papers-storage";
import { getCardSchedule, setCardSchedule, getDeckSchedules } from "@/lib/flashcards/deck-schedule";
import { isDue, isMastered, nextSchedule, type RecallRating } from "@/lib/flashcards/spaced-recall";
import { cn } from "@/lib/utils";

function shuffleOrder(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function MarkedPaperFlashcards({
  cards,
  title,
  deckId,
}: {
  cards: MarkedPaperFlashcard[];
  title: string;
  deckId: string;
}) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState<"all" | "due">("all");
  const [listOpen, setListOpen] = useState(false);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const empty = cards.length === 0;

  useEffect(() => {
    setOrder(cards.map((_, i) => i));
    setPos(0);
    setFlipped(false);
  }, [cards]);

  const filteredOrder = useMemo(() => {
    if (filter === "all") return order;
    const dueOnly = order.filter((ci) => isDue(getCardSchedule(deckId, cards[ci]!.id)));
    return dueOnly.length ? dueOnly : order;
  }, [order, filter, deckId, cards]);

  const effectiveOrder = filteredOrder;
  const ci = effectiveOrder[pos] ?? 0;
  const card = cards[ci] ?? null;

  const stats = useMemo(() => {
    const sched = getDeckSchedules(deckId);
    let mastered = 0;
    let due = 0;
    for (const c of cards) {
      const s = sched[c.id];
      if (isMastered(s)) mastered += 1;
      if (isDue(s)) due += 1;
    }
    return { mastered, due, total: cards.length };
  }, [cards, deckId, scheduleVersion]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setFlipped(false);
      setPos((p) => Math.max(0, Math.min(effectiveOrder.length - 1, p + dir)));
    },
    [effectiveOrder.length]
  );

  const rate = useCallback(
    (rating: RecallRating) => {
      if (!card) return;
      const prev = getCardSchedule(deckId, card.id);
      setCardSchedule(deckId, card.id, nextSchedule(rating, prev));
      setScheduleVersion((v) => v + 1);
      setFlipped(false);
      setPos((p) => Math.min(p + 1, effectiveOrder.length - 1));
    },
    [card, deckId, effectiveOrder.length]
  );

  const onShuffle = () => {
    setOrder(shuffleOrder(cards.length));
    setPos(0);
    setFlipped(false);
  };

  useEffect(() => {
    if (empty) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "s" || e.key === "S") onShuffle();
      if (!flipped) return;
      if (e.key === "1") rate(0);
      if (e.key === "2") rate(1);
      if (e.key === "3") rate(2);
      if (e.key === "4") rate(3);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [empty, go, flipped, rate]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || !flipped) {
      touchStart.current = null;
      return;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) rate(0);
    else rate(2);
  }

  if (empty) {
    return (
      <p className="text-sm text-muted-foreground">
        No flashcards could be built from this paper (try a session with fuller feedback).
      </p>
    );
  }

  const frontLines = card!.front.split("\n");
  const head = frontLines[0] ?? "";
  const restFront = frontLines.slice(1).join("\n");

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Card {pos + 1} / {effectiveOrder.length} · {title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            Mastered {stats.mastered}/{stats.total}
          </span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
            Due ~{stats.due}
          </span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${stats.total ? (stats.mastered / stats.total) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={filter === "all" ? "primary" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => {
            setFilter("all");
            setPos(0);
          }}
        >
          <Layers className="size-4" />
          All
        </Button>
        <Button
          type="button"
          variant={filter === "due" ? "primary" : "outline"}
          size="sm"
          className="gap-1"
          onClick={() => {
            setFilter("due");
            setPos(0);
          }}
        >
          <Clock className="size-4" />
          Due
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onShuffle}>
          <Shuffle className="size-4" />
          Shuffle
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setListOpen((v) => !v)}>
          <List className="size-4" />
          List
        </Button>
      </div>

      {listOpen ? (
        <ul className="max-h-40 overflow-auto rounded-lg border border-border/60 bg-card/50 p-2 text-xs">
          {effectiveOrder.map((idx, i) => (
            <li key={cards[idx]!.id}>
              <button
                type="button"
                onClick={() => {
                  setPos(i);
                  setListOpen(false);
                }}
                className={cn(
                  "w-full rounded px-2 py-1 text-left hover:bg-muted",
                  i === pos && "bg-accent/15 font-medium"
                )}
              >
                {i + 1}. {cards[idx]!.front.replace(/\n/g, " ").slice(0, 72)}
                {cards[idx]!.front.length > 72 ? "…" : ""}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className={cn(
          "relative min-h-[220px] w-full rounded-2xl border border-border/80 bg-card p-6 text-left shadow-md transition-[transform,box-shadow] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent",
          flipped && "ring-2 ring-accent/30"
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{flipped ? "Back" : "Front"}</p>
        {!flipped ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-accent">{head}</p>
            {restFront ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{restFront}</p> : null}
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{card!.back}</p>
        )}
        <p className="mt-4 text-[10px] text-muted-foreground">
          Tap to flip · ← → · 1–4 rate when back shown · S shuffle · swipe ← again / → good
        </p>
      </div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => rate(0)}>
            Again <span className="ml-1 text-muted-foreground">1</span>
          </Button>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => rate(1)}>
            Hard <span className="ml-1 text-muted-foreground">2</span>
          </Button>
          <Button type="button" variant="primary" size="sm" className="text-xs" onClick={() => rate(2)}>
            Good <span className="ml-1 opacity-80">3</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => rate(3)}>
            Easy <span className="ml-1 text-muted-foreground">4</span>
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pos === 0} onClick={() => go(-1)} className="gap-1">
          <ChevronLeft size={16} />
          Prev
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setFlipped(false)}>
          <RotateCcw size={14} />
          Reset card
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pos >= effectiveOrder.length - 1}
          onClick={() => go(1)}
          className="gap-1"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
