import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { loadQuestionBank } from "@/lib/content/loaders";
import type { PaperType } from "@/lib/domain/types";

export default async function MockExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ paper?: PaperType }>;
}) {
  const { paper } = await searchParams;
  const questions = loadQuestionBank();

  const paper1 = questions.filter((question) => question.paper === "paper-1").slice(0, 6);
  const paper2 = questions.filter((question) => question.paper === "paper-2").slice(0, 6);
  const mixed = [...paper1.slice(0, 3), ...paper2.slice(0, 3)];

  const mocks = [
    { id: "paper-1", title: "Paper 1 Simulation", questions: paper1, minutes: 150 },
    { id: "paper-2", title: "Paper 2 Simulation", questions: paper2, minutes: 150 },
    { id: "mixed", title: "Component Triage Mix", questions: mixed, minutes: 60 },
  ].filter((mock) => (paper ? mock.id === paper : true));

  return (
    <div className="flex flex-col gap-10 pb-24 relative z-10 w-full max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="inline-block rounded-full border border-[#d4e5cb] bg-[#edf7ef] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4b8f60]">
          Assessment Environment
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Full Mock Execution</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Take complete synthesized examinations under strict simulated conditions. Performance dictates deep systemic gap tracking across your Command Centre.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        {mocks.map((mock) => (
          <Card key={mock.id} className="group flex flex-col justify-between bg-[#f7f3ed] p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">{mock.title}</h2>
                <Pill variant="accent">{mock.minutes} min</Pill>
              </div>
              <div className="mt-5 space-y-3">
                {mock.questions.map((question) => (
                  <p key={question.id} className="line-clamp-2 text-sm leading-snug text-slate-600">
                    <span className="mr-2 text-[#2f69b5]/50">-</span>
                    {question.prompt || question.title || "Examination Query"}
                  </p>
                ))}
              </div>
            </div>

            {mock.questions[0] ? (
              <Link
                href={`/question-bank/${mock.questions[0].id}`}
                className="app-button-blue mt-8 w-full"
              >
                Initialize Assessment
              </Link>
            ) : (
              <div className="mt-8 rounded-xl border border-[#ddd5ca] bg-white/70 px-4 py-3 text-center text-sm text-slate-500">
                No questions available for this mock.
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
