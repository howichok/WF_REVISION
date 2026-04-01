import { buildTopicMastery } from "@/lib/domain/analytics";
import type {
  LearnerExamPlan,
  LearnerPersonalisation,
  LearnerProfileState,
  LibraryResource,
  OnboardingAssessmentOption,
  OnboardingAssessmentQuestion,
  PaperType,
  ProgressState,
  Question,
  RevisionUser,
  Topic,
} from "@/lib/domain/types";

const PAPER_ORDER: PaperType[] = ["paper-1", "paper-2", "esp", "os"];

const PAPER_LABELS: Record<PaperType, string> = {
  "paper-1": "Paper 1",
  "paper-2": "Paper 2",
  esp: "ESP",
  os: "Occupational Specialism",
};

const EXAM_TEMPLATES: Array<{
  paper: PaperType;
  title: string;
  shortTitle: string;
  kind: "task" | "exam" | "milestone";
  month: number;
  day: number;
  focusLabel: string;
  route: string;
}> = [
  {
    paper: "esp",
    title: "ESP Task 1",
    shortTitle: "Task 1",
    kind: "task",
    month: 5,
    day: 11,
    focusLabel: "Project brief, requirements, and scenario framing",
    route: "/esp",
  },
  {
    paper: "esp",
    title: "ESP Task 2",
    shortTitle: "Task 2",
    kind: "task",
    month: 5,
    day: 13,
    focusLabel: "Requirements, acceptance criteria, and planning",
    route: "/esp",
  },
  {
    paper: "esp",
    title: "ESP Task 3 (Design)",
    shortTitle: "Task 3",
    kind: "task",
    month: 5,
    day: 15,
    focusLabel: "Design decisions, structure, and solution communication",
    route: "/esp",
  },
  {
    paper: "esp",
    title: "ESP Task 4A",
    shortTitle: "Task 4A",
    kind: "task",
    month: 5,
    day: 18,
    focusLabel: "Implementation, testing evidence, and defect fixing",
    route: "/esp",
  },
  {
    paper: "esp",
    title: "ESP Task 4B",
    shortTitle: "Task 4B",
    kind: "task",
    month: 5,
    day: 20,
    focusLabel: "Evaluation, evidence, and final justification",
    route: "/esp",
  },
  {
    paper: "paper-1",
    title: "Paper 1",
    shortTitle: "Paper 1",
    kind: "exam",
    month: 5,
    day: 22,
    focusLabel: "Problem solving, algorithms, and programming fundamentals",
    route: "/paper-1",
  },
  {
    paper: "paper-2",
    title: "Paper 2",
    shortTitle: "Paper 2",
    kind: "exam",
    month: 6,
    day: 2,
    focusLabel: "Data, security, legislation, and business context",
    route: "/paper-2",
  },
  {
    paper: "os",
    title: "Next Milestone",
    shortTitle: "Milestone",
    kind: "milestone",
    month: 6,
    day: 9,
    focusLabel: "Occupational specialism planning and practical extension",
    route: "/os",
  },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normaliseCopy(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

function toSentence(value: string): string {
  const copy = normaliseCopy(value);
  if (!copy) return "";
  return /[.!?]$/.test(copy) ? copy : `${copy}.`;
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hashSeed(value: string): number {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function rotate<T>(values: T[], count: number): T[] {
  if (values.length === 0) return values;
  const offset = count % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function getDifficultyWeight(difficulty: Question["difficulty"]): number {
  if (difficulty === "core") return 0;
  if (difficulty === "extended") return 1;
  return 2;
}

function buildFallbackDistractor(question: Question, index: number): string {
  const fallbacks = [
    `Focus on describing features only instead of answering the ${question.commandWord} task.`,
    "Ignore the scenario details and give a generic statement.",
    "Choose the first term you recognise without checking the logic carefully.",
  ];

  return fallbacks[index] ?? fallbacks[0];
}

function buildAssessmentOptions(question: Question, pool: Question[]): OnboardingAssessmentOption[] {
  const correct = toSentence(question.markSchemePoints[0] ?? question.prompt);
  const distractorPool = [
    ...question.commonPitfalls,
    ...pool.filter((item) => item.id !== question.id).flatMap((item) => [item.commonPitfalls[0], item.markSchemePoints[0]]),
  ]
    .filter(Boolean)
    .map((item) => toSentence(item as string))
    .filter((item) => item !== correct);

  const distractors = uniqueBy(distractorPool, (item) => item.toLowerCase()).slice(0, 3);

  while (distractors.length < 3) {
    distractors.push(toSentence(buildFallbackDistractor(question, distractors.length)));
  }

  const options: OnboardingAssessmentOption[] = [
    { id: `${question.id}-correct`, label: correct, isCorrect: true },
    ...distractors.slice(0, 3).map((label, index) => ({
      id: `${question.id}-distractor-${index}`,
      label,
      isCorrect: false,
    })),
  ];

  return rotate(options, hashSeed(question.id));
}

export function getPaperLabel(paper: PaperType): string {
  return PAPER_LABELS[paper];
}

export function getStudyPathLabel(selectedPapers: PaperType[]): string {
  if (selectedPapers.length === 0) return "Mixed path";
  if (selectedPapers.length > 1) return "Mixed path";
  return PAPER_LABELS[selectedPapers[0]];
}

export function createEmptyLearnerProfile(now = new Date().toISOString()): LearnerProfileState {
  return {
    onboardingCompleted: false,
    onboardingStep: 0,
    studyPath: "mixed",
    selectedPapers: [],
    weakTopicIds: [],
    weakSubtopicIds: [],
    assessmentAnswers: [],
    onboardingStartedAt: now,
    onboardingCompletedAt: null,
  };
}

export function getCurrentUserProfile(user: RevisionUser | null): LearnerProfileState {
  return user?.profile ?? createEmptyLearnerProfile();
}

export function getNextExamForPapers(selectedPapers: PaperType[], referenceDate = new Date()): LearnerExamPlan | null {
  const relevantPapers = selectedPapers.length > 0 ? selectedPapers : PAPER_ORDER;
  const referenceMidnight = new Date(referenceDate);
  referenceMidnight.setHours(0, 0, 0, 0);

  const nextExams = EXAM_TEMPLATES.filter((item) => relevantPapers.includes(item.paper)).map((item) => {
    let year = referenceMidnight.getFullYear();
    let examDate = new Date(year, item.month - 1, item.day, 9, 0, 0, 0);

    if (examDate < referenceMidnight) {
      year += 1;
      examDate = new Date(year, item.month - 1, item.day, 9, 0, 0, 0);
    }

    const daysUntil = Math.max(
      0,
      Math.ceil((examDate.getTime() - referenceMidnight.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      paper: item.paper,
      title: item.title,
      shortTitle: item.shortTitle,
      kind: item.kind,
      examDate: examDate.toISOString(),
      daysUntil,
      topicsToCover: 0,
      priorityTopicIds: [],
      focusLabel: item.focusLabel,
      route: item.route,
    } satisfies LearnerExamPlan;
  });

  return nextExams.sort((left, right) => left.daysUntil - right.daysUntil)[0] ?? null;
}

export function buildOnboardingAssessmentQuestions(
  topics: Topic[],
  questions: Question[],
  selectedPapers: PaperType[],
  weakTopicIds: string[],
): OnboardingAssessmentQuestion[] {
  const relevantPapers = selectedPapers.length > 0 ? selectedPapers : PAPER_ORDER;
  const selectedTopics = topics.filter((topic) => relevantPapers.includes(topic.paper));
  const desiredCount = selectedPapers.length >= 3 ? 8 : 6;

  const topicPriority = [
    ...weakTopicIds,
    ...selectedTopics
      .sort((left, right) => PAPER_ORDER.indexOf(left.paper) - PAPER_ORDER.indexOf(right.paper))
      .map((topic) => topic.id),
  ];

  const uniqueTopicOrder = uniqueBy(topicPriority, (topicId) => topicId);
  const chosenQuestions: Question[] = [];
  const usedTopics = new Set<string>();

  for (const topicId of uniqueTopicOrder) {
    const match = questions
      .filter((question) => relevantPapers.includes(question.paper) && question.topicId === topicId)
      .sort((left, right) => getDifficultyWeight(left.difficulty) - getDifficultyWeight(right.difficulty))[0];

    if (match && !usedTopics.has(match.topicId)) {
      chosenQuestions.push(match);
      usedTopics.add(match.topicId);
    }

    if (chosenQuestions.length >= desiredCount) {
      break;
    }
  }

  if (chosenQuestions.length < desiredCount) {
    const fill = questions
      .filter((question) => relevantPapers.includes(question.paper) && !usedTopics.has(question.topicId))
      .sort((left, right) => {
        const paperDelta = PAPER_ORDER.indexOf(left.paper) - PAPER_ORDER.indexOf(right.paper);
        if (paperDelta !== 0) return paperDelta;
        return getDifficultyWeight(left.difficulty) - getDifficultyWeight(right.difficulty);
      });

    for (const question of fill) {
      chosenQuestions.push(question);
      usedTopics.add(question.topicId);
      if (chosenQuestions.length >= desiredCount) {
        break;
      }
    }
  }

  return chosenQuestions.map((question) => {
    const topic = selectedTopics.find((item) => item.id === question.topicId);
    const subtopic = topic?.subtopics.find((item) => item.id === question.subtopicId);

    return {
      id: `assessment-${question.id}`,
      paper: question.paper,
      topicId: question.topicId,
      subtopicId: question.subtopicId,
      title: question.title,
      prompt: question.prompt,
      supportLabel: `${getPaperLabel(question.paper)}${topic ? ` - ${topic.title}` : ""}${subtopic ? ` - ${subtopic.title}` : ""}`,
      difficulty: question.difficulty,
      options: buildAssessmentOptions(question, questions.filter((item) => item.paper === question.paper)),
      explanation: toSentence(question.markSchemePoints.slice(0, 2).join(" ")),
    };
  });
}

export function buildLearnerPersonalisation(
  topics: Topic[],
  questions: Question[],
  progress: ProgressState,
  profile: LearnerProfileState,
): LearnerPersonalisation {
  const selectedPapers = profile.selectedPapers.length > 0 ? profile.selectedPapers : PAPER_ORDER;
  const selectedTopics = topics.filter((topic) => selectedPapers.includes(topic.paper));
  const masteryMap = new Map(buildTopicMastery(topics, questions, progress.attempts).map((item) => [item.topicId, item]));
  const upcomingExamSeed = getNextExamForPapers(selectedPapers);

  const topicSignals = selectedTopics.map((topic) => {
    const assessmentAnswers = profile.assessmentAnswers.filter((answer) => answer.topicId === topic.id);
    const assessmentTotal = assessmentAnswers.length;
    const assessmentCorrect = assessmentAnswers.filter((answer) => answer.isCorrect).length;
    const assessmentPercent = assessmentTotal > 0 ? (assessmentCorrect / assessmentTotal) * 100 : null;
    const practice = masteryMap.get(topic.id);
    const weakSubtopicCount = topic.subtopics.filter((subtopic) => profile.weakSubtopicIds.includes(subtopic.id)).length;
    const manualWeak = profile.weakTopicIds.includes(topic.id) || weakSubtopicCount > 0;

    let score = manualWeak ? 38 : 58;

    if (assessmentPercent !== null && practice) {
      score = assessmentPercent * 0.45 + practice.masteryPercent * 0.45 + 10;
    } else if (assessmentPercent !== null) {
      score = 25 + assessmentPercent * 0.7;
    } else if (practice) {
      score = practice.masteryPercent * 0.75 + 15;
    }

    score -= profile.weakTopicIds.includes(topic.id) ? 14 : 0;
    score -= Math.min(12, weakSubtopicCount * 4);
    score += practice?.recentTrend ? Math.min(6, Math.max(-6, practice.recentTrend / 3)) : 0;
    score = clamp(score);

    const drivers: string[] = [];
    if (manualWeak) drivers.push("Flagged as a weak area in your study setup.");
    if (assessmentTotal > 0) drivers.push(`${assessmentCorrect}/${assessmentTotal} quick skill checks answered correctly.`);
    if (practice?.attemptCount) drivers.push(`${practice.attemptCount} saved practice attempts on record.`);
    if (practice?.frequentGaps[0]) drivers.push(`Practice gap: ${practice.frequentGaps[0]}.`);
    if (upcomingExamSeed?.paper === topic.paper) drivers.push(`Relevant to ${upcomingExamSeed.shortTitle}.`);
    if (drivers.length === 0) drivers.push("Awaiting more evidence from revision sessions.");

    return {
      topicId: topic.id,
      title: topic.title,
      paper: topic.paper,
      score,
      route: `/${topic.paper}/${topic.id}`,
      manualWeak,
      assessmentCorrect,
      assessmentTotal,
      practiceAttempts: practice?.attemptCount ?? 0,
      practiceMastery: practice?.masteryPercent ?? null,
      drivers,
    };
  });

  const sortedByStrength = [...topicSignals].sort((left, right) => right.score - left.score);
  const sortedByWeakness = [...topicSignals].sort((left, right) => {
    const priorityDelta = Number(right.manualWeak) - Number(left.manualWeak);
    if (priorityDelta !== 0) return priorityDelta;
    return left.score - right.score;
  });

  const priorities = [...topicSignals].sort((left, right) => {
    const leftPriority =
      (100 - left.score) +
      (left.manualWeak ? 10 : 0) +
      (upcomingExamSeed?.paper === left.paper ? 18 : 0) +
      (left.practiceAttempts === 0 ? 6 : 0);
    const rightPriority =
      (100 - right.score) +
      (right.manualWeak ? 10 : 0) +
      (upcomingExamSeed?.paper === right.paper ? 18 : 0) +
      (right.practiceAttempts === 0 ? 6 : 0);

    return rightPriority - leftPriority;
  });

  const averageScore = average(topicSignals.map((item) => item.score));
  const level = averageScore >= 72 ? "secure" : averageScore >= 45 ? "developing" : "emerging";

  const upcomingExam =
    upcomingExamSeed === null
      ? null
      : {
          ...upcomingExamSeed,
          topicsToCover: topicSignals.filter((item) => item.paper === upcomingExamSeed.paper && item.score < 70).length,
          priorityTopicIds: priorities
            .filter((item) => item.paper === upcomingExamSeed.paper)
            .slice(0, 3)
            .map((item) => item.topicId),
        };

  return {
    studyPathLabel: getStudyPathLabel(selectedPapers),
    level,
    averageScore,
    strengths: sortedByStrength.slice(0, 3),
    weakAreas: sortedByWeakness.slice(0, 4),
    priorities: priorities.slice(0, 4),
    recommendedTopic: priorities[0] ?? null,
    upcomingExam,
  };
}

export function groupResourcesByCategory(resources: LibraryResource[]): Record<LibraryResource["category"], LibraryResource[]> {
  return resources.reduce(
    (accumulator, resource) => ({
      ...accumulator,
      [resource.category]: [...accumulator[resource.category], resource],
    }),
    {
      "Past Papers": [],
      "Mark Schemes": [],
      PDFs: [],
      "Revision Notes": [],
      "Teacher Resources": [],
    } as Record<LibraryResource["category"], LibraryResource[]>,
  );
}
