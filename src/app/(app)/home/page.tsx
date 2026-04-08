"use client";

import Link from "next/link";
import { ArrowRight, Flame, Sparkles, Target } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Card } from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";

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

  const shortcuts = [
    {
      href: "/revision/topics?mode=simple",
      label: "Simple revision",
      hint: "Topics, quick Q/A, coach",
      icon: Sparkles,
    },
    {
      href: "/revision/topics?mode=exam-conditions",
      label: "Exam conditions",
      hint: "Timed topic session",
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
                    Simple revision or exam conditions — then your topics.
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

        <div className="perf-fade-up space-y-2" style={{ animationDelay: "120ms" }}>
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
