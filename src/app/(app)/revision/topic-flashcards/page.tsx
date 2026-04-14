"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Layers } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { listTopicsWithFlashcardDecks } from "@/lib/marked-papers-storage";

export default function TopicFlashcardsHubPage() {
  const rows = useMemo(() => listTopicsWithFlashcardDecks(), []);

  return (
    <PageContainer size="md" className="py-8 sm:py-10">
      <div className="space-y-6">
        <Link
          href="/revision/topics?mode=exam"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Topics
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Topic flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Decks built from your saved marked papers, grouped by topic (this device).
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Save a marked exam paper to generate cards. Each topic you answered gets its own deck.
          </p>
        ) : (
          <ul className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card/60">
            {rows.map((r) => (
              <li key={r.topicId}>
                <Link
                  href={`/revision/topic-flashcards/${encodeURIComponent(r.topicId)}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:px-5"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                    <Layers size={16} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{r.label}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{r.count} cards</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
