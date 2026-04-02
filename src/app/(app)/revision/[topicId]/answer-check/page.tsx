"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ExamConditionsWorkspace } from "@/components/revision/exam-conditions-workspace";
import { getTopicById } from "@/lib/types";

export default function TopicAnswerCheckPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const preferredQuestionId = searchParams.get("questionId") ?? undefined;
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
    />
  );
}
