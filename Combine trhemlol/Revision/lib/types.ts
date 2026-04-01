export type PaperId = "paper1" | "paper2";

export interface SyllabusSection {
  id: string;
  title: string;
  sections?: SyllabusSection[];
  outcomes?: string[];
}

export interface SyllabusPaper {
  id: "P1" | "P2";
  name: string;
  exam_duration_minutes: number;
  exam_date: string;
  content_areas: SyllabusSection[];
}

export interface SyllabusRoot {
  qualification: string;
  component: string;
  source: {
    document: string;
    publisher: string;
    version: string;
    publication_month: string;
  };
  papers: SyllabusPaper[];
  notes?: Record<string, string>;
}

export interface Subtopic {
  id: string;
  title: string;
  notes: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  summary: string;
  subtopics: Subtopic[];
  parentId?: string | null;
  depth?: number;
  outcomes?: string[];
  childrenIds?: string[];
  pathIds?: string[];
}

export interface Paper {
  id: PaperId;
  slug: string;
  title: string;
  examTitle: string;
  examDate: string;
  durationMinutes: number;
  topics: Topic[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  paperId: PaperId;
  topicId: string;
  topicSlug: string;
}

export interface QuizQuestion {
  id: string;
  paperId: PaperId;
  topicId: string;
  subtopicId?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  diagnostic: boolean;
}

export interface Flashcard {
  id: string;
  paperId: PaperId;
  topicId: string;
  term: string;
  prompt: string;
  answer: string;
  tags: string[];
}

export interface RubricCriterion {
  id: string;
  label: string;
  weight: number;
  keywords: string[];
  synonyms?: string[];
}

export interface RubricDefinition {
  title: string;
  criteria: RubricCriterion[];
}

export interface CodingTestCase {
  id: string;
  description: string;
  args: unknown[];
  expected: unknown;
}

export interface CodingTask {
  language: "javascript";
  functionName: string;
  starterCode: string;
  tests: CodingTestCase[];
}

export type ExamAnswerType = "open-ended" | "coding";

export interface ExamQuestion {
  id: string;
  paperId: PaperId;
  topicIds: string[];
  title: string;
  scenario: string;
  task: string;
  answerType: ExamAnswerType;
  markSchemeHints: string[];
  recommendedMinutes: number;
  rubric?: RubricDefinition;
  codingTask?: CodingTask;
}

export interface Profile {
  nickname: string;
  email?: string;
  createdAt: string;
}

export interface Settings {
  minutesPerDay?: number;
  hoursPerWeek?: number;
  daysPerWeek: number;
  onboardingComplete: boolean;
}

export interface TopicProgress {
  topicId: string;
  paperId: PaperId;
  mastery: number;
  weakManual: boolean;
  weakBonus: number;
  correctAnswers: number;
  totalAnswers: number;
  lastReviewedAt?: string;
}

export interface FlashcardProgress {
  cardId: string;
  box: 1 | 2 | 3 | 4 | 5;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface SessionLog {
  id: string;
  date: string;
  mode: "revision" | "quiz" | "exam";
  paperId?: PaperId;
  topicIds: string[];
  score: number;
  durationMinutes: number;
}

export interface ExamAttempt {
  id: string;
  date: string;
  paperId: PaperId;
  score: number;
  durationMinutes: number;
  weakTopics: string[];
}

export interface Streak {
  current: number;
  best: number;
  lastActiveDate?: string;
}

export interface RubricFoundPoint {
  criterionId: string;
  label: string;
  weight: number;
  matchedTerm: string;
  matchedFragment: string;
  similarity: number;
}

export interface RubricMissingPoint {
  criterionId: string;
  label: string;
  weight: number;
  expectedTerms: string[];
}

export interface RubricSuspiciousPoint {
  criterionId: string;
  label: string;
  matchedTerm: string;
  matchedFragment: string;
  similarity: number;
}

export interface RubricCheckReport {
  score: number;
  maxScore: number;
  percentage: number;
  found: RubricFoundPoint[];
  missing: RubricMissingPoint[];
  suspicious: RubricSuspiciousPoint[];
}

export interface SpellIssue {
  word: string;
  normalizedWord: string;
  start: number;
  end: number;
  suggestions: string[];
}

export interface CodingTestResult {
  id: string;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export interface CodingCheckReport {
  score: number;
  maxScore: number;
  percentage: number;
  compileError?: string;
  tests: CodingTestResult[];
}

export interface AnswerCheckReport {
  questionId: string;
  paperId: PaperId;
  questionTitle: string;
  answerType: ExamAnswerType;
  response: string;
  rubricReport?: RubricCheckReport;
  spellIssues?: SpellIssue[];
  codingReport?: CodingCheckReport;
  score: number;
  maxScore: number;
  percentage: number;
  checkedAt: string;
}

export interface AnswerCheckHistoryItem extends AnswerCheckReport {
  id: string;
}

export interface PersistedAppState {
  profile: Profile | null;
  settings: Settings;
  topicProgress: Record<string, TopicProgress>;
  flashcardProgress: Record<string, FlashcardProgress>;
  sessionLogs: SessionLog[];
  examAttempts: ExamAttempt[];
  answerCheckHistory: AnswerCheckHistoryItem[];
  dailyMinutes: Record<string, number>;
  streak: Streak;
}

export interface TopicWorkload {
  topicId: string;
  paperId: PaperId;
  title: string;
  mastery: number;
  weight: number;
  weakManual: boolean;
}
