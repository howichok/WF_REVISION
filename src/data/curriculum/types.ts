import type { MaterialCardData } from "@/components/ui";
import type { TopicId } from "@/lib/types";

export type SourceClassification = "primary" | "secondary" | "legacy" | "duplicate";

export type ContentSourceKind =
  | "specification"
  | "textbook"
  | "question-bank"
  | "past-paper"
  | "mark-scheme";

export type ResourceDisplayType =
  | "past-paper"
  | "notes"
  | "video"
  | "worksheet"
  | "slides";

export interface ContentSource {
  id: string;
  title: string;
  kind: ContentSourceKind;
  classification: SourceClassification;
  filePath: string;
  year?: number;
  duplicateOfId?: string;
  caution?: string;
  notes: string;
}

export interface QualificationComponent {
  id: string;
  title: string;
  summary: string;
  focus: string;
  routeHint?: string;
}

export interface QualificationOverview {
  id: string;
  title: string;
  level: string;
  duration: string;
  industryPlacement: string;
  summary: string;
  coreTopics: string[];
  occupationalSpecialismTopics: string[];
  assessmentComponents: QualificationComponent[];
}

export interface ExamGuideEntry {
  id: string;
  title: string;
  series: string;
  dateLabel: string;
  isoDate?: string;
  duration?: string;
  summary: string;
  routeHint?: string;
  sourceId: string;
  emphasis: "paper-1" | "paper-2" | "project" | "results" | "resit";
}

export interface ExamGuide {
  id: string;
  title: string;
  summary: string;
  caution: string;
  sourceLabel: string;
  entries: ExamGuideEntry[];
}

export interface CurriculumPoint {
  id: string;
  code: string;
  title: string;
  summary: string;
  areaId: string;
  areaCode: string;
  relatedTerms: string[];
  relatedConcepts: string[];
  markSchemeIdeas: string[];
  practicePrompts: string[];
}

export interface CurriculumArea {
  id: string;
  code: string;
  title: string;
  summary: string;
  officialSourceId: string;
  points: CurriculumPoint[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  aliases?: string[];
  curriculumPointIds: string[];
  legacyTopicIds: TopicId[];
}

export interface AnswerRubricSignalGroup {
  anyOf: string[];
}

export interface AnswerRubricSlot {
  id: string;
  label: string;
  weight: number;
  minimumGroups?: number;
  groups: AnswerRubricSignalGroup[];
  missingFeedback: string;
}

export interface QuestionEvaluationProfile {
  depthExpectation?: "brief" | "explained" | "developed";
  strongAnswerGuidance?: string;
  slots: AnswerRubricSlot[];
}

export interface ContentResource {
  id: string;
  title: string;
  kind: ContentSourceKind;
  displayType: ResourceDisplayType;
  sourceId: string;
  filePath: string;
  summary: string;
  year?: number;
  curriculumPointIds: string[];
  legacyTopicIds: TopicId[];
  tags: string[];
  estimatedMinutes?: number;
}

export type QuestionType =
  | "short-open"
  | "medium-open"
  | "extended-response"
  | "scenario"
  | "question-bank-section";

export interface QuestionMetadata {
  id: string;
  sourceId: string;
  title: string;
  sourceLabel: string;
  year?: number;
  paper?: string;
  marks?: number;
  questionType: QuestionType;
  summary: string;
  expectation: string;
  curriculumPointIds: string[];
  legacyTopicIds: TopicId[];
  practicePrompt: string;
  markSchemeConceptIds: string[];
  evaluationProfile?: QuestionEvaluationProfile;
}

export interface MarkSchemeConceptMetadata {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  conceptTargets: string[];
  curriculumPointIds: string[];
  legacyTopicIds: TopicId[];
}

export interface LegacyTopicMapping {
  topicId: TopicId;
  officialPointIds: string[];
  note: string;
}

export interface TopicContentBundle {
  mapping: LegacyTopicMapping | null;
  officialPoints: CurriculumPoint[];
  terms: GlossaryTerm[];
  resources: ContentResource[];
  questions: QuestionMetadata[];
}

export interface SearchResultItem {
  id: string;
  score: number;
}

export interface StructuredSearchResults {
  curriculumPoints: CurriculumPoint[];
  glossaryTerms: GlossaryTerm[];
  resources: ContentResource[];
  questions: QuestionMetadata[];
}

export interface RecommendedMaterial extends MaterialCardData {
  resourceId: string;
}
