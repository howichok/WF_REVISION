"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { ActiveLearningLayout } from "@/components/features/revision/active-learning/active-learning-layout";
import { buildLinearRailItems } from "@/components/features/revision/active-learning/rail-builders";
import { TaskContextStrip } from "@/components/features/revision/active-learning/task-context-strip";
import { TaskFeedbackPanel } from "@/components/features/revision/active-learning/task-feedback-panel";
import { TaskPanel } from "@/components/features/revision/active-learning/task-panel";
import { TaskResponsePanel } from "@/components/features/revision/active-learning/task-response-panel";
import { useAppData } from "@/components/providers/app-data-provider";
import { useAiOverlay } from "@/components/providers/ai-overlay-provider";
import { TopicNextSteps } from "@/components/features/revision/topic-next-steps";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { extractCommandWord } from "@/lib/command-words";
import { getTopicCoverageGraph } from "@/lib/content";
import { consumeSseStream } from "@/lib/intelligence/client-sse";
import {
  getPracticeQuestionForTopic,
  getPracticeQuestionsForTopic,
} from "@/lib/intelligence/catalog";
import {
  clearInsertedCueEdits,
  pushRevisionEditEntry,
  undoLastRevisionEdit,
  type RevisionEditHistoryEntry,
} from "@/lib/intelligence/revision-edit-history";
import {
  canAcceptMicroRewrite,
  countInsertedCueTokens,
} from "@/lib/intelligence/revision-improve-guards";
import { getAnswerCheckNextStepRecommendations } from "@/lib/topic-progression";
import type {
  IntelligenceStreamChunkPayload,
  IntelligenceStreamErrorPayload,
  IntelligenceStreamPredictionPayload,
  IntelligenceStreamStatusPayload,
} from "@/lib/intelligence/streaming";
import type { RevisionAnswerEvaluation } from "@/lib/intelligence/types";
import type {
  RevisionImprovementChange,
  RevisionImprovementOutputMode,
  RevisionImprovementResponse,
  RevisionImprovementSpan,
} from "@/lib/intelligence/types";

interface WrittenAnswerCheckerProps {
  topicId: string;
  topicLabel: string;
  topicIcon?: string;
  preferredQuestionId?: string;
}

function getScoreTone(scorePercent: number) {
  if (scorePercent >= 70) {
    return "success" as const;
  }

  if (scorePercent >= 40) {
    return "warning" as const;
  }

  return "danger" as const;
}

function softenHint(value: string) {
  const cleaned = value
    .replace(/^(Explain|Describe|Discuss|Evaluate|Identify|State|Show|Link|Use)\s+(that\s+)?/i, "")
    .replace(/\.$/, "")
    .trim();

  if (!cleaned) {
    return value.trim();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function renderHighlightedPreview(
  answer: string,
  spans: RevisionImprovementSpan[]
) {
  if (!answer) {
    return null;
  }

  if (spans.length === 0) {
    return <span>{answer}</span>;
  }

  const sorted = [...spans].sort((left, right) => left.start - right.start);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const span of sorted) {
    if (span.start > cursor) {
      nodes.push(
        <span key={`plain-${cursor}`}>{answer.slice(cursor, span.start)}</span>
      );
    }

    nodes.push(
      <mark
        key={span.id}
        title={`${span.reason}${span.replacementHint ? ` ${span.replacementHint}` : ""}`}
        className={
          span.severity === "high"
            ? "rounded-md bg-danger/20 px-1 py-0.5 text-foreground underline decoration-danger/80 decoration-2 underline-offset-4"
            : "rounded-md bg-warning/20 px-1 py-0.5 text-foreground underline decoration-warning/80 decoration-2 underline-offset-4"
        }
      >
        {answer.slice(span.start, span.end)}
      </mark>
    );

    cursor = span.end;
  }

  if (cursor < answer.length) {
    nodes.push(<span key={`plain-tail-${cursor}`}>{answer.slice(cursor)}</span>);
  }

  return nodes;
}

function buildCueToken(prefix: string, value: string) {
  return `[${prefix}: ${value.trim()}]`;
}

function shortenCueText(value: string, maxLength = 64) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function uniqueCueItems(items: Array<string | null | undefined>, limit = 3) {
  return Array.from(
    new Set(
      items
        .map((item) => item?.replace(/\s+/g, " ").trim())
        .filter((item): item is string => Boolean(item))
    )
  ).slice(0, limit);
}

function buildImprovementPrecisionCueItems(
  improvement: RevisionImprovementResponse
) {
  return uniqueCueItems(
    [
      ...improvement.changes.flatMap((change) => {
        if (change.kind === "replace" && change.targetText && change.microRewriteText) {
          return [`Swap "${shortenCueText(change.targetText, 24)}" for "${change.microRewriteText}".`];
        }

        if (change.kind === "replace" && change.targetText) {
          return [
            `Tighten "${shortenCueText(change.targetText, 24)}": ${shortenCueText(change.replacementText, 68)}`,
          ];
        }

        if (change.kind === "add") {
          return [`Add this missing point: ${shortenCueText(change.replacementText, 68)}`];
        }

        return [];
      }),
      ...improvement.weakSpans.map((span) => span.replacementHint),
    ],
    3
  );
}

function buildImprovementMisconceptionCueItems(
  improvement: RevisionImprovementResponse
) {
  return uniqueCueItems(
    [
      ...improvement.weakSpans
        .filter((span) => span.severity === "high")
        .map((span) => `Avoid this confusion: ${shortenCueText(span.reason, 96)}`),
      ...improvement.commentator
        .filter((item) => /^Fix this confusion:/i.test(item))
        .map((item) => item.replace(/^Fix this confusion:\s*/i, "Avoid this confusion: ")),
    ],
    2
  );
}

export function WrittenAnswerChecker({
  topicId,
  topicLabel,
  topicIcon,
  preferredQuestionId,
}: WrittenAnswerCheckerProps) {
  const overlay = useAiOverlay();
  const { recordAnswerCheckCoaching, revisionProgress, topicCoachingMemory } = useAppData();
  const availableQuestions = useMemo(() => getPracticeQuestionsForTopic(topicId), [topicId]);
  const overlaySurfaceId = useMemo(() => `written-answer-checker-${topicId}`, [topicId]);
  const responseSurfaceRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const undoLastEditRef = useRef<() => void>(() => undefined);
  const clearInsertedCuesRef = useRef<() => void>(() => undefined);
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = useMemo(
    () => getPracticeQuestionForTopic(topicId, questionIndex),
    [topicId, questionIndex]
  );
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<RevisionAnswerEvaluation | null>(null);
  const [improvementResult, setImprovementResult] =
    useState<RevisionImprovementResponse | null>(null);
  const [improvementMode, setImprovementMode] =
    useState<RevisionImprovementOutputMode>("commentator");
  const [isImproving, setIsImproving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [improvementError, setImprovementError] = useState("");
  const [improvementSourceAnswer, setImprovementSourceAnswer] = useState("");
  const [isDirtySinceLastCheck, setIsDirtySinceLastCheck] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [editHistory, setEditHistory] = useState<RevisionEditHistoryEntry[]>([]);
  const [improvementPrecisionCues, setImprovementPrecisionCues] = useState<string[]>([]);
  const [improvementMisconceptionCues, setImprovementMisconceptionCues] = useState<string[]>([]);
  const [evaluationStreamStatus, setEvaluationStreamStatus] = useState("");
  const [evaluationStreamText, setEvaluationStreamText] = useState("");
  const [improvementStreamStatus, setImprovementStreamStatus] = useState("");
  const [improvementStreamText, setImprovementStreamText] = useState("");
  const nextSteps = useMemo(
    () =>
      result
        ? getAnswerCheckNextStepRecommendations({
            topicId,
            questionId: question?.id,
            scorePercent: Math.round((result.score / result.maxScore) * 100),
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          })
        : { primary: null, secondary: null },
    [question?.id, result, revisionProgress, topicCoachingMemory, topicId]
  );
  const currentPointId = useMemo(() => {
    if (!question?.id) {
      return null;
    }

    const graph = getTopicCoverageGraph(topicId);
    return (
      graph?.coverageByPoint.find(
        (node) =>
          node.questionIds.includes(question.id) ||
          node.generatedQuestionIds.includes(question.id) ||
          node.followUpQuestionIds.includes(question.id)
      )?.pointId ?? question.id
    );
  }, [question?.id, topicId]);

  useEffect(() => {
    const preferredIndex = preferredQuestionId
      ? availableQuestions.findIndex((entry) => entry.id === preferredQuestionId)
      : -1;
    setQuestionIndex(preferredIndex >= 0 ? preferredIndex : 0);
  }, [availableQuestions, preferredQuestionId, topicId]);

  useEffect(() => {
    setAnswer("");
    setResult(null);
    setImprovementResult(null);
    setImprovementError("");
    setImprovementSourceAnswer("");
    setError("");
    setIsDirtySinceLastCheck(false);
    setHintLevel(0);
    setEditHistory([]);
    setImprovementPrecisionCues([]);
    setImprovementMisconceptionCues([]);
    setEvaluationStreamStatus("");
    setEvaluationStreamText("");
    setImprovementStreamStatus("");
    setImprovementStreamText("");
  }, [question?.id]);

  const insertedCueCount = useMemo(() => countInsertedCueTokens(answer), [answer]);
  const answerWordCount = useMemo(
    () => answer.trim().split(/\s+/).filter(Boolean).length,
    [answer]
  );

  useEffect(() => {
    if (!question) {
      return;
    }

    overlay.registerRevisionSurface({
      surfaceId: overlaySurfaceId,
      topicId,
      topicLabel,
      modeGroup: "Exam questions",
      modeLabel: "Final written answer",
      prompt: question.prompt,
      anchorRef: responseSurfaceRef,
      scanRef: textareaRef,
      onUndoLastEdit: () => undoLastEditRef.current(),
      onClearInsertedCues: () => clearInsertedCuesRef.current(),
    });

    return () => {
      overlay.unregisterRevisionSurface(overlaySurfaceId);
    };
  }, [overlay, overlaySurfaceId, question, topicId, topicLabel]);

  useEffect(() => {
    if (!question) {
      return;
    }

    overlay.syncRevisionSurface({
      surfaceId: overlaySurfaceId,
      prompt: question.prompt,
      answer,
      canUndoEdits: editHistory.length > 0,
      canClearInsertedCues: insertedCueCount > 0,
    });
  }, [answer, editHistory.length, insertedCueCount, overlay, overlaySurfaceId, question]);

  useEffect(() => {
    overlay.setSurfaceRecommendations({
      surfaceId: overlaySurfaceId,
      primaryAction: nextSteps.primary
        ? {
            label: nextSteps.primary.label,
            href: nextSteps.primary.href,
            kind: nextSteps.primary.actionKind,
          }
        : null,
      secondaryAction: nextSteps.secondary
        ? {
            label: nextSteps.secondary.label,
            href: nextSteps.secondary.href,
            kind: nextSteps.secondary.actionKind,
          }
        : null,
    });
  }, [nextSteps.primary, nextSteps.secondary, overlay, overlaySurfaceId]);

  async function handleEvaluate() {
    if (!question || !answer.trim()) {
      setError("Write a short answer before running the checker.");
      return;
    }

    const submittedAnswer = answer;
    setIsLoading(true);
    setError("");
    setEvaluationStreamStatus("Opening live mark-scheme stream...");
    setEvaluationStreamText("");
    overlay.startRevisionCheck(overlaySurfaceId);

    try {
      const response = await fetch("/api/intelligence/evaluate/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "revision-answer",
          questionId: question.id,
          answer: submittedAnswer,
        }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to evaluate the answer right now.");
      }

      let streamedFeedback = "";

      await consumeSseStream(response, (eventName, payloadText) => {
        if (eventName === "status") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamStatusPayload;
          setEvaluationStreamStatus(payload.message);
          overlay.streamRevisionProgress({
            surfaceId: overlaySurfaceId,
            statusLine: payload.message,
          });
          return;
        }

        if (eventName === "prediction") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamPredictionPayload;
          overlay.setRevisionPrediction({
            surfaceId: overlaySurfaceId,
            ...payload,
          });
          return;
        }

        if (eventName === "chunk") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamChunkPayload;
          streamedFeedback = `${streamedFeedback}${payload.text}`;
          setEvaluationStreamText(streamedFeedback);
          overlay.streamRevisionProgress({
            surfaceId: overlaySurfaceId,
            note: streamedFeedback,
          });
          return;
        }

        if (eventName === "final") {
          const evaluation = JSON.parse(payloadText) as RevisionAnswerEvaluation;
          const scorePercent = Math.round((evaluation.score / evaluation.maxScore) * 100);
          const recommendations = getAnswerCheckNextStepRecommendations({
            topicId,
            questionId: question.id,
            scorePercent,
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          });

          setResult(evaluation);
          setIsDirtySinceLastCheck(false);
          setEvaluationStreamStatus("");
          setEvaluationStreamText("");
          recordAnswerCheckCoaching({
            topicId,
            questionId: question.id,
            pointId: currentPointId,
            scorePercent,
            misconceptionLabels: evaluation.misconceptions,
            recommendedAction: recommendations.primary?.reasonCode ?? null,
            recommendedHref: recommendations.primary?.href ?? null,
          });
          overlay.completeRevisionCheck({
            surfaceId: overlaySurfaceId,
            scorePercent,
            score: evaluation.score,
            maxScore: evaluation.maxScore,
            feedback: evaluation.feedback,
          });
          return;
        }

        if (eventName === "error") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamErrorPayload;
          throw new Error(payload.message ?? "Unable to evaluate the answer right now.");
        }
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to evaluate the answer right now.";

      setError(
        message
      );
      setEvaluationStreamStatus("");
      setEvaluationStreamText("");
      overlay.failRevisionCheck({
        surfaceId: overlaySurfaceId,
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImproveAnswer() {
    if (!question || !answer.trim()) {
      setImprovementError("Write a short answer before asking for an improvement pass.");
      return;
    }

    const submittedAnswer = answer;
    setIsImproving(true);
    setImprovementError("");
    setImprovementStreamStatus("Opening live improvement pass...");
    setImprovementStreamText("");
    setImprovementPrecisionCues([]);
    setImprovementMisconceptionCues([]);
    overlay.startRevisionImprove(overlaySurfaceId);

    try {
      const response = await fetch("/api/intelligence/revision-improve/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "revision-improve",
          questionId: question.id,
          answer: submittedAnswer,
          outputMode: improvementMode,
        }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to improve the answer right now.");
      }

      let streamedImprovement = "";

      await consumeSseStream(response, (eventName, payloadText) => {
        if (eventName === "status") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamStatusPayload;
          setImprovementStreamStatus(payload.message);
          overlay.streamRevisionProgress({
            surfaceId: overlaySurfaceId,
            statusLine: payload.message,
          });
          return;
        }

        if (eventName === "prediction") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamPredictionPayload;
          overlay.setRevisionPrediction({
            surfaceId: overlaySurfaceId,
            ...payload,
          });
          return;
        }

        if (eventName === "chunk") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamChunkPayload;
          streamedImprovement = `${streamedImprovement}${payload.text}`;
          setImprovementStreamText(streamedImprovement);
          overlay.streamRevisionProgress({
            surfaceId: overlaySurfaceId,
            note: streamedImprovement,
          });
          return;
        }

        if (eventName === "section") {
          const payload = JSON.parse(payloadText) as {
            section?: "precisionCues" | "misconceptions";
            items?: string[];
          };
          const nextItems = uniqueCueItems(payload.items ?? [], payload.section === "misconceptions" ? 2 : 3);

          if (payload.section === "precisionCues") {
            setImprovementPrecisionCues(nextItems);
          }

          if (payload.section === "misconceptions") {
            setImprovementMisconceptionCues(nextItems);
          }

          if (nextItems[0]) {
            overlay.streamRevisionProgress({
              surfaceId: overlaySurfaceId,
              note: nextItems[0],
            });
          }
          return;
        }

        if (eventName === "final") {
          const improvement = JSON.parse(payloadText) as RevisionImprovementResponse;

          setImprovementResult(improvement);
          setImprovementPrecisionCues((current) =>
            current.length > 0 ? current : buildImprovementPrecisionCueItems(improvement)
          );
          setImprovementMisconceptionCues((current) =>
            current.length > 0 ? current : buildImprovementMisconceptionCueItems(improvement)
          );
          setImprovementSourceAnswer(submittedAnswer);
          setImprovementStreamStatus("");
          setImprovementStreamText("");
          overlay.completeRevisionImprove({
            surfaceId: overlaySurfaceId,
            outputMode: improvement.outputMode,
            highlightedCount: improvement.weakSpans.length,
            changeCount: improvement.changes.length,
          });
          return;
        }

        if (eventName === "error") {
          const payload = JSON.parse(payloadText) as IntelligenceStreamErrorPayload;
          throw new Error(payload.message ?? "Unable to improve the answer right now.");
        }
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to improve the answer right now.";

      setImprovementError(message);
      setImprovementStreamStatus("");
      setImprovementStreamText("");
      overlay.failRevisionImprove({
        surfaceId: overlaySurfaceId,
        message,
      });
    } finally {
      setIsImproving(false);
    }
  }

  function focusTextarea(cursor: number) {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  function updateAnswerFromMachineEdit(
    nextAnswer: string,
    cursor: number,
    kind: RevisionEditHistoryEntry["kind"]
  ) {
    setEditHistory((current) =>
      pushRevisionEditEntry(current, {
        kind,
        previousAnswer: answer,
        nextAnswer,
      })
    );
    setAnswer(nextAnswer);
    setError("");
    setImprovementError("");
    if (result) {
      setIsDirtySinceLastCheck(true);
    }

    focusTextarea(cursor);
  }

  function updateAnswerFromManualChange(nextAnswer: string) {
    setAnswer(nextAnswer);
    setError("");
    setImprovementError("");
    if (result) {
      setIsDirtySinceLastCheck(true);
    }
  }

  function appendCueToEnd(cue: string) {
    const prefix = answer.trim().endsWith("\n") || !answer.trim() ? "" : "\n";
    const insertion = `${prefix}${cue}`;
    const nextAnswer = `${answer}${insertion}`;
    updateAnswerFromMachineEdit(nextAnswer, nextAnswer.length, "insert-cue");
  }

  function handleInsertChangeCue(change: RevisionImprovementChange) {
    if (isImprovementStale) {
      setImprovementError("Run improvement again before inserting cues into a changed answer.");
      return;
    }

    const cue =
      change.kind === "replace"
        ? buildCueToken("upgrade cue", change.replacementText)
        : buildCueToken("add cue", change.replacementText);

    if (change.kind === "replace" && change.targetText) {
      const targetIndex = answer.indexOf(change.targetText);
      if (targetIndex >= 0) {
        const insertAt = targetIndex + change.targetText.length;
        const insertion = ` ${cue}`;
        const nextAnswer =
          `${answer.slice(0, insertAt)}${insertion}${answer.slice(insertAt)}`;
        updateAnswerFromMachineEdit(nextAnswer, insertAt + insertion.length, "insert-cue");
        return;
      }
    }

    appendCueToEnd(cue);
  }

  function handleInsertSpanCue(span: RevisionImprovementSpan) {
    if (isImprovementStale) {
      setImprovementError("Run improvement again before inserting cues into a changed answer.");
      return;
    }

    const cue = buildCueToken(
      "fix cue",
      span.replacementHint ?? span.reason
    );
    const insertAt = Math.min(span.end, answer.length);
    const insertion = ` ${cue}`;
    const nextAnswer =
      `${answer.slice(0, insertAt)}${insertion}${answer.slice(insertAt)}`;
    updateAnswerFromMachineEdit(nextAnswer, insertAt + insertion.length, "insert-cue");
  }

  function handleAcceptRewrite(change: RevisionImprovementChange) {
    if (isImprovementStale) {
      setImprovementError("Run improvement again before applying a rewrite to a changed answer.");
      return;
    }

    if (!canAcceptMicroRewrite(change)) {
      setImprovementError("This suggestion is not eligible for direct phrase replacement.");
      return;
    }

    const targetText = change.targetText ?? "";
    const rewrite = change.microRewriteText ?? "";
    const targetIndex = answer.indexOf(targetText);

    if (targetIndex < 0) {
      setImprovementError("The target phrase could not be found in the current answer.");
      return;
    }

    const nextAnswer =
      `${answer.slice(0, targetIndex)}${rewrite}${answer.slice(targetIndex + targetText.length)}`;
    updateAnswerFromMachineEdit(nextAnswer, targetIndex + rewrite.length, "rewrite");
  }

  function handleUndoLastEdit() {
    const undone = undoLastRevisionEdit(editHistory);
    if (!undone) {
      return;
    }

    setEditHistory(undone.history);
    setAnswer(undone.answer);
    setError("");
    setImprovementError("");
    if (result) {
      setIsDirtySinceLastCheck(true);
    }
    focusTextarea(undone.answer.length);
  }

  function handleClearInsertedCues() {
    const cleared = clearInsertedCueEdits(answer, editHistory);
    if (!cleared) {
      setImprovementError("No inserted cues were found in the current answer.");
      return;
    }

    setEditHistory(cleared.history);
    setAnswer(cleared.answer);
    setError("");
    setImprovementError("");
    if (result) {
      setIsDirtySinceLastCheck(true);
    }
    focusTextarea(cleared.answer.length);
  }

  function handleLoadAnotherQuestion() {
    if (availableQuestions.length <= 1) {
      return;
    }

    setQuestionIndex((current) => (current + 1) % availableQuestions.length);
  }

  undoLastEditRef.current = handleUndoLastEdit;
  clearInsertedCuesRef.current = handleClearInsertedCues;

  if (!question) {
    return (
      <div className="py-12 text-center">
        <ClipboardList
          size={40}
          className="mx-auto mb-3 text-muted-foreground opacity-50"
        />
        <p className="mb-2 text-sm text-muted-foreground">
          Structured written checks are being prepared for {topicLabel}.
        </p>
        <p className="text-xs text-muted-foreground/70">
          The intelligence engine is ready, but this topic does not have a public practice prompt yet.
        </p>
      </div>
    );
  }

  const scorePercent = result
    ? Math.round((result.score / result.maxScore) * 100)
    : 0;
  const scoreTone = getScoreTone(scorePercent);
  const stageLabel = result ? "Analysis" : "Response";
  const railItems = buildLinearRailItems(
    [
      {
        id: "prompt",
        label: "Prompt",
        description: "Read the written-response question carefully.",
      },
      {
        id: "response",
        label: "Response",
        description: "Write your answer before checking it.",
      },
      {
        id: "analysis",
        label: "Analysis",
        description: "Review your score, gaps, and misconceptions.",
      },
    ],
    result ? "analysis" : "response",
    result ? ["prompt", "response"] : ["prompt"]
  );

  const railSummary = result
    ? [
        { label: "Marks", value: `${result.score}/${result.maxScore}` },
        {
          label: "Confidence",
          value: `${Math.round(result.confidence * 100)}%`,
          tone: "accent" as const,
        },
        {
          label: "Coverage",
          value: `${result.matchedConcepts.length}/${result.conceptBreakdown.length}`,
          tone: scoreTone,
        },
      ]
    : [{ label: "Marks", value: `${question.maxScore}` }];

  const feedbackTone = result
    ? isDirtySinceLastCheck
      ? "warning"
      : scoreTone
    : "analysis";
  const commandWord = extractCommandWord(question.prompt);
  const hintBullets = [
    commandWord
      ? `Start with the command word: ${commandWord.guidance}`
      : "Start with a direct point, then explain it and link it to the scenario.",
    ...question.rubricSummary.map((line) => `Cover this area: ${softenHint(line)}.`),
    "Finish with a consequence, example, or impact sentence so the answer feels applied rather than generic.",
  ];
  const visibleHints = hintBullets.slice(0, Math.min(hintBullets.length, hintLevel));
  const hasMoreHints = hintLevel < hintBullets.length;
  const isImprovementStale =
    Boolean(improvementResult) && improvementSourceAnswer !== answer;
  const previewAnswer = isImprovementStale ? improvementSourceAnswer : answer;
  const visibleImprovementPrecisionCues =
    improvementPrecisionCues.length > 0
      ? improvementPrecisionCues
      : improvementResult
        ? buildImprovementPrecisionCueItems(improvementResult)
        : [];
  const visibleImprovementMisconceptionCues =
    improvementMisconceptionCues.length > 0
      ? improvementMisconceptionCues
      : improvementResult
        ? buildImprovementMisconceptionCueItems(improvementResult)
        : [];
  const visibleImprovementFocusItems = improvementResult
    ? uniqueCueItems(
        [
          ...visibleImprovementPrecisionCues,
          ...visibleImprovementMisconceptionCues,
          ...improvementResult.commentator,
        ],
        4
      )
    : [];
  const primaryImprovementChanges = improvementResult?.changes.slice(0, 3) ?? [];

  useEffect(() => {
    const shouldSuppressOverlay = Boolean(improvementResult) && !isImproving;
    overlay.setOverlaySuppressed(shouldSuppressOverlay);

    return () => {
      overlay.setOverlaySuppressed(false);
    };
  }, [improvementResult, isImproving, overlay]);

  return (
    <ActiveLearningLayout
      backHref={`/revision/${topicId}/practice`}
      railTitle={`${topicLabel} exam questions`}
      railSubtitle="Plan the wording in your head, write one fuller response, then let the deterministic checker mark it."
      railIcon={
        <span className="flex items-center gap-2 text-foreground">
          {topicIcon ? <span className="text-lg leading-none">{topicIcon}</span> : null}
          <BrainCircuit size={18} className="text-accent" />
        </span>
      }
      railItems={railItems}
      railSummary={railSummary}
      mobileSummaryLabel="Exam questions"
      contextStrip={
        <TaskContextStrip
          eyebrow="Exam questions"
          breadcrumb={
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
              {topicIcon ? <span>{topicIcon}</span> : null}
              <span>{topicLabel}</span>
              {question.subtopicId ? (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-muted">{question.subtopicId}</span>
                </>
              ) : null}
            </div>
          }
          meta="This is the full written-response route. Use it when you want proper rubric-style checking, not just a quick Q/A pass."
          status={
            <span className="tabular-nums text-xs font-medium uppercase tracking-[0.18em] text-muted">
              {stageLabel}
            </span>
          }
        >
          <div className="flex flex-wrap gap-2">
            {availableQuestions.length > 1 ? (
              <Badge variant="default">
                Prompt {questionIndex + 1} of {availableQuestions.length}
              </Badge>
            ) : null}
            <Badge variant="accent">{question.maxScore} marks</Badge>
            <Badge variant="default">Final written answer</Badge>
          </div>
        </TaskContextStrip>
      }
      task={
        (
          <TaskPanel
            title={question.prompt}
            subtitle="Write one fuller exam-style answer. The checker looks for key ideas, explanation quality, and how well you link them to the scenario."
            commandWord={commandWord}
          />
        )
      }
      response={
        (() => {
          const placeholder = commandWord
            ? `Write your ${commandWord.word.toLowerCase()} response here. Mention the concept, ${commandWord.guidance.charAt(0).toLowerCase()}${commandWord.guidance.slice(1)}`
            : "Write a short structured answer. Mention the concept, explain it, and link it to the scenario.";
          return (
            <TaskResponsePanel
              label="Your response"
              description="Type the full response first, then run the checker to see marks, matched ideas, missing concepts, and misconceptions."
            >
              <div ref={responseSurfaceRef} className="space-y-3">
                {commandWord ? (
                  <p className="text-xs text-muted-foreground">
                    This question asks you to{" "}
                    <span className="font-medium text-accent">
                      {commandWord.word.toLowerCase()}
                    </span>
                    . {commandWord.guidance.charAt(0).toLowerCase()}
                    {commandWord.guidance.slice(1)}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setHintLevel((current) =>
                        current < hintBullets.length ? current + 1 : current
                      )
                    }
                    disabled={!hasMoreHints}
                  >
                    <Lightbulb size={14} />
                    {hintLevel === 0
                      ? "Need a hint?"
                      : hasMoreHints
                        ? "Show a stronger hint"
                        : "All hints shown"}
                  </Button>
                  {hintLevel > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setHintLevel(0)}
                    >
                      Hide hints
                    </Button>
                  ) : null}
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={improvementMode === "commentator" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setImprovementMode("commentator")}
                    >
                      Commentator
                    </Button>
                    <Button
                      type="button"
                      variant={improvementMode === "diff" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setImprovementMode("diff")}
                    >
                      Diff hints
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleImproveAnswer()}
                      isLoading={isImproving}
                    >
                      <Sparkles size={14} />
                      Improve this answer
                    </Button>
                  </div>
                </div>
                {visibleHints.length > 0 ? (
                  <div className="rounded-3xl border border-warning/20 bg-warning/5 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
                      <Lightbulb size={12} />
                      Scaffold only
                    </div>
                    <div className="mt-3 space-y-2">
                      {visibleHints.map((hint) => (
                        <p
                          key={`${question.id}-${hint}`}
                          className="rounded-2xl border border-warning/15 bg-background/30 px-3 py-3 text-sm text-foreground/90"
                        >
                          {hint}
                        </p>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      These hints are designed to nudge your structure and coverage, not give you a ready-made answer.
                    </p>
                  </div>
                ) : null}
                <textarea
                  ref={textareaRef}
                  id={`written-answer-${question.id}`}
                  value={answer}
                  onChange={(event) => {
                    updateAnswerFromManualChange(event.target.value);
                  }}
                  rows={8}
                  placeholder={placeholder}
                  className="min-h-[220px] w-full rounded-3xl border border-border bg-surface/40 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />

              <div className="flex flex-col gap-2 text-xs">
              {error ? (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              ) : improvementError ? (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle size={14} className="shrink-0" />
                  {improvementError}
                </div>
              ) : isDirtySinceLastCheck ? (
                <p className="text-warning">
                  Your answer changed after the last check. Run it again to refresh the analysis.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  The current engine is local-first and explainable. Gemini can polish wording, but it does not write the full answer for you.
                </p>
              )}
              <p className="text-muted-foreground/70">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </p>
              <div className="flex flex-wrap gap-2">
                {editHistory.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleUndoLastEdit}
                  >
                    Undo last edit
                  </Button>
                ) : null}
                {insertedCueCount > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleClearInsertedCues}
                  >
                    Clear inserted cues
                  </Button>
                ) : null}
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-accent/20 bg-accent/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                      Live mark-scheme stream
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {evaluationStreamStatus || "Scanning the current answer..."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                    </span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-accent/80" />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-accent/60"
                      style={{ animationDelay: "140ms" }}
                    />
                  </div>
                </div>
                {evaluationStreamText ? (
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                    {evaluationStreamText}
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-accent align-middle" />
                  </p>
                ) : null}
              </div>
            ) : null}

            {isImproving ? (
              <div className="rounded-3xl border border-accent/20 bg-accent/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                      Live improvement pass
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {improvementStreamStatus || "Finding upgrade spots..."}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                    Live
                  </div>
                </div>
                {improvementStreamText ? (
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                    {improvementStreamText}
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-accent align-middle" />
                  </p>
                ) : null}
                {improvementPrecisionCues.length > 0 || improvementMisconceptionCues.length > 0 ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {improvementPrecisionCues.length > 0 ? (
                      <div className="rounded-2xl border border-accent/20 bg-accent/8 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                          <Lightbulb size={12} />
                          Live precision cues
                        </div>
                        <div className="mt-3 space-y-2">
                          {improvementPrecisionCues.map((item) => (
                            <p key={item} className="text-sm text-foreground/90">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {improvementMisconceptionCues.length > 0 ? (
                      <div className="rounded-2xl border border-warning/20 bg-warning/8 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">
                          <AlertCircle size={12} />
                          Live confusion check
                        </div>
                        <div className="mt-3 space-y-2">
                          {improvementMisconceptionCues.map((item) => (
                            <p key={item} className="text-sm text-foreground/90">
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {improvementResult ? (
              <div className="rounded-3xl border border-accent/20 bg-accent/6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                      Improve This Answer
                    </p>
                    <p className="mt-2 text-sm text-foreground/90">
                      {improvementResult.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">{improvementResult.outputMode}</Badge>
                    <Badge variant="default">
                      {improvementResult.provider === "gemini-coach"
                        ? "AI wording polish"
                        : "Local only"}
                    </Badge>
                    {improvementResult.provider !== "gemini-coach" && answerWordCount < 40 ? (
                      <Badge variant="default">Short draft: token-safe mode</Badge>
                    ) : null}
                    <Badge variant="default">
                      {improvementResult.weakSpans.length} weak spot
                      {improvementResult.weakSpans.length === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="default">
                      {primaryImprovementChanges.length} next edit
                      {primaryImprovementChanges.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>

                {isImprovementStale ? (
                  <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/8 px-3 py-3 text-xs text-warning">
                    The improvement preview below belongs to the previous version of your answer. Run improvement again to refresh the underlines.
                  </div>
                ) : null}

                {visibleImprovementFocusItems.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                      <Lightbulb size={12} />
                      What to change next
                    </div>
                    <div className="mt-3 space-y-2">
                      {visibleImprovementFocusItems.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/8 bg-background/30 px-3 py-3 text-sm text-foreground/90"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-3xl border border-white/8 bg-black/18 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <ClipboardList size={12} className="text-accent" />
                    Underlined upgrade spots
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/92">
                    {renderHighlightedPreview(previewAnswer, improvementResult.weakSpans)}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-muted-foreground">
                  Insert cue adds a bracketed reminder into your draft. Accept rewrite only swaps a very short phrase, not a full sentence.
                </div>

                <div className="mt-4 space-y-3">
                  {primaryImprovementChanges.map((change) => (
                    <div
                      key={change.id}
                      className="rounded-2xl border border-border bg-card/30 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={change.kind === "replace" ? "warning" : "accent"}
                        >
                          {change.kind === "replace" ? "Tighten phrase" : "Add missing point"}
                        </Badge>
                        <p className="text-sm font-medium text-foreground">
                          {change.label}
                        </p>
                      </div>
                      {change.targetText ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Current phrase: "{change.targetText}"
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-foreground/90">
                        {change.replacementText}
                      </p>
                      {change.microRewriteText ? (
                        <p className="mt-2 text-xs text-accent">
                          Safe short rewrite: "{change.microRewriteText}"
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isImprovementStale || isImproving}
                          onClick={() => handleInsertChangeCue(change)}
                        >
                          Insert cue
                        </Button>
                        {canAcceptMicroRewrite(change) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isImprovementStale || isImproving}
                            onClick={() => handleAcceptRewrite(change)}
                          >
                            Accept rewrite
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <details className="mt-4 rounded-2xl border border-border bg-card/20 p-4">
                  <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    See checklist and marking reasons
                  </summary>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-border bg-card/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Improvement checklist
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {improvementResult.checklist.map((item) => (
                            <Badge key={item} variant="default">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {improvementResult.commentator.length > 0 ? (
                        <div className="rounded-2xl border border-border bg-card/30 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Coach notes
                          </p>
                          <div className="mt-3 space-y-2">
                            {improvementResult.commentator.map((item) => (
                              <p key={item} className="text-sm text-foreground/90">
                                {item}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-border bg-card/30 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Why it was marked
                      </p>
                      <div className="mt-3 space-y-2">
                        {improvementResult.weakSpans.length > 0 ? (
                          improvementResult.weakSpans.map((span) => (
                            <div key={span.id} className="rounded-2xl border border-white/8 px-3 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={span.severity === "high" ? "danger" : "warning"}
                                >
                                  {span.severity}
                                </Badge>
                                <p className="text-sm font-medium text-foreground">
                                  {span.label}
                                </p>
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                {span.reason}
                              </p>
                              {span.replacementHint ? (
                                <p className="mt-2 text-xs leading-relaxed text-accent">
                                  {span.replacementHint}
                                </p>
                              ) : null}
                              {(span.replacementHint || span.reason) ? (
                                <div className="mt-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={isImprovementStale || isImproving}
                                    onClick={() => handleInsertSpanCue(span)}
                                  >
                                    Insert cue near phrase
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No weak phrase was highlighted, so the main gains are in the missing concept suggestions.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            ) : null}
          </div>
        </TaskResponsePanel>
          );
        })()
      }
      feedback={
        result ? (
          <TaskFeedbackPanel
            tone={feedbackTone}
            title="Analytical result"
            summary={
              isDirtySinceLastCheck
                ? "The analysis below is from your previous check. Run it again to refresh the score and concept coverage."
                : result.feedback
            }
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-3 rounded-3xl border border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Score summary
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl font-semibold text-foreground">
                    {result.score}/{result.maxScore}
                  </span>
                  <Badge variant={scoreTone}>{scorePercent}%</Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.feedback}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Confidence
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {Math.round(result.confidence * 100)}%
                  </p>
                  <ProgressBar
                    value={Math.round(result.confidence * 100)}
                    size="sm"
                    className="mt-3"
                    color={
                      scoreTone === "danger"
                        ? "danger"
                        : scoreTone === "warning"
                          ? "warning"
                          : "success"
                    }
                  />
                </div>

                <div className="rounded-3xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Coverage
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {result.matchedConcepts.length}/{result.conceptBreakdown.length}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    concepts clearly matched
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <section className="rounded-3xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles size={12} className="text-success" />
                  Matched ideas
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.matchedConcepts.length > 0 ? (
                    result.matchedConcepts.map((concept) => (
                      <Badge key={concept} variant="success">
                        {concept}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No clear mark-scheme matches yet.
                    </span>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Target size={12} className="text-warning" />
                  Still missing
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.missingConcepts.length > 0 ? (
                    result.missingConcepts.map((concept) => (
                      <Badge key={concept} variant="warning">
                        {concept}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No major gaps detected.
                    </span>
                  )}
                </div>
              </section>

              <section
                className={
                  result.misconceptions.length > 0
                    ? "rounded-3xl border border-danger/20 bg-danger/5 p-4"
                    : "rounded-3xl border border-border p-4"
                }
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <AlertCircle
                    size={12}
                    className={
                      result.misconceptions.length > 0 ? "text-danger" : "text-muted-foreground"
                    }
                  />
                  Misconceptions
                </div>
                <div className="mt-3 space-y-2">
                  {result.misconceptionBreakdown.length > 0 ? (
                    result.misconceptionBreakdown.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border p-3"
                      >
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.explanation}
                        </p>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No flagged misconception signals.
                    </span>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-3xl border border-border p-4">
              <TopicNextSteps
                primary={nextSteps.primary}
                secondary={nextSteps.secondary}
                title="Same-topic next step"
              />

              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Concept breakdown
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      See how each marking idea was scored instead of treating the result like one opaque number.
                    </p>
                  </div>
                  <Badge variant="default">{result.conceptBreakdown.length} concepts</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {result.conceptBreakdown.map((concept) => {
                    const tone =
                      concept.coverage >= 0.9
                        ? "success"
                        : concept.coverage > 0
                          ? "warning"
                          : "danger";

                    return (
                      <div
                        key={concept.id}
                        className="rounded-3xl border border-border p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {concept.label}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {concept.scoreAwarded}/{concept.maxScore} marks
                              </p>
                            </div>

                            {concept.matchedEvidence.length > 0 ? (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  Evidence found
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {concept.matchedEvidence.map((evidence) => (
                                    <span
                                      key={`${concept.id}-${evidence}`}
                                      className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-foreground/90"
                                    >
                                      {evidence}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {concept.missingEvidence.length > 0 ? (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  Still missing
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {concept.missingEvidence.slice(0, 3).map((evidence) => (
                                    <span
                                      key={`${concept.id}-missing-${evidence}`}
                                      className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                                    >
                                      {evidence}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="min-w-[180px] space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Coverage</span>
                              <span>{Math.round(concept.coverage * 100)}%</span>
                            </div>
                            <ProgressBar
                              value={Math.round(concept.coverage * 100)}
                              size="sm"
                              color={
                                tone === "danger"
                                  ? "danger"
                                  : tone === "warning"
                                    ? "warning"
                                    : "success"
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </TaskFeedbackPanel>
        ) : undefined
      }
      primaryAction={{
        label: result ? "Check revised answer" : "Check answer against mark scheme",
        onClick: () => void handleEvaluate(),
        loading: isLoading,
        disabled: !answer.trim(),
      }}
      secondaryAction={
        availableQuestions.length > 1
          ? {
              label: "Try another question",
              onClick: handleLoadAnotherQuestion,
              variant: "secondary",
            }
          : {
              label: "Open topic resources",
              href: `/revision/${topicId}/resources`,
              variant: "ghost",
            }
      }
      tertiaryAction={
        availableQuestions.length > 1
          ? {
              label: "Open topic resources",
              href: `/revision/${topicId}/resources`,
              variant: "ghost",
            }
          : undefined
      }
    />
  );
}
