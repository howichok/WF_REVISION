"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  parseExamConditionsDifficultyParam,
  parseExamQuestionSetSizeParam,
  parseExamTopicAllocationsParam,
} from "@/lib/exam-conditions";
import { getTopicById } from "@/lib/types";

const ExamConditionsWorkspace = dynamic(
  () =>
    import("@/components/revision/exam-conditions-workspace").then((m) => ({
      default: m.ExamConditionsWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[min(70vh,560px)] rounded-2xl border border-border bg-card/50 animate-pulse"
        aria-busy="true"
        aria-label="Loading exam workspace"
      />
    ),
  }
);

function ExamQuestionsPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const preferredQuestionId = searchParams.get("questionId") ?? undefined;
  const autoStart = searchParams.get("autoStart") === "1";
  const countRaw = searchParams.get("count");
  const parsedCount = countRaw !== null && countRaw !== "" ? Number.parseInt(countRaw, 10) : Number.NaN;
  const legacySetSize =
    Number.isFinite(parsedCount) && parsedCount > 0
      ? parsedCount <= 10
        ? (10 as const)
        : parsedCount <= 20
          ? (20 as const)
          : (30 as const)
      : undefined;

  const launchSetSize = parseExamQuestionSetSizeParam(searchParams.get("size")) ?? legacySetSize;

  const launchTopicAllocations = parseExamTopicAllocationsParam(searchParams.get("alloc")) ?? undefined;

  const launchDifficultyMode = parseExamConditionsDifficultyParam(searchParams.get("difficulty"));
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-5 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Unknown topic</p>
        <p className="text-sm text-slate-600">
          The URL segment <code className="rounded bg-slate-200/80 px-1.5 py-0.5 text-xs">{topicId || "—"}</code> does
          not match a topic in this build. Check the link or pick a topic again.
        </p>
        <Link
          href="/revision/topics?mode=exam"
          className={cn(
            "mx-auto inline-flex items-center justify-center rounded-xl border border-border/80 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card hover:border-border-light"
          )}
        >
          Back to exam topics
        </Link>
      </div>
    );
  }

  return (
    <ExamConditionsWorkspace
      topicId={topicId}
      topicLabel={topicInfo.label}
      topicIcon={topicInfo.icon}
      preferredQuestionId={preferredQuestionId}
      autoStart={autoStart}
      launchSetSize={launchSetSize}
      launchTopicAllocations={launchTopicAllocations}
      launchDifficultyMode={launchDifficultyMode}
    />
  );
}

export default function TopicExamQuestionsWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-[min(70vh,560px)] rounded-2xl border border-border bg-card/50 animate-pulse"
          aria-busy="true"
          aria-label="Loading exam workspace"
        />
      }
    >
      <ExamQuestionsPageInner />
    </Suspense>
  );
}
