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
      eyebrow="Universal Ask DSD"
      title={`Ask ${topicInfo.label}`}
      description="One entrypoint for hints, direct explanations, official sources, answer-check routing, and the next best practice prompt."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>The router checks local DSD content first.</p>
            <p>Grounded web is only treated as authoritative with Pearson or T Levels allowlisted sources.</p>
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
