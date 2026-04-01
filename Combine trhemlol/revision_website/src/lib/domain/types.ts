export type Difficulty = "core" | "extended" | "stretch";
export type PaperType = "paper-1" | "paper-2" | "esp" | "os";
export type SourceProvider = "Pearson" | "Teacher-made" | "Derived";
export type SourceType = "live-paper" | "specification-derived" | "project-prep" | "scenario";
export type LearnerLevel = "emerging" | "developing" | "secure";

export interface Subtopic {
  id: string;
  title: string;
  page?: number;
  outcomes: string[];
}

export interface Topic {
  id: string;
  paper: PaperType;
  title: string;
  summary: string;
  subtopics: Subtopic[];
  contentArea?: number;
  pageStart?: number;
  pageEnd?: number;
}

export interface Question {
  id: string;
  sourceProvider: SourceProvider;
  sourceType: SourceType;
  sourceName: string;
  year: number | null;
  season?: string;
  component: string;
  paper: PaperType;
  sectionName: string;
  questionNumber: string;
  topicId: string;
  subtopicId: string;
  commandWord: string;
  markValue: number;
  difficulty: Difficulty;
  prompt: string;
  title: string;
  answerType: string;
  estimatedMinutes: number;
  skillTags: string[];
  tags: string[];
  markSchemeId: string;
  markSchemePoints: string[];
  commonPitfalls: string[];
}

export interface FeedbackRule {
  id: string;
  title: string;
  shape: string;
  description: string;
  feedbackChecks: string[];
}

export interface MarkScheme {
  id: string;
  questionId: string;
  linkedPoints: Array<{
    primaryPoint: string;
    explanatoryExpansion: string;
  }>;
  applicationToScenarioRequired: boolean;
  applicationCriteria: string[];
  commandWordFulfillment: { expectedAction: string; penaltyIfMissed: string };
  evaluationRequirements: { conclusionRequired: boolean; justificationRequired: boolean };
  partialCreditBreakdown: Array<{ marks: number; criteria: string }>;
  examinerGuidance: string;
}

export interface AttemptEvaluation {
  id: string;
  questionId: string;
  answeredAt: string;
  timeSpentSeconds: number;
  scoreAchieved: number;
  maxScore: number;
  writtenResponse: string;
  missingKnowledgePoints: string[];
  weakApplicationToScenario: boolean;
  poorCommandWordFulfillment: boolean;
  lackOfEvaluationOrConclusion: boolean;
  retryState: "pending" | "resolved";
}

export interface AttemptDraft {
  questionId: string;
  timeSpentSeconds: number;
  scoreAchieved: number;
  maxScore: number;
  writtenResponse: string;
  missingKnowledgePoints: string[];
  weakApplicationToScenario: boolean;
  poorCommandWordFulfillment: boolean;
  lackOfEvaluationOrConclusion: boolean;
}

export interface ProgressState {
  attempts: AttemptEvaluation[];
  bookmarks: string[];
}

export interface OnboardingAssessmentOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface OnboardingAssessmentQuestion {
  id: string;
  paper: PaperType;
  topicId: string;
  subtopicId: string;
  title: string;
  prompt: string;
  supportLabel: string;
  difficulty: Difficulty;
  options: OnboardingAssessmentOption[];
  explanation: string;
}

export interface OnboardingAssessmentAnswer {
  questionId: string;
  topicId: string;
  paper: PaperType;
  selectedOptionId: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface LearnerProfileState {
  onboardingCompleted: boolean;
  onboardingStep: number;
  studyPath: "mixed" | PaperType;
  selectedPapers: PaperType[];
  weakTopicIds: string[];
  weakSubtopicIds: string[];
  assessmentAnswers: OnboardingAssessmentAnswer[];
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
}

export interface RevisionUser {
  id: string;
  username: string;
  usernameKey: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  progress: ProgressState;
  profile: LearnerProfileState;
}

export interface LearnerTopicSignal {
  topicId: string;
  title: string;
  paper: PaperType;
  score: number;
  route: string;
  manualWeak: boolean;
  assessmentCorrect: number;
  assessmentTotal: number;
  practiceAttempts: number;
  practiceMastery: number | null;
  drivers: string[];
}

export interface LearnerExamPlan {
  paper: PaperType;
  title: string;
  shortTitle: string;
  kind: "task" | "exam" | "milestone";
  examDate: string;
  daysUntil: number;
  topicsToCover: number;
  priorityTopicIds: string[];
  focusLabel: string;
  route: string;
}

export interface LearnerPersonalisation {
  studyPathLabel: string;
  level: LearnerLevel;
  averageScore: number;
  strengths: LearnerTopicSignal[];
  weakAreas: LearnerTopicSignal[];
  priorities: LearnerTopicSignal[];
  recommendedTopic: LearnerTopicSignal | null;
  upcomingExam: LearnerExamPlan | null;
}

export interface LibraryResource {
  id: string;
  title: string;
  category: "Past Papers" | "Mark Schemes" | "PDFs" | "Revision Notes" | "Teacher Resources";
  description: string;
  href: string;
  fileName: string;
  extension: string;
  tags: string[];
}

export interface TopicMastery {
  topicId: string;
  title: string;
  paper: PaperType;
  masteryPercent: number;
  accuracyPercent: number;
  coveragePercent: number;
  attemptCount: number;
  recentTrend: number;
  averageTimeRatio: number;
  frequentGaps: string[];
}

export interface PaperReadiness {
  paper: PaperType;
  readinessPercent: number;
  topicsCovered: number;
  totalTopics: number;
}

export interface WeakTopicSignal {
  topicId: string;
  title: string;
  paper: PaperType;
  strength: number;
  reasons: string[];
  primaryGap: string | null;
}

export interface ActionDirective {
  id: string;
  title: string;
  reason: string;
  route: string;
  estimatedMinutes: number;
  type: "mistake-retry" | "triage-drill" | "paper-prep" | "knowledge-bootstrap";
  topicId?: string;
  questionId?: string;
  paper?: PaperType;
}

export interface CurriculumAssessment {
  id: string;
  title: string;
  contentAreas?: Topic[];
}

export interface CurriculumMap {
  qualification: {
    id: string;
    title: string;
    qualificationNumber: string;
    firstTeaching: string;
  };
  components: Array<{
    id: string;
    title: string;
    assessments?: CurriculumAssessment[];
    assessment?: {
      id: string;
      title: string;
      performanceOutcomes: string[];
      contentAreas: Array<{
        id: string;
        title: string;
        pageStart: number;
        pageEnd: number;
        focus: string[];
      }>;
    };
  }>;
}
