"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlarmClock, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/app-state-provider";
import { AnswerCheckHistory } from "@/components/features/revision/answer-check-history";
import { AnswerCheckReportView } from "@/components/features/revision/answer-check-report";
import { SharePanel } from "@/components/shared/share-panel";
import {
  EXAM_DURATION_MINUTES,
  EXAM_PACER_LAST_MINUTES_WARNING,
  EXAM_PACER_MILESTONES_MINUTES,
} from "@/lib/constants";
import { getExamQuestionsByPaper } from "@/lib/content";
import { evaluateExamResponse } from "@/lib/evaluation";
import { createExamShare } from "@/lib/share";
import type { AnswerCheckReport, ExamQuestion, PaperId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function defaultQuestionForPaper(paperId: PaperId): ExamQuestion | null {
  const paperQuestions = getExamQuestionsByPaper(paperId);
  return paperQuestions[0] ?? null;
}

function weakTopicsFromReport(question: ExamQuestion, report: AnswerCheckReport, masteryMap: Record<string, number>): string[] {
  const fromMastery = question.topicIds.filter((topicId) => (masteryMap[topicId] ?? 50) < 65);
  const fromScore = report.percentage < 60 ? question.topicIds : [];
  return Array.from(new Set([...fromMastery, ...fromScore]));
}

export default function ExamPage() {
  const { state, submitExamAttempt, saveAnswerCheck } = useAppState();
  const initialQuestion = defaultQuestionForPaper("paper1");

  const [paperId, setPaperId] = useState<PaperId>("paper1");
  const [running, setRunning] = useState(false);
  const [manualFinished, setManualFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_MINUTES * 60);
  const [questionId, setQuestionId] = useState<string | null>(initialQuestion?.id ?? null);
  const [responseText, setResponseText] = useState(
    initialQuestion?.answerType === "coding" ? initialQuestion.codingTask?.starterCode ?? "" : ""
  );
  const [checkReport, setCheckReport] = useState<AnswerCheckReport | null>(null);
  const [resultSaved, setResultSaved] = useState(false);
  const reachedRef = useRef<Set<number>>(new Set());

  const questions = useMemo(() => getExamQuestionsByPaper(paperId), [paperId]);
  const question = useMemo(
    () => questions.find((item) => item.id === questionId) ?? null,
    [questions, questionId]
  );

  const finished = manualFinished || secondsLeft === 0;

  useEffect(() => {
    if (!running || finished) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          toast.error("Time is up. End and score your response.");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running, finished]);

  useEffect(() => {
    const total = EXAM_DURATION_MINUTES * 60;
    const passedMinutes = Math.floor((total - secondsLeft) / 60);

    for (const minute of EXAM_PACER_MILESTONES_MINUTES) {
      if (passedMinutes >= minute && !reachedRef.current.has(minute)) {
        reachedRef.current.add(minute);
        toast.info(`${minute} minutes passed - check progress`);
      }
    }

    if (
      secondsLeft <= EXAM_PACER_LAST_MINUTES_WARNING * 60 &&
      !reachedRef.current.has(-1)
    ) {
      reachedRef.current.add(-1);
      toast.warning(`${EXAM_PACER_LAST_MINUTES_WARNING} minutes left`);
    }
  }, [secondsLeft]);

  const progress = useMemo(() => {
    const total = EXAM_DURATION_MINUTES * 60;
    return ((total - secondsLeft) / total) * 100;
  }, [secondsLeft]);

  const applyQuestionSelection = (nextQuestion: ExamQuestion | null) => {
    setQuestionId(nextQuestion?.id ?? null);
    setResponseText(
      nextQuestion?.answerType === "coding"
        ? nextQuestion.codingTask?.starterCode ?? ""
        : ""
    );
    setCheckReport(null);
    setResultSaved(false);
  };

  const endExam = () => {
    setRunning(false);
    setManualFinished(true);
  };

  const checkResponse = () => {
    if (!question) {
      return;
    }

    if (!responseText.trim()) {
      toast.error("Write an answer first.");
      return;
    }

    const report = evaluateExamResponse(question, responseText);
    setCheckReport(report);
    setResultSaved(false);
    saveAnswerCheck(report);
    toast.success("Answer checked and saved to history.");
  };

  const saveExamResult = () => {
    if (!question || !checkReport) {
      toast.error("Run answer check first.");
      return;
    }

    const masteryMap = Object.fromEntries(
      Object.entries(state.topicProgress).map(([topicId, topic]) => [topicId, topic.mastery])
    );

    const weakTopics = weakTopicsFromReport(question, checkReport, masteryMap);

    submitExamAttempt({
      paperId,
      score: checkReport.percentage,
      durationMinutes: Math.ceil((EXAM_DURATION_MINUTES * 60 - secondsLeft) / 60),
      topicIds: question.topicIds,
      weakTopics,
    });

    setResultSaved(true);
    toast.success("Exam result saved.");
  };

  const shareSummary = useMemo(() => {
    const score = checkReport?.percentage ?? 0;
    const weakTopics = question
      ? question.topicIds.filter((topicId) => (state.topicProgress[topicId]?.mastery ?? 50) < 65)
      : [];

    return createExamShare(state, paperId === "paper1" ? "Paper 1" : "Paper 2", score, weakTopics);
  }, [state, paperId, checkReport?.percentage, question]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl">Exam mode</CardTitle>
          <CardDescription>2h 15m timer, minimal UI, no hints while writing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Paper</p>
              <Select
                value={paperId}
                onValueChange={(value) => {
                  const nextPaper = value as PaperId;
                  setPaperId(nextPaper);
                  applyQuestionSelection(defaultQuestionForPaper(nextPaper));
                  setManualFinished(false);
                  setSecondsLeft(EXAM_DURATION_MINUTES * 60);
                  setRunning(false);
                  reachedRef.current = new Set();
                }}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper1">Paper 1</SelectItem>
                  <SelectItem value="paper2">Paper 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Question</p>
              <Select
                value={question?.id ?? ""}
                onValueChange={(value) => {
                  const nextQuestion = questions.find((item) => item.id === value) ?? null;
                  applyQuestionSelection(nextQuestion);
                }}
                disabled={running || !questions.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose question" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ({item.answerType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!running && !finished ? (
              <Button onClick={() => setRunning(true)}>
                <AlarmClock className="size-4" />
                Start exam timer
              </Button>
            ) : null}
            {running ? (
              <Button variant="destructive" onClick={endExam}>End exam</Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Timer</p>
              <p className="inline-flex items-center gap-1 text-2xl font-semibold tabular-nums">
                <Timer className="size-5" />
                {formatClock(secondsLeft)}
              </p>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {question ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>{question.title}</CardTitle>
            <CardDescription>{question.scenario}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">Task: {question.task}</p>
            <Textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder={question.answerType === "coding" ? "Write your JavaScript solution..." : "Write your exam response..."}
              rows={14}
              className={question.answerType === "coding" ? "font-mono" : ""}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70">
          <CardContent className="p-4 text-sm text-muted-foreground">No exam questions configured for this paper.</CardContent>
        </Card>
      )}

      {finished && question ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Exam report</CardTitle>
            <CardDescription>
              Run local check (rubric/coding tests), then save result. No AI is used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkResponse}>Check response now</Button>

            {checkReport ? <AnswerCheckReportView report={checkReport} /> : null}

            {checkReport && !resultSaved ? (
              <Button onClick={saveExamResult}>Save exam result</Button>
            ) : null}

            {resultSaved && checkReport ? (
              <div className="space-y-3">
                <pre className="rounded-xl border border-border/70 bg-secondary/35 p-4 text-xs whitespace-pre-wrap">
                  {shareSummary}
                </pre>
                <SharePanel summary={shareSummary} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AnswerCheckHistory items={state.answerCheckHistory} />
    </div>
  );
}
