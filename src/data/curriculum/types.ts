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

export type ExamMetadataPaper = "paper_1" | "paper_2";

export type ExamMetadataCommandWord =
  | "give"
  | "state"
  | "name"
  | "identify"
  | "write"
  | "describe"
  | "explain"
  | "explain with additional justification"
  | "discuss"
  | "evaluate"
  | "draw"
  | "complete";

export type ExamMetadataAssessmentObjective =
  | "AO1a"
  | "AO1b"
  | "AO2"
  | "AO3a"
  | "AO3b";

export type ExamMetadataDifficulty = "low" | "medium" | "high";

export type ExamMetadataAssessmentTrack = "esp";

export type EspTask =
  | "pre_release"
  | "task_1"
  | "task_2"
  | "task_3"
  | "task_4a"
  | "task_4b";

export type EspBriefType =
  | "brief-analysis"
  | "project-plan"
  | "defect-fix"
  | "solution-design"
  | "solution-development"
  | "reflective-evaluation";

export type EspDeliverableType =
  | "brief-note"
  | "project-plan-rationale"
  | "corrected-code-test-log"
  | "algorithm-design"
  | "working-code-evidence"
  | "reflective-evaluation";

export interface ExamMetadataIndicativeMarkScheme {
  type: "points_based" | "levels_based";
  points: string[];
  judgementRequired: boolean;
  modelAnswerOutline: string;
}

export interface ExamMetadataValidation {
  fitsPaperBoundary: boolean;
  fitsCommandWord: boolean;
  fitsMarkDemand: boolean;
  specGrounded: boolean;
  sourceGrounded: boolean;
  notDuplicate: boolean;
  scenarioDistinct: boolean;
  answerLogicDistinct: boolean;
}

export interface QuestionExamMetadata {
  paper?: ExamMetadataPaper;
  assessmentTrack?: ExamMetadataAssessmentTrack;
  espTask?: EspTask;
  vocationalContext?: string;
  briefType?: EspBriefType;
  deliverableType?: EspDeliverableType;
  relatedContentAreas?: string[];
  contentArea?: string;
  subtopic?: string;
  commandWord?: ExamMetadataCommandWord;
  assessmentObjectives?: ExamMetadataAssessmentObjective[];
  stimulus?: string;
  difficulty?: ExamMetadataDifficulty;
  indicativeMarkScheme?: ExamMetadataIndicativeMarkScheme;
  sourceReference?: string;
  sourceFile?: string;
  sourceExcerptHash?: string;
  generationBatch?: string;
  validation?: ExamMetadataValidation;
  examinerRationale?: string;
  reviewDecision?: "keep" | "revise" | "reject";
  duplicationRisk?: "low" | "medium" | "high";
  realismScore?: number;
  scenarioSignature?: string;
  answerLogicSignature?: string;
  responseFormat?: "written" | "code" | "diagram" | "table" | "mixed";
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
  examMetadata?: QuestionExamMetadata;
  reviewed?: boolean;
  active?: boolean;
}

export type CoverageQuestionVariant =
  | "core-explain"
  | "scenario-apply"
  | "compare-justify"
  | "evaluate-impact"
  | "design-decision"
  | "risk-priority"
  | "evaluate-tradeoff"
  | "fix-misconception";

export interface CoverageRewriteRule {
  target: string;
  hint: string;
  microRewrite?: string;
}

export interface CurriculumPointCoverageNode {
  pointId: string;
  pointCode: string;
  pointTitle: string;
  legacyTopicIds: TopicId[];
  relatedTerms: string[];
  relatedConcepts: string[];
  questionIds: string[];
  generatedQuestionIds: string[];
  generatedVariants: CoverageQuestionVariant[];
  misconceptionSignals: string[];
  rewriteRules: CoverageRewriteRule[];
  resourcePriorityIds: string[];
  followUpQuestionIds: string[];
  commandWordTargets: string[];
  improvementSignals: string[];
}

export interface TopicCoverageGraph {
  topicId: TopicId;
  coveredPointIds: string[];
  generatedQuestionIds: string[];
  generatedQuestionCount: number;
  totalQuestionCount: number;
  relatedTerms: string[];
  coverageByPoint: CurriculumPointCoverageNode[];
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
