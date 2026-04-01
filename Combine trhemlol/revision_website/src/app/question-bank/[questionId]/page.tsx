import { notFound } from "next/navigation";

import { QuestionAttemptView } from "@/components/question-attempt-view";
import { getQuestionById, loadFeedbackRules, loadQuestionBank } from "@/lib/content/loaders";

export default async function QuestionDetailPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  const questions = loadQuestionBank();
  const feedbackRules = loadFeedbackRules();
  const question = getQuestionById(questions, questionId);

  if (!question) {
    notFound();
  }

  const relatedQuestions = questions
    .filter((item) => item.id !== question.id && item.topicId === question.topicId)
    .slice(0, 4);

  return (
    <QuestionAttemptView
      question={question}
      feedbackRule={feedbackRules.find((rule) => rule.id === question.markSchemeId)}
      relatedQuestions={relatedQuestions}
    />
  );
}
