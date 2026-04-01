"use client";

import Link from "next/link";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { buildWeakTopicSignals } from "@/lib/domain/analytics";
import type { Question, Topic } from "@/lib/domain/types";

export function WeakTopicsView({ topics, questions }: { topics: Topic[]; questions: Question[] }) {
  const progress = useProgress();
  const signals = buildWeakTopicSignals(topics, questions, progress.attempts);

  return (
    <div className="flex flex-col gap-10 pb-24 relative z-10 w-full max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="inline-block rounded-full border border-[#efc2b8] bg-[#faece8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#b45847]">
          Weak Topic Engine
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Weakness Triage</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          These topics are currently producing the strongest weakness signals from your attempt history.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {signals.map((signal) => (
          <Card key={signal.topicId} className="bg-[#f7f3ed] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-slate-500">{signal.paper}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">{signal.title}</h2>
              </div>
              <Pill variant="destructive">{Math.round(signal.strength)}</Pill>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#b45847]">
              {signal.reasons.map((reason) => (
                <p key={`${signal.topicId}-${reason}`}>- {reason}</p>
              ))}
            </div>
            <Link
              href={`/${signal.paper}/${signal.topicId}`}
              className="app-button-blue mt-6"
            >
              Open topic
            </Link>
          </Card>
        ))}
      </div>

      {signals.length === 0 && (
        <Card className="bg-[#f7f3ed] p-8 text-center text-slate-500">
          No weak-topic signals yet. Answer a few questions to initialize diagnostics.
        </Card>
      )}
    </div>
  );
}
