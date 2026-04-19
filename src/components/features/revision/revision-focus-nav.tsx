"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { revisionTopicsListHref } from "@/lib/revision-routes";
import { cn } from "@/lib/utils";

export type RevisionFocusMode = "simple" | "exam";

export function RevisionFocusNav({
  activeMode,
  fromHub = false,
}: {
  activeMode: RevisionFocusMode;
  /** Set when the user already chose a mode on /revision — avoids a second full-width mode switcher. */
  fromHub?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <Link
        href="/revision"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        {fromHub ? "Revision home" : "All routes"}
      </Link>

      {fromHub ? (
        <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 sm:max-w-xl sm:items-end sm:text-right">
          <p className="text-sm font-medium text-foreground">
            {activeMode === "simple"
              ? "Simple revision — pick your topics below"
              : "Exam questions — pick one topic below"}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {activeMode === "simple"
              ? "You already chose quick practice on the previous screen; this step is only about which units to open."
              : "You already chose timed exam-style practice; select a single topic to configure the session."}
          </p>
          <Link
            href={
              activeMode === "simple"
                ? revisionTopicsListHref({ exam: true, fromHub: true })
                : revisionTopicsListHref({ exam: false, fromHub: true })
            }
            className="text-sm font-medium text-accent transition-colors hover:text-accent/90"
          >
            {activeMode === "simple" ? "Switch to exam questions instead →" : "Switch to simple topic mix instead →"}
          </Link>
        </div>
      ) : (
        <div
          className="flex max-w-md flex-1 rounded-2xl border border-border/60 bg-muted/25 p-1 sm:justify-end"
          role="tablist"
          aria-label="Revision mode"
        >
          <Link
            href={revisionTopicsListHref({ exam: false })}
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
            href={revisionTopicsListHref({ exam: true })}
            role="tab"
            aria-selected={activeMode === "exam"}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all",
              activeMode === "exam"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Exam questions
          </Link>
        </div>
      )}
    </nav>
  );
}
