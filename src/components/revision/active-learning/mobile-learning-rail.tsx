"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Lock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LearningRailItem, LearningRailSummary } from "./types";

interface MobileLearningRailProps {
  backHref?: string;
  railTitle: string;
  railSubtitle?: string;
  railIcon?: ReactNode;
  railItems: LearningRailItem[];
  railSummary?: LearningRailSummary[];
  mobileSummaryLabel?: string;
}

function formatProgress(items: LearningRailItem[]) {
  const unlocked = items.filter((item) => item.state !== "locked");
  if (unlocked.length === 0) {
    return "Locked";
  }

  const currentIndex = unlocked.findIndex((item) => item.state === "current");
  const completed = unlocked.filter((item) => item.state === "completed").length;

  if (currentIndex >= 0) {
    return `${currentIndex + 1} / ${unlocked.length}`;
  }

  return `${completed} / ${unlocked.length}`;
}

function MobileRailItem({ item, onNavigate }: { item: LearningRailItem; onNavigate: () => void }) {
  const stateClasses = {
    completed: "al-rail-item al-rail-item-complete",
    current: "al-rail-item al-rail-item-current",
    upcoming: "al-rail-item al-rail-item-upcoming",
    locked: "al-rail-item al-rail-item-locked",
  }[item.state];

  const indicator = {
    completed: <Check size={12} className="text-success" />,
    current: <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(139,92,246,0.55)]" />,
    upcoming: <span className="h-2.5 w-2.5 rounded-full border border-border-light bg-transparent" />,
    locked: <Lock size={11} className="text-muted-foreground" />,
  }[item.state];

  const content = (
    <div className={stateClasses}>
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          item.state === "completed"
            ? "border-success/30 bg-success/10"
            : item.state === "current"
              ? "border-accent/30 bg-accent/12"
              : item.state === "locked"
                ? "border-border/70 bg-card/60"
                : "border-border-light bg-card/40"
        )}
      >
        {indicator}
      </span>

      <div className="min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
          {item.meta ? <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted">{item.meta}</span> : null}
        </div>
        {item.description ? <p className="text-xs leading-5 text-muted">{item.description}</p> : null}
      </div>
    </div>
  );

  if (!item.href) {
    return content;
  }

  return (
    <Link href={item.href} className="block focus-ring rounded-2xl" onClick={onNavigate}>
      {content}
    </Link>
  );
}

export function MobileLearningRail({
  backHref,
  railTitle,
  railSubtitle,
  railIcon,
  railItems,
  railSummary,
  mobileSummaryLabel,
}: MobileLearningRailProps) {
  const [isOpen, setIsOpen] = useState(false);

  const progressLabel = useMemo(() => formatProgress(railItems), [railItems]);

  return (
    <>
      <button type="button" className="al-mobile-strip lg:hidden" onClick={() => setIsOpen(true)}>
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-foreground">
            {railIcon ?? <PanelLeftOpen size={18} />}
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-xs font-medium uppercase tracking-[0.18em] text-muted">
              {mobileSummaryLabel ?? railTitle}
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">{progressLabel}</span>
          </span>
        </span>

        <span className="inline-flex items-center gap-2 text-sm text-muted">
          Steps
          <ChevronRight size={16} />
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close progression drawer"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative h-full max-w-[22rem] border-r border-white/8 bg-[linear-gradient(180deg,rgba(14,14,18,0.98),rgba(8,8,10,1))] px-4 py-5 shadow-[24px_0_60px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-start justify-between gap-3 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{railTitle}</p>
                {railSubtitle ? <p className="text-sm leading-6 text-muted">{railSubtitle}</p> : null}
              </div>

              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <PanelLeftClose size={15} />
                Close
              </Button>
            </div>

            {backHref ? (
              <Link
                href={backHref}
                className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <ArrowLeft size={13} />
                Back
              </Link>
            ) : null}

            <div className="space-y-3 overflow-y-auto pb-4">
              {railItems.map((item) => (
                <MobileRailItem key={item.id} item={item} onNavigate={() => setIsOpen(false)} />
              ))}
            </div>

            {railSummary?.length ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
                {railSummary.map((summary) => (
                  <div
                    key={`${summary.label}-${summary.value}`}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs font-medium",
                      summary.tone === "accent"
                        ? "border-accent/20 bg-accent/10 text-accent"
                        : summary.tone === "success"
                          ? "border-success/25 bg-success/10 text-success"
                          : summary.tone === "warning"
                            ? "border-warning/25 bg-warning/10 text-warning"
                            : summary.tone === "danger"
                              ? "border-danger/25 bg-danger/10 text-danger"
                              : "border-border bg-card/55 text-muted"
                    )}
                  >
                    <span className="text-muted">{summary.label}</span>{" "}
                    <span className="text-foreground">{summary.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export type { MobileLearningRailProps };
