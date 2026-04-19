"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Layers } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { AnnotatedAnswerView } from "@/components/features/revision/annotated-answer-view";
import {
  formatMarkedPaperTimeRemaining,
  getMarkedPaper,
  isMarkedPaperTemporary,
  type StoredMarkedPaperV1,
} from "@/lib/marked-papers-storage";
import { cn } from "@/lib/utils";

export default function MarkedPaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [paper, setPaper] = useState<StoredMarkedPaperV1 | null | undefined>(undefined);

  useEffect(() => {
    setPaper(getMarkedPaper(id));
  }, [id]);

  useEffect(() => {
    if (!paper || !isMarkedPaperTemporary(paper)) return;
    const t = window.setInterval(() => {
      setPaper(getMarkedPaper(id));
    }, 30_000);
    return () => window.clearInterval(t);
  }, [paper, id]);

  if (paper === undefined) {
    return (
      <PageContainer size="lg" className="py-10">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PageContainer>
    );
  }

  if (!paper) {
    return (
      <PageContainer size="lg" className="py-10">
        <p className="text-sm text-muted-foreground">This saved paper was not found.</p>
        <button
          type="button"
          className="mt-4 inline-flex rounded-lg border border-border/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-card"
          onClick={() => router.push("/revision/marked-papers")}
        >
          Back to list
        </button>
      </PageContainer>
    );
  }

  const walk = paper.results.examinerWalkthrough ?? [];

  return (
    <PageContainer size="lg" className="py-8 sm:py-10">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/revision/marked-papers"
              className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Saved papers
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {paper.topicIcon ? `${paper.topicIcon} ` : ""}
              {paper.topicLabel}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(paper.savedAt).toLocaleString()} · {paper.results.scorePercent}% ·{" "}
              {paper.results.totalScore}/{paper.results.totalMaxScore} marks
            </p>
            {isMarkedPaperTemporary(paper) && typeof paper.expiresAtMs === "number" ? (
              <p
                className={cn(
                  "mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums",
                  "border-amber-400/50 bg-amber-50/90 text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-100",
                )}
              >
                Temporarily saved · {formatMarkedPaperTimeRemaining(paper.expiresAtMs)} left
              </p>
            ) : null}
          </div>
          <Link
            href={`/revision/marked-papers/${paper.id}/flashcards`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-soft"
          >
            <Layers size={15} />
            Study flashcards
          </Link>
        </div>

        <section className="space-y-6">
          {paper.results.reviews.map((r, idx) => (
            <article key={r.question.id} className="rounded-xl border border-border/70 bg-card/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-3">
                <h2 className="text-sm font-semibold text-foreground">Question {idx + 1}</h2>
                <p className="text-xs font-medium tabular-nums text-muted-foreground">
                  {r.score}/{r.maxScore} marks
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.question.prompt}</p>
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your answer</p>
                <AnnotatedAnswerView
                  answerText={r.answer}
                  walkthroughBeat={walk[idx] ?? null}
                  fallbackFeedback={r.evaluation.feedback}
                  density="compact"
                  className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </PageContainer>
  );
}
