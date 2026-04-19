import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/features/revision/topic-route-shell";
import { TopicExamQuestionsPanel } from "@/components/features/revision/topic-content-panels";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicPaperPromptsPage({
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
      activeMode="paper-prompts"
      eyebrow="Past papers"
      title={`${topicInfo.label} mapped paper prompts`}
      description="Review how this topic appears in papers, what the answer focus looks like, and which mark-scheme ideas are targeted — before you run a timed exam-question session."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Best use
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Read these prompts to learn the wording and marks, then use{" "}
            <span className="font-medium text-foreground">Exam questions</span> for a timed, marked run.
          </p>
        </Card>
      }
    >
      <TopicExamQuestionsPanel topicId={topicId} />
    </TopicRouteShell>
  );
}
