"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type RevisionFocusMode = "simple" | "exam";

export function RevisionFocusNav({ activeMode }: { activeMode: RevisionFocusMode }) {
  return (
    <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <Link
        href="/revision"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        All routes
      </Link>

      <div
        className="flex max-w-md flex-1 rounded-2xl border border-border/60 bg-muted/25 p-1 sm:justify-end"
        role="tablist"
        aria-label="Revision mode"
      >
        <Link
          href="/revision/topics?mode=simple"
          role="tab"
          aria-selected={activeMode === "simple"}
          className={cn(
            "flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all",
            activeMode === "simple"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Simple revision
        </Link>
        <Link
          href="/revision/topics?mode=exam-conditions"
          role="tab"
          aria-selected={activeMode === "exam"}
          className={cn(
            "flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all",
            activeMode === "exam"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Exam conditions
        </Link>
      </div>
    </nav>
  );
}
