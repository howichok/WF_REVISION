import { REVISION_QUESTION_SCHEMAS } from "./rules/revision";
import type { PublicRevisionQuestion } from "./types";

export const PUBLIC_REVISION_QUESTIONS: PublicRevisionQuestion[] =
  REVISION_QUESTION_SCHEMAS.map((schema) => ({
    id: schema.id,
    topicId: schema.topicId,
    subtopicId: schema.subtopicId,
    prompt: schema.prompt,
    maxScore: schema.maxScore,
    rubricSummary: schema.rubricSummary,
  }));

export function getPracticeQuestionsForTopic(topicId: string): PublicRevisionQuestion[] {
  return PUBLIC_REVISION_QUESTIONS.filter((question) => question.topicId === topicId);
}

export function getPracticeQuestionForTopic(
  topicId: string,
  variantIndex = 0
): PublicRevisionQuestion | null {
  const questions = getPracticeQuestionsForTopic(topicId);

  if (questions.length === 0) {
    return null;
  }

  const safeIndex = Math.abs(variantIndex) % questions.length;
  return questions[safeIndex] ?? null;
}
