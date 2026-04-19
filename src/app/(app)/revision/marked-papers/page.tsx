"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileStack, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/features/revision/revision-subnav";
import {
  deleteMarkedPaper,
  formatMarkedPaperTimeRemaining,
  isMarkedPaperTemporary,
  listMarkedPapers,
  type StoredMarkedPaperV1,
} from "@/lib/marked-papers-storage";
import { cn } from "@/lib/utils";

const linkBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border/80 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-card hover:border-border-light";
const linkBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-soft";

function PaperRow({
  p,
  onDeleted,
  showExpiry,
}: {
  p: StoredMarkedPaperV1;
  onDeleted: () => void;
  showExpiry: boolean;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!showExpiry || typeof p.expiresAtMs !== "number") return;
    const id = window.setInterval(() => setTick((x) => x + 1), 30_000);
    return () => window.clearInterval(id);
  }, [showExpiry, p.expiresAtMs]);

  const expiryLine = useMemo(() => {
    void tick;
    if (!showExpiry || typeof p.expiresAtMs !== "number" || p.expiresAtMs <= Date.now()) return null;
    return `${formatMarkedPaperTimeRemaining(p.expiresAtMs)} left · expires ${new Date(p.expiresAtMs).toLocaleString()}`;
  }, [showExpiry, p.expiresAtMs, tick]);

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        showExpiry
          ? "border-amber-400/35 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-500/8"
          : "border-border/70 bg-card/60",
      )}
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
            {new Date(p.savedAt).toLocaleString()} · {p.results.scorePercent}% · {p.results.reviews.length} questions
            {expiryLine ? (
              <>
                <br />
                <span className="tabular-nums text-amber-900/90 dark:text-amber-100/90">{expiryLine}</span>
              </>
            ) : null}
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
            onDeleted();
          }}
        >
          <Trash2 size={14} />
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </li>
  );
}

export default function MarkedPapersListPage() {
  const [papers, setPapers] = useState<StoredMarkedPaperV1[]>([]);

  const refresh = () => setPapers(listMarkedPapers());

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => refresh(), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { permanent, temporary } = useMemo(() => {
    const perm: StoredMarkedPaperV1[] = [];
    const temp: StoredMarkedPaperV1[] = [];
    for (const p of papers) {
      if (isMarkedPaperTemporary(p)) temp.push(p);
      else perm.push(p);
    }
    return { permanent: perm, temporary: temp };
  }, [papers]);

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
              New sessions are <strong className="text-foreground">auto-saved for 3 days</strong> on this device. Tap{" "}
              <strong className="text-foreground">Save permanently</strong> on the results screen to keep a paper, merge
              flashcards into topic decks, and move it here under <strong className="text-foreground">Saved</strong>. When
              the timer hits zero, temporary copies are removed automatically (no cloud backup yet).
            </p>
          </div>
        </div>

        {papers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Finish an exam marking session — your paper appears automatically for three days, or use{" "}
            <strong>Save permanently</strong> on the results screen to keep it.
          </p>
        ) : (
          <div className="space-y-10">
            {temporary.length > 0 ? (
              <section className="space-y-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Temporarily saved
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These drafts are purged on this device when the countdown ends unless you open the paper and save it
                    permanently from the results screen.
                  </p>
                </div>
                <ul className="space-y-3">
                  {temporary.map((p) => (
                    <PaperRow key={p.id} p={p} onDeleted={refresh} showExpiry />
                  ))}
                </ul>
              </section>
            ) : null}

            {permanent.length > 0 ? (
              <section className="space-y-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-accent">Saved permanently</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Kept until you delete them on this device.</p>
                </div>
                <ul className="space-y-3">
                  {permanent.map((p) => (
                    <PaperRow key={p.id} p={p} onDeleted={refresh} showExpiry={false} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
