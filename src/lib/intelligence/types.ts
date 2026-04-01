export type EvaluationMode = "revision-answer" | "community-content";

export interface NormalizedText {
  original: string;
  normalized: string;
  tokens: string[];
}

export interface PhraseEvidence {
  phrase: string;
  start: number;
  end: number;
  similarity: number;
  negated: boolean;
}

export interface PhraseGroupRule {
  anyOf: string[];
}

export interface RevisionConceptRule {
  id: string;
  label: string;
  weight: number;
  requiredGroups: PhraseGroupRule[];
  feedback: string;
}

export interface RevisionMisconceptionRule {
  id: string;
  label: string;
  penalty: number;
  groups: PhraseGroupRule[];
  explanation: string;
}

export interface RevisionQuestionSchema {
  id: string;
  topicId: string;
  subtopicId?: string;
  prompt: string;
  maxScore: number;
  rubricSummary: string[];
  concepts: RevisionConceptRule[];
  misconceptions: RevisionMisconceptionRule[];
}

export interface PublicRevisionQuestion {
  id: string;
  topicId: string;
  subtopicId?: string;
  prompt: string;
  maxScore: number;
  rubricSummary: string[];
}

export interface ConceptEvaluation {
  id: string;
  label: string;
  scoreAwarded: number;
  maxScore: number;
  coverage: number;
  matchedEvidence: string[];
  missingEvidence: string[];
}

export interface MisconceptionEvaluation {
  id: string;
  label: string;
  explanation: string;
  penaltyApplied: number;
}

export interface RevisionAnswerEvaluation {
  evaluationVersion: 1;
  evaluatedAt: string;
  mode: "revision-answer";
  questionId: string;
  topicId: string;
  score: number;
  maxScore: number;
  matchedConcepts: string[];
  missingConcepts: string[];
  misconceptions: string[];
  confidence: number;
  feedback: string;
  conceptBreakdown: ConceptEvaluation[];
  misconceptionBreakdown: MisconceptionEvaluation[];
}

export interface CommunityEvaluationInput {
  content: string;
  topicId?: string;
  contentType?: "post" | "reply";
}

export interface CommunityContentEvaluation {
  evaluationVersion: 1;
  evaluatedAt: string;
  mode: "community-content";
  topicId?: string;
  contentType: "post" | "reply";
  qualityScore: number;
  relevanceScore: number;
  flags: string[];
  reasons: string[];
  suggestedState: "allow" | "review" | "downrank";
  signalBreakdown: {
    lengthScore: number;
    educationalSignalScore: number;
    relevanceSignalScore: number;
    civilityPenalty: number;
    repetitionPenalty: number;
    lowValuePenalty: number;
    misleadingPenalty: number;
  };
}

export interface RevisionEvaluationRequest {
  mode: "revision-answer";
  questionId: string;
  answer: string;
}

export interface CommunityEvaluationRequest {
  mode: "community-content";
  content: string;
  topicId?: string;
  contentType?: "post" | "reply";
}

export type IntelligenceEvaluationRequest =
  | RevisionEvaluationRequest
  | CommunityEvaluationRequest;

export type IntelligenceEvaluationResponse =
  | RevisionAnswerEvaluation
  | CommunityContentEvaluation;
