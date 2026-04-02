import type {
  RevisionAnswerEvaluation,
  RevisionImprovementOutputMode,
  RevisionImprovementResponse,
  TopicIntelligenceResponse,
} from "./types";
import type { RevisionPredictionBand } from "./revision-prediction";

export type IntelligenceStreamEventName =
  | "status"
  | "prediction"
  | "meta"
  | "section"
  | "chunk"
  | "final"
  | "error";

export interface IntelligenceStreamStatusPayload {
  stage: string;
  message: string;
}

export interface IntelligenceStreamPredictionPayload {
  source: "revision-evaluate" | "revision-improve";
  band: RevisionPredictionBand;
  scorePercent: number;
  score: number;
  maxScore: number;
}

export interface IntelligenceStreamErrorPayload {
  message: string;
}

export interface IntelligenceStreamChunkPayload {
  text: string;
}

export interface IntelligenceStreamSectionPayload {
  section: "examSafeFocus" | "precisionCues" | "misconceptions" | "next-step";
  items?: string[];
  action?: TopicIntelligenceResponse["suggestedNextAction"];
}

export type TopicAssistantSectionPayload = IntelligenceStreamSectionPayload;

export interface RevisionEvaluationStreamMeta {
  mode: "revision-answer";
  questionId: string;
  topicId: string;
}

export interface RevisionImproveStreamMeta {
  mode: "revision-improve";
  questionId: string;
  topicId: string;
  outputMode: RevisionImprovementOutputMode;
  provider?: RevisionImprovementResponse["provider"];
  model?: string;
}

export type IntelligenceStreamMetaPayload =
  | RevisionEvaluationStreamMeta
  | RevisionImproveStreamMeta
  | TopicIntelligenceResponse;

export type IntelligenceStreamFinalPayload =
  | RevisionAnswerEvaluation
  | RevisionImprovementResponse
  | TopicIntelligenceResponse;

export function toSseEvent(event: IntelligenceStreamEventName, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function splitTextIntoChunks(value: string) {
  const tokens = value.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];

  for (let index = 0; index < tokens.length; ) {
    const size = tokens[index]?.trim().length > 7 ? 2 : 3;
    chunks.push(tokens.slice(index, index + size).join(""));
    index += size;
  }

  return chunks.length > 0 ? chunks : [value];
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
