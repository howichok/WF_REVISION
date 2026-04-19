"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkedPaperFlashcards } from "@/components/features/revision/marked-paper-flashcards";
import { getTopicFlashcardDeck } from "@/lib/marked-papers-storage";
import { getTopicById } from "@/lib/types";

export default function TopicFlashcardsStudyPage() {
  const params = useParams();
  const raw = typeof params.topicId === "string" ? params.topicId : "";
  const topicId = decodeURIComponent(raw);

  const cards = useMemo(() => {
    if (!topicId) return [];
    return getTopicFlashcardDeck(topicId);
  }, [topicId]);

  const label = useMemo(() => getTopicById(topicId)?.label ?? topicId, [topicId]);

  if (!topicId) {
    return (
      <PageContainer size="md" className="py-10">
        <p className="text-sm text-muted-foreground">Invalid topic.</p>
        <Link href="/revision/topic-flashcards" className="mt-4 inline-block text-sm text-accent underline">
          Back to topic decks
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md" className="py-8 sm:py-10">
      <div className="space-y-6">
        <Link
          href="/revision/topic-flashcards"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          All topic decks
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">From your saved papers · {cards.length} cards</p>
        </div>
        <MarkedPaperFlashcards cards={cards} title={label} deckId={`topic-${topicId}`} />
      </div>
    </PageContainer>
  );
}
