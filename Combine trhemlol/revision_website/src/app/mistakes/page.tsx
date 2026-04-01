import { MistakesView } from "@/components/mistakes-view";
import { loadQuestionBank } from "@/lib/content/loaders";

export default function MistakesPage() {
  const questions = loadQuestionBank();

  return <MistakesView questions={questions} />;
}
