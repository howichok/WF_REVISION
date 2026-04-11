import type { RefObject } from "react";
import type { RevisionPredictionBand } from "@/lib/intelligence/revision-prediction";

export type OverlayPhase =
  | "idle"
  | "ready"
  | "checking"
  | "fail"
  | "merit"
  | "distinction"
  | "error";

export type DockMode = "float" | "snap";
export type RevisionModeGroup = "Exam questions" | "Simple revision";

export interface RevisionSurfaceRegistration {
  surfaceId: string;
  topicId: string;
  topicLabel: string;
  prompt: string;
  modeGroup?: RevisionModeGroup;
  modeLabel?: string;
  anchorRef: RefObject<HTMLElement | null>;
  scanRef?: RefObject<HTMLElement | null>;
  onUndoLastEdit?: () => void;
  onClearInsertedCues?: () => void;
}

export interface RevisionSurfaceUpdate {
  surfaceId: string;
  prompt?: string;
  answer: string;
  canUndoEdits?: boolean;
  canClearInsertedCues?: boolean;
}

export interface RevisionCheckCompleteInput {
  surfaceId: string;
  scorePercent: number;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface RevisionCheckErrorInput {
  surfaceId: string;
  message: string;
}

export interface RevisionImproveCompleteInput {
  surfaceId: string;
  outputMode: "commentator" | "diff";
  highlightedCount: number;
  changeCount: number;
}

export interface RevisionPredictionInput {
  surfaceId: string;
  band: RevisionPredictionBand;
  scorePercent: number;
  score: number;
  maxScore: number;
  source: "revision-evaluate" | "revision-improve";
}

export interface RevisionProgressInput {
  surfaceId: string;
  statusLine?: string;
  note?: string;
}

export interface OverlayRecommendedAction {
  label: string;
  href: string;
  kind: "route" | "external";
}

export interface GuidedSessionStartInput {
  surfaceId: string;
  statusLine: string;
  note?: string;
}

export interface GuidedSessionCompleteInput {
  surfaceId: string;
  phase?: OverlayPhase;
  statusLine: string;
  note?: string;
  scoreLabel?: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

export interface GuidedSessionErrorInput {
  surfaceId: string;
  message: string;
  note?: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

export interface SurfaceRecommendationsInput {
  surfaceId: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

export interface OverlaySessionState {
  topicId?: string;
  topicLabel: string;
  modeGroup?: RevisionModeGroup;
  modeLabel?: string;
  prompt: string;
  answerPreview: string;
  wordCount: number;
  phase: OverlayPhase;
  statusLine: string;
  scoreLabel?: string;
  note?: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

export interface OverlaySurfaceMeta {
  surfaceId: string;
  topicId: string;
  topicLabel: string;
  modeGroup: RevisionModeGroup;
  modeLabel: string;
  prompt: string;
  answerPreview: string;
  wordCount: number;
  canUndoEdits: boolean;
  canClearInsertedCues: boolean;
}

export interface AiOverlayContextValue {
  registerRevisionSurface: (surface: RevisionSurfaceRegistration) => void;
  unregisterRevisionSurface: (surfaceId: string) => void;
  syncRevisionSurface: (input: RevisionSurfaceUpdate) => void;
  startRevisionCheck: (surfaceId: string) => void;
  setRevisionPrediction: (input: RevisionPredictionInput) => void;
  streamRevisionProgress: (input: RevisionProgressInput) => void;
  completeRevisionCheck: (input: RevisionCheckCompleteInput) => void;
  failRevisionCheck: (input: RevisionCheckErrorInput) => void;
  startRevisionImprove: (surfaceId: string) => void;
  completeRevisionImprove: (input: RevisionImproveCompleteInput) => void;
  failRevisionImprove: (input: RevisionCheckErrorInput) => void;
  startGuidedSession: (input: GuidedSessionStartInput) => void;
  completeGuidedSession: (input: GuidedSessionCompleteInput) => void;
  failGuidedSession: (input: GuidedSessionErrorInput) => void;
  setSurfaceRecommendations: (input: SurfaceRecommendationsInput) => void;
  undoLastEdit: (surfaceId: string) => void;
  clearInsertedCues: (surfaceId: string) => void;
  setOverlaySuppressed: (suppressed: boolean) => void;
}
