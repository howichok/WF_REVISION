"use client";

import Link from "next/link";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LearningRailItem, LearningRailSummary } from "./types";

interface LearningRailProps {
  backHref?: string;
  railTitle: string;
  railSubtitle?: string;
  railIcon?: ReactNode;
  railItems: LearningRailItem[];
  railSummary?: LearningRailSummary[];
}

const summaryToneClasses: Record<NonNullable<LearningRailSummary["tone"]>, string> = {
  default: "border-border bg-card/55 text-muted",
  accent: "border-accent/20 bg-accent/10 text-accent",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
};

function RailItemInner({ item }: { item: LearningRailItem }) {
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

  return (
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
}

export function LearningRail({
  backHref,
  railTitle,
  railSubtitle,
  railIcon,
  railItems,
  railSummary,
}: LearningRailProps) {
  return (
    <aside className="al-rail hidden lg:flex" aria-label={`${railTitle} progression`}>
      <div className="al-rail-header">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={13} />
            Back
          </Link>
        ) : null}

        <div className="flex items-start gap-3">
          {railIcon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-foreground">
              {railIcon}
            </span>
          ) : null}

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{railTitle}</p>
            {railSubtitle ? <p className="text-sm leading-6 text-muted">{railSubtitle}</p> : null}
          </div>
        </div>
      </div>

      <div className="al-rail-list">
        {railItems.map((item) =>
          item.href ? (
            <Link key={item.id} href={item.href} className="block focus-ring rounded-2xl">
              <RailItemInner item={item} />
            </Link>
          ) : (
            <RailItemInner key={item.id} item={item} />
          )
        )}
      </div>

      {railSummary?.length ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {railSummary.map((summary) => (
            <div
              key={`${summary.label}-${summary.value}`}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-medium",
                summaryToneClasses[summary.tone ?? "default"]
              )}
            >
              <span className="text-muted">{summary.label}</span>{" "}
              <span className="text-foreground">{summary.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

export type { LearningRailProps };
