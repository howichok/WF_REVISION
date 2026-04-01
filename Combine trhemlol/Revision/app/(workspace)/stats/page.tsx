"use client";

import { useMemo } from "react";
import { Calendar, Clock, Flame, Layers3 } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { allTopics, topicById } from "@/lib/content";
import { isoDayKey } from "@/lib/storage/client-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function StatsPage() {
  const { state, plan } = useAppState();

  const topicRows = useMemo(
    () =>
      allTopics.map((topic) => {
        const progress = state.topicProgress[topic.id];
        return {
          topicId: topic.id,
          title: topic.title,
          mastery: progress?.mastery ?? 50,
          weakManual: progress?.weakManual ?? false,
        };
      }),
    [state.topicProgress]
  );

  const avgMastery = useMemo(() => {
    const values = topicRows.map((topic) => topic.mastery);
    return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
  }, [topicRows]);

  const todayMinutes = state.dailyMinutes[isoDayKey()] ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/70">
          <CardContent className="space-y-1 p-4">
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Layers3 className="size-4" /> Average mastery</p>
            <p className="text-2xl font-semibold">{avgMastery}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="space-y-1 p-4">
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Clock className="size-4" /> Today</p>
            <p className="text-2xl font-semibold">{todayMinutes}m</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="space-y-1 p-4">
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Flame className="size-4" /> Streak</p>
            <p className="text-2xl font-semibold">{state.streak.current}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardContent className="space-y-1 p-4">
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="size-4" /> Next exam</p>
            <p className="text-2xl font-semibold">{plan.daysUntilPaper1}d</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Topic mastery map</CardTitle>
          <CardDescription>Updated by diagnostics, quizzes, and exam sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topicRows.map((topic) => (
            <div key={topic.topicId} className="space-y-2 rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>{topic.title}</span>
                <span className="inline-flex items-center gap-2">
                  {topic.weakManual ? <Badge>Weak</Badge> : null}
                  <Badge variant="outline">{topic.mastery}%</Badge>
                </span>
              </div>
              <Progress value={topic.mastery} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.sessionLogs.slice(0, 10).map((session) => (
            <div key={session.id} className="rounded-lg border border-border/70 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="capitalize">{session.mode}</span>
                <span>{session.score}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {session.topicIds.length
                  ? session.topicIds.map((topicId) => topicById[topicId]?.title ?? topicId).join(", ")
                  : "General focus"}
              </p>
            </div>
          ))}
          {state.sessionLogs.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
