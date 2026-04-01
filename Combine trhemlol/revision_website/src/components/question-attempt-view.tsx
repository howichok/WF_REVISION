"use client";

import Link from "next/link";
import { useState } from "react";

import { useProgress } from "@/components/providers/progress-provider";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { FeedbackRule, Question } from "@/lib/domain/types";

export function QuestionAttemptView({
  question,
  feedbackRule,
  relatedQuestions,
}: {
  question: Question;
  feedbackRule?: FeedbackRule;
  relatedQuestions: Question[];
}) {
  const progress = useProgress();
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [minutesSpent, setMinutesSpent] = useState(question.estimatedMinutes);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const bookmarked = progress.bookmarks.includes(question.id);

  function toggleEvidence(point: string) {
    setSelectedEvidence((current) =>
      current.includes(point) ? current.filter((item) => item !== point) : [...current, point],
    );
  }

  function handleSubmit() {
    const score = selectedEvidence.length;
    setSubmittedScore(score);
    progress.submitAttempt({
      questionId: question.id,
      scoreAchieved: score,
      maxScore: question.markSchemePoints.length,
      timeSpentSeconds: Math.round(minutesSpent * 60),
      writtenResponse: writtenAnswer,
      missingKnowledgePoints: question.markSchemePoints.filter((point) => !selectedEvidence.includes(point)),
      weakApplicationToScenario: false,
      poorCommandWordFulfillment: score < Math.ceil(question.markSchemePoints.length / 2),
      lackOfEvaluationOrConclusion:
        question.commandWord.toLowerCase() === "evaluate" && score < question.markSchemePoints.length,
    });
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#f7f3ed]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill>{question.paper}</Pill>
              <Pill>{question.commandWord}</Pill>
              <Pill>{question.markValue} marks</Pill>
              <Pill>{question.estimatedMinutes} min</Pill>
            </div>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">{question.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{question.prompt}</p>
          </div>

          <div className="min-w-[14rem] rounded-2xl border border-[#ddd5ca] bg-white/75 p-4">
            <button onClick={() => progress.toggleBookmark(question.id)} className="app-button-muted w-full !px-3 !py-2 !text-sm">
              {bookmarked ? "Remove bookmark" : "Bookmark question"}
            </button>
            <p className="mt-4 text-sm text-slate-500">{question.sourceName}</p>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="bg-[#f7f3ed]">
          <h2 className="text-lg font-semibold text-slate-900">Write your response</h2>
          <textarea
            value={writtenAnswer}
            onChange={(event) => setWrittenAnswer(event.target.value)}
            className="app-input mt-4 min-h-[16rem] px-4 py-4"
            placeholder="Write the answer you would give under exam conditions."
          />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="text-sm text-slate-600">
              Confidence
              <select
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
                className="app-input ml-3 inline-flex w-auto min-w-[5rem] px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-600">
              Minutes spent
              <input
                value={minutesSpent}
                min={1}
                onChange={(event) => setMinutesSpent(Number(event.target.value) || 1)}
                type="number"
                className="app-input ml-3 inline-flex w-20 px-3 py-2 text-sm"
              />
            </label>

            <button onClick={handleSubmit} className="app-button-blue">
              Submit self-mark
            </button>
          </div>
        </Card>

        <Card className="bg-[#f7f3ed]">
          <h2 className="text-lg font-semibold text-slate-900">Examiner checklist</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mark the points your answer genuinely covered. This is the current mark-aware feedback skeleton rather than
            a fake auto-marker.
          </p>
          <div className="mt-4 space-y-3">
            {question.markSchemePoints.map((point) => (
              <label key={point} className="flex gap-3 rounded-2xl border border-[#ddd5ca] bg-white/75 p-3 text-sm text-slate-600">
                <input type="checkbox" checked={selectedEvidence.includes(point)} onChange={() => toggleEvidence(point)} />
                <span>{point}</span>
              </label>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card className="bg-[#f7f3ed]">
          <h2 className="text-lg font-semibold text-slate-900">Feedback rule</h2>
          <p className="mt-3 text-sm text-slate-600">{feedbackRule?.description}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {feedbackRule?.feedbackChecks.map((check) => (
              <p key={check}>- {check}</p>
            ))}
          </div>
        </Card>

        <Card className="bg-[#f7f3ed]">
          <h2 className="text-lg font-semibold text-slate-900">Common pitfalls</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {question.commonPitfalls.map((pitfall) => (
              <p key={pitfall}>- {pitfall}</p>
            ))}
          </div>
        </Card>

        <Card className="bg-[#f7f3ed]">
          <h2 className="text-lg font-semibold text-slate-900">Current self-score</h2>
          <p className="mt-3 text-4xl font-semibold text-slate-900">
            {submittedScore ?? selectedEvidence.length}/{question.markSchemePoints.length}
          </p>
          <ProgressBar value={((submittedScore ?? selectedEvidence.length) / question.markSchemePoints.length) * 100} className="mt-4" />
          <p className="mt-3 text-sm text-slate-600">
            Confidence {confidence}/5 · Current answer length {writtenAnswer.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </Card>
      </section>

      <Card className="bg-[#f7f3ed]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Related follow-up questions</h2>
          <Link href="/question-bank" className="text-sm text-[#2f69b5]">
            Back to bank
          </Link>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {relatedQuestions.map((item) => (
            <Link key={item.id} href={`/question-bank/${item.id}`} className="block rounded-2xl border border-[#ddd5ca] bg-white/75 p-4">
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600">{item.prompt}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
