"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkedPaperFlashcards } from "@/components/revision/marked-paper-flashcards";
import { buildFlashcardsFromMarkedPaper, getMarkedPaper, type StoredMarkedPaperV1 } from "@/lib/marked-papers-storage";

export default function MarkedPaperFlashcardsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [paper, setPaper] = useState<StoredMarkedPaperV1 | null | undefined>(undefined);

  useEffect(() => {
    setPaper(getMarkedPaper(id));
  }, [id]);

  const cards = useMemo(() => (paper ? buildFlashcardsFromMarkedPaper(paper) : []), [paper]);

  if (paper === undefined) {
    return (
      <PageContainer size="md" className="py-10">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PageContainer>
    );
  }

  if (!paper) {
    return (
      <PageContainer size="md" className="py-10">
        <p className="text-sm text-muted-foreground">Paper not found.</p>
        <Link href="/revision/marked-papers" className="mt-4 inline-block text-sm text-accent underline">
          Back to list
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="md" className="py-8 sm:py-10">
      <div className="space-y-6">
        <Link
          href={`/revision/marked-papers/${paper.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Marked paper
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Revision flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {paper.topicIcon ? `${paper.topicIcon} ` : ""}
            {paper.topicLabel} · built from this paper&apos;s feedback
          </p>
        </div>
        <MarkedPaperFlashcards cards={cards} title={paper.topicLabel} />
      </div>
    </PageContainer>
  );
}
