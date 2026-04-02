import { Card } from "@/components/ui";
import { TopicIntelligenceAssistant } from "@/components/revision/topic-intelligence-assistant";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicAskPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{
    query?: string;
    intent?: string;
    autoRun?: string;
  }>;
}) {
  const { topicId } = await params;
  const resolvedSearchParams = await searchParams;
  const topicInfo = getTopicById(topicId);
  const tree = getTopicTree(topicId);

  if (!topicInfo || !tree) {
    return null;
  }

  return (
    <TopicRouteShell
      topicId={topicId}
      activeMode="ask"
      eyebrow="Simple revision"
      title={`Ask ${topicInfo.label}`}
      description="The fast revision route for hints, short explanations, official sources, and quick next-step guidance before you move into Exam conditions."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>This sits inside Simple revision, so it should help you think faster rather than replace your answer for you.</p>
            <p>The router checks local DSD content first and only treats grounded web as authoritative with Pearson or T Levels allowlisted sources.</p>
            <p>Hints stay scaffold-only and do not turn into full model answers.</p>
          </div>
        </Card>
      }
    >
      <TopicIntelligenceAssistant
        topicId={topicId}
        topicLabel={topicInfo.label}
        initialQuery={resolvedSearchParams.query}
        initialIntent={resolvedSearchParams.intent}
        autoRun={resolvedSearchParams.autoRun === "1"}
      />
    </TopicRouteShell>
  );
}
