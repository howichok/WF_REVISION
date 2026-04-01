import { PaperOverviewView } from "@/components/paper-overview-view";
import { getPaperTopics, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

export default function Paper1Page() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();
  const topics = getPaperTopics(curriculum, "paper-1");

  return <PaperOverviewView paperId="paper-1" topics={topics} questions={questions} />;
}
