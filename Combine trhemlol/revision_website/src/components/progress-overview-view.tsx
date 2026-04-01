"use client";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { buildPaperReadiness, buildTopicMastery } from "@/lib/domain/analytics";
import type { AttemptEvaluation, Question, Topic } from "@/lib/domain/types";

export function ProgressOverviewView({ topics, questions }: { topics: Topic[]; questions: Question[] }) {
  const progress = useProgress();

  const safeAttempts = progress.attempts as unknown as AttemptEvaluation[];
  const safeQuestions = questions as unknown as Question[];
  const safeTopics = topics as unknown as Topic[];

  let readiness: ReturnType<typeof buildPaperReadiness> = [];
  let mastery: ReturnType<typeof buildTopicMastery> = [];

  try {
    readiness = buildPaperReadiness(safeTopics, safeQuestions, safeAttempts);
    mastery = buildTopicMastery(safeTopics, safeQuestions, safeAttempts).sort(
      (left, right) => left.masteryPercent - right.masteryPercent,
    );
  } catch {
    // Ignore malformed local state so the progress view still renders.
  }

  const recentAttempts = [...safeAttempts]
    .sort((left, right) => new Date(right.answeredAt).getTime() - new Date(left.answeredAt).getTime())
    .slice(0, 6)
    .map((attempt) => ({
      ...attempt,
      title: `${safeQuestions.find((question) => question.id === attempt.questionId)?.prompt?.substring(0, 40) ?? attempt.questionId}...`,
    }));

  return (
    <div className="space-y-6">
      <Card className="bg-[#f7f3ed] p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#2f69b5]">Component Progress</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">System Diagnostics</h1>
          </div>
          <button onClick={progress.clearProgress} className="app-button-muted !px-4 !py-2 !text-sm">
            Reset Engine State
          </button>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {readiness.map((item) => (
          <Card key={item.paper} className="bg-[#f7f3ed] p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{item.paper.replace("-", " ")}</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{Math.round(item.readinessPercent)}%</p>
            <p className="mt-2 text-sm font-medium text-[#2f69b5]">
              {item.topicsCovered} / {item.totalTopics} topics covered
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="bg-[#f7f3ed] p-6">
          <h2 className="text-lg font-semibold text-slate-900">Critical Mastery Flags</h2>
          <div className="mt-4 space-y-3">
            {mastery.slice(0, 8).map((topic) => (
              <div key={topic.topicId} className="rounded-xl border border-[#e3dbcf] bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{topic.title}</p>
                  <Pill variant={topic.masteryPercent >= 70 ? "accent" : "destructive"}>
                    {Math.round(topic.masteryPercent)}%
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Accuracy {Math.round(topic.accuracyPercent)}% - Coverage {Math.round(topic.coveragePercent)}%
                </p>
                {topic.frequentGaps.length > 0 ? <p className="mt-1 text-xs font-bold text-[#b45847]">Flag: {topic.frequentGaps[0]}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-[#f7f3ed] p-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Telemetry</h2>
          <div className="mt-4 space-y-3">
            {recentAttempts.map((attempt) => (
              <div
                key={`${attempt.questionId}-${attempt.answeredAt}`}
                className="rounded-xl border border-[#e3dbcf] bg-white/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-1 font-medium text-slate-900">{attempt.title}</p>
                  <Pill>
                    {attempt.scoreAchieved}/{attempt.maxScore}
                  </Pill>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Status: {attempt.retryState === "pending" ? "Failed (Retry Pending)" : "Resolved"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
