"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ExamConditionsWorkspace } from "@/components/revision/exam-conditions-workspace";
import {
  parseExamConditionsDifficultyParam,
  parseExamQuestionSetSizeParam,
  parseExamTopicAllocationsParam,
} from "@/lib/exam-conditions";
import { getTopicById } from "@/lib/types";

export default function TopicExamQuestionsWorkspacePage() {
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
    return null;
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
