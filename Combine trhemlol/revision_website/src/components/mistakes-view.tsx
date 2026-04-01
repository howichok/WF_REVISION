"use client";

import Link from "next/link";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { Question } from "@/lib/domain/types";

export function MistakesView({ questions }: { questions: Question[] }) {
  const progress = useProgress();
  const pendingAttempts = progress.attempts
    .filter((attempt) => attempt.retryState === "pending")
    .sort((left, right) => new Date(right.answeredAt).getTime() - new Date(left.answeredAt).getTime());

  return (
    <div className="flex flex-col gap-10 pb-24 relative z-10 w-full max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="inline-block rounded-full border border-[#efc9a6] bg-[#fff0e4] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#c1651b]">
          Retry Queue
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Mistakes & Retries</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Pending mistakes remain here until you record a fully resolved retry for the same question.
        </p>
      </header>

      <div className="grid gap-4">
        {pendingAttempts.map((attempt) => {
          const question = questions.find((item) => item.id === attempt.questionId);

          return (
            <Card key={attempt.id} className="bg-[#f7f3ed] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Pill variant="destructive">retry pending</Pill>
                    {question ? <Pill variant="accent">{question.paper}</Pill> : null}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{question?.title ?? attempt.questionId}</h2>
                  <p className="text-sm leading-relaxed text-slate-600">{question?.prompt ?? "Question metadata could not be loaded."}</p>
                  {attempt.missingKnowledgePoints.length > 0 && (
                    <div className="space-y-1 text-sm text-[#c1651b]">
                      {attempt.missingKnowledgePoints.slice(0, 4).map((point) => (
                        <p key={`${attempt.id}-${point}`}>- {point}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {attempt.scoreAchieved}/{attempt.maxScore}
                  </p>
                  <p className="text-xs text-slate-500">{Math.round(attempt.timeSpentSeconds / 60)}m logged</p>
                  {question ? (
                    <Link
                      href={`/question-bank/${question.id}`}
                      className="app-button-blue"
                    >
                      Retry now
                    </Link>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {pendingAttempts.length === 0 && (
        <Card className="bg-[#f7f3ed] p-8 text-center text-slate-500">
          No pending retries. The queue is clear.
        </Card>
      )}
    </div>
  );
}
