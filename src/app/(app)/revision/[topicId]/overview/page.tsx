import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicOverviewPanel } from "@/components/revision/topic-content-panels";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicOverviewPage({
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
      activeMode="overview"
      eyebrow="Topic overview"
      title={topicInfo.label}
      description="Use this page to understand the topic structure, official curriculum coverage, linked materials, and where to go next."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Best next action
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Once you understand the topic shape, move into the practice hub to choose the right learning mode instead of scrolling through every tool at once.
          </p>
        </Card>
      }
    >
      <TopicOverviewPanel topicId={topicId} />
    </TopicRouteShell>
  );
}

