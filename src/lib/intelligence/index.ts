import { evaluateCommunityContent } from "./moderation";
import { REVISION_QUESTION_SCHEMAS } from "./rules/revision";
import { evaluateRevisionAnswerWithSchema } from "./scoring";
import type {
  CommunityEvaluationRequest,
  IntelligenceEvaluationRequest,
  IntelligenceEvaluationResponse,
  RevisionEvaluationRequest,
  RevisionQuestionSchema,
} from "./types";

const REVISION_QUESTION_MAP = new Map<string, RevisionQuestionSchema>(
  REVISION_QUESTION_SCHEMAS.map((schema) => [schema.id, schema])
);

export function getRevisionQuestionSchema(questionId: string): RevisionQuestionSchema | null {
  return REVISION_QUESTION_MAP.get(questionId) ?? null;
}

export function evaluateRevisionAnswer(
  request: RevisionEvaluationRequest
): IntelligenceEvaluationResponse {
  const schema = getRevisionQuestionSchema(request.questionId);

  if (!schema) {
    throw new Error(`Unknown revision question: ${request.questionId}`);
  }

  return evaluateRevisionAnswerWithSchema(schema, request.answer);
}

export function evaluateCommunityRequest(
  request: CommunityEvaluationRequest
): IntelligenceEvaluationResponse {
  return evaluateCommunityContent({
    content: request.content,
    topicId: request.topicId,
    contentType: request.contentType,
  });
}

export function evaluateIntelligenceRequest(
  request: IntelligenceEvaluationRequest
): IntelligenceEvaluationResponse {
  if (request.mode === "revision-answer") {
    return evaluateRevisionAnswer(request);
  }

  return evaluateCommunityRequest(request);
}

export {
  evaluateCommunityContent,
  evaluateRevisionAnswerWithSchema,
  REVISION_QUESTION_SCHEMAS,
};
