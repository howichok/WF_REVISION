"use client";

import Link from "next/link";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { buildActionDirectives } from "@/lib/domain/analytics";
import type { Question, Topic } from "@/lib/domain/types";

export function PlannerView({ topics, questions }: { topics: Topic[]; questions: Question[] }) {
  const progress = useProgress();
  const directives = buildActionDirectives(topics, questions, progress);

  return (
    <div className="flex flex-col gap-10 pb-24 relative z-10 w-full max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="inline-block rounded-full border border-[#bdd3ef] bg-[#edf4fd] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2f69b5]">
          Revision Planner
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Action Queue</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Current revision slots generated from your live weakness, mistake, and paper-readiness signals.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {directives.map((directive) => (
          <Card key={directive.id} className="flex flex-col justify-between bg-[#f7f3ed] p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Pill variant="accent">{directive.type}</Pill>
                <span className="text-xs font-mono text-slate-500">{directive.estimatedMinutes}m</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{directive.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{directive.reason}</p>
              </div>
            </div>
            <Link
              href={directive.route}
              className="app-button-blue mt-6"
            >
              Open target
            </Link>
          </Card>
        ))}
      </div>

      {directives.length === 0 && (
        <Card className="bg-[#f7f3ed] p-8 text-center text-slate-500">
          No current directives were generated.
        </Card>
      )}
    </div>
  );
}
