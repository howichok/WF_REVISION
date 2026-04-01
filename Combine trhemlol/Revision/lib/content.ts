import syllabusData from "@/content/syllabus.json";
import outcomesData from "@/content/outcomes-text.json";
import glossaryData from "@/data/glossary.json";
import quizData from "@/data/quizQuestions.json";
import flashcardsData from "@/data/flashcards.json";
import examData from "@/data/examQuestions.json";
import type {
  ExamQuestion,
  Flashcard,
  GlossaryTerm,
  Paper,
  PaperId,
  QuizQuestion,
  SyllabusRoot,
  SyllabusSection,
  Topic,
} from "@/lib/types";

export interface TopicTreeNode {
  id: string;
  title: string;
  paperId: PaperId;
  paperSlug: string;
  depth: number;
  parentId: string | null;
  outcomes: string[];
  children: TopicTreeNode[];
  pathIds: string[];
}

const rawSyllabus = syllabusData as SyllabusRoot;
const rawOutcomeText = outcomesData as {
  parsed_outcomes?: Record<string, string>;
};
const outcomeTextById = rawOutcomeText.parsed_outcomes ?? {};

const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/â€™|â€˜/g, "'"],
  [/â€œ|â€/g, '"'],
  [/â€“|â€”/g, "-"],
  [/â€¦/g, "..."],
  [/â€¢/g, "-"],
  [/Â/g, ""],
];

const SYLLABUS_TO_PAPER_ID = {
  P1: "paper1",
  P2: "paper2",
} as const;

const PAPER_ID_TO_SYLLABUS = {
  paper1: "P1",
  paper2: "P2",
} as const;

const PAPER_SLUG = {
  paper1: "p1",
  paper2: "p2",
} as const;

export const syllabus = rawSyllabus;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeOutcomeText(text: string): string {
  let next = text;

  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  // PDF extraction keeps list markers as "?" and "o" tokens.
  next = next
    .replace(/:\s*\?/g, ": ")
    .replace(/:\s*o\s+/g, ": ")
    .replace(/\s\?\s(?=[A-Za-z0-9])/g, "; ")
    .replace(/\so\s(?=[A-Za-z0-9])/g, "; ");

  return normalizeWhitespace(next);
}

function shortOutcomeText(text: string, limit = 150): string {
  const compact = sanitizeOutcomeText(text);
  return compact.length <= limit ? compact : `${compact.slice(0, limit - 3)}...`;
}

export function getOutcomeText(outcomeId: string): string {
  const found = outcomeTextById[outcomeId];
  if (found) {
    return sanitizeOutcomeText(found);
  }
  return `Outcome ${outcomeId} is listed in the syllabus. Add local notes and examples here.`;
}

function normalizePaperId(sourceId: "P1" | "P2"): PaperId {
  return SYLLABUS_TO_PAPER_ID[sourceId];
}

function syllabusPaperId(paperId: PaperId): "P1" | "P2" {
  return PAPER_ID_TO_SYLLABUS[paperId];
}

function slugForPaper(paperId: PaperId): string {
  return PAPER_SLUG[paperId];
}

function titleForPaper(paperId: PaperId): string {
  return paperId === "paper1" ? "Paper 1" : "Paper 2";
}

function buildSubtopics(section: SyllabusSection) {
  const childSections = section.sections ?? [];
  const outcomes = section.outcomes ?? [];

  if (childSections.length > 0) {
    return childSections.map((child) => ({
      id: child.id,
      title: `${child.id} ${child.title}`,
      notes: (child.outcomes ?? []).length
        ? shortOutcomeText(getOutcomeText((child.outcomes ?? [])[0]))
        : "No direct outcomes listed on this node. Review child sections.",
    }));
  }

  if (outcomes.length > 0) {
    return outcomes.map((outcomeId) => ({
      id: outcomeId,
      title: `Outcome ${outcomeId}`,
      notes: getOutcomeText(outcomeId),
    }));
  }

  return [
    {
      id: `${section.id}.placeholder`,
      title: "Container node",
      notes: "No direct outcomes in this node. Use child sections for revision content.",
    },
  ];
}

function flattenSections(
  sections: SyllabusSection[],
  depth: number,
  parentId: string | null,
  pathIds: string[]
): Topic[] {
  const rows: Topic[] = [];

  for (const section of sections) {
    const currentPath = [...pathIds, section.id];
    const outcomes = section.outcomes ?? [];
    const childSections = section.sections ?? [];

    rows.push({
      id: section.id,
      slug: section.id,
      title: `${section.id} ${section.title}`,
      summary: outcomes.length
        ? shortOutcomeText(
            outcomes
              .slice(0, 2)
              .map((outcomeId) => getOutcomeText(outcomeId))
              .join(" ")
          )
        : "No direct outcomes on this node in syllabus. Use child sections below.",
      subtopics: buildSubtopics(section),
      parentId,
      depth,
      outcomes,
      childrenIds: childSections.map((child) => child.id),
      pathIds: currentPath,
    });

    rows.push(...flattenSections(childSections, depth + 1, section.id, currentPath));
  }

  return rows;
}

function treeSections(
  sections: SyllabusSection[],
  paperId: PaperId,
  depth: number,
  parentId: string | null,
  pathIds: string[]
): TopicTreeNode[] {
  return sections.map((section) => {
    const nextPath = [...pathIds, section.id];
    const childSections = section.sections ?? [];
    const outcomes = section.outcomes ?? [];

    return {
      id: section.id,
      title: `${section.id} ${section.title}`,
      paperId,
      paperSlug: slugForPaper(paperId),
      depth,
      parentId,
      outcomes,
      pathIds: nextPath,
      children: treeSections(childSections, paperId, depth + 1, section.id, nextPath),
    };
  });
}

function deriveExamTitle(sourceName: string, paperId: PaperId): string {
  if (sourceName.toLowerCase().includes("paper 1")) {
    return "Core Paper 1";
  }

  if (sourceName.toLowerCase().includes("paper 2")) {
    return "Core Paper 2";
  }

  return paperId === "paper1" ? "Core Paper 1" : "Core Paper 2";
}

export const papers: Paper[] = rawSyllabus.papers.map((sourcePaper) => {
  const paperId = normalizePaperId(sourcePaper.id);
  const topics = flattenSections(sourcePaper.content_areas, 0, null, []);

  return {
    id: paperId,
    slug: slugForPaper(paperId),
    title: titleForPaper(paperId),
    examTitle: deriveExamTitle(sourcePaper.name, paperId),
    examDate: `${sourcePaper.exam_date}T09:00:00.000Z`,
    durationMinutes: sourcePaper.exam_duration_minutes,
    topics,
  };
});

export const syllabusTreeByPaper: Record<PaperId, TopicTreeNode[]> = {
  paper1: treeSections(
    rawSyllabus.papers.find((paper) => paper.id === syllabusPaperId("paper1"))?.content_areas ?? [],
    "paper1",
    0,
    null,
    []
  ),
  paper2: treeSections(
    rawSyllabus.papers.find((paper) => paper.id === syllabusPaperId("paper2"))?.content_areas ?? [],
    "paper2",
    0,
    null,
    []
  ),
};

export const papersById = Object.fromEntries(
  papers.map((paper) => [paper.id, paper])
) as Record<PaperId, Paper>;

export const glossaryTerms = glossaryData as GlossaryTerm[];
export const quizQuestions = quizData as QuizQuestion[];
export const flashcards = flashcardsData as Flashcard[];
export const examQuestions = examData as ExamQuestion[];

export const allTopics = papers.flatMap((paper) =>
  paper.topics.map((topic) => ({ ...topic, paperId: paper.id, paperTitle: paper.title }))
);

export const assessableTopics = allTopics.filter((topic) => {
  const outcomesCount = topic.outcomes?.length ?? 0;
  const childrenCount = topic.childrenIds?.length ?? 0;
  return outcomesCount > 0 || childrenCount === 0;
});

export const topicById = Object.fromEntries(allTopics.map((topic) => [topic.id, topic]));

const outcomeContextById = new Map<string, { paperId: PaperId; topicId: string }>();

for (const topic of allTopics) {
  for (const outcomeId of topic.outcomes ?? []) {
    if (!outcomeContextById.has(outcomeId)) {
      outcomeContextById.set(outcomeId, {
        paperId: topic.paperId,
        topicId: topic.id,
      });
    }
  }
}

const allOutcomeEntries = Array.from(outcomeContextById.entries()).map(([id, context]) => ({
  id,
  paperId: context.paperId,
  topicId: context.topicId,
  text: getOutcomeText(id),
}));

const outcomeIdsByPaper: Record<PaperId, string[]> = {
  paper1: Array.from(
    new Set(allOutcomeEntries.filter((entry) => entry.paperId === "paper1").map((entry) => entry.id))
  ),
  paper2: Array.from(
    new Set(allOutcomeEntries.filter((entry) => entry.paperId === "paper2").map((entry) => entry.id))
  ),
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function uniqueItems(values: string[]): string[] {
  return Array.from(new Set(values));
}

function pickDeterministic(values: string[], count: number, seedKey: string): string[] {
  if (values.length === 0 || count <= 0) {
    return [];
  }

  if (values.length <= count) {
    return [...values];
  }

  const seed = hashSeed(seedKey);
  const picked: string[] = [];
  const used = new Set<number>();
  let index = seed % values.length;
  const step = (seed % (values.length - 1)) + 1;

  while (picked.length < count && used.size < values.length) {
    if (!used.has(index)) {
      used.add(index);
      picked.push(values[index]);
    }
    index = (index + step) % values.length;
  }

  return picked;
}

function buildOptionsWithCorrect(
  correct: string,
  distractors: string[],
  seedKey: string
): { options: string[]; correctIndex: number } {
  const distinctDistractors = uniqueItems(distractors).filter((option) => option !== correct).slice(0, 3);
  while (distinctDistractors.length < 3) {
    distinctDistractors.push(`Not listed for this node (${distinctDistractors.length + 1})`);
  }

  const options = [...distinctDistractors];
  const correctIndex = hashSeed(seedKey) % 4;
  options.splice(correctIndex, 0, correct);

  return {
    options,
    correctIndex,
  };
}

function resolveTopicOutcomeIds(topicId: string, limit = 8): string[] {
  const topic = getTopicById(topicId);
  const direct = topic?.outcomes ?? [];

  if (direct.length > 0) {
    return direct.slice(0, limit);
  }

  const descendants = allTopics
    .filter((candidate) => candidate.id !== topicId && (candidate.pathIds ?? []).includes(topicId))
    .flatMap((candidate) => candidate.outcomes ?? []);

  return uniqueItems(descendants).slice(0, limit);
}

function buildGeneratedDiagnosticQuestions(topicId: string): QuizQuestion[] {
  const topic = getTopicById(topicId);
  const paperId = getTopicPaperId(topicId) ?? "paper1";
  const title = topic?.title ?? topicId;
  const directOutcomes = topic?.outcomes ?? [];
  const outcomePool = resolveTopicOutcomeIds(topicId, 8);
  const topicOutcomeSet = new Set(outcomePool);
  const selectedOutcomes = pickDeterministic(
    outcomePool,
    Math.min(3, outcomePool.length),
    `${topicId}-selected-outcomes`
  );

  const questions: Array<Omit<QuizQuestion, "id" | "paperId" | "topicId" | "diagnostic">> = [];

  for (const outcomeId of selectedOutcomes) {
    const correct = shortOutcomeText(getOutcomeText(outcomeId), 125);
    const distractorCandidates = allOutcomeEntries
      .filter(
        (entry) =>
          entry.paperId === paperId &&
          entry.id !== outcomeId &&
          !topicOutcomeSet.has(entry.id)
      )
      .map((entry) => shortOutcomeText(entry.text, 125));

    const distractors = pickDeterministic(
      uniqueItems(distractorCandidates),
      3,
      `${topicId}-${outcomeId}-distractors`
    );
    const { options, correctIndex } = buildOptionsWithCorrect(
      correct,
      distractors,
      `${topicId}-${outcomeId}-position`
    );

    questions.push({
      prompt: `Which statement best matches outcome ${outcomeId}?`,
      options,
      correctIndex,
      explanation: `Matched to syllabus outcome ${outcomeId}.`,
    });
  }

  if (outcomePool.length > 0) {
    const focusOutcomeId = selectedOutcomes[0] ?? outcomePool[0];
    const idDistractors = pickDeterministic(
      outcomeIdsByPaper[paperId].filter((outcomeId) => outcomeId !== focusOutcomeId),
      3,
      `${topicId}-id-distractors`
    );
    const idQuestion = buildOptionsWithCorrect(
      focusOutcomeId,
      idDistractors,
      `${topicId}-id-position`
    );

    questions.push({
      prompt: `Which outcome ID belongs to ${title}?`,
      options: idQuestion.options,
      correctIndex: idQuestion.correctIndex,
      explanation: `${focusOutcomeId} is mapped to this syllabus node.`,
    });
  }

  const directCount = directOutcomes.length;
  const countDistractors = uniqueItems([
    String(Math.max(0, directCount - 1)),
    String(directCount + 1),
    String(directCount + 2),
    String(directCount + 3),
  ]).filter((value) => value !== String(directCount));
  while (countDistractors.length < 3) {
    countDistractors.push(String(directCount + countDistractors.length + 1));
  }
  const countQuestion = buildOptionsWithCorrect(
    String(directCount),
    countDistractors,
    `${topicId}-count-position`
  );

  questions.push({
    prompt: `How many direct outcomes are listed for node ${topicId} in syllabus.json?`,
    options: countQuestion.options,
    correctIndex: countQuestion.correctIndex,
    explanation:
      directCount > 0
        ? `${topicId} has ${directCount} direct outcome(s).`
        : `${topicId} is a container node; revise outcomes in child sections.`,
  });

  questions.push({
    prompt: `What is the safest revision strategy for ${title}?`,
    options: [
      "Ignore outcome IDs and memorise random facts",
      "Map notes and practice questions to listed outcomes",
      "Only revise after the exam timer starts",
      "Skip weak areas and move to unrelated topics",
    ],
    correctIndex: 1,
    explanation: "Outcome-linked revision gives clear coverage and better diagnostics.",
  });

  if (questions.length < 6) {
    questions.push({
      prompt: `If ${topicId} is weak, what should your plan do?`,
      options: [
        "Reduce practice time for this node",
        "Increase its revision weight and test it again",
        "Remove the node from all plans",
        "Switch papers immediately",
      ],
      correctIndex: 1,
      explanation: "Weak topics get extra weight via mastery gap + weak bonus.",
    });
  }

  return questions.slice(0, 6).map((item, index) => ({
    id: `generated-${topicId}-${index + 1}`,
    paperId,
    topicId,
    prompt: item.prompt,
    options: item.options,
    correctIndex: item.correctIndex,
    explanation: item.explanation,
    diagnostic: true,
  }));
}

export function getPaperBySlug(paperSlug: string): Paper | null {
  return papers.find((paper) => paper.slug === paperSlug) ?? null;
}

export function getTopicBySlug(paperSlug: string, topicSlug: string): Topic | null {
  const paper = getPaperBySlug(paperSlug);
  if (!paper) {
    return null;
  }

  const decodedTopicId = decodeURIComponent(topicSlug);
  return paper.topics.find((topic) => topic.id === decodedTopicId) ?? null;
}

export function getTopicById(topicId: string): Topic | null {
  return topicById[topicId] ?? null;
}

export function getTopicPaperId(topicId: string): PaperId | null {
  const record = allTopics.find((topic) => topic.id === topicId);
  return (record?.paperId as PaperId) ?? null;
}

export function getTopicTitle(topicId: string): string {
  return topicById[topicId]?.title ?? topicId;
}

export function getQuizByTopic(topicId: string, diagnosticOnly = false): QuizQuestion[] {
  const matched = quizQuestions.filter(
    (question) =>
      question.topicId === topicId &&
      (!diagnosticOnly || question.diagnostic)
  );
  const generated = buildGeneratedDiagnosticQuestions(topicId);

  if (diagnosticOnly) {
    const targetCount = 6;
    if (matched.length >= targetCount) {
      return matched.slice(0, targetCount);
    }
    return [...matched, ...generated.slice(0, Math.max(0, targetCount - matched.length))];
  }

  if (matched.length > 0) {
    return matched;
  }

  return generated;
}

export function getQuizByPaper(paperId: PaperId): QuizQuestion[] {
  const custom = quizQuestions.filter((question) => question.paperId === paperId);
  const coveredTopics = new Set(custom.map((question) => question.topicId));
  const generated = assessableTopics
    .filter((topic) => topic.paperId === paperId && !coveredTopics.has(topic.id))
    .flatMap((topic) => buildGeneratedDiagnosticQuestions(topic.id).slice(0, 3));

  return [...custom, ...generated];
}

export function getExamQuestionsByPaper(paperId: PaperId): ExamQuestion[] {
  return examQuestions.filter((question) => question.paperId === paperId);
}

export function getExamQuestionByPaper(paperId: PaperId): ExamQuestion {
  return getExamQuestionsByPaper(paperId)[0] ?? examQuestions[0];
}

export function getExamQuestionById(questionId: string): ExamQuestion | null {
  return examQuestions.find((question) => question.id === questionId) ?? null;
}
