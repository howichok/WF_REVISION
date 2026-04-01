import { ProgressOverviewView } from "@/components/progress-overview-view";
import { getAllTopics, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

export default function ProgressPage() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();

  return <ProgressOverviewView topics={getAllTopics(curriculum)} questions={questions} />;
}
