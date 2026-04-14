import {
  CODEX_EXAM_STYLE_QUESTION_METADATA,
  CODEX_EXAM_STYLE_REJECTION_SUMMARY,
  CONTENT_SOURCES,
  DSD_CURRICULUM_POINTS,
  QUESTION_METADATA,
} from "@/data/curriculum";
import type { ExamMetadataCommandWord, QuestionMetadata } from "@/data/curriculum";

const ALLOWED_COMMAND_WORDS = new Set<ExamMetadataCommandWord>([
  "give",
  "state",
  "name",
  "identify",
  "write",
  "describe",
  "explain",
  "explain with additional justification",
  "discuss",
  "evaluate",
  "draw",
  "complete",
]);

const PAPER_CONTENT_AREAS = {
  paper_1: new Set([
    "Problem Solving",
    "Introduction to Programming",
    "Emerging Issues",
    "Legislation and Regulatory Requirements",
  ]),
  paper_2: new Set([
    "Business Context",
    "Data",
    "Digital Environments",
    "Security",
  ]),
} as const;

const LEGACY_PAPER_LABEL = {
  paper_1: "Paper 1",
  paper_2: "Paper 2",
} as const;

const GENERATED_SOURCE_BY_PAPER = {
  paper_1: "codex-reviewed-paper1-exam-bank-2026",
  paper_2: "codex-reviewed-paper2-exam-bank-2026",
} as const;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "would",
  "could",
  "should",
  "team",
  "scenario",
  "project",
  "system",
  "before",
  "after",
  "because",
  "using",
  "used",
  "into",
  "one",
  "two",
  "three",
]);

const DISALLOWED_REVISION_PHRASES = [
  "the relevant focus is",
  "revision question",
  "in your own words",
  "what do you know about",
  "classroom",
  "homework",
];

const TEMPLATE_ARTEFACT_PATTERNS = [
  /\bundefined\b/i,
  /\bnull\b/i,
  /\bNaN\b/i,
  /\[object Object\]/i,
  /{{|}}/,
  /\bTODO\b/i,
  /\blorem ipsum\b/i,
];

function increment(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensFor(value: string) {
  return normalise(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function ngrams(tokens: string[], size: number) {
  const values = new Set<string>();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    values.add(tokens.slice(index, index + size).join(" "));
  }
  return values;
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 && right.size === 0) {
    return 1;
  }

  const [small, large] = left.size < right.size ? [left, right] : [right, left];
  let intersection = 0;

  for (const value of small) {
    if (large.has(value)) {
      intersection += 1;
    }
  }

  return intersection / (left.size + right.size - intersection);
}

function stemFor(question: QuestionMetadata) {
  return question.practicePrompt || question.summary;
}

function markBand(marks: number | undefined) {
  if (!marks) {
    return "unknown";
  }
  if (marks <= 2) {
    return "1-2";
  }
  if (marks <= 4) {
    return "3-4";
  }
  if (marks <= 6) {
    return "5-6";
  }
  return "8-12";
}

function requireCheck(condition: unknown, message: string, failures: string[]) {
  if (!condition) {
    failures.push(message);
  }
}

const failures: string[] = [];
const generated = CODEX_EXAM_STYLE_QUESTION_METADATA;
const generatedIds = new Set(generated.map((question) => question.id));
const allQuestionIds = new Set<string>();
const sourceIds = new Set(CONTENT_SOURCES.map((source) => source.id));
const pointIds = new Set(DSD_CURRICULUM_POINTS.map((point) => point.id));
const generatedViaQuestionMetadata = QUESTION_METADATA.filter((question) =>
  generatedIds.has(question.id)
);

requireCheck(
  generated.length === generatedIds.size,
  "Generated question IDs must be unique.",
  failures
);
requireCheck(
  generatedViaQuestionMetadata.length === generated.length,
  "Generated questions must be spread through QUESTION_METADATA.",
  failures
);

for (const question of QUESTION_METADATA) {
  requireCheck(!allQuestionIds.has(question.id), `Duplicate question id: ${question.id}`, failures);
  allQuestionIds.add(question.id);
}

const countsByPaper: Record<string, number> = {};
const countsByContentArea: Record<string, number> = {};
const countsByCommandWord: Record<string, number> = {};
const countsByMarkBand: Record<string, number> = {};
const scenarioSignatures = new Map<string, string>();
const answerLogicSignatures = new Map<string, string>();
const normalisedGeneratedStems = new Map<string, string>();
const legacyQuestions = QUESTION_METADATA.filter((question) => !generatedIds.has(question.id));
const legacyStems = legacyQuestions.map((question) => ({
  id: question.id,
  normalised: normalise(stemFor(question)),
  tokenSet: new Set(tokensFor(stemFor(question))),
  bigramSet: ngrams(tokensFor(stemFor(question)), 2),
}));

for (const question of generated) {
  const metadata = question.examMetadata;
  const stem = stemFor(question);
  const normalisedStem = normalise(stem);
  const paper = metadata?.paper;
  const contentArea = metadata?.contentArea;
  const commandWord = metadata?.commandWord;
  const sourceForPaper = paper ? GENERATED_SOURCE_BY_PAPER[paper] : undefined;
  const validation = metadata?.validation;
  const artefactText = [
    question.title,
    question.summary,
    question.expectation,
    question.practicePrompt,
    metadata?.stimulus,
    metadata?.scenarioSignature,
    metadata?.answerLogicSignature,
  ]
    .filter(Boolean)
    .join(" ");

  requireCheck(metadata, `${question.id} is missing examMetadata.`, failures);
  requireCheck(paper, `${question.id} is missing examMetadata.paper.`, failures);
  requireCheck(
    paper === "paper_1" || paper === "paper_2",
    `${question.id} has invalid paper metadata.`,
    failures
  );
  requireCheck(
    paper ? question.paper === LEGACY_PAPER_LABEL[paper] : false,
    `${question.id} legacy paper field does not match examMetadata.paper.`,
    failures
  );
  requireCheck(
    paper && contentArea ? PAPER_CONTENT_AREAS[paper].has(contentArea) : false,
    `${question.id} content area ${contentArea ?? "<missing>"} does not fit ${paper ?? "<missing paper>"}.`,
    failures
  );
  requireCheck(
    commandWord ? ALLOWED_COMMAND_WORDS.has(commandWord) : false,
    `${question.id} has invalid command word ${commandWord ?? "<missing>"}.`,
    failures
  );
  requireCheck(question.reviewed === true, `${question.id} must have reviewed=true.`, failures);
  requireCheck(question.active === true, `${question.id} must have active=true.`, failures);
  requireCheck(
    metadata?.reviewDecision === "keep",
    `${question.id} must have examMetadata.reviewDecision="keep".`,
    failures
  );
  requireCheck(
    metadata?.duplicationRisk === "low",
    `${question.id} should have low duplication risk after review.`,
    failures
  );
  requireCheck(
    typeof metadata?.realismScore === "number" && metadata.realismScore >= 8,
    `${question.id} must have a realism score of at least 8.`,
    failures
  );
  requireCheck(
    metadata?.sourceReference && metadata.sourceFile && metadata.sourceExcerptHash,
    `${question.id} must include source reference, source file, and source excerpt hash.`,
    failures
  );
  requireCheck(
    metadata?.sourceFile?.startsWith("sources/"),
    `${question.id} must cite a repository-backed source file.`,
    failures
  );
  requireCheck(
    /^fnv1a-[a-z0-9-]+$/i.test(metadata?.sourceExcerptHash ?? ""),
    `${question.id} must include a stable generated source excerpt hash.`,
    failures
  );
  requireCheck(
    metadata?.examinerRationale,
    `${question.id} must include examiner rationale.`,
    failures
  );
  requireCheck(
    sourceForPaper ? question.sourceId === sourceForPaper : false,
    `${question.id} sourceId must match its generated paper batch source.`,
    failures
  );
  requireCheck(sourceIds.has(question.sourceId), `${question.id} sourceId is not valid.`, failures);

  for (const pointId of question.curriculumPointIds) {
    requireCheck(pointIds.has(pointId), `${question.id} has invalid curriculum point ${pointId}.`, failures);
  }

  requireCheck(
    Boolean(validation?.fitsPaperBoundary && validation.fitsCommandWord && validation.fitsMarkDemand),
    `${question.id} validation flags for paper, command word, and mark demand must be true.`,
    failures
  );
  requireCheck(
    Boolean(validation?.specGrounded && validation.sourceGrounded),
    `${question.id} source-grounding validation flags must be true.`,
    failures
  );
  requireCheck(
    Boolean(validation?.notDuplicate && validation.scenarioDistinct && validation.answerLogicDistinct),
    `${question.id} duplicate/scenario/answer-logic validation flags must be true.`,
    failures
  );
  requireCheck(
    metadata?.indicativeMarkScheme && metadata.indicativeMarkScheme.points.length >= 4,
    `${question.id} must include a usable indicative mark scheme.`,
    failures
  );

  if (commandWord === "evaluate") {
    requireCheck(
      metadata?.indicativeMarkScheme?.judgementRequired === true,
      `${question.id} evaluate item must require judgement.`,
      failures
    );
  }
  if (commandWord === "discuss") {
    requireCheck(
      metadata?.indicativeMarkScheme?.judgementRequired === false,
      `${question.id} discuss item should not force a judgement.`,
      failures
    );
  }
  if (commandWord === "write") {
    requireCheck(metadata?.responseFormat === "code", `${question.id} write item must use code response format.`, failures);
  }
  if (commandWord === "draw") {
    requireCheck(metadata?.responseFormat === "diagram", `${question.id} draw item must use diagram response format.`, failures);
  }

  if ((question.marks ?? 0) <= 2) {
    requireCheck(
      !["discuss", "evaluate", "explain with additional justification"].includes(commandWord ?? ""),
      `${question.id} uses a high-demand command word for a low-mark item.`,
      failures
    );
  }
  if ((question.marks ?? 0) >= 8) {
    requireCheck(
      metadata?.indicativeMarkScheme?.type === "levels_based",
      `${question.id} extended response must use a levels-based mark scheme.`,
      failures
    );
  }

  for (const phrase of DISALLOWED_REVISION_PHRASES) {
    requireCheck(
      !normalisedStem.includes(phrase),
      `${question.id} contains non-exam wording phrase: ${phrase}`,
      failures
    );
  }
  for (const pattern of TEMPLATE_ARTEFACT_PATTERNS) {
    requireCheck(
      !pattern.test(artefactText),
      `${question.id} contains a template artefact: ${pattern.source}`,
      failures
    );
  }
  requireCheck(
    !/\ba algorithm\b/i.test(stem),
    `${question.id} contains an incorrect article before algorithm.`,
    failures
  );
  requireCheck(
    !/\busing using\b/i.test(stem),
    `${question.id} contains repeated 'using' wording.`,
    failures
  );

  const previousStemId = normalisedGeneratedStems.get(normalisedStem);
  requireCheck(
    !previousStemId,
    `${question.id} duplicates generated stem ${previousStemId ?? ""}.`,
    failures
  );
  normalisedGeneratedStems.set(normalisedStem, question.id);

  for (const legacy of legacyStems) {
    requireCheck(
      normalisedStem !== legacy.normalised,
      `${question.id} duplicates legacy stem ${legacy.id}.`,
      failures
    );

    const tokenSimilarity = jaccard(new Set(tokensFor(stem)), legacy.tokenSet);
    const bigramSimilarity = jaccard(ngrams(tokensFor(stem), 2), legacy.bigramSet);
    requireCheck(
      !(tokenSimilarity >= 0.9 && bigramSimilarity >= 0.78),
      `${question.id} is too close to legacy stem ${legacy.id} (${tokenSimilarity.toFixed(2)} token, ${bigramSimilarity.toFixed(2)} bigram).`,
      failures
    );
  }

  const generatedTokens = tokensFor(stem);
  const generatedTokenSet = new Set(generatedTokens);
  const generatedBigramSet = ngrams(generatedTokens, 2);

  for (const [otherStem, otherId] of normalisedGeneratedStems) {
    if (otherId === question.id || otherStem === normalisedStem) {
      continue;
    }

    const otherTokens = tokensFor(otherStem);
    const tokenSimilarity = jaccard(generatedTokenSet, new Set(otherTokens));
    const bigramSimilarity = jaccard(generatedBigramSet, ngrams(otherTokens, 2));
    requireCheck(
      !(tokenSimilarity >= 0.92 && bigramSimilarity >= 0.82),
      `${question.id} is too close to generated stem ${otherId} (${tokenSimilarity.toFixed(2)} token, ${bigramSimilarity.toFixed(2)} bigram).`,
      failures
    );
  }

  if (paper && contentArea && metadata?.scenarioSignature) {
    const signature = `${paper}:${contentArea}:${metadata.scenarioSignature}`;
    const previous = scenarioSignatures.get(signature);
    requireCheck(
      !previous,
      `${question.id} reuses scenario signature from ${previous ?? ""}.`,
      failures
    );
    scenarioSignatures.set(signature, question.id);
  } else {
    failures.push(`${question.id} is missing scenarioSignature.`);
  }

  if (paper && contentArea && metadata?.answerLogicSignature) {
    const signature = `${paper}:${contentArea}:${metadata.answerLogicSignature}`;
    const previous = answerLogicSignatures.get(signature);
    requireCheck(
      !previous,
      `${question.id} reuses answer logic signature from ${previous ?? ""}.`,
      failures
    );
    answerLogicSignatures.set(signature, question.id);
  } else {
    failures.push(`${question.id} is missing answerLogicSignature.`);
  }

  increment(countsByPaper, paper ?? "missing");
  increment(countsByContentArea, contentArea ?? "missing");
  increment(countsByCommandWord, commandWord ?? "missing");
  increment(countsByMarkBand, `${paper ?? "missing"}:${markBand(question.marks)}`);
}

for (const paper of ["paper_1", "paper_2"] as const) {
  requireCheck(
    (countsByPaper[paper] ?? 0) > 100,
    `${paper} must keep more than 100 generated questions.`,
    failures
  );
  requireCheck(
    (countsByMarkBand[`${paper}:1-2`] ?? 0) >= 24,
    `${paper} needs a healthy short-item distribution.`,
    failures
  );
  requireCheck(
    (countsByMarkBand[`${paper}:3-4`] ?? 0) >= 36,
    `${paper} needs a healthy medium-item distribution.`,
    failures
  );
  requireCheck(
    (countsByMarkBand[`${paper}:5-6`] ?? 0) >= 24,
    `${paper} needs a healthy deeper-item distribution.`,
    failures
  );
  requireCheck(
    (countsByMarkBand[`${paper}:8-12`] ?? 0) >= 12,
    `${paper} needs a healthy extended-item distribution.`,
    failures
  );
}

requireCheck(
  CODEX_EXAM_STYLE_REJECTION_SUMMARY.reduce((total, item) => total + item.count, 0) > 0,
  "Rejected candidate summary must record examiner-review rejections.",
  failures
);

const report = {
  generatedQuestions: generated.length,
  countsByPaper,
  countsByContentArea,
  countsByCommandWord,
  countsByMarkBand,
  rejectedCandidates: CODEX_EXAM_STYLE_REJECTION_SUMMARY,
};

if (failures.length > 0) {
  console.error(JSON.stringify({ ...report, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
