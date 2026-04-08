"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ExamConditionsWorkspace } from "@/components/revision/exam-conditions-workspace";
import { parseExamConditionsDifficultyParam } from "@/lib/exam-conditions";
import { getTopicById } from "@/lib/types";

export default function TopicExamConditionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const preferredQuestionId = searchParams.get("questionId") ?? undefined;
  const autoStart = searchParams.get("autoStart") === "1";
  const countRaw = searchParams.get("count");
  const parsedCount = countRaw !== null && countRaw !== "" ? Number.parseInt(countRaw, 10) : Number.NaN;
  const launchQuestionCount =
    Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : undefined;
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
      launchQuestionCount={launchQuestionCount}
      launchDifficultyMode={launchDifficultyMode}
    />
  );
}
