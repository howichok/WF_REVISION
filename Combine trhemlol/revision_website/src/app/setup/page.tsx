import { OnboardingFlow } from "@/components/onboarding-flow";
import { getAllTopics, loadCurriculumMap, loadLibraryResources, loadQuestionBank } from "@/lib/content/loaders";

export default function SetupPage() {
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();
  const topics = getAllTopics(curriculum);
  const resources = loadLibraryResources();

  return <OnboardingFlow topics={topics} questions={questions} resources={resources} />;
}
