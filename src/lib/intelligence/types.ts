export type EvaluationMode = "revision-answer" | "community-content";
export type RevisionImprovementOutputMode = "commentator" | "diff";

export type TopicIntelligenceIntent =
  | "hint"
  | "local-answer"
  | "grounded-answer"
  | "answer-check"
  | "practice-question"
  | "resource-pick"
  | "misconception-fix";

export type TopicIntelligenceConfidence = "high" | "medium" | "low";

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

export interface RevisionImprovementRequest {
  mode: "revision-improve";
  questionId: string;
  answer: string;
  outputMode?: RevisionImprovementOutputMode;
}

export interface RevisionImprovementSpan {
  id: string;
  label: string;
  start: number;
  end: number;
  severity: "medium" | "high";
  reason: string;
  replacementHint?: string;
}

export interface RevisionImprovementChange {
  id: string;
  kind: "replace" | "add";
  label: string;
  targetText?: string;
  replacementText: string;
  rationale: string;
  microRewriteText?: string;
}

export interface RevisionImprovementResponse {
  evaluationVersion: 1;
  evaluatedAt: string;
  mode: "revision-improve";
  provider?: "local-rule-engine" | "gemini-coach";
  model?: string;
  questionId: string;
  topicId: string;
  outputMode: RevisionImprovementOutputMode;
  summary: string;
  commentator: string[];
  checklist: string[];
  weakSpans: RevisionImprovementSpan[];
  changes: RevisionImprovementChange[];
  basedOnScore: {
    score: number;
    maxScore: number;
    confidence: number;
  };
}

export interface CommunityEvaluationRequest {
  mode: "community-content";
  content: string;
  topicId?: string;
  contentType?: "post" | "reply";
}

export interface TopicIntelligenceRequest {
  topicId: string;
  query: string;
  overrideIntent?: TopicIntelligenceIntent;
  draftAnswer?: string;
}

export interface TopicIntelligenceSource {
  id: string;
  title: string;
  type: "local-point" | "local-resource" | "official-resource" | "grounded-web";
  href?: string;
  host?: string;
  note?: string;
}

export interface TopicIntelligenceRelatedQuestion {
  id: string;
  title: string;
  prompt: string;
  sourceLabel: string;
  href: string;
  marks?: number;
  kind: "answer-check" | "exam-question" | "exam-drill";
}

export interface TopicIntelligenceRelatedResource {
  id: string;
  title: string;
  summary: string;
  href?: string;
  isExternal: boolean;
}

export interface TopicIntelligenceNextAction {
  label: string;
  href: string;
  kind: "route" | "external";
}

export interface TopicIntelligenceResponse {
  evaluationVersion: 1;
  evaluatedAt: string;
  mode: "topic-assistant";
  provider?: "local-rule-engine" | "gemini-coach" | "gemini-grounded";
  model?: string;
  topicId: string;
  query: string;
  intent: TopicIntelligenceIntent;
  confidence: TopicIntelligenceConfidence;
  confidenceScore: number;
  answer: string;
  examSafeFocus: string[];
  misconceptions: string[];
  suggestedNextAction: TopicIntelligenceNextAction | null;
  sources: TopicIntelligenceSource[];
  relatedQuestions: TopicIntelligenceRelatedQuestion[];
  relatedResources: TopicIntelligenceRelatedResource[];
  officialConfirmationStatus: "not-needed" | "confirmed" | "not-found" | "unavailable";
  localOnly: boolean;
}

export type IntelligenceEvaluationRequest =
  | RevisionEvaluationRequest
  | RevisionImprovementRequest
  | CommunityEvaluationRequest;

export type IntelligenceEvaluationResponse =
  | RevisionAnswerEvaluation
  | RevisionImprovementResponse
  | CommunityContentEvaluation;
