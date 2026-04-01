"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Clock3, Flame, PlayCircle } from "lucide-react";
import { useAppState, useWeakTopics } from "@/components/app-state-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { topicById } from "@/lib/content";
import { isoDayKey } from "@/lib/storage/client-store";

export default function DashboardPage() {
  const { state, plan } = useAppState();
  const weakTopics = useWeakTopics(3);
  const todayMinutes = state.dailyMinutes[isoDayKey()] ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card className="border-border">
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <CardTitle className="text-2xl">Start today&apos;s session</CardTitle>
          <CardDescription>Cards, mini-quiz, then an exam-style question.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <Button asChild size="lg" className="h-14 w-full justify-between text-base sm:text-lg">
            <Link href="/revision">
              <span className="inline-flex items-center gap-2">
                <PlayCircle className="size-5" />
                Start Today&apos;s Session
              </span>
              <ArrowRight className="size-5" />
            </Link>
          </Button>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Today focus</p>
            {plan.todayTasks.slice(0, 3).map((task) => (
              <div key={task.topicId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                <span>{task.title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{task.minutes}m</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-4 shrink-0" /> Days to Paper 1
            </p>
            <p className="text-xl font-semibold tabular-nums">{plan.daysUntilPaper1}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-4 shrink-0" /> Days to Paper 2
            </p>
            <p className="text-xl font-semibold tabular-nums">{plan.daysUntilPaper2}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock3 className="size-4 shrink-0" /> Recommended
            </p>
            <p className="text-xl font-semibold tabular-nums">{plan.recommendedMinutesPerDay}m/day</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="inline-flex items-center gap-1 text-muted-foreground">
              <Flame className="size-4 shrink-0" /> Streak / Today
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {state.streak.current} / {todayMinutes}m
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Weak topic mastery</CardTitle>
              <CardDescription>Top 3 weakest nodes right now.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/stats">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {weakTopics.map((topic) => (
            <div key={topic.topicId} className="space-y-2 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{topicById[topic.topicId]?.title ?? topic.title}</span>
                <span
                  className={
                    topic.weakManual
                      ? "shrink-0 tabular-nums font-medium text-foreground"
                      : "shrink-0 tabular-nums text-muted-foreground"
                  }
                >
                  {topic.mastery}%
                </span>
              </div>
              <Progress value={topic.mastery} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
