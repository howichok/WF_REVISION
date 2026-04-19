"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/app-state-provider";
import { AnswerCheckHistory } from "@/components/features/revision/answer-check-history";
import { AnswerCheckReportView } from "@/components/features/revision/answer-check-report";
import { SharePanel } from "@/components/shared/share-panel";
import { flashcards, getExamQuestionsByPaper, getQuizByTopic } from "@/lib/content";
import { evaluateExamResponse } from "@/lib/evaluation";
import { createDailyShare } from "@/lib/share";
import { isoDayKey } from "@/lib/storage/client-store";
import type { AnswerCheckReport, PaperId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function isDue(dueDate?: string): boolean {
  if (!dueDate) {
    return true;
  }
  return new Date(dueDate) <= new Date();
}

export default function RevisionPage() {
  const {
    state,
    plan,
    reviewFlashcard,
    submitQuizAttempt,
    submitExamAttempt,
    addMinutes,
    getDayNumber,
    saveAnswerCheck,
  } = useAppState();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [showBack, setShowBack] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [examQuestionId, setExamQuestionId] = useState<string | null>(null);
  const [examAnswersByQuestion, setExamAnswersByQuestion] = useState<Record<string, string>>({});
  const [examReportsByQuestion, setExamReportsByQuestion] = useState<Record<string, AnswerCheckReport>>({});
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [sessionLogged, setSessionLogged] = useState(false);
  const sessionStartRef = useRef<number>(0);

  const dueCards = useMemo(
    () =>
      flashcards.filter((card) => {
        const progress = state.flashcardProgress[card.id];
        return isDue(progress?.dueDate);
      }),
    [state.flashcardProgress]
  );

  const weakTopicIds = useMemo(
    () => plan.workloads.slice(0, 2).map((topic) => topic.topicId),
    [plan.workloads]
  );

  const revisionQuiz = useMemo(
    () =>
      weakTopicIds
        .flatMap((topicId) => getQuizByTopic(topicId, true).slice(0, 3))
        .slice(0, 6),
    [weakTopicIds]
  );

  const focusPaper: PaperId = plan.phase === "between-papers" ? "paper2" : "paper1";
  const focusPaperQuestions = useMemo(() => getExamQuestionsByPaper(focusPaper), [focusPaper]);

  const activeExamQuestionId = useMemo(() => {
    if (examQuestionId && focusPaperQuestions.some((question) => question.id === examQuestionId)) {
      return examQuestionId;
    }
    return focusPaperQuestions[0]?.id ?? null;
  }, [examQuestionId, focusPaperQuestions]);

  const examTask = useMemo(
    () => focusPaperQuestions.find((question) => question.id === activeExamQuestionId) ?? null,
    [focusPaperQuestions, activeExamQuestionId]
  );

  const examAnswer = useMemo(() => {
    if (!examTask || !activeExamQuestionId) {
      return "";
    }

    const saved = examAnswersByQuestion[activeExamQuestionId];
    if (saved !== undefined) {
      return saved;
    }

    return examTask.answerType === "coding"
      ? examTask.codingTask?.starterCode ?? ""
      : "";
  }, [examTask, activeExamQuestionId, examAnswersByQuestion]);

  const examCheckReport = activeExamQuestionId
    ? examReportsByQuestion[activeExamQuestionId] ?? null
    : null;

  useEffect(() => {
    sessionStartRef.current = Date.now();
    const interval = window.setInterval(() => {
      const diffMs = Date.now() - sessionStartRef.current;
      setElapsedMinutes(Math.max(1, Math.floor(diffMs / (60 * 1000))));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const currentCard = dueCards[cardIndex] ?? null;
  const currentQuizQuestion = revisionQuiz[quizIndex] ?? null;

  const finishCards = () => {
    setStep(1);
  };

  const handleCardReview = (remembered: boolean) => {
    if (!currentCard) {
      finishCards();
      return;
    }

    reviewFlashcard(currentCard.id, remembered);
    setShowBack(false);

    const nextIndex = cardIndex + 1;
    if (nextIndex >= dueCards.length) {
      finishCards();
      return;
    }

    setCardIndex(nextIndex);
  };

  const submitMiniQuiz = () => {
    if (revisionQuiz.length === 0) {
      setQuizSubmitted(true);
      setStep(2);
      return;
    }

    const correct = revisionQuiz.filter(
      (question) => quizAnswers[question.id] === question.correctIndex
    ).length;
    const score = Math.round((correct / revisionQuiz.length) * 100);

    const topicStats = weakTopicIds.map((topicId) => {
      const topicQuestions = revisionQuiz.filter((question) => question.topicId === topicId);
      const topicCorrect = topicQuestions.filter(
        (question) => quizAnswers[question.id] === question.correctIndex
      ).length;

      return {
        topicId,
        correct: topicCorrect,
        total: topicQuestions.length,
      };
    });

    submitQuizAttempt({
      mode: "revision",
      paperId: focusPaper,
      score,
      durationMinutes: 12,
      topicStats,
    });

    setQuizSubmitted(true);
    setStep(2);
  };

  const updateExamAnswer = (value: string) => {
    if (!activeExamQuestionId) {
      return;
    }

    setExamAnswersByQuestion((previous) => ({
      ...previous,
      [activeExamQuestionId]: value,
    }));
  };

  const checkExamAnswer = () => {
    if (!examTask || !activeExamQuestionId) {
      return;
    }

    if (!examAnswer.trim()) {
      toast.error("Write an answer first.");
      return;
    }

    const report = evaluateExamResponse(examTask, examAnswer);
    setExamReportsByQuestion((previous) => ({
      ...previous,
      [activeExamQuestionId]: report,
    }));
    saveAnswerCheck(report);
    toast.success("Checked and saved to history.");
  };

  const submitExamStyle = () => {
    if (!examTask || !examCheckReport) {
      toast.error("Check your answer before finishing the session.");
      return;
    }

    const weakTopics = examTask.topicIds.filter((topicId) => {
      const mastery = state.topicProgress[topicId]?.mastery ?? 50;
      return mastery < 65 || examCheckReport.percentage < 60;
    });

    submitExamAttempt({
      paperId: examTask.paperId,
      score: examCheckReport.percentage,
      durationMinutes: Math.max(20, Math.min(45, elapsedMinutes)),
      topicIds: examTask.topicIds,
      weakTopics,
    });

    if (!sessionLogged) {
      addMinutes(elapsedMinutes);
      setSessionLogged(true);
    }

    setStep(3);
  };

  const shareSummary = useMemo(
    () => createDailyShare(state, getDayNumber(), state.dailyMinutes[isoDayKey()] ?? 0),
    [state, getDayNumber]
  );

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">Revision mode</CardTitle>
              <CardDescription>Today session: Cards to mini-quiz to exam-style prompt.</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Clock className="mr-1 size-4" /> {elapsedMinutes}m this session
            </Badge>
          </div>
          <Progress value={(step / 3) * 100} />
        </CardHeader>
      </Card>

      {step === 0 ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>1) Flashcards (Leitner)</CardTitle>
            <CardDescription>{dueCards.length} card(s) due today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCard ? (
              <>
                <div className="rounded-xl border border-border/70 p-5">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{currentCard.term}</p>
                  <p className="text-lg font-medium">{currentCard.prompt}</p>
                  {showBack ? (
                    <p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground">
                      {currentCard.answer}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setShowBack((prev) => !prev)}>
                    {showBack ? "Hide answer" : "Show answer"}
                  </Button>
                  <Button variant="outline" onClick={() => handleCardReview(false)}>
                    Again
                  </Button>
                  <Button onClick={() => handleCardReview(true)}>
                    Remembered
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                <p>No cards due. Nice spacing.</p>
                <Button onClick={finishCards}>Continue to mini-quiz</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>2) Mini-quiz (weak topics)</CardTitle>
            <CardDescription>{revisionQuiz.length} quick checks from your weakest areas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuizQuestion ? (
              <div className="space-y-3 rounded-xl border border-border/70 p-4">
                <p className="text-sm text-muted-foreground">Question {quizIndex + 1} / {revisionQuiz.length}</p>
                <p className="font-medium">{currentQuizQuestion.prompt}</p>
                <div className="space-y-2">
                  {currentQuizQuestion.options.map((option, optionIndex) => (
                    <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-accent">
                      <input
                        type="radio"
                        name={currentQuizQuestion.id}
                        checked={quizAnswers[currentQuizQuestion.id] === optionIndex}
                        onChange={() =>
                          setQuizAnswers((previous) => ({
                            ...previous,
                            [currentQuizQuestion.id]: optionIndex,
                          }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setQuizIndex((prev) => Math.max(0, prev - 1))}
                    disabled={quizIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setQuizIndex((prev) => Math.min(revisionQuiz.length - 1, prev + 1))}
                    disabled={quizIndex >= revisionQuiz.length - 1}
                  >
                    Next
                  </Button>
                  <Button
                    onClick={submitMiniQuiz}
                    disabled={Object.keys(quizAnswers).length < revisionQuiz.length}
                  >
                    Submit mini-quiz
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={submitMiniQuiz}>Skip quiz and continue</Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>3) Exam-style question</CardTitle>
            <CardDescription>
              Local rubric/coding check. No AI interpretation, only configured rubric and tests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Question set ({focusPaper.toUpperCase()})</Label>
                <Select value={activeExamQuestionId ?? ""} onValueChange={setExamQuestionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose question" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusPaperQuestions.map((question) => (
                      <SelectItem key={question.id} value={question.id}>
                        {question.title} ({question.answerType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {examTask ? (
              <>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-sm text-muted-foreground">{examTask.title}</p>
                  <p className="mt-2 text-sm">{examTask.scenario}</p>
                  <p className="mt-2 text-sm font-medium">Task: {examTask.task}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-answer">Your response</Label>
                  <Textarea
                    id="exam-answer"
                    value={examAnswer}
                    onChange={(event) => updateExamAnswer(event.target.value)}
                    rows={10}
                    className={examTask.answerType === "coding" ? "font-mono" : ""}
                    placeholder={examTask.answerType === "coding" ? "Write JavaScript solution..." : "Write your answer..."}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={checkExamAnswer}>Check answer</Button>
                  <Button variant="outline" onClick={submitExamStyle} disabled={!examCheckReport}>
                    Finish today&apos;s session
                  </Button>
                </div>
                {examCheckReport ? <AnswerCheckReportView report={examCheckReport} /> : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No exam-style question configured for this paper.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-2xl">
              <CheckCircle2 className="size-6 text-emerald-600" />
              Session complete
            </CardTitle>
            <CardDescription>Share your progress or restart a focused cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-auto rounded-xl border border-border/70 bg-secondary/35 p-4 text-xs leading-relaxed whitespace-pre-wrap">
              {shareSummary}
            </pre>
            <SharePanel summary={shareSummary} />
            <Button
              variant="outline"
              onClick={() => {
                setStep(0);
                setCardIndex(0);
                setShowBack(false);
                setQuizIndex(0);
                setQuizAnswers({});
                setQuizSubmitted(false);
                setSessionLogged(false);
                sessionStartRef.current = Date.now();
                setElapsedMinutes(0);
              }}
            >
              <RotateCcw className="size-4" />
              Restart flow
            </Button>
            {quizSubmitted ? (
              <Badge variant="secondary" className="inline-flex items-center gap-1">
                <Sparkles className="size-3.5" />
                Mini-quiz updated mastery and weak-topic stats.
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AnswerCheckHistory items={state.answerCheckHistory} limit={4} />
    </div>
  );
}
