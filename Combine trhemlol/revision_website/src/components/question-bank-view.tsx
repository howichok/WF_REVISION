"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bookmark } from "lucide-react";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { Question, Topic } from "@/lib/domain/types";

export function QuestionBankView({
  questions,
  topics,
  initialQuery = "",
}: {
  questions: Question[];
  topics: Topic[];
  initialQuery?: string;
}) {
  const progress = useProgress();
  const [query, setQuery] = useState(initialQuery);
  const [paper, setPaper] = useState("all");

  const results = questions.filter((question) => {
    if (paper !== "all" && question.paper !== paper) return false;
    if (query && !(question.prompt || question.title || "").toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 pb-24">
      <header className="space-y-4">
        <div className="inline-block rounded-full border border-[#bdd3ef] bg-[#edf4fd] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2f69b5]">
          Question Bank
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Question Execution Bank</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Filter raw evaluation criteria across all components.
        </p>
        <p className="text-xs font-mono text-slate-500">
          {topics.length} mapped topics · {questions.length} executable prompts
        </p>

        <div className="mt-5 grid w-full gap-3 lg:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search term..."
            className="app-input col-span-1 lg:col-span-2"
          />
          <select value={paper} onChange={(event) => setPaper(event.target.value)} className="app-input col-span-1">
            <option value="all">All Components</option>
            <option value="paper-1">Core Paper 1</option>
            <option value="paper-2">Core Paper 2</option>
            <option value="esp">ESP</option>
            <option value="os">OS</option>
          </select>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {results.map((question) => {
          const bookmarked = progress.bookmarks.includes(question.id);

          return (
            <Card key={question.id} className="group flex flex-col justify-between bg-[#f7f3ed] p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Pill variant="accent">{question.paper}</Pill>
                    <span className="rounded-full border border-[#ddd5ca] bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {question.commandWord || "Evaluate"}
                    </span>
                  </div>
                  <button
                    onClick={() => progress.toggleBookmark(question.id)}
                    className="p-2 text-slate-500 transition-colors hover:text-[#2f69b5]"
                  >
                    <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
                  </button>
                </div>

                <h2 className="text-lg font-bold leading-relaxed text-slate-900">
                  {question.prompt || question.title || "Missing prompt"}
                </h2>

                <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-500">
                  <span>[{question.markValue || 1} MARKS]</span>
                  <span>[{question.estimatedMinutes || Math.max(1, Math.round((question.markValue || 1) * 1.5))}m TIME LIMIT]</span>
                </div>
              </div>

              <Link href={`/question-bank/${question.id}`} className="app-button-blue mt-6 w-full">
                Launch Executor <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          );
        })}
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-[#ddd5ca] bg-[#f7f3ed] p-8 text-center text-slate-500">
          No components isolated. Loosen the current filters.
        </div>
      ) : null}
    </div>
  );
}
