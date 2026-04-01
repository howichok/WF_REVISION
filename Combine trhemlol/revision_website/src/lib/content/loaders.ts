import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import type {
  CurriculumMap,
  FeedbackRule,
  LibraryResource,
  PaperType,
  Question,
  SourceProvider,
  SourceType,
  Topic,
} from "@/lib/domain/types";

const derivedRoot = path.join(process.cwd(), "docs", "derived");
const sourcePdfRoot = path.join(process.cwd(), "docs", "source-pdfs");

function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(path.join(derivedRoot, fileName), "utf-8")) as T;
}

function normalizePaper(paper: string): PaperType {
  if (paper === "employer-set-project") return "esp";
  if (paper === "occupational-specialism") return "os";
  return paper as PaperType;
}

function normalizeDifficulty(value: string): Question["difficulty"] {
  if (value === "foundation") return "core";
  if (value === "secure") return "extended";
  return "stretch";
}

function normalizeSourceProvider(value: string): SourceProvider {
  if (value === "official-past-paper") return "Pearson";
  if (value === "curriculum-authored") return "Derived";
  return "Derived";
}

function normalizeSourceType(value: string): SourceType {
  if (value === "official-past-paper") return "live-paper";
  if (value === "curriculum-authored") return "specification-derived";
  return "scenario";
}

function normalizeQuestionNumber(section: string, index: number): string {
  if (section === "section-a") return `${index + 1}`;
  if (section === "section-b") return `${index + 1}`;
  if (section === "project-prep") return `${index + 1}`;
  return `${index + 1}`;
}

type RawCurriculumMap = {
  qualification: {
    id: string;
    title: string;
    qualification_number: string;
    first_teaching: string;
  };
  components: Array<{
    id: string;
    title: string;
    assessments?: Array<{
      id: string;
      title: string;
      content_areas?: Array<{
        id: string;
        paper: string;
        content_area: number;
        title: string;
        summary: string;
        page_start: number;
        page_end: number;
        subtopics: Array<{
          id: string;
          title: string;
          page?: number;
          outcomes: string[];
        }>;
      }>;
    }>;
    assessment?: {
      id: string;
      title: string;
      performance_outcomes: string[];
      content_areas: Array<{
        id: string;
        title: string;
        page_start: number;
        page_end: number;
        focus: string[];
      }>;
    };
  }>;
};

type RawQuestion = {
  id: string;
  source_type: string;
  source_name: string;
  component: string;
  paper: string;
  year: string;
  season: string;
  section: string;
  topic_id: string;
  subtopic_id: string;
  command_word: string;
  marks: number;
  difficulty: string;
  answer_type: string;
  estimated_minutes: number;
  title: string;
  prompt: string;
  mark_scheme_points: string[];
  common_pitfalls: string[];
  feedback_rule_id: string;
  tags: string[];
};

type RawFeedbackRule = {
  id: string;
  title: string;
  shape: string;
  description: string;
  feedback_checks: string[];
};

type RawTopic = NonNullable<
  NonNullable<RawCurriculumMap["components"][number]["assessments"]>[number]["content_areas"]
>[number];

function normalizeTopic(rawTopic: RawTopic): Topic {
  return {
    id: rawTopic.id,
    paper: normalizePaper(rawTopic.paper),
    title: rawTopic.title,
    summary: rawTopic.summary,
    contentArea: rawTopic.content_area,
    pageStart: rawTopic.page_start,
    pageEnd: rawTopic.page_end,
    subtopics: rawTopic.subtopics.map((subtopic) => ({
      id: subtopic.id,
      title: subtopic.title,
      page: subtopic.page,
      outcomes: subtopic.outcomes,
    })),
  };
}

export function loadCurriculumMap(): CurriculumMap {
  const raw = readJson<RawCurriculumMap>("curriculum-map.json");

  return {
    qualification: {
      id: raw.qualification.id,
      title: raw.qualification.title,
      qualificationNumber: raw.qualification.qualification_number,
      firstTeaching: raw.qualification.first_teaching,
    },
    components: raw.components.map((component) => ({
      id: component.id,
      title: component.title,
      assessments: component.assessments?.map((assessment) => ({
        id: normalizePaper(assessment.id),
        title: assessment.title,
        contentAreas: assessment.content_areas?.map(normalizeTopic),
      })),
      assessment: component.assessment
        ? {
            id: normalizePaper(component.assessment.id),
            title: component.assessment.title,
            performanceOutcomes: component.assessment.performance_outcomes,
            contentAreas: component.assessment.content_areas.map((area) => ({
              id: area.id,
              title: area.title,
              pageStart: area.page_start,
              pageEnd: area.page_end,
              focus: area.focus,
            })),
          }
        : undefined,
    })),
  };
}

export function loadQuestionBank(): Question[] {
  const rawQuestions = readJson<RawQuestion[]>("question-bank.json");

  return rawQuestions.map((question, index) => ({
    id: question.id,
    sourceProvider: normalizeSourceProvider(question.source_type),
    sourceType: normalizeSourceType(question.source_type),
    sourceName: question.source_name,
    year: question.year ? Number(question.year) || null : null,
    season: question.season || undefined,
    component: question.component,
    paper: normalizePaper(question.paper),
    sectionName: question.section,
    questionNumber: normalizeQuestionNumber(question.section, index),
    topicId: question.topic_id,
    subtopicId: question.subtopic_id,
    commandWord: question.command_word,
    markValue: question.marks,
    difficulty: normalizeDifficulty(question.difficulty),
    prompt: question.prompt,
    title: question.title,
    answerType: question.answer_type,
    estimatedMinutes: question.estimated_minutes,
    skillTags: question.tags,
    tags: question.tags,
    markSchemeId: question.feedback_rule_id,
    markSchemePoints: question.mark_scheme_points,
    commonPitfalls: question.common_pitfalls,
  }));
}

export function loadFeedbackRules(): FeedbackRule[] {
  const rawRules = readJson<RawFeedbackRule[]>("feedback-rules.json");
  return rawRules.map((rule) => ({
    id: rule.id,
    title: rule.title,
    shape: rule.shape,
    description: rule.description,
    feedbackChecks: rule.feedback_checks,
  }));
}

export function loadTopicSkillMap(): Record<string, { skills: string[]; practice_modes: string[]; question_shapes: string[] }> {
  return readJson("topic-skill-map.json");
}

export function getAllTopics(curriculum: CurriculumMap): Topic[] {
  return curriculum.components
    .flatMap((component) => component.assessments ?? [])
    .flatMap((assessment) => assessment.contentAreas ?? []);
}

export function getPaperTopics(curriculum: CurriculumMap, paperId: PaperType): Topic[] {
  return getAllTopics(curriculum).filter((topic) => topic.paper === paperId);
}

export function getTopicById(curriculum: CurriculumMap, topicId: string): Topic | undefined {
  return getAllTopics(curriculum).find((topic) => topic.id === topicId);
}

export function getQuestionsForPaper(questions: Question[], paperId: PaperType): Question[] {
  return questions.filter((question) => question.paper === paperId);
}

export function getQuestionsForTopic(questions: Question[], topicId: string): Question[] {
  return questions.filter((question) => question.topicId === topicId);
}

export function getQuestionById(questions: Question[], questionId: string): Question | undefined {
  return questions.find((question) => question.id === questionId);
}

function buildResourceHref(relativePath: string): string {
  return `/api/resources?path=${encodeURIComponent(relativePath.replace(/\\/g, "/"))}`;
}

function normaliseFileTitle(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return baseName
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bpdf\b/gi, "")
    .trim();
}

function buildResourceDescription(fileName: string, category: LibraryResource["category"]): string {
  if (category === "Past Papers") return `Timed paper material for ${normaliseFileTitle(fileName)}.`;
  if (category === "Mark Schemes") return `Examiner guidance and mark allocation for ${normaliseFileTitle(fileName)}.`;
  if (category === "Revision Notes") return `Reference notes covering ${normaliseFileTitle(fileName)}.`;
  if (category === "Teacher Resources") return `Supporting planning material for ${normaliseFileTitle(fileName)}.`;
  return `Qualification reference document: ${normaliseFileTitle(fileName)}.`;
}

function extractResourceTags(fileName: string): string[] {
  const lowerName = fileName.toLowerCase();
  const tags: string[] = [];

  if (lowerName.includes("paper 1") || lowerName.includes("core-1")) tags.push("Paper 1");
  if (lowerName.includes("paper 2") || lowerName.includes("core-paper-2")) tags.push("Paper 2");
  if (lowerName.includes("esp")) tags.push("ESP");
  if (lowerName.includes("occupational")) tags.push("Occupational Specialism");
  if (lowerName.includes("spec")) tags.push("Specification");
  if (lowerName.includes("mark")) tags.push("Mark scheme");

  return tags;
}

function classifyPdfCategory(fileName: string): LibraryResource["category"] {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("mark scheme")) return "Mark Schemes";
  if (lowerName.includes("specification")) return "PDFs";
  return "Past Papers";
}

function classifyDerivedCategory(fileName: string): LibraryResource["category"] {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("data-contracts") || lowerName.includes("ui-navigation") || lowerName.includes("recommendation-logic") || lowerName.endsWith(".csv")) {
    return "Teacher Resources";
  }
  return "Revision Notes";
}

export function loadLibraryResources(): LibraryResource[] {
  const sourceResources = readdirSync(sourcePdfRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const category = classifyPdfCategory(entry.name);
      const relativePath = path.join("docs", "source-pdfs", entry.name);

      return {
        id: `pdf-${entry.name}`,
        title: normaliseFileTitle(entry.name),
        category,
        description: buildResourceDescription(entry.name, category),
        href: buildResourceHref(relativePath),
        fileName: entry.name,
        extension: "pdf",
        tags: extractResourceTags(entry.name),
      } satisfies LibraryResource;
    });

  const derivedResources = readdirSync(derivedRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".csv")))
    .map((entry) => {
      const category = classifyDerivedCategory(entry.name);
      const relativePath = path.join("docs", "derived", entry.name);

      return {
        id: `derived-${entry.name}`,
        title: normaliseFileTitle(entry.name),
        category,
        description: buildResourceDescription(entry.name, category),
        href: buildResourceHref(relativePath),
        fileName: entry.name,
        extension: path.extname(entry.name).replace(".", ""),
        tags: extractResourceTags(entry.name),
      } satisfies LibraryResource;
    });

  return [...sourceResources, ...derivedResources].sort((left, right) => left.title.localeCompare(right.title));
}
