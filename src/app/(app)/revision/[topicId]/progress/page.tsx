import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicProgressPanel } from "@/components/revision/topic-content-panels";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicProgressPage({
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
      activeMode="progress"
      eyebrow="Topic progress"
      title={`${topicInfo.label} progress`}
      description="Use this route to read the saved progress for this topic only: reviewed subtopics, practice-set completion, and what still needs another round."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            What changes this page
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Reviewing subtopics and completing practice modes updates this page. Use it to verify what is saved rather than to do the task itself.
          </p>
        </Card>
      }
    >
      <TopicProgressPanel topicId={topicId} />
    </TopicRouteShell>
  );
}

