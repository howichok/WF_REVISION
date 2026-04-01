import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { PaperType, Question } from "@/lib/domain/types";

export function DrillView({
  paper,
  minutes,
  questions,
}: {
  paper: PaperType;
  minutes: number;
  questions: Question[];
}) {
  return (
    <div className="flex flex-col gap-10 pb-24 relative z-10 w-full max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="inline-block rounded-full border border-[#bdd3ef] bg-[#edf4fd] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2f69b5]">
          Drill Launcher
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">{paper.replace("-", " ")} targeted drill</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Focused question set sized for the selected time window. The current drill surface launches directly into individual question executors.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {questions.map((question) => (
          <Card key={question.id} className="bg-[#f7f3ed] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Pill variant="accent">{question.commandWord}</Pill>
                <Pill>{question.markValue} marks</Pill>
              </div>
              <span className="text-xs font-mono text-slate-500">{question.estimatedMinutes}m</span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{question.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{question.prompt}</p>
            <Link
              href={`/question-bank/${question.id}`}
              className="app-button-blue mt-6"
            >
              Launch question
            </Link>
          </Card>
        ))}
      </div>

      <Card className="bg-[#f7f3ed] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Drill budget</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{minutes} minutes</p>
          </div>
          <Link
            href="/question-bank"
            className="app-button-muted"
          >
            Open full bank
          </Link>
        </div>
      </Card>
    </div>
  );
}
