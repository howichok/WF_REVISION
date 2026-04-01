"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CircleX, Play } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { ReportDialog } from "@/components/shared/report-dialog";
import { getQuizByPaper, getQuizByTopic, papers } from "@/lib/content";
import type { QuizQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function QuizPage() {
  const searchParams = useSearchParams();
  const initialPaperId: "paper1" | "paper2" = searchParams.get("paper") === "paper2" ? "paper2" : "paper1";
  const requestedTopicId = searchParams.get("topic");
  const requestedCount = Number(searchParams.get("count") ?? "8");
  const initialQuestionCount = Number.isFinite(requestedCount)
    ? Math.max(3, Math.min(20, requestedCount))
    : 8;
  const initialTopicExists = requestedTopicId
    ? (papers.find((paper) => paper.id === initialPaperId)?.topics ?? []).some((topic) => topic.id === requestedTopicId)
    : false;
  const initialTopicId = initialTopicExists && requestedTopicId ? requestedTopicId : "all";
  const shouldAutoStart = searchParams.get("autostart") === "1";

  const initialQuestions =
    shouldAutoStart
      ? (
          initialTopicId === "all"
            ? getQuizByPaper(initialPaperId)
            : getQuizByTopic(initialTopicId).filter((question) => question.paperId === initialPaperId)
        ).slice(0, Math.max(1, Math.min(20, initialQuestionCount)))
      : [];

  const { submitQuizAttempt } = useAppState();
  const [paperId, setPaperId] = useState<"paper1" | "paper2">(initialPaperId);
  const [topicId, setTopicId] = useState<string>(initialTopicId);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const topicsForPaper = useMemo(
    () => papers.find((paper) => paper.id === paperId)?.topics ?? [],
    [paperId]
  );

  const startQuizWith = (nextPaperId: "paper1" | "paper2", nextTopicId: string, nextQuestionCount: number) => {
    const filtered =
      nextTopicId === "all"
        ? getQuizByPaper(nextPaperId)
        : getQuizByTopic(nextTopicId).filter((question) => question.paperId === nextPaperId);

    const selected = filtered.slice(0, Math.max(1, Math.min(20, nextQuestionCount)));
    setActiveQuestions(selected);
    setAnswers({});
    setSubmitted(false);
  };

  const startQuiz = () => {
    startQuizWith(paperId, topicId, questionCount);
  };

  const score = useMemo(() => {
    if (!submitted || activeQuestions.length === 0) {
      return 0;
    }

    const correct = activeQuestions.filter(
      (question) => answers[question.id] === question.correctIndex
    ).length;

    return Math.round((correct / activeQuestions.length) * 100);
  }, [submitted, activeQuestions, answers]);

  const weakTopicStats = useMemo(() => {
    if (!submitted || activeQuestions.length === 0) {
      return [];
    }

    const map = new Map<string, { correct: number; total: number }>();
    for (const question of activeQuestions) {
      const current = map.get(question.topicId) ?? { correct: 0, total: 0 };
      current.total += 1;
      if (answers[question.id] === question.correctIndex) {
        current.correct += 1;
      }
      map.set(question.topicId, current);
    }

    return Array.from(map.entries())
      .map(([topicKey, stat]) => ({
        topicId: topicKey,
        correct: stat.correct,
        total: stat.total,
        percent: Math.round((stat.correct / stat.total) * 100),
      }))
      .sort((a, b) => a.percent - b.percent);
  }, [submitted, activeQuestions, answers]);

  const submitQuiz = () => {
    if (activeQuestions.length === 0) {
      return;
    }

    const topicStats = weakTopicStats.map((topic) => ({
      topicId: topic.topicId,
      correct: topic.correct,
      total: topic.total,
    }));

    submitQuizAttempt({
      mode: "quiz",
      paperId,
      score,
      durationMinutes: Math.max(10, Math.round(activeQuestions.length * 1.5)),
      topicStats,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz mode</CardTitle>
          <CardDescription>Choose paper/topic/size, then review mistakes with explanations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Paper</Label>
            <Select value={paperId} onValueChange={(value) => { setPaperId(value as "paper1" | "paper2"); setTopicId("all"); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paper1">Paper 1</SelectItem>
                <SelectItem value="paper2">Paper 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topicsForPaper.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="question-count">Questions</Label>
            <Input
              id="question-count"
              type="number"
              min={3}
              max={20}
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value) || 8)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={startQuiz} className="w-full">
              <Play className="size-4" />
              Start quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeQuestions.length > 0 ? (
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Questions</CardTitle>
              <Badge variant="outline">{activeQuestions.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeQuestions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctIndex;

              return (
                <div key={question.id} className="space-y-2 rounded-lg border border-border/70 p-4">
                  <p className="text-sm font-medium">{index + 1}. {question.prompt}</p>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const checked = userAnswer === optionIndex;
                      const markCorrect = submitted && optionIndex === question.correctIndex;
                      const markWrong = submitted && checked && !isCorrect;

                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${markCorrect ? "border-emerald-500 bg-emerald-500/10" : "border-border/70"} ${markWrong ? "border-destructive bg-destructive/10" : ""}`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            checked={checked}
                            onChange={() =>
                              setAnswers((previous) => ({
                                ...previous,
                                [question.id]: optionIndex,
                              }))
                            }
                            disabled={submitted}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  {submitted ? (
                    <p className="text-xs text-muted-foreground">Explanation: {question.explanation}</p>
                  ) : null}
                </div>
              );
            })}

            {!submitted ? (
              <Button
                onClick={() => setSubmitted(true)}
                disabled={Object.keys(answers).length < activeQuestions.length}
              >
                Check answers
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <p className="text-xl font-semibold">Score: {score}%</p>
                <p className="text-sm text-muted-foreground">Weak topics are recalculated from this attempt.</p>
                <Button onClick={submitQuiz}>Save results to stats</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {submitted && weakTopicStats.length > 0 ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Weak topic stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakTopicStats.map((topic) => (
              <div key={topic.topicId} className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm">
                <span>{topic.topicId}</span>
                <span className="inline-flex items-center gap-1">
                  {topic.percent >= 60 ? <Check className="size-4 text-emerald-600" /> : <CircleX className="size-4 text-destructive" />}
                  {topic.percent}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <ReportDialog contextLabel="Quiz" />
      </div>
    </div>
  );
}
