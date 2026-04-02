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
      eyebrow="Two-mode practice hub"
      title={`Practice ${topicInfo.label}`}
      description="Everything in this topic now sits under two routes: Simple revision for fast Q/A, and Exam conditions for planning plus one fuller written answer."
      aside={
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How this topic works now
          </p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Simple revision is for quick Q/A, retrieval, and short AI help while you are still learning the topic.</p>
            <p>Exam conditions is for planning first, then finishing with a longer written answer that the AI checker marks.</p>
            <p>If you are not sure where to start, begin in Simple revision and only switch once the core idea feels stable.</p>
          </div>
        </Card>
      }
    >
      <TopicPracticeStudio topicId={topicId} topicLabel={topicInfo.label} />
    </TopicRouteShell>
  );
}

