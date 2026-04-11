import type {
  ContentResource,
  GlossaryTerm,
  QuestionMetadata,
} from "@/data/curriculum";
import type { SharedCurriculumSnapshot } from "@/lib/shared-curriculum";
import {
  getMarkSchemeConceptsForQuestion,
  getTopicContentBundle,
} from "./content";
import { extractCommandWord } from "./command-words";
import { getTopicById, getTopicTree, TOPICS } from "./types";

export type PracticeSetKind = "recall" | "exam-drill" | "quiz";
export type PracticePaper = "Paper 1" | "Paper 2";
export type PracticePathId = "mixed" | "paper-1" | "paper-2";

export interface PracticeRecallCard {
  id: string;
  topicId: string;
  title: string;
  prompt: string;
  answer: string;
  hint?: string;
  kind: "term" | "curriculum-point";
  tags: string[];
  relatedResourceIds: string[];
  relatedQuestionIds: string[];
  nextStep: string;
}

export interface PracticeExamDrill {
  id: string;
  topicId: string;
  questionId: string;
  title: string;
  sourceLabel: string;
  paper?: PracticePaper;
  marks?: number;
  prompt: string;
  answerFocus: string;
  checklist: string[];
  linkedResourceIds: string[];
  sourceType?: "past-paper" | "official-point";
}

export interface PracticeQuizQuestion {
  id: string;
  topicId: string;
  type: "multiple-choice" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subtopicLabel?: string;
  sourceLabel?: string;
  paper?: PracticePaper;
  evaluationProfile?: QuestionMetadata["evaluationProfile"];
}

export interface PracticeResourceStep {
  id: string;
  label: string;
  why: string;
  resource: ContentResource | null;
}

export interface TopicPracticeBundle {
  topicId: string;
  topicLabel: string;
  recallCards: PracticeRecallCard[];
  examDrills: PracticeExamDrill[];
  quizQuestions: PracticeQuizQuestion[];
  resourceSteps: PracticeResourceStep[];
}

export interface PracticePathSummary {
  id: PracticePathId;
  title: string;
  eyebrow: string;
  description: string;
  questionCount: number;
  examDrillCount: number;
  topicCount: number;
  relatedTopicIds: string[];
  startLabel: string;
  statLabel: string;
  purpose: string;
  paper?: PracticePaper;
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function dedupeById<T extends { id: string }>(values: T[]) {
  return Array.from(new Map(values.map((value) => [value.id, value])).values());
}

function shuffleQuizPool<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const SIMPLE_REVISION_QUIZ_CAP = 8;
/** About one short-written item per this many quick-check (MCQ) slots in a capped session. */
export const SIMPLE_REVISION_MCQ_PER_WRITTEN = 10;

/**
 * Simple revision sessions favour multiple-choice: roughly {@link SIMPLE_REVISION_MCQ_PER_WRITTEN}
 * quick checks per one short written task in a capped run (default {@link SIMPLE_REVISION_QUIZ_CAP}).
 * When `paperId` routes use the full mixed shuffle instead.
 */
export function buildSimpleRevisionQuizSelection(
  pool: PracticeQuizQuestion[],
  options: { maxQuestions?: number; mcqPerWritten?: number } = {}
): PracticeQuizQuestion[] {
  const max = Math.max(1, options.maxQuestions ?? SIMPLE_REVISION_QUIZ_CAP);
  const mcqPerWritten = Math.max(1, options.mcqPerWritten ?? SIMPLE_REVISION_MCQ_PER_WRITTEN);

  const mcqPool = shuffleQuizPool(pool.filter((q) => q.type === "multiple-choice"));
  const writtenPool = shuffleQuizPool(pool.filter((q) => q.type === "short-answer"));

  const writtenTarget = Math.min(
    writtenPool.length,
    Math.max(0, Math.round(max / (mcqPerWritten + 1)))
  );
  const mcqTarget = max - writtenTarget;

  const mcqCount = Math.min(mcqPool.length, mcqTarget);
  const writtenCount = Math.min(writtenPool.length, max - mcqCount);

  const picked = [
    ...mcqPool.slice(0, mcqCount),
    ...writtenPool.slice(0, writtenCount),
  ];

  return shuffleQuizPool(picked);
}

function inferQuestionPaper(question: QuestionMetadata): PracticePaper | undefined {
  if (question.paper === "Paper 1" || question.paper === "Paper 2") {
    return question.paper;
  }

  const sourceLabel = question.sourceLabel.toLowerCase();

  if (sourceLabel.includes("paper 1")) {
    return "Paper 1";
  }

  if (sourceLabel.includes("paper 2")) {
    return "Paper 2";
  }

  return undefined;
}

function getTopicSubtopicLabel(topicId: string, index = 0) {
  const tree = getTopicTree(topicId);

  if (!tree || tree.subtopics.length === 0) {
    return undefined;
  }

  return tree.subtopics[index % tree.subtopics.length]?.label;
}

function rotateDeterministically<T>(values: T[], seed: string) {
  if (values.length <= 1) {
    return values;
  }

  const offset =
    [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    values.length;

  return values.slice(offset).concat(values.slice(0, offset));
}

function buildTermMultipleChoiceQuestion(
  topicId: string,
  term: GlossaryTerm,
  allTerms: GlossaryTerm[]
): PracticeQuizQuestion | null {
  const distractors = allTerms.filter((candidate) => candidate.id !== term.id);
  const optionsPool = uniqueStrings(
    rotateDeterministically(
      distractors.map((candidate) => candidate.term),
      term.id
    )
  ).slice(0, 3);

  if (optionsPool.length < 3) {
    return null;
  }

  const options = rotateDeterministically(
    [term.term, ...optionsPool],
    `option-${term.id}`
  ).slice(0, 4);

  return {
    id: `quiz-term-${term.id}`,
    topicId,
    type: "multiple-choice",
    question: `Which term best matches this description?\n\n${term.definition}`,
    options,
    correctAnswer: term.term,
    explanation: `${term.term}: ${term.definition}`,
    difficulty: "easy",
    subtopicLabel: getTopicSubtopicLabel(topicId),
    sourceLabel: "Glossary recall",
    paper: "Paper 1",
  };
}

function buildSubtopicQuestion(topicId: string): PracticeQuizQuestion[] {
  const tree = getTopicTree(topicId);

  if (!tree || tree.subtopics.length < 2) {
    return [];
  }

  return tree.subtopics.map((subtopic, index) => {
    const distractorLabels = rotateDeterministically(
      tree.subtopics
        .filter((candidate) => candidate.id !== subtopic.id)
        .map((candidate) => candidate.label),
      subtopic.id
    ).slice(0, 3);

    const options = rotateDeterministically(
      [subtopic.label, ...distractorLabels],
      `subtopic-${subtopic.id}`
    );

    return {
      id: `quiz-subtopic-${subtopic.id}`,
      topicId,
      type: "multiple-choice",
      question: `Which subtopic is most closely linked to this keyword set?\n\n${subtopic.keywords
        .slice(0, 3)
        .join(", ")}`,
      options,
      correctAnswer: subtopic.label,
      explanation: `${subtopic.label} covers ideas such as ${subtopic.keywords
        .slice(0, 4)
        .join(", ")}.`,
      difficulty: index > 1 ? "medium" : "easy",
      subtopicLabel: subtopic.label,
      sourceLabel: "Topic coverage",
      paper: "Paper 1",
    };
  });
}

function extractQuestionCues(
  question: QuestionMetadata,
  snapshot?: SharedCurriculumSnapshot | null
) {
  const markSchemeCues = getMarkSchemeConceptsForQuestion(question.id, snapshot)
    .flatMap((concept) => concept.conceptTargets)
    .slice(0, 5);

  const expectationCues = question.expectation
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8)
    .slice(0, 2);

  return uniqueStrings([...markSchemeCues, ...expectationCues]);
}

function buildExamPromptQuestion(
  topicId: string,
  question: QuestionMetadata,
  snapshot?: SharedCurriculumSnapshot | null
): PracticeQuizQuestion {
  const cues = extractQuestionCues(question, snapshot);

  return {
    id: `quiz-exam-${question.id}`,
    topicId,
    type: "short-answer",
    question: question.practicePrompt,
    correctAnswer: cues[0] ?? question.expectation,
    acceptableAnswers: cues,
    explanation: question.expectation,
    difficulty:
      (question.marks ?? 0) >= 8
        ? "hard"
        : (question.marks ?? 0) >= 4
          ? "medium"
          : "easy",
    subtopicLabel: getTopicSubtopicLabel(topicId, 1),
    sourceLabel: question.sourceLabel,
    paper: inferQuestionPaper(question),
    evaluationProfile: question.evaluationProfile,
  };
}

function getPromptDifficulty(prompt: string) {
  const normalizedPrompt = prompt.toLowerCase();
  const commandWord = extractCommandWord(prompt)?.id;

  if (
    normalizedPrompt.startsWith("explain two") ||
    normalizedPrompt.startsWith("describe two")
  ) {
    return {
      marks: 5,
      difficulty: "medium" as const,
    };
  }

  if (commandWord === "state" || commandWord === "identify") {
    return {
      marks: 3,
      difficulty: "easy" as const,
    };
  }

  if (
    commandWord === "compare" ||
    commandWord === "evaluate" ||
    commandWord === "discuss" ||
    commandWord === "justify" ||
    commandWord === "analyse"
  ) {
    return {
      marks: 6,
      difficulty: "hard" as const,
    };
  }

  return {
    marks: 4,
    difficulty: "medium" as const,
  };
}

function pickResource(
  resources: ContentResource[],
  allowedKinds: ContentResource["kind"][]
) {
  return (
    resources.find((resource) => allowedKinds.includes(resource.kind)) ?? null
  );
}

function getResourceSteps(
  topicId: string,
  snapshot?: SharedCurriculumSnapshot | null
): PracticeResourceStep[] {
  const bundle = getTopicContentBundle(topicId, snapshot);
  const learnResource = pickResource(bundle.resources, ["textbook", "specification"]);
  const testResource = pickResource(bundle.resources, ["question-bank", "past-paper"]);
  const reviewResource = pickResource(bundle.resources, ["mark-scheme"]);

  return [
    {
      id: `${topicId}-learn`,
      label: "Learn first",
      why: "Use a concise note/spec source before you try recall from memory.",
      resource: learnResource,
    },
    {
      id: `${topicId}-test`,
      label: "Then test it",
      why: "Move into question-bank or past-paper style prompts once the terms feel familiar.",
      resource: testResource,
    },
    {
      id: `${topicId}-review`,
      label: "Then review gaps",
      why: "Compare your recall with mark-scheme language so you can tighten exam wording.",
      resource: reviewResource,
    },
  ];
}

export function getPracticeSetId(topicId: string, kind: PracticeSetKind) {
  return `practice:${kind}:${topicId}`;
}

export function getTopicPracticeBundle(
  topicId: string,
  snapshot?: SharedCurriculumSnapshot | null
): TopicPracticeBundle {
  const topicInfo = getTopicById(topicId);
  const bundle = getTopicContentBundle(topicId, snapshot);
  const officialPointCards = bundle.officialPoints.map((point) => ({
    id: `recall-point-${point.id}`,
    topicId,
    title: `${point.code} ${point.title}`,
    prompt: `Explain what ${point.code} covers and why it matters in ${topicInfo?.label ?? "this topic"}.`,
    answer: point.summary,
    hint:
      point.relatedTerms.length > 0
        ? `Exam terms: ${point.relatedTerms.slice(0, 3).join(", ")}`
        : undefined,
    kind: "curriculum-point" as const,
    tags: uniqueStrings([...point.relatedTerms.slice(0, 3), ...point.relatedConcepts.slice(0, 2)]),
    relatedResourceIds: bundle.resources
      .filter((resource) => resource.curriculumPointIds.includes(point.id))
      .slice(0, 2)
      .map((resource) => resource.id),
    relatedQuestionIds: bundle.questions
      .filter((question) => question.curriculumPointIds.includes(point.id))
      .slice(0, 2)
      .map((question) => question.id),
    nextStep: "Try to give one example or exam scenario that uses this point.",
  }));

  const termCards = bundle.terms.map((term) => ({
    id: `recall-term-${term.id}`,
    topicId,
    title: term.term,
    prompt: `Define ${term.term} in your own words.`,
    answer: term.definition,
    hint:
      term.aliases && term.aliases.length > 0
        ? `Also appears as ${term.aliases.slice(0, 2).join(", ")}`
        : undefined,
    kind: "term" as const,
    tags: uniqueStrings([
      ...(term.aliases ?? []).slice(0, 3),
      ...bundle.officialPoints
        .filter((point) => term.curriculumPointIds.includes(point.id))
        .flatMap((point) => point.relatedConcepts.slice(0, 2)),
    ]),
    relatedResourceIds: bundle.resources
      .filter((resource) =>
        resource.curriculumPointIds.some((pointId) =>
          term.curriculumPointIds.includes(pointId)
        )
      )
      .slice(0, 2)
      .map((resource) => resource.id),
    relatedQuestionIds: bundle.questions
      .filter((question) =>
        question.curriculumPointIds.some((pointId) =>
          term.curriculumPointIds.includes(pointId)
        )
      )
      .slice(0, 2)
      .map((question) => question.id),
    nextStep: "Say where this term could appear in an exam answer or scenario.",
  }));

  const allTerms = TOPICS.flatMap((topic) => getTopicContentBundle(topic.id, snapshot).terms);
  const quizQuestions = [
    ...bundle.terms
      .map((term) => buildTermMultipleChoiceQuestion(topicId, term, allTerms))
      .filter((question): question is PracticeQuizQuestion => Boolean(question)),
    ...buildSubtopicQuestion(topicId),
    ...bundle.questions.map((question) => buildExamPromptQuestion(topicId, question, snapshot)),
    ...bundle.officialPoints.flatMap((point, pointIndex) =>
      point.practicePrompts.slice(0, 4).map((prompt, promptIndex) => {
        const difficulty = getPromptDifficulty(prompt);

        return {
          id: `quiz-point-${point.id}-${promptIndex + 1}`,
          topicId,
          type: "short-answer" as const,
          question: prompt,
          correctAnswer: point.summary,
          acceptableAnswers: uniqueStrings([
            ...point.markSchemeIdeas,
            ...point.relatedConcepts,
            ...point.relatedTerms,
          ]).slice(0, 6),
          explanation: point.summary,
          difficulty:
            pointIndex > 2 && difficulty.difficulty === "medium"
              ? "hard"
              : difficulty.difficulty,
          subtopicLabel: `${point.code} ${point.title}`,
          sourceLabel: "Official point drill",
          paper: "Paper 1" as const,
        };
      })
    ),
  ];

  const questionDrills = bundle.questions.map((question) => {
    const conceptTargets = getMarkSchemeConceptsForQuestion(question.id, snapshot)
      .flatMap((concept) => concept.conceptTargets)
      .slice(0, 4);
    const linkedResourceIds = bundle.resources
      .filter(
        (resource) =>
          resource.kind === "past-paper" ||
          resource.kind === "mark-scheme" ||
          resource.kind === "question-bank"
      )
      .slice(0, 3)
      .map((resource) => resource.id);

    return {
      id: `exam-drill-${question.id}`,
      topicId,
      questionId: question.id,
      title: question.title,
      sourceLabel: question.sourceLabel,
      paper: inferQuestionPaper(question),
      marks: question.marks,
      prompt: question.practicePrompt,
      answerFocus: question.expectation,
      checklist:
        conceptTargets.length > 0
          ? conceptTargets
          : [question.expectation],
      linkedResourceIds,
      sourceType: "past-paper" as const,
    };
  });

  const curriculumDrills = bundle.officialPoints.flatMap((point) =>
    point.practicePrompts.map((prompt, index) => {
      const promptMeta = getPromptDifficulty(prompt);
      const linkedResourceIds = bundle.resources
        .filter((resource) => resource.curriculumPointIds.includes(point.id))
        .slice(0, 3)
        .map((resource) => resource.id);

      return {
        id: `exam-drill-point-${point.id}-${index + 1}`,
        topicId,
        questionId: `point-${point.id}-${index + 1}`,
        title: `${point.code} ${point.title}`,
        sourceLabel: `Official point ${point.code}`,
        paper: "Paper 1" as const,
        marks: promptMeta.marks,
        prompt,
        answerFocus: point.summary,
        checklist: uniqueStrings([
          ...point.markSchemeIdeas,
          ...point.relatedConcepts.map((concept) => `Link ${concept} to the scenario.`),
          ...point.relatedTerms.slice(0, 2).map((term) => `Use ${term} accurately.`),
        ]).slice(0, 5),
        linkedResourceIds,
        sourceType: "official-point" as const,
      };
    })
  );

  return {
    topicId,
    topicLabel: topicInfo?.label ?? topicId,
    recallCards: [...termCards, ...officialPointCards],
    examDrills: [...questionDrills, ...curriculumDrills],
    quizQuestions,
      resourceSteps: getResourceSteps(topicId, snapshot),
  };
}

export function getQuickQuizQuestionPool(
  topicId?: string,
  snapshot?: SharedCurriculumSnapshot | null
) {
  return getFilteredQuickQuizQuestionPool(
    topicId ? { topicId } : undefined,
    snapshot
  );
}

interface QuickQuizPoolOptions {
  topicId?: string;
  paper?: PracticePaper;
  topicIds?: string[];
}

export function getFilteredQuickQuizQuestionPool(
  options: QuickQuizPoolOptions = {},
  snapshot?: SharedCurriculumSnapshot | null
) {
  const topicIds = options.topicIds?.length
    ? options.topicIds
    : options.topicId
      ? [options.topicId]
      : TOPICS.filter((topic) => topic.id !== "esp").map((topic) => topic.id);

  const pool = dedupeById(
    topicIds.flatMap((topicId) => getTopicPracticeBundle(topicId, snapshot).quizQuestions)
  );

  if (!options.paper) {
    return pool;
  }

  return pool.filter((question) => question.paper === options.paper);
}

export function getPaperPracticeBundle(
  pathId: Exclude<PracticePathId, "mixed">,
  snapshot?: SharedCurriculumSnapshot | null
) {
  const paper: PracticePaper = pathId === "paper-1" ? "Paper 1" : "Paper 2";
  const topicIds = TOPICS.filter((topic) => topic.id !== "esp").map((topic) => topic.id);
  const bundles = topicIds.map((topicId) => getTopicPracticeBundle(topicId, snapshot));
  const quizQuestions = dedupeById(
    bundles.flatMap((bundle) =>
      bundle.quizQuestions.filter((question) => question.paper === paper)
    )
  );
  const examDrills = dedupeById(
    bundles.flatMap((bundle) =>
      bundle.examDrills.filter((drill) => drill.paper === paper)
    )
  );
  const relatedTopicIds = topicIds.filter((topicId) =>
    quizQuestions.some((question) => question.topicId === topicId) ||
    examDrills.some((drill) => drill.topicId === topicId)
  );

  return {
    paper,
    quizQuestions,
    examDrills,
    relatedTopicIds,
  };
}

export function getPracticePathSummary(
  pathId: PracticePathId,
  snapshot?: SharedCurriculumSnapshot | null
): PracticePathSummary {
  if (pathId === "mixed") {
    const relatedTopicIds = TOPICS.filter((topic) => topic.id !== "esp").map(
      (topic) => topic.id
    );
    const questionCount = getFilteredQuickQuizQuestionPool(undefined, snapshot).length;

    return {
      id: "mixed",
      title: "General practice",
      eyebrow: "Start Here",
      description:
        "Cross-topic retrieval for waking everything up before you narrow down into a paper or one weak topic.",
      questionCount,
      examDrillCount: relatedTopicIds.reduce(
        (sum, topicId) => sum + getTopicPracticeBundle(topicId, snapshot).examDrills.length,
        0
      ),
      topicCount: relatedTopicIds.length,
      relatedTopicIds,
      startLabel: "Start mixed quiz",
      statLabel: "all-topic questions",
      purpose: "Best when you want broad retrieval across the whole course.",
    };
  }

  const paperBundle = getPaperPracticeBundle(pathId, snapshot);
  const isPaperOne = pathId === "paper-1";

  return {
    id: pathId,
    title: isPaperOne ? "Paper 1 practice" : "Paper 2 practice",
    eyebrow: "Practice by Paper",
    description: isPaperOne
      ? "Theory-heavy retrieval, terminology, shorter knowledge checks, and official-point drills."
      : "Scenario-based written questions, applied design choices, and longer exam-style explanations.",
    questionCount: paperBundle.quizQuestions.length,
    examDrillCount: paperBundle.examDrills.length,
    topicCount: paperBundle.relatedTopicIds.length,
    relatedTopicIds: paperBundle.relatedTopicIds,
    startLabel: isPaperOne ? "Start Paper 1 quiz" : "Start Paper 2 quiz",
    statLabel: isPaperOne ? "paper 1 questions" : "paper 2 questions",
    purpose: isPaperOne
      ? "Use this when you want faster retrieval and theory coverage."
      : "Use this when you want applied, exam-style written practice.",
    paper: paperBundle.paper,
  };
}

export function getPracticeSetLabel(kind: PracticeSetKind) {
  if (kind === "recall") {
    return "Recall cycle";
  }

  if (kind === "exam-drill") {
    return "Exam drill";
  }

  return "Quick quiz";
}
