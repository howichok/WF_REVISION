"use client";

import { useParams } from "next/navigation";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { WrittenAnswerChecker } from "@/components/revision/written-answer-checker";
import { getTopicById } from "@/lib/types";

export default function TopicAnswerCheckPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  return (
    <TopicRouteShell
      topicId={topicId}
      activeMode="answer-check"
      eyebrow="Answer check"
      title={topicInfo.label}
      description="Written prompts with mark-style feedback on coverage and misconceptions."
    >
      <WrittenAnswerChecker
        topicId={topicId}
        topicLabel={topicInfo.label}
        topicIcon={topicInfo.icon}
      />
    </TopicRouteShell>
  );
}
