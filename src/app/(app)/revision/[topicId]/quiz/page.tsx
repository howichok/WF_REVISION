"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { getTopicById } from "@/lib/types";

const QuickQuiz = dynamic(
  () => import("@/components/revision/quick-quiz").then((m) => ({ default: m.QuickQuiz })),
  {
    loading: () => (
      <div className="min-h-[280px] rounded-2xl border border-border bg-card/50 animate-pulse" aria-hidden />
    ),
    ssr: false,
  }
);

export default function TopicQuizPage() {
  const params = useParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const topicInfo = getTopicById(topicId);

  if (!topicInfo) {
    return null;
  }

  return (
    <TopicRouteShell
      topicId={topicId}
      activeMode="quiz"
      eyebrow="Simple revision"
      title={topicInfo.label}
      description="Fast Q/A for this topic. Use it to warm up retrieval and short written checks before a timed Exam questions session."
    >
      <QuickQuiz topicId={topicId} />
    </TopicRouteShell>
  );
}
