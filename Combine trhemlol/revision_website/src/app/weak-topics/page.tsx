import { WeakTopicsView } from "@/components/weak-topics-view";
import { getAllTopics, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

export default function WeakTopicsPage() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();

  return <WeakTopicsView topics={getAllTopics(curriculum)} questions={questions} />;
}
