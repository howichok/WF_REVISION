import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicExamQuestionsPanel } from "@/components/revision/topic-content-panels";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicExamQuestionsPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topicInfo = getTopicById(topicId);
  const tree = getTopicTree(topicId);

  if (!topicInfo || !tree) {
    return null;
  }

  return (
    <TopicRouteShell
      topicId={topicId}
      activeMode="exam-questions"
      eyebrow="Exam questions"
      title={`${topicInfo.label} mapped paper prompts`}
      description="Use this route to review how this topic appears in papers, what the answer focus looks like, and which mark-scheme ideas are being targeted."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Best use
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Review these prompts before exam drill or answer checking so you know the language, mark weighting, and answer focus for the topic.
          </p>
        </Card>
      }
    >
      <TopicExamQuestionsPanel topicId={topicId} />
    </TopicRouteShell>
  );
}

