import { PlannerView } from "@/components/planner-view";
import { getAllTopics, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

export default function PlannerPage() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();

  return <PlannerView topics={getAllTopics(curriculum)} questions={questions} />;
}
