"use client";

import { useState } from "react";
import { Question } from "@/lib/domain/types";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { BookOpen, Target, Clock, Tag, Play } from "lucide-react";

interface RichQuestionExecutorProps {
  question: Question;
  onSubmit: (writtenResponse: string, timeSpentSeconds: number) => void;
}

export function RichQuestionExecutor({ question, onSubmit }: RichQuestionExecutorProps) {
  const [response, setResponse] = useState("");
  const [startTime] = useState(Date.now());

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(response, timeSpent);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Pill variant="accent" icon={BookOpen}>
            {question.sourceProvider} {question.year}
          </Pill>
          <span className="border-l border-white/10 pl-2 text-xs font-mono font-medium uppercase tracking-widest text-muted">
            {question.sectionName} - Q{question.questionNumber}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-accent">[{question.markValue} Marks]</span>
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <Clock className="h-4 w-4" /> ~{question.markValue * 1.5}m Limit
          </span>
        </div>
      </header>

      <Card className="relative overflow-hidden border-white/5 bg-panel/40 p-8">
        <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-5">
          <Target className="h-64 w-64" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-accent/20 bg-accent/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Command Word: {question.commandWord}
            </span>
            <div className="flex max-w-full items-center gap-2 overflow-x-auto no-scrollbar">
              {question.skillTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-sm bg-white/5 px-2 py-1 text-[10px] font-mono text-muted"
                >
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-bold leading-relaxed text-white md:text-2xl">{question.prompt}</h2>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            <Play className="h-4 w-4" /> Execution Zone
          </label>
          <span className="text-xs font-mono text-muted/50">Characters: {response.length}</span>
        </div>
        <textarea
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          placeholder="Construct your response here. Pay attention to the command word..."
          className="h-80 w-full resize-y rounded-xl border border-white/10 bg-slate-950/50 p-6 font-mono text-sm leading-relaxed text-white/90 shadow-inner transition-all focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      <div className="flex items-center justify-end border-t border-white/5 pt-4">
        <button
          onClick={handleSubmit}
          disabled={response.trim().length === 0}
          className="h-12 rounded-lg bg-accent px-8 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:bg-accent/90 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit for Examiner Review
        </button>
      </div>
    </div>
  );
}
