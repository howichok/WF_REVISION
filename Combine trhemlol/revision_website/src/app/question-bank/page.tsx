import { QuestionBankView } from "@/components/question-bank-view";
import { getAllTopics, loadCurriculumMap, loadQuestionBank } from "@/lib/content/loaders";

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const curriculum = loadCurriculumMap();
  const questions = loadQuestionBank();

  return <QuestionBankView questions={questions} topics={getAllTopics(curriculum)} initialQuery={query ?? ""} />;
}
