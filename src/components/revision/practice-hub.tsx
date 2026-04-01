"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Layers3,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui";
import { getWeakestTopics } from "@/lib/progress";

interface PracticeHubProps {
  onOpenDiagnostic?: () => void;
  compact?: boolean;
}

const pathRows = [
  {
    href: "/revision/topics",
    icon: Target,
    label: "Browse topics",
    description: "Open one topic for recall, drills, answer checking, or quiz.",
  },
  {
    href: "/revision/quick-quiz",
    icon: Zap,
    label: "Quick Quiz",
    description: "Fast retrieval across all topics.",
  },
  {
    href: "/revision/paper-1",
    icon: ClipboardCheck,
    label: "Paper 1",
    description: "Theory-heavy retrieval and terminology.",
  },
  {
    href: "/revision/paper-2",
    icon: Layers3,
    label: "Paper 2",
    description: "Applied written practice and scenarios.",
  },
  {
    href: "/revision/diagnostic",
    icon: BrainCircuit,
    label: "Diagnostic",
    description: "Map weak points with adaptive assessment.",
  },
];

export function PracticeHub({ compact = false }: PracticeHubProps) {
  const { diagnostic } = useAppData();
  const weakestTopics = getWeakestTopics(diagnostic, compact ? 2 : 3);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Choose a revision path</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick one route and focus on it. You can always switch later.
        </p>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border">
        {pathRows.map((row) => {
          const Icon = row.icon;

          return (
            <Link
              key={row.href}
              href={row.href}
              className="group flex items-center gap-4 px-4 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-card/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Icon size={16} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground">{row.label}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
              </div>
              <ArrowRight size={14} className="shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
            </Link>
          );
        })}
      </div>

      {weakestTopics.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-warning" />
            <p className="text-sm font-medium text-foreground">Weakest topics</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakestTopics.map((topic) => {
              const pct = Math.round((topic.score / topic.maxScore) * 100);
              return (
                <Link key={topic.category} href={`/revision/${topic.category}/practice`}>
                  <Badge variant={pct >= 50 ? "warning" : "danger"}>
                    {topic.topic} {pct}%
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
