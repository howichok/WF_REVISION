"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock4, TimerReset } from "lucide-react";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";
import { useAppState } from "@/components/app-state-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const defaultDaysOptions = [7, 5, 3];

export default function OnboardingTimePage() {
  const router = useRouter();
  const { state, updateSettings } = useAppState();

  const hasMinutes = Boolean(state.settings.minutesPerDay);
  const [mode, setMode] = useState<"minutes" | "hours">(hasMinutes ? "minutes" : "hours");
  const [minutesPerDay, setMinutesPerDay] = useState(state.settings.minutesPerDay?.toString() ?? "45");
  const [hoursPerWeek, setHoursPerWeek] = useState(state.settings.hoursPerWeek?.toString() ?? "6");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(state.settings.daysPerWeek || 5);
  const [error, setError] = useState<string | null>(null);

  const projectedMinutes = useMemo(() => {
    if (mode === "minutes") {
      return Number(minutesPerDay) || 0;
    }
    const hours = Number(hoursPerWeek) || 0;
    return Math.round((hours * 60) / Math.max(1, daysPerWeek));
  }, [mode, minutesPerDay, hoursPerWeek, daysPerWeek]);

  const submit = () => {
    if (mode === "minutes") {
      const minutes = Number(minutesPerDay);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        setError("Enter a valid minutes/day value.");
        return;
      }
      updateSettings(minutes, undefined, daysPerWeek);
    } else {
      const hours = Number(hoursPerWeek);
      if (!Number.isFinite(hours) || hours <= 0) {
        setError("Enter a valid hours/week value.");
        return;
      }
      updateSettings(undefined, hours, daysPerWeek);
    }

    setError(null);
    router.push("/onboarding/weakness");
  };

  return (
    <OnboardingGuard step="time">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-2xl">Study time setup</CardTitle>
            <CardDescription>
              Pick your pace once. The planner adapts daily tasks to your available time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "minutes" | "hours")}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="minutes">Minutes / day</TabsTrigger>
                <TabsTrigger value="hours">Hours / week</TabsTrigger>
              </TabsList>
              <TabsContent value="minutes" className="space-y-2 pt-4">
                <Label htmlFor="minutes">Minutes per day</Label>
                <div className="relative">
                  <Clock4 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="minutes"
                    type="number"
                    min={10}
                    step={5}
                    value={minutesPerDay}
                    onChange={(event) => setMinutesPerDay(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </TabsContent>
              <TabsContent value="hours" className="space-y-2 pt-4">
                <Label htmlFor="hours">Hours per week</Label>
                <div className="relative">
                  <TimerReset className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="hours"
                    type="number"
                    min={1}
                    step={0.5}
                    value={hoursPerWeek}
                    onChange={(event) => setHoursPerWeek(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label>Days per week</Label>
              <div className="flex flex-wrap gap-2">
                {defaultDaysOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={daysPerWeek === option ? "default" : "outline"}
                    onClick={() => setDaysPerWeek(option)}
                  >
                    {option} days
                  </Button>
                ))}
                <label
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border px-3 text-sm",
                    daysPerWeek !== 7 && daysPerWeek !== 5 && daysPerWeek !== 3
                      ? "border-primary"
                      : "border-border"
                  )}
                >
                  Custom
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={daysPerWeek}
                    onChange={(event) => setDaysPerWeek(Math.min(7, Math.max(1, Number(event.target.value) || 1)))}
                    className="h-8 w-16"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-secondary/35 p-4">
              <p className="text-sm text-muted-foreground">Estimated working pace</p>
              <p className="text-2xl font-semibold">{projectedMinutes} min/day</p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex justify-end">
              <Button size="lg" onClick={submit}>
                Continue to weakness setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingGuard>
  );
}
