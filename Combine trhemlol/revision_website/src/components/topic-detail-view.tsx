"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, FileText, Flame, Play, Target } from "lucide-react";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { buildTopicMastery } from "@/lib/domain/analytics";
import type { Question, Topic } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

interface TopicDetailViewProps {
  topic: Topic;
  questions: Question[];
  activeSubtopicId?: string;
}

export function TopicDetailView({ topic, questions, activeSubtopicId }: TopicDetailViewProps) {
  const progress = useProgress();
  const attempts = progress.attempts;
  const topicQuestions = questions.filter((question) => question.topicId === topic.id);
  const topicAttempts = attempts.filter((attempt) => topicQuestions.some((question) => question.id === attempt.questionId));

  const mastery = buildTopicMastery([topic], questions, attempts)[0];
  const pendingMistakes = topicAttempts.filter((attempt) => attempt.retryState === "pending");
  const diagnosticQuestions = topicQuestions.filter((question) => question.difficulty === "core").slice(0, 3);
  const examQuestions = topicQuestions.filter((question) => question.difficulty !== "core");

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 pb-24">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href={`/${topic.paper}`} className="transition-colors hover:text-[#2f69b5]">
            {topic.paper.replace("-", " ")}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-800">Topic Strategy</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">{topic.title}</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Pill variant={mastery.masteryPercent < 60 ? "destructive" : "accent"}>
            {Math.round(mastery.masteryPercent)}% readiness
          </Pill>
          <span className="text-xs font-mono text-slate-500">{mastery.attemptCount} attempts</span>
        </div>
      </header>

      <Card className="bg-[#f7f3ed] p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2f69b5]">
          <BookOpen className="h-4 w-4" /> Phase 1: Syllabus targeting
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {topic.subtopics.map((subtopic) => {
            const isActive = subtopic.id === activeSubtopicId;

            return (
              <Link key={subtopic.id} href={`/${topic.paper}/${topic.id}/${subtopic.id}`}>
                <div
                  className={cn(
                    "h-full rounded-[1.2rem] border p-4 transition",
                    isActive ? "border-[#bdd3ef] bg-[#edf4fd]" : "border-[#ddd5ca] bg-white/75 hover:bg-white",
                  )}
                >
                  <h3 className={cn("text-base font-semibold", isActive ? "text-[#2f69b5]" : "text-slate-900")}>{subtopic.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {subtopic.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5f93d4]" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-[#f7f3ed] p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Target className="h-4 w-4 text-[#2f69b5]" /> Phase 2: Diagnostic check
          </div>
          <div className="mt-5 space-y-3">
            {diagnosticQuestions.length > 0 ? (
              diagnosticQuestions.map((question, index) => (
                <Link key={question.id} href={`/question-bank/${question.id}`} className="app-list-row">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#2f69b5]">Q{index + 1}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{question.prompt}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    {question.markValue} marks <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-[#ddd5ca] bg-white/75 p-4 text-sm text-slate-500">
                No core diagnostics loaded for this topic.
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-[#f7f3ed] p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c1651b]">
            <Flame className="h-4 w-4" /> Retry pressure
          </div>
          {pendingMistakes.length > 0 ? (
            <div className="mt-5 rounded-[1.2rem] border border-[#efc2b8] bg-[#faece8] p-5">
              <h3 className="text-lg font-semibold text-slate-900">{pendingMistakes.length} pending retries</h3>
              <p className="mt-2 text-sm leading-6 text-[#b45847]">
                Resolve historic mistakes here before moving too far into deep execution.
              </p>
              <Link href={`/mistakes?topic=${topic.id}`} className="app-button-orange mt-5 w-full">
                Resolve error queue
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.2rem] border border-[#d4e5cb] bg-[#edf7ef] p-5 text-sm text-[#487856]">
              No pending retries for this topic.
            </div>
          )}
        </Card>
      </section>

      <Card className="bg-[#f7f3ed] p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          <FileText className="h-4 w-4 text-[#2f69b5]" /> Phase 3: Long-answer execution
        </div>
        <div className="mt-5 space-y-3">
          {examQuestions.length > 0 ? (
            examQuestions.map((question) => (
              <Link key={question.id} href={`/question-bank/${question.id}`} className="block rounded-[1.2rem] border border-[#ddd5ca] bg-white/80 p-5 transition hover:bg-white">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#edf4fd] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2f69b5]">
                        Extended Response
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">
                        {question.commandWord || "Evaluate"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-relaxed text-slate-900">{question.prompt}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <span>[{question.markValue} marks]</span>
                    <span className="inline-flex items-center gap-1 text-[#2f69b5]">
                      Start <Play className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-[#ddd5ca] bg-white/75 p-4 text-sm text-slate-500">
              No extended-response questions loaded for this topic yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
