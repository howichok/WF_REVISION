import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CODEX_ESP_PRACTICE_METADATA,
  CONTENT_SOURCES,
  DSD_CURRICULUM_POINTS,
  QUESTION_METADATA,
} from "@/data/curriculum";
import type { EspTask, QuestionMetadata } from "@/data/curriculum";

const ESP_SOURCE_ID = "codex-reviewed-esp-practice-bank-2026";
const REVIEW_FILE_PATH = path.join(
  process.cwd(),
  "sources",
  "espsource",
  "review",
  "codex-esp-reviewed-draft.txt"
);

const ESP_TASKS = new Set<EspTask>([
  "pre_release",
  "task_1",
  "task_2",
  "task_3",
  "task_4a",
  "task_4b",
]);

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
  "task",
  "student",
  "brief",
  "evidence",
  "solution",
  "client",
]);

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
  return `${question.title} ${question.summary} ${question.practicePrompt}`;
}

function requireCheck(condition: unknown, message: string, failures: string[]) {
  if (!condition) {
    failures.push(message);
  }
}

const failures: string[] = [];
const countsByTask: Record<string, number> = {};
const countsByDeliverableType: Record<string, number> = {};
const sourceIds = new Set(CONTENT_SOURCES.map((source) => source.id));
const pointIds = new Set(DSD_CURRICULUM_POINTS.map((point) => point.id));
const questionIds = new Set(QUESTION_METADATA.map((question) => question.id));
const espIds = new Set<string>();
const exactStems = new Map<string, string>();
const stemFingerprints: Array<{
  id: string;
  tokenSet: Set<string>;
  bigramSet: Set<string>;
}> = [];

requireCheck(sourceIds.has(ESP_SOURCE_ID), "Dedicated ESP source row must exist.", failures);
requireCheck(
  existsSync(REVIEW_FILE_PATH),
  `ESP review draft must exist at ${REVIEW_FILE_PATH}.`,
  failures
);

const reviewFile = existsSync(REVIEW_FILE_PATH)
  ? readFileSync(REVIEW_FILE_PATH, "utf8")
  : "";

requireCheck(
  reviewFile.includes("Section 1 - extracted source-derived ESP patterns"),
  "Review file must include extracted source-derived ESP patterns.",
  failures
);
requireCheck(
  reviewFile.includes("Section 2 - generated reviewed ESP practice output"),
  "Review file must include generated reviewed ESP practice output.",
  failures
);
requireCheck(
  CODEX_ESP_PRACTICE_METADATA.length >= 20,
  "ESP practice bank must contain at least 20 reviewed items.",
  failures
);

for (const question of CODEX_ESP_PRACTICE_METADATA) {
  const metadata = question.examMetadata;
  const task = metadata?.espTask;
  const stem = stemFor(question);
  const normalisedStem = normalise(stem);

  requireCheck(!espIds.has(question.id), `Duplicate ESP question id: ${question.id}.`, failures);
  espIds.add(question.id);

  requireCheck(
    questionIds.has(question.id),
    `${question.id} must be spread through QUESTION_METADATA.`,
    failures
  );
  requireCheck(
    reviewFile.includes(`id: ${question.id}`),
    `${question.id} must be present in the ESP review draft before integration.`,
    failures
  );
  requireCheck(question.sourceId === ESP_SOURCE_ID, `${question.id} must use ESP source id.`, failures);
  requireCheck(question.paper === undefined, `${question.id} must not set top-level paper.`, failures);
  requireCheck(question.reviewed === true, `${question.id} must have reviewed=true.`, failures);
  requireCheck(question.active === true, `${question.id} must have active=true.`, failures);
  requireCheck(
    question.legacyTopicIds.length === 1 && question.legacyTopicIds[0] === "esp",
    `${question.id} must map only to legacy ESP topic compatibility.`,
    failures
  );

  requireCheck(metadata, `${question.id} is missing examMetadata.`, failures);
  requireCheck(metadata?.assessmentTrack === "esp", `${question.id} must be assessmentTrack=esp.`, failures);
  requireCheck(metadata?.paper === undefined, `${question.id} must not set examMetadata.paper.`, failures);
  requireCheck(task ? ESP_TASKS.has(task) : false, `${question.id} has invalid espTask.`, failures);
  requireCheck(metadata?.reviewDecision === "keep", `${question.id} must have reviewDecision=keep.`, failures);
  requireCheck(metadata?.duplicationRisk === "low", `${question.id} must have low duplication risk.`, failures);
  requireCheck(
    typeof metadata?.realismScore === "number" && metadata.realismScore >= 8,
    `${question.id} must have realismScore >= 8.`,
    failures
  );
  requireCheck(
    Boolean(metadata?.vocationalContext && metadata.briefType && metadata.deliverableType),
    `${question.id} must include ESP brief, deliverable and vocational context metadata.`,
    failures
  );
  requireCheck(
    Array.isArray(metadata?.relatedContentAreas) && metadata.relatedContentAreas.length >= 2,
    `${question.id} must include relatedContentAreas.`,
    failures
  );
  requireCheck(
    Boolean(metadata?.sourceReference && metadata.sourceFile && metadata.sourceExcerptHash),
    `${question.id} must include ESP provenance metadata.`,
    failures
  );
  requireCheck(
    metadata?.sourceFile?.includes("sources/espsource"),
    `${question.id} must be grounded in the local ESP source folder.`,
    failures
  );
  requireCheck(
    /^fnv1a-[a-z0-9]+$/i.test(metadata?.sourceExcerptHash ?? ""),
    `${question.id} must include a stable sourceExcerptHash.`,
    failures
  );
  requireCheck(
    metadata?.indicativeMarkScheme && metadata.indicativeMarkScheme.points.length >= 4,
    `${question.id} must include a usable indicative mark scheme outline.`,
    failures
  );
  requireCheck(
    Boolean(metadata?.validation?.sourceGrounded && metadata.validation.notDuplicate),
    `${question.id} validation flags must show source grounding and dedupe review.`,
    failures
  );

  for (const pointId of question.curriculumPointIds) {
    requireCheck(pointIds.has(pointId), `${question.id} has invalid curriculum point ${pointId}.`, failures);
  }

  const previousExactStem = exactStems.get(normalisedStem);
  requireCheck(
    !previousExactStem,
    `${question.id} duplicates ESP stem ${previousExactStem ?? ""}.`,
    failures
  );
  exactStems.set(normalisedStem, question.id);

  const tokenSet = new Set(tokensFor(stem));
  const bigramSet = ngrams(tokensFor(stem), 2);

  for (const previous of stemFingerprints) {
    const tokenSimilarity = jaccard(tokenSet, previous.tokenSet);
    const bigramSimilarity = jaccard(bigramSet, previous.bigramSet);

    requireCheck(
      !(tokenSimilarity >= 0.9 && bigramSimilarity >= 0.78),
      `${question.id} is too close to ESP stem ${previous.id} (${tokenSimilarity.toFixed(2)} token, ${bigramSimilarity.toFixed(2)} bigram).`,
      failures
    );
  }

  stemFingerprints.push({ id: question.id, tokenSet, bigramSet });

  increment(countsByTask, task ?? "missing");
  increment(countsByDeliverableType, metadata?.deliverableType ?? "missing");
}

for (const task of ["task_1", "task_2", "task_3", "task_4a", "task_4b"] as const) {
  requireCheck(
    (countsByTask[task] ?? 0) >= 4,
    `${task} must include at least four reviewed ESP practice items.`,
    failures
  );
}

requireCheck(
  (countsByTask.pre_release ?? 0) >= 1,
  "pre_release must include at least one reviewed ESP practice prompt.",
  failures
);

const report = {
  espQuestions: CODEX_ESP_PRACTICE_METADATA.length,
  reviewFile: REVIEW_FILE_PATH,
  countsByTask,
  countsByDeliverableType,
};

if (failures.length > 0) {
  console.error(JSON.stringify({ ...report, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
