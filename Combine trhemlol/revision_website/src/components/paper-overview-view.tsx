"use client";

import Link from "next/link";
import { Activity, ArrowRight, Flame, Play, Target, TrendingUp } from "lucide-react";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress-bar";
import { buildPaperReadiness, buildTopicMastery, buildWeakTopicSignals } from "@/lib/domain/analytics";
import type { PaperType, Question, Topic } from "@/lib/domain/types";

interface PaperOverviewViewProps {
  paperId: PaperType;
  topics: Topic[];
  questions: Question[];
}

export function PaperOverviewView({ paperId, topics, questions }: PaperOverviewViewProps) {
  const progress = useProgress();
  const attempts = progress.attempts;
  const paperTopics = topics.filter((topic) => topic.paper === paperId);
  const paperQuestions = questions.filter((question) => question.paper === paperId);
  const paperAttempts = attempts.filter((attempt) =>
    paperQuestions.some((question) => question.id === attempt.questionId),
  );

  const readiness = buildPaperReadiness(topics, questions, attempts).find((item) => item.paper === paperId);
  const weakSignals = buildWeakTopicSignals(paperTopics, paperQuestions, paperAttempts).slice(0, 3);
  const pendingMistakes = paperAttempts.filter((attempt) => attempt.retryState === "pending");
  const topicMastery = buildTopicMastery(paperTopics, paperQuestions, paperAttempts).sort(
    (left, right) => left.masteryPercent - right.masteryPercent,
  );

  const title =
    paperId === "paper-1" ? "Core Paper 1" : paperId === "paper-2" ? "Core Paper 2" : paperId.toUpperCase();

  const subtitle =
    paperId === "paper-1"
      ? "Digital Capabilities & Problem Solving"
      : paperId === "paper-2"
        ? "Digital Business & Data"
        : "Qualification Component";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 pb-24">
      <header className="space-y-4">
        <Pill variant="accent">Revision Mode</Pill>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="max-w-2xl text-lg text-slate-600">{subtitle}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-[#f7f3ed] p-8">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2f69b5]">
            <Activity className="h-4 w-4" /> Component Telemetry
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">System readiness</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter text-slate-900">
                  {Math.round(readiness?.readinessPercent ?? 0)}%
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-[#2f69b5]">
                  <TrendingUp className="h-4 w-4" /> Projected
                </span>
              </div>
              <ProgressBar percent={readiness?.readinessPercent ?? 0} className="mt-4 h-2" />
            </div>

            <div className="space-y-4 rounded-[1.4rem] border border-[#ddd5ca] bg-white/80 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Topics covered</p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {readiness?.topicsCovered ?? 0} / {readiness?.totalTopics ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pending mistakes</p>
                <p className="mt-2 flex items-center gap-2 text-xl font-bold text-[#c1651b]">
                  {pendingMistakes.length} <Flame className="h-4 w-4" />
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#f7f3ed] p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Play className="h-4 w-4" /> Quick practice
          </div>
          <div className="mt-5 space-y-3">
            {[
              { href: `/${paperId}/drill?time=10`, label: "Component Quick Mix", detail: "10 minutes" },
              { href: `/${paperId}/drill?time=25`, label: "Targeted Gap Drill", detail: "25 minutes" },
              { href: `/mock-exams?paper=${paperId}`, label: "Full Mock Exam", detail: "2h 30m" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="app-list-row">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-[#f7f3ed] p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Target className="h-4 w-4" /> Strategy Map
          </div>
          <div className="mt-5 space-y-3">
            {topicMastery.map((topic) => {
              const isDanger = topic.masteryPercent < 60;

              return (
                <Link key={topic.topicId} href={`/${paperId}/${topic.topicId}`} className="block">
                  <div className="rounded-[1.2rem] border border-[#ddd5ca] bg-white/80 p-4 transition hover:bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">{topic.title}</h4>
                          {isDanger ? <span className="rounded-full bg-[#faece8] px-2 py-1 text-[10px] font-bold uppercase text-[#b45847]">Priority</span> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {topic.attemptCount} attempts · {Math.round(topic.coveragePercent)}% coverage
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <p className="mb-1 text-right text-xs font-mono text-slate-500">{Math.round(topic.masteryPercent)}%</p>
                          <ProgressBar percent={topic.masteryPercent} className="h-2" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#f7f3ed] p-6">
            <h2 className="text-lg font-semibold text-slate-900">Weakness signals</h2>
            <div className="mt-4 space-y-3">
              {weakSignals.length > 0 ? (
                weakSignals.map((signal) => (
                  <Link key={signal.topicId} href={`/${paperId}/${signal.topicId}`} className="block rounded-[1.2rem] border border-[#efc2b8] bg-[#faece8] p-4">
                    <p className="text-sm font-semibold text-slate-900">{signal.title}</p>
                    <p className="mt-2 text-xs leading-5 text-[#b45847]">
                      {signal.primaryGap ? `Gap detected: ${signal.primaryGap}` : signal.reasons.join(", ")}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-[#d4e5cb] bg-[#edf7ef] p-4 text-sm text-[#487856]">
                  No critical signals detected on this component yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-[#f7f3ed] p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c1651b]">Mistake feed</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{pendingMistakes.length}</p>
            <p className="mt-2 text-sm text-slate-600">Pending retries</p>
            {pendingMistakes.length > 0 ? (
              <Link href={`/mistakes?paper=${paperId}`} className="app-button-orange mt-5 w-full">
                Resolve queue
              </Link>
            ) : null}
          </Card>
        </div>
      </section>
    </div>
  );
}
