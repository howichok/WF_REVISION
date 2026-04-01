import { PaperOverviewView } from "@/components/paper-overview-view";
import { getPaperTopics, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

export default function Paper2Page() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();
  const topics = getPaperTopics(curriculum, "paper-2");

  return <PaperOverviewView paperId="paper-2" topics={topics} questions={questions} />;
}
