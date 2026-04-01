import { CommandCentreView } from "@/components/command-centre-view";
import { getAllTopics, loadCurriculumMap, loadLibraryResources, loadQuestionBank } from "@/lib/content/loaders";

export default function RevisionPage() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();
  const topics = getAllTopics(curriculum);
  const resources = loadLibraryResources();

  return <CommandCentreView topics={topics} questions={questions} resources={resources} />;
}
