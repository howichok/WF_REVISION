import { notFound } from "next/navigation";

import { TopicDetailView } from "@/components/topic-detail-view";
import { getTopicById, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

interface PageProps {
  params: Promise<{
    topicId: string;
    subtopicId: string;
  }>;
}

export default async function Paper1SubtopicPage({ params }: PageProps) {
  const { topicId, subtopicId } = await params;
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();
  const topic = getTopicById(curriculum, topicId);

  if (!topic || topic.paper !== "paper-1" || !topic.subtopics.some((subtopic) => subtopic.id === subtopicId)) {
    notFound();
  }

  return <TopicDetailView topic={topic} questions={questions} activeSubtopicId={subtopicId} />;
}
