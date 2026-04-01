import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicResourcesPanel } from "@/components/revision/topic-content-panels";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicResourcesPage({
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
      activeMode="resources"
      eyebrow="Topic resources"
      title={`${topicInfo.label} support material`}
      description="This route is secondary support. Use it when you need notes, papers, or mark schemes to fix a specific gap revealed by diagnostic or practice."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Use resources well
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Do not treat this page as the main task. Start with recall, drill, quiz, or answer checking, then come here when you know what needs reinforcement.
          </p>
        </Card>
      }
    >
      <TopicResourcesPanel topicId={topicId} />
    </TopicRouteShell>
  );
}

