"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileStack, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/features/revision/revision-subnav";
import { deleteMarkedPaper, listMarkedPapers, type StoredMarkedPaperV1 } from "@/lib/marked-papers-storage";
import { cn } from "@/lib/utils";

const linkBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border/80 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-card hover:border-border-light";
const linkBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-soft";

export default function MarkedPapersListPage() {
  const [papers, setPapers] = useState<StoredMarkedPaperV1[]>([]);

  useEffect(() => {
    setPapers(listMarkedPapers());
  }, []);

  return (
    <PageContainer size="lg" className="py-8 sm:py-10">
      <div className="space-y-8">
        <RevisionSubnav />
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/revision/topics?mode=exam"
              className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Exam topics
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Saved marked papers</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Papers you saved after exam marking stay on this device. Open one to review answers or study flashcards built
              from feedback.
            </p>
          </div>
        </div>

        {papers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Finish an exam-questions session, then choose <strong>Save paper</strong> on the results screen.
          </p>
        ) : (
          <ul className="space-y-3">
            {papers.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileStack size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {p.topicIcon ? `${p.topicIcon} ` : ""}
                      {p.topicLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(p.savedAt).toLocaleString()} · {p.results.scorePercent}% · {p.results.reviews.length}{" "}
                      questions
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/revision/marked-papers/${p.id}`} className={linkBtn}>
                    Open
                  </Link>
                  <Link href={`/revision/marked-papers/${p.id}/flashcards`} className={linkBtnPrimary}>
                    Flashcards
                  </Link>
                  <button
                    type="button"
                    className={cn(linkBtn, "text-danger hover:bg-danger/10")}
                    onClick={() => {
                      deleteMarkedPaper(p.id);
                      setPapers(listMarkedPapers());
                    }}
                  >
                    <Trash2 size={14} />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
