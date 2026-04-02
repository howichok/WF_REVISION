import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { EXAM_MILESTONES, PAPER_LABELS, type ExamMilestone } from "@/lib/exam-plan";

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function kindLabel(m: ExamMilestone) {
  if (m.kind === "exam") return "Exam";
  if (m.kind === "task") return "ESP task";
  return "Milestone";
}

export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-muted text-sm">
          <CalendarDays size={16} className="text-accent" />
          Exam-focused timeline
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Exam plan</h1>
        <p className="text-muted text-sm leading-relaxed max-w-xl">
          Illustrative schedule for core papers and ESP (adjust to your centre’s dates). Each row links
          into the matching revision area in this app.
        </p>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">Milestones</CardTitle>
          <CardDescription>May–June window, typical two-year route</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/60">
          {EXAM_MILESTONES.map((m) => (
            <Link
              key={`${m.paper}-${m.shortTitle}-${m.day}`}
              href={m.href}
              className="flex flex-col sm:flex-row sm:items-center gap-2 py-4 first:pt-0 last:pb-0 hover:bg-card-hover/50 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="shrink-0 w-24 text-sm text-muted tabular-nums">
                {MONTHS[m.month]} {m.day}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{m.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    {PAPER_LABELS[m.paper]}
                  </span>
                  <span className="text-xs text-muted-foreground">{kindLabel(m)}</span>
                </div>
                <p className="text-sm text-muted mt-1">{m.focusLabel}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
