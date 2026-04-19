"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { ActiveLearningLayout } from "@/components/features/revision/active-learning/active-learning-layout";
import { LearningRail } from "@/components/features/revision/active-learning/learning-rail";
import { MobileLearningRail } from "@/components/features/revision/active-learning/mobile-learning-rail";
import { buildLinearRailItems } from "@/components/features/revision/active-learning/rail-builders";
import { TaskContextStrip } from "@/components/features/revision/active-learning/task-context-strip";
import { TaskFeedbackPanel } from "@/components/features/revision/active-learning/task-feedback-panel";
import { TaskPanel } from "@/components/features/revision/active-learning/task-panel";
import { TaskResponsePanel } from "@/components/features/revision/active-learning/task-response-panel";
import { LearningOutcomePanel } from "@/components/features/revision/learning-outcome-panel";
import { Badge, Button } from "@/components/ui";
import {
  analyzeTopicDiagnosticSession,
  getDiagnosticTopics,
  getTopicDiagnosticDefinition,
  mergeDiagnosticResult,
  type DiagnosticFollowUpQuestion,
} from "@/lib/diagnostic";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import type {
  DiagnosticFollowUpEntry,
  DiagnosticPointAssessment,
  DiagnosticPointStatus,
  DiagnosticResult,
  TopicDiagnosticReport,
} from "@/lib/types";

interface DiagnosticWorkspaceProps {
  diagnostic: DiagnosticResult | null;
  onComplete: (result: DiagnosticResult) => Promise<void>;
}

type Stage = "topic" | "baseline" | "follow-up" | "results";
type DiagnosticTopicOption = ReturnType<typeof getDiagnosticTopics>[number];

interface CurriculumTopicRow {
  id: string;
  label: string;
  icon: string;
  short_label: string;
}

function pointVariant(status: DiagnosticPointStatus) {
  if (status === "covered") return "success" as const;
  if (status === "partial") return "warning" as const;
  if (status === "misconception") return "danger" as const;
  return "default" as const;
}

function pointLabel(status: DiagnosticPointStatus) {
  if (status === "covered") return "Covered well";
  if (status === "partial") return "Partially covered";
  if (status === "misconception") return "Misconception detected";
  return "Not assessed";
}

function getInitialTopicId(diagnostic: DiagnosticResult | null) {
  return (
    diagnostic?.recommendedTopicIds?.[0] ??
    diagnostic?.latestTopicId ??
    getDiagnosticTopics()[0]?.id ??
    ""
  );
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function DiagnosticError({ error }: { error: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
      <AlertCircle size={14} className="shrink-0" />
      {error}
    </div>
  );
}

function DiagnosticTopicSelectionState({
  topics,
  previewTopicId,
  setPreviewTopicId,
  startTopic,
  error,
}: {
  topics: DiagnosticTopicOption[];
  previewTopicId: string;
  setPreviewTopicId: (topicId: string) => void;
  startTopic: (topicId: string) => void;
  error: string;
}) {
  const previewTopic = topics.find((topic) => topic.id === previewTopicId) ?? topics[0];
  const previewDefinition = previewTopic ? getTopicDiagnosticDefinition(previewTopic.id) : null;

  if (!previewTopic || !previewDefinition) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      {error ? <DiagnosticError error={error} /> : null}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Choose a topic to diagnose
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ll explain what you know, then answer targeted follow-ups.
        </p>
      </div>

      <div className="space-y-2">
        {topics.map((topic) => {
          const isPreview = previewTopicId === topic.id;

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setPreviewTopicId(topic.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors",
                isPreview
                  ? "border-l-3 border-l-accent bg-accent/8"
                  : "hover:bg-white/4"
              )}
            >
              <span className="text-xl">{topic.icon}</span>
              <span className="text-sm font-medium text-foreground">{topic.label}</span>
            </button>
          );
        })}
      </div>

      {previewTopic ? (
        <motion.div
          key={previewTopic.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/8 bg-white/4 p-5"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{previewTopic.icon}</span>
            <h2 className="text-lg font-semibold text-foreground">{previewTopic.label}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {previewDefinition.description}
          </p>
          <div className="mt-5">
            <Button size="lg" onClick={() => startTopic(previewTopic.id)}>
              Start diagnostic
              <ArrowRight size={16} />
            </Button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

function DiagnosticResultsSummary({
  report,
  railItems,
}: {
  report: TopicDiagnosticReport;
  railItems: ReturnType<typeof buildLinearRailItems>;
}) {
  const coveredCount = report.curriculumPoints.filter((point) => point.status === "covered").length;
  const partialCount = report.curriculumPoints.filter((point) => point.status === "partial").length;
  const misconceptionCount = report.curriculumPoints.filter((point) => point.status === "misconception").length;
  const railSummary = [
    { label: "Coverage", value: `${coveredCount}/${report.curriculumPoints.length}`, tone: "success" as const },
    {
      label: "Confidence",
      value: `${Math.round(report.confidence * 100)}%`,
      tone: "accent" as const,
    },
    {
      label: "Targets",
      value: `${report.suggestedNextTargets.length}`,
      tone: report.suggestedNextTargets.length > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  return (
    <div className="al-shell">
      <MobileLearningRail
        backHref="/revision"
        railTitle={`${report.topicLabel} diagnostic`}
        railSubtitle="Saved topic-first diagnostic route."
        railIcon={<span className="text-lg">{report.topicIcon}</span>}
        railItems={railItems}
        railSummary={railSummary}
        mobileSummaryLabel="Results"
      />

      <div className="al-shell-grid">
        <LearningRail
          backHref="/revision"
          railTitle={`${report.topicLabel} diagnostic`}
          railSubtitle="Saved topic-first diagnostic route."
          railIcon={<span className="text-lg">{report.topicIcon}</span>}
          railItems={railItems}
          railSummary={railSummary}
        />

        <div className="al-task-column">
          <LearningOutcomePanel
            eyebrow="Diagnostic results"
            title={`Diagnostic complete for ${report.topicLabel}`}
            summary="You now have a saved coverage map. Use it to focus your practice."
            tone={misconceptionCount > 0 ? "warning" : coveredCount > partialCount ? "success" : "accent"}
            progressLabel="Diagnostic confidence"
            progressValue={Math.round(report.confidence * 100)}
            badges={[
              { label: `${coveredCount} covered`, variant: "success" },
              { label: `${partialCount} partial`, variant: "warning" },
              { label: `${misconceptionCount} misconceptions`, variant: misconceptionCount > 0 ? "danger" : "default" },
            ]}
            primaryAction={{
              label: "Practice weak areas",
              href: "/revision/weak-areas",
            }}
            secondaryAction={{
              label: "Topic practice",
              href: `/revision/${report.topicId}/practice`,
              variant: "secondary",
            }}
          />

          <div>
            <h3 className="text-sm font-semibold text-foreground">Coverage by point</h3>
            <div className="mt-3 space-y-1">
              {report.curriculumPoints.map((point) => (
                <div key={point.pointId} className="flex items-center gap-3 rounded-lg py-2 px-3 hover:bg-white/3">
                  <span className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground">{point.pointId}</span>
                  <span className="min-w-0 flex-1 text-sm text-foreground">{point.label}</span>
                  <Badge variant={pointVariant(point.status)}>{pointLabel(point.status)}</Badge>
                  {point.notes ? (
                    <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:inline">{point.notes}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {report.suggestedNextTargets.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">What to revise next</h3>
              <ul className="mt-2 space-y-1">
                {report.suggestedNextTargets.map((target) => (
                  <li key={target} className="text-sm text-muted-foreground">
                    &bull; {target}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function buildActiveRailItems({
  activeTopicLabel,
  stage,
  followUps,
  pendingFollowUp,
}: {
  activeTopicLabel: string;
  stage: Stage;
  followUps: DiagnosticFollowUpEntry[];
  pendingFollowUp: DiagnosticFollowUpQuestion | null;
}) {
  const followUpItems = [
    ...followUps.map((followUp, index) => ({
      id: followUp.id,
      label: `Follow-up ${index + 1}`,
      description: followUp.question,
      meta: "completed",
    })),
  ];

  if (stage === "follow-up" && pendingFollowUp) {
    followUpItems.push({
      id: pendingFollowUp.id,
      label: `Follow-up ${followUps.length + 1}`,
      description: pendingFollowUp.question,
      meta: "current",
    });
  }

  const items = [
    {
      id: "topic",
      label: "Topic selected",
      description: activeTopicLabel,
    },
    {
      id: "baseline",
      label: "Baseline answer",
      description: "Explain what you already know in your own words.",
    },
    ...followUpItems,
    {
      id: "results",
      label: "Results",
      description: "Saved topic diagnostic summary.",
    },
  ];

  const completedIds = new Set<string>(["topic"]);

  if (stage === "follow-up" || stage === "results") {
    completedIds.add("baseline");
    followUps.forEach((followUp) => completedIds.add(followUp.id));
  }

  return buildLinearRailItems(
    items,
    stage === "baseline"
      ? "baseline"
      : stage === "follow-up" && pendingFollowUp
        ? pendingFollowUp.id
        : "results",
    completedIds
  );
}

function getTargetedFeedbackSummary(point: DiagnosticPointAssessment | null) {
  if (!point) {
    return null;
  }

  if (point.status === "misconception") {
    return "The current evidence still suggests a misconception. Clarify the point directly before moving on.";
  }

  if (point.missingTerms.length > 0) {
    return `The follow-up is checking whether you can explain ${point.missingTerms.slice(0, 2).join(" and ")} clearly enough to move this point beyond partial coverage.`;
  }

  return point.notes ?? "This follow-up is confirming whether the missing evidence for the point is now strong enough.";
}

export function DiagnosticWorkspace({
  diagnostic,
  onComplete,
}: DiagnosticWorkspaceProps) {
  const [databaseTopics, setDatabaseTopics] = useState<DiagnosticTopicOption[]>(() => getDiagnosticTopics());
  const [previewTopicId, setPreviewTopicId] = useState(() => getInitialTopicId(diagnostic));
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("topic");
  const [freeformResponse, setFreeformResponse] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [analysis, setAnalysis] = useState<TopicDiagnosticReport | null>(null);
  const [completedReport, setCompletedReport] = useState<TopicDiagnosticReport | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<DiagnosticFollowUpQuestion | null>(null);
  const [followUps, setFollowUps] = useState<DiagnosticFollowUpEntry[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();

    if (!config) {
      return;
    }

    const supabase = getBrowserSupabaseClient();
    let cancelled = false;

    void supabase
      .from("curriculum_topics")
      .select("id, label, icon, short_label")
      .order("sort_order", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (cancelled || loadError || !data || data.length === 0) {
          return;
        }

        const fallbackTopics = getDiagnosticTopics();
        const nextTopics = (data as CurriculumTopicRow[])
          .map((row) => {
            const fallbackTopic = fallbackTopics.find((topic) => topic.id === row.id);

            if (!fallbackTopic) {
              return null;
            }

            return {
              ...fallbackTopic,
              label: row.label,
              icon: row.icon,
              shortLabel: row.short_label,
            };
          })
          .filter((topic): topic is DiagnosticTopicOption => Boolean(topic));

        if (nextTopics.length > 0) {
          setDatabaseTopics(nextTopics);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const topics = databaseTopics;
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? topics.find((topic) => topic.id === previewTopicId) ?? topics[0];
  const activeDefinition = activeTopic ? getTopicDiagnosticDefinition(activeTopic.id) : null;
  const targetedPoint =
    pendingFollowUp && analysis
      ? analysis.curriculumPoints.find((point) => point.pointId === pendingFollowUp.targetedPointId) ?? null
      : null;
  const activePrompt =
    stage === "baseline"
      ? "What do you already know about this topic?"
      : pendingFollowUp?.question ?? "Add the missing concept or clarification this follow-up is checking.";
  const activePromptDescription =
    stage === "baseline"
      ? "Write naturally. Mention the concepts, links, processes, and examples you would use if you were explaining this topic in an exam."
      : "This prompt is checking one weak or missing curriculum signal. Clarify it directly before moving on.";
  const activeResponseValue = stage === "baseline" ? freeformResponse : followUpResponse;
  const activeWordCount = stage === "baseline" ? getWordCount(freeformResponse) : getWordCount(followUpResponse);

  const activeRailItems = useMemo(
    () =>
      buildActiveRailItems({
        activeTopicLabel: activeTopic?.label ?? "Selected topic",
        stage,
        followUps,
        pendingFollowUp,
      }),
    [activeTopic?.label, followUps, pendingFollowUp, stage]
  );

  const resultsRailItems = useMemo(() => {
    if (!completedReport) {
      return [];
    }

    return buildLinearRailItems(
      [
        {
          id: "topic",
          label: "Topic selected",
          description: completedReport.topicLabel,
        },
        {
          id: "baseline",
          label: "Baseline answer",
          description: "Initial freeform explanation captured.",
        },
        ...completedReport.followUps.map((followUp, index) => ({
          id: followUp.id,
          label: `Follow-up ${index + 1}`,
          description: followUp.question,
        })),
        {
          id: "results",
          label: "Results",
          description: "Saved topic diagnostic summary.",
        },
      ],
      "results"
    );
  }, [completedReport]);

  const activeStepCount = useMemo(
    () => activeRailItems.filter((item) => item.state !== "locked").length,
    [activeRailItems]
  );
  const activeStepIndex = useMemo(() => {
    const currentIndex = activeRailItems.findIndex((item) => item.state === "current");
    return currentIndex >= 0 ? currentIndex + 1 : 1;
  }, [activeRailItems]);
  const activeCompletedCount = useMemo(
    () => activeRailItems.filter((item) => item.state === "completed").length,
    [activeRailItems]
  );
  const activeConfidence = analysis ? Math.round(analysis.confidence * 100) : 0;
  const activeRailSummary = useMemo(
    () => [
      {
        label: "Progress",
        value: `${activeStepIndex}/${activeStepCount || 1}`,
        tone: "accent" as const,
      },
      {
        label: "Answered",
        value: `${activeCompletedCount}`,
        tone: "default" as const,
      },
      ...(analysis
        ? [
            {
              label: "Confidence",
              value: `${activeConfidence}%`,
              tone: activeConfidence >= 70 ? ("success" as const) : ("warning" as const),
            },
          ]
        : []),
    ],
    [activeCompletedCount, activeConfidence, activeStepCount, activeStepIndex, analysis]
  );

  function resetFlow(nextPreviewTopicId = activeTopic?.id ?? previewTopicId) {
    setPreviewTopicId(nextPreviewTopicId);
    setActiveTopicId(null);
    setStage("topic");
    setFreeformResponse("");
    setFollowUpResponse("");
    setAnalysis(null);
    setCompletedReport(null);
    setPendingFollowUp(null);
    setFollowUps([]);
    setError("");
    setIsSubmitting(false);
  }

  function startTopic(topicId: string) {
    setPreviewTopicId(topicId);
    setActiveTopicId(topicId);
    setStage("baseline");
    setFreeformResponse("");
    setFollowUpResponse("");
    setAnalysis(null);
    setCompletedReport(null);
    setPendingFollowUp(null);
    setFollowUps([]);
    setError("");
  }

  async function persistAndShowResults(report: TopicDiagnosticReport) {
    setIsSubmitting(true);
    setError("");

    try {
      await onComplete(mergeDiagnosticResult(diagnostic, report));
      setCompletedReport(report);
      setStage("results");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the diagnostic result."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runInitialAnalysis() {
    if (!activeTopic) return;
    if (freeformResponse.trim().length < 40) {
      setError("Write a fuller explanation before starting the diagnostic.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = analyzeTopicDiagnosticSession({
        topicId: activeTopic.id,
        freeformResponse,
      });
      setAnalysis(result.report);
      setPendingFollowUp(result.nextFollowUp);

      if (result.nextFollowUp) {
        setStage("follow-up");
      } else {
        await persistAndShowResults(result.report);
        return;
      }
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyse this topic yet."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runFollowUp() {
    if (!activeTopic || !pendingFollowUp || !analysis) return;
    if (followUpResponse.trim().length < 12) {
      setError("Add a short follow-up answer so the diagnostic can refine the point.");
      return;
    }

    const nextFollowUps = [
      ...followUps,
      {
        id: pendingFollowUp.id,
        targetedPointId: pendingFollowUp.targetedPointId,
        question: pendingFollowUp.question,
        answer: followUpResponse.trim(),
        reason: pendingFollowUp.reason,
      },
    ];

    setIsSubmitting(true);
    setError("");

    try {
      const result = analyzeTopicDiagnosticSession({
        topicId: activeTopic.id,
        freeformResponse,
        followUps: nextFollowUps,
      });
      setFollowUps(nextFollowUps);
      setFollowUpResponse("");
      setAnalysis(result.report);
      setPendingFollowUp(result.nextFollowUp);

      if (result.nextFollowUp) {
        setStage("follow-up");
      } else {
        await persistAndShowResults(result.report);
        return;
      }
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to refine this diagnostic."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (stage === "topic") {
    return (
      <DiagnosticTopicSelectionState
        topics={topics}
        previewTopicId={previewTopicId}
        setPreviewTopicId={setPreviewTopicId}
        startTopic={startTopic}
        error={error}
      />
    );
  }

  if (stage === "results" && completedReport) {
    return <DiagnosticResultsSummary report={completedReport} railItems={resultsRailItems} />;
  }

  if (!activeTopic || !activeDefinition) {
    return null;
  }

  const feedbackTitle =
    stage === "follow-up" && targetedPoint
      ? `Checking ${targetedPoint.pointId} ${targetedPoint.label}`
      : undefined;
  const feedbackSummary =
    stage === "follow-up" && targetedPoint
      ? getTargetedFeedbackSummary(targetedPoint)
      : undefined;

  return (
    <ActiveLearningLayout
      backHref="/revision"
      railTitle={`${activeTopic.label} diagnostic`}
      railSubtitle={activeDefinition.description}
      railIcon={<span className="text-lg">{activeTopic.icon}</span>}
      railItems={activeRailItems}
      railSummary={activeRailSummary}
      mobileSummaryLabel="Diagnostic steps"
      contextStrip={
        <TaskContextStrip
          eyebrow="Diagnostic"
          breadcrumb={`${activeTopic.label}`}
          status={
            <span className="text-xs tabular-nums text-muted-foreground">
              Step {activeStepIndex} / {activeStepCount || 1}
            </span>
          }
        />
      }
      task={
        <TaskPanel title={activePrompt}>
          <p className="text-xs text-muted-foreground mb-2">{activePromptDescription}</p>
          {stage === "follow-up" && targetedPoint ? (
            <p className="text-sm text-warning">
              Checking: {targetedPoint.pointId} {targetedPoint.label}
            </p>
          ) : null}
        </TaskPanel>
      }
      response={
        <TaskResponsePanel>
          {error ? <DiagnosticError error={error} /> : null}

          <textarea
            value={activeResponseValue}
            onChange={(event) => {
              if (stage === "baseline") {
                setFreeformResponse(event.target.value);
              } else {
                setFollowUpResponse(event.target.value);
              }
              setError("");
            }}
            rows={stage === "baseline" ? 10 : 6}
            placeholder={
              stage === "baseline"
                ? "Explain what you already know about this topic..."
                : "Answer the follow-up question..."
            }
            className="w-full rounded-xl border border-border bg-surface/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />

          <p className="text-right text-[11px] tabular-nums text-muted-foreground/50">{activeWordCount} words</p>
        </TaskResponsePanel>
      }
      feedback={
        stage === "follow-up" && targetedPoint ? (
          <TaskFeedbackPanel
            tone={targetedPoint.status === "misconception" ? "danger" : targetedPoint.status === "covered" ? "success" : "warning"}
            title={feedbackTitle}
            summary={feedbackSummary}
          />
        ) : undefined
      }
      primaryAction={{
        label: stage === "baseline" ? "Submit" : "Continue",
        onClick: () => void (stage === "baseline" ? runInitialAnalysis() : runFollowUp()),
        loading: isSubmitting,
      }}
      secondaryAction={
        stage === "follow-up" && analysis
          ? {
              label: "View results",
              onClick: () => void persistAndShowResults(analysis),
              disabled: isSubmitting,
              variant: "secondary",
            }
          : {
              label: "Change topic",
              onClick: () => resetFlow(activeTopic.id),
              disabled: isSubmitting,
              variant: "secondary",
            }
      }
    />
  );
}
