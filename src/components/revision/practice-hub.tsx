"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  Layers3,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui";
import { getWeakestTopics } from "@/lib/progress";

interface PracticeHubProps {
  onOpenDiagnostic?: () => void;
  compact?: boolean;
}

const supportLinks = [
  {
    href: "/revision/diagnostic",
    icon: BrainCircuit,
    label: "Diagnostic",
    description: "Map weak points before you choose a mode.",
  },
  {
    href: "/revision/paper-1",
    icon: ClipboardCheck,
    label: "Paper 1 quick route",
    description: "Fast theory retrieval inside Simple revision.",
  },
  {
    href: "/revision/paper-2",
    icon: Layers3,
    label: "Paper 2 quick route",
    description: "Applied prompts before you move into full Exam conditions.",
  },
];

export function PracticeHub({ compact = false }: PracticeHubProps) {
  const { diagnostic } = useAppData();
  const weakestTopics = getWeakestTopics(diagnostic, compact ? 2 : 3);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Choose a revision mode</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The site now works best when you think in two routes: quick learning first, full exam writing second.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Link
          href="/revision/topics"
          className="group rounded-[28px] border border-accent/20 bg-accent/10 p-5 shadow-[0_18px_50px_-32px_rgba(139,92,246,0.38)] transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                <Search size={18} className="text-accent" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-foreground">Simple revision</p>
                  <Badge variant="accent">Fast Q/A</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use Ask DSD, recall, and quick Q/A while you are still learning or warming up a topic.
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Ask coach</p>
              <p className="mt-1 text-xs text-muted-foreground">Hints, short explanations, source picks.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Recall</p>
              <p className="mt-1 text-xs text-muted-foreground">Retrieve terms and points from memory.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Quick Q/A</p>
              <p className="mt-1 text-xs text-muted-foreground">Fast checks before you write full answers.</p>
            </div>
          </div>
        </Link>

        <Link
          href="/revision/topics"
          className="group rounded-[28px] border border-warning/20 bg-warning/10 p-5 shadow-[0_18px_50px_-32px_rgba(245,158,11,0.38)] transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                <Target size={18} className="text-warning" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-foreground">Exam conditions</p>
                  <Badge variant="warning">Plan + write</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan the answer first, then finish with one fuller written response that the AI checks against the rubric.
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="shrink-0 text-warning transition-transform group-hover:translate-x-0.5" />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Exam drill</p>
              <p className="mt-1 text-xs text-muted-foreground">Plan structure, checklist, and exam focus before you write.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Final written answer</p>
              <p className="mt-1 text-xs text-muted-foreground">Use answer-check for the longer 6/8/12-mark style response.</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border">
        {supportLinks.map((row) => {
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
