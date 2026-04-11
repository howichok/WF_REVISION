"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, Sparkles, Target } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Card } from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import { revisionTopicsListHref } from "@/lib/revision-routes";
import {
  EXAM_MILESTONES,
  PAPER_LABELS,
  daysUntilMilestone,
  examMilestoneKindLabel,
  resolveMilestoneDate,
  type ExamMilestone,
} from "@/lib/exam-plan";

function getLondonGreeting(): string {
  const now = new Date();
  const londonHour = parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );
  return londonHour < 12 ? "Morning" : londonHour < 18 ? "Afternoon" : "Evening";
}

function formatMilestoneDate(m: ExamMilestone, now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(resolveMilestoneDate(m, now));
}

function countdownPhrase(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default function HomePage() {
  const { isHydrating, user } = useAppData();

  if (isHydrating && !user) {
    return (
      <PageContainer size="md">
        <div className="h-48" />
      </PageContainer>
    );
  }

  if (!user) return null;

  const greeting = getLondonGreeting();
  const now = new Date();
  const milestonesSorted = [...EXAM_MILESTONES].sort(
    (a, b) => resolveMilestoneDate(a, now).getTime() - resolveMilestoneDate(b, now).getTime(),
  );

  const shortcuts = [
    {
      href: revisionTopicsListHref({ exam: false }),
      label: "Simple revision",
      hint: "Topics, recall, quick Q/A",
      icon: Sparkles,
    },
    {
      href: revisionTopicsListHref({ exam: true }),
      label: "Exam questions",
      hint: "Timed paper-style session",
      icon: Target,
    },
  ];

  return (
    <PageContainer size="md">
      <div className="space-y-8">
        <div className="perf-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="mb-2 flex items-center gap-2">
            <Flame size={13} className="text-accent" />
            <span className="text-xs font-medium text-accent">3 day streak</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {greeting}, {user.nickname}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Same flow every time: pick a mode, pick topics, repeat.
          </p>
        </div>

        <div className="perf-fade-up" style={{ animationDelay: "60ms" }}>
          <Card hover className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/4 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <Sparkles size={20} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">Repeat revision</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Simple revision or exam questions — then your topics.
                  </p>
                </div>
              </div>
              <Link href="/revision" className="shrink-0">
                <Button size="sm" className="group">
                  Go
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="perf-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Exam plan
              </p>
            </div>
            <Link
              href="/planner"
              className="text-[11px] font-medium text-accent hover:text-accent/90"
            >
              Open planner
            </Link>
          </div>
          <Card className="overflow-hidden border-border/80 p-0">
            <div className="divide-y divide-border/50 px-3 py-2 sm:px-4">
              {milestonesSorted.map((m, index) => {
                const days = daysUntilMilestone(m, now);
                const isNext = index === 0;
                const isLast = index === milestonesSorted.length - 1;
                return (
                  <div
                    key={`${m.paper}-${m.shortTitle}-${m.month}-${m.day}`}
                    className="group flex gap-3 py-3 first:pt-2.5 last:pb-2.5"
                  >
                    <div className="flex w-4 shrink-0 flex-col items-center pt-1.5" aria-hidden>
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 border-card shadow-sm transition-colors ${
                          isNext
                            ? "bg-accent ring-2 ring-accent/30"
                            : "bg-border group-hover:bg-accent/55"
                        }`}
                      />
                      {!isLast ? (
                        <span className="mt-1 w-px flex-1 min-h-[1.75rem] bg-border/70 group-hover:bg-border" />
                      ) : null}
                    </div>
                    <Link
                      href={m.href}
                      className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg py-0.5 pr-1 transition-colors hover:bg-card-hover/35 sm:flex-row sm:items-center sm:gap-4 sm:pr-2"
                    >
                      <div className="shrink-0 sm:w-[7.75rem]">
                        <p className="text-xs font-medium tabular-nums text-muted-foreground">
                          {formatMilestoneDate(m, now)}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
                            days === 0
                              ? "text-warning"
                              : isNext
                                ? "text-accent"
                                : "text-muted-foreground"
                          }`}
                        >
                          {countdownPhrase(days)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{m.title}</span>
                          <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                            {PAPER_LABELS[m.paper]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{examMilestoneKindLabel(m)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.focusLabel}</p>
                      </div>
                      <ArrowRight
                        size={14}
                        className="hidden shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent sm:block"
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="perf-fade-up space-y-2" style={{ animationDelay: "140ms" }}>
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Jump in
          </p>
          {shortcuts.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-card/60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/8">
                  <Icon size={14} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground">{link.label}</span>
                  <span className="block text-xs text-muted-foreground">{link.hint}</span>
                </div>
                <ArrowRight
                  size={13}
                  className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
