"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Flame,
  Layers3,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Card } from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import {
  getRevisitQueue,
  getWeakestTopics,
} from "@/lib/progress";

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

export default function HomePage() {
  const {
    activityHistory,
    diagnostic,
    isHydrating,
    onboarding,
    revisionProgress,
    user,
  } = useAppData();

  if (isHydrating && !user) {
    return (
      <PageContainer size="md">
        <div className="h-48" />
      </PageContainer>
    );
  }

  if (!user) return null;

  const hasDiagnostic = Boolean(diagnostic);
  const greeting = getLondonGreeting();
  const weakestTopics = getWeakestTopics(diagnostic, 1);
  const revisitQueue = getRevisitQueue(
    diagnostic,
    onboarding,
    revisionProgress,
    activityHistory,
    1
  );
  const nextQueueItem = revisitQueue[0] ?? null;

  const primaryHref = hasDiagnostic ? "/revision/weak-areas" : "/revision/diagnostic";
  const primaryLabel = hasDiagnostic ? "Continue weak-topic practice" : "Start diagnostic";
  const primaryDescription = hasDiagnostic && nextQueueItem
    ? `${nextQueueItem.topicLabel} is due next.`
    : hasDiagnostic && weakestTopics[0]
      ? `${weakestTopics[0].topic} still needs work.`
      : "Map your weak points so the site can guide you.";

  const quickLinks = [
    { href: "/revision/topics", label: "Topic practice", icon: Target },
    { href: "/revision/quick-quiz", label: "Quick quiz", icon: Zap },
    { href: "/revision/paper-1", label: "Paper 1", icon: ClipboardCheck },
    { href: "/revision/paper-2", label: "Paper 2", icon: Layers3 },
    ...(hasDiagnostic
      ? []
      : [{ href: "/revision/diagnostic", label: "Diagnostic", icon: BrainCircuit }]),
  ];

  return (
    <PageContainer size="md">
      <div className="space-y-8">
        <div className="perf-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={13} className="text-accent" />
            <span className="text-xs font-medium text-accent">3 day streak</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {greeting}, {user.nickname}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasDiagnostic
              ? "Pick a revision path and keep moving."
              : "Start with a diagnostic, then the site can guide the rest."}
          </p>
        </div>

        <div className="perf-fade-up" style={{ animationDelay: "60ms" }}>
          <Card hover className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/4 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-base">
                    {hasDiagnostic ? "Your next step" : "Start with a diagnostic"}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                    {hasDiagnostic ? "Revision path — step 2 of 6" : "Revision path — step 1 of 6"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {primaryDescription}
                  </p>
                </div>
              </div>
              <Link href={primaryHref} className="shrink-0">
                <Button size="sm" className="group">
                  {primaryLabel}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="perf-fade-up space-y-2" style={{ animationDelay: "120ms" }}>
          {quickLinks.map((link) => {
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
                <span className="flex-1 text-sm text-foreground">{link.label}</span>
                <ArrowRight size={13} className="text-muted-foreground transition-colors group-hover:text-accent" />
              </Link>
            );
          })}
          <Link
            href="/revision/progress"
            className="mt-2 inline-flex items-center gap-1 px-3 text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            View progress
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
