import { notFound } from "next/navigation";
import { TopicDetailView } from "@/components/topic-detail-view";
import { getTopicById, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

interface PageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export default async function Paper2TopicPage({ params }: PageProps) {
  const { topicId } = await params;
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();
  const topic = getTopicById(curriculum, topicId);

  if (!topic || topic.paper !== "paper-2") {
    notFound();
  }

  return (
    <TopicDetailView
      topic={topic}
      questions={questions}
    />
  );
}
