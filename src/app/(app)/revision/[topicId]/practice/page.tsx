import { Card } from "@/components/ui";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { TopicPracticeStudio } from "@/components/revision/topic-practice-studio";
import { getTopicById, getTopicTree } from "@/lib/types";

export default async function TopicPracticePage({
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
      activeMode="practice"
      eyebrow="Topic practice hub"
      title={`Practice ${topicInfo.label}`}
      description="Choose one clear study mode for this topic. Each route now has a single purpose and a clearer outcome."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How to use this
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Use recall when you need retrieval.</p>
            <p>Use exam drill when you need planning and self-checking.</p>
            <p>Use answer check when you want rubric-based feedback.</p>
            <p>Use quick quiz when you want fast correction and score.</p>
          </div>
        </Card>
      }
    >
      <TopicPracticeStudio topicId={topicId} topicLabel={topicInfo.label} />
    </TopicRouteShell>
  );
}

