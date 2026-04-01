import {
  CODING_TEST_TIMEOUT_MS,
  RUBRIC_FUZZY_THRESHOLD,
  RUBRIC_SUSPICIOUS_THRESHOLD_OFFSET,
  SHORT_WORD_STRICT_THRESHOLD,
  SPELLCHECK_MIN_WORD_LENGTH,
  SPELLCHECK_SUGGESTION_LIMIT,
  SPELLCHECK_SUGGESTION_THRESHOLD,
  VERY_SHORT_WORD_EXACT_MATCH_LENGTH,
} from "@/lib/constants";
import { examQuestions, flashcards, glossaryTerms, papers, quizQuestions } from "@/lib/content";
import type {
  AnswerCheckReport,
  CodingCheckReport,
  CodingTask,
  CodingTestResult,
  ExamQuestion,
  RubricCheckReport,
  RubricCriterion,
  SpellIssue,
} from "@/lib/types";

interface ParsedWord {
  raw: string;
  normalized: string;
  start: number;
  end: number;
}

interface TermMatch {
  term: string;
  fragment: string;
  similarity: number;
  threshold: number;
}

interface SpellSegment {
  text: string;
  issue?: SpellIssue;
}

const WORD_REGEX = /[A-Za-z][A-Za-z'-]*/g;

const COMMON_WORDS = [
  "about", "above", "acceptance", "across", "action", "after", "again", "against", "algorithm",
  "all", "allow", "also", "analysis", "and", "another", "answer", "any", "app", "approach",
  "are", "array", "as", "at", "audit", "auth", "based", "basic", "because", "before", "between",
  "block", "boundary", "branch", "build", "by", "call", "can", "case", "check", "clear", "code",
  "compliance", "condition", "control", "correct", "criteria", "data", "debug", "define", "design",
  "details", "dequeue", "describe", "developer", "development", "different", "edge", "else", "empty",
  "encryption", "enqueue", "error", "event", "every", "example", "expected", "explain", "feature",
  "first", "flow", "for", "front", "from", "function", "gdpr", "given", "goal", "handle", "has",
  "have", "help", "high", "if", "in", "include", "input", "into", "is", "it", "its", "justified",
  "key", "lawful", "least", "legal", "limit", "list", "logic", "loop", "make", "many", "mark",
  "maximum", "measurable", "method", "minimum", "model", "module", "more", "must", "need", "next",
  "not", "notes", "of", "on", "one", "only", "operation", "or", "order", "output", "paper", "pass",
  "point", "process", "programming", "progress", "propose", "queue", "reason", "remove", "report",
  "requirement", "response", "result", "review", "role", "rule", "same", "scenario", "score", "security",
  "service", "set", "should", "show", "simple", "so", "software", "solution", "step", "stories", "story",
  "string", "structure", "suggest", "suitable", "system", "task", "test", "testing", "that", "the", "then",
  "there", "these", "they", "this", "three", "through", "time", "to", "topic", "trace", "two", "underflow",
  "unit", "use", "user", "using", "value", "validation", "weak", "when", "where", "which", "with", "workflow",
  "write", "your",
];

function parseWords(text: string): ParsedWord[] {
  const words: ParsedWord[] = [];
  for (const match of text.matchAll(WORD_REGEX)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const end = start + raw.length;
    words.push({
      raw,
      normalized: normalizeWord(raw),
      start,
      end,
    });
  }
  return words;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizePhrase(value: string): string {
  return parseWords(value)
    .map((word) => word.normalized)
    .filter(Boolean)
    .join(" ");
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function levenshteinSimilarity(a: string, b: string): number {
  const normalizedA = normalizePhrase(a);
  const normalizedB = normalizePhrase(b);

  if (!normalizedA || !normalizedB) {
    return 0;
  }

  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  if (maxLength === 0) {
    return 1;
  }

  return 1 - distance / maxLength;
}

function keywordThreshold(term: string): number {
  const compactLength = normalizeWord(term.replace(/\s+/g, "")).length;

  if (compactLength <= VERY_SHORT_WORD_EXACT_MATCH_LENGTH) {
    return 1;
  }

  if (compactLength <= 5) {
    return Math.max(RUBRIC_FUZZY_THRESHOLD, SHORT_WORD_STRICT_THRESHOLD);
  }

  return RUBRIC_FUZZY_THRESHOLD;
}

function findBestTermMatch(answerWords: ParsedWord[], answerText: string, term: string): TermMatch {
  const normalizedTerm = normalizePhrase(term);
  const threshold = keywordThreshold(term);

  if (!normalizedTerm) {
    return {
      term,
      fragment: "",
      similarity: 0,
      threshold,
    };
  }

  const normalizedAnswer = normalizePhrase(answerText);
  if (normalizedAnswer.includes(normalizedTerm)) {
    return {
      term,
      fragment: term,
      similarity: 1,
      threshold,
    };
  }

  const termWords = parseWords(term).map((word) => word.normalized).filter(Boolean);
  let bestSimilarity = 0;
  let bestFragment = "";

  if (termWords.length <= 1) {
    for (const word of answerWords) {
      const similarity = levenshteinSimilarity(word.normalized, normalizedTerm);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestFragment = word.raw;
      }
    }
  } else {
    const windowSize = termWords.length;
    for (let index = 0; index <= answerWords.length - windowSize; index += 1) {
      const fragmentWords = answerWords.slice(index, index + windowSize);
      const fragment = fragmentWords.map((word) => word.raw).join(" ");
      const similarity = levenshteinSimilarity(fragment, normalizedTerm);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestFragment = fragment;
      }
    }
  }

  return {
    term,
    fragment: bestFragment || term,
    similarity: bestSimilarity,
    threshold,
  };
}

function bestCriterionMatch(answerWords: ParsedWord[], answerText: string, criterion: RubricCriterion): TermMatch {
  const allTerms = [...criterion.keywords, ...(criterion.synonyms ?? [])];

  return allTerms.reduce<TermMatch>(
    (best, term) => {
      const current = findBestTermMatch(answerWords, answerText, term);
      return current.similarity > best.similarity ? current : best;
    },
    {
      term: "",
      fragment: "",
      similarity: 0,
      threshold: RUBRIC_FUZZY_THRESHOLD,
    }
  );
}

export function evaluateRubricAnswer(answer: string, question: ExamQuestion): RubricCheckReport {
  const rubric = question.rubric;

  if (!rubric) {
    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      found: [],
      missing: [],
      suspicious: [],
    };
  }

  const answerWords = parseWords(answer);
  const found: RubricCheckReport["found"] = [];
  const missing: RubricCheckReport["missing"] = [];
  const suspicious: RubricCheckReport["suspicious"] = [];

  let score = 0;

  for (const criterion of rubric.criteria) {
    const match = bestCriterionMatch(answerWords, answer, criterion);
    const suspiciousThreshold = Math.max(0, match.threshold - RUBRIC_SUSPICIOUS_THRESHOLD_OFFSET);

    if (match.similarity >= match.threshold) {
      score += criterion.weight;
      found.push({
        criterionId: criterion.id,
        label: criterion.label,
        weight: criterion.weight,
        matchedTerm: match.term,
        matchedFragment: match.fragment,
        similarity: Number(match.similarity.toFixed(2)),
      });
      continue;
    }

    if (match.similarity >= suspiciousThreshold) {
      suspicious.push({
        criterionId: criterion.id,
        label: criterion.label,
        matchedTerm: match.term,
        matchedFragment: match.fragment,
        similarity: Number(match.similarity.toFixed(2)),
      });
      continue;
    }

    missing.push({
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      expectedTerms: [...criterion.keywords, ...(criterion.synonyms ?? [])],
    });
  }

  const maxScore = rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    score,
    maxScore,
    percentage,
    found,
    missing,
    suspicious,
  };
}

function buildDictionary(): string[] {
  const dictionary = new Set<string>(COMMON_WORDS.map((word) => normalizeWord(word)).filter(Boolean));

  const textSources: string[] = [];

  textSources.push(
    ...papers.flatMap((paper) => [
      paper.title,
      paper.examTitle,
      ...paper.topics.flatMap((topic) => [
        topic.title,
        topic.summary,
        ...topic.subtopics.flatMap((subtopic) => [subtopic.title, subtopic.notes]),
      ]),
    ])
  );

  textSources.push(
    ...glossaryTerms.flatMap((term) => [term.term, term.definition]),
    ...flashcards.flatMap((card) => [card.term, card.prompt, card.answer]),
    ...quizQuestions.flatMap((question) => [question.prompt, question.explanation, ...question.options]),
    ...examQuestions.flatMap((question) => [
      question.title,
      question.scenario,
      question.task,
      ...question.markSchemeHints,
      ...(question.rubric?.criteria.flatMap((criterion) => [
        criterion.label,
        ...criterion.keywords,
        ...(criterion.synonyms ?? []),
      ]) ?? []),
      question.codingTask?.starterCode ?? "",
      ...(question.codingTask?.tests.map((test) => test.description) ?? []),
    ])
  );

  for (const text of textSources) {
    for (const word of parseWords(text)) {
      if (word.normalized.length >= 2) {
        dictionary.add(word.normalized);
      }
    }
  }

  return Array.from(dictionary.values());
}

const SPELL_DICTIONARY = buildDictionary();
const SPELL_DICTIONARY_SET = new Set(SPELL_DICTIONARY);

function shouldIgnoreSpellToken(word: ParsedWord): boolean {
  if (word.normalized.length < SPELLCHECK_MIN_WORD_LENGTH) {
    return true;
  }

  if (/^[A-Z0-9]+$/.test(word.raw) && word.raw.length <= 5) {
    return true;
  }

  return false;
}

function suggestionCandidates(word: string): string[] {
  const candidates = SPELL_DICTIONARY.filter((candidate) => candidate[0] === word[0]);

  const ranked = candidates
    .map((candidate) => ({
      value: candidate,
      similarity: levenshteinSimilarity(word, candidate),
    }))
    .filter((candidate) => candidate.similarity >= SPELLCHECK_SUGGESTION_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, SPELLCHECK_SUGGESTION_LIMIT)
    .map((candidate) => candidate.value);

  return ranked;
}

export function runSpellcheck(answer: string): SpellIssue[] {
  const words = parseWords(answer);
  const issues: SpellIssue[] = [];

  for (const word of words) {
    if (shouldIgnoreSpellToken(word)) {
      continue;
    }

    if (SPELL_DICTIONARY_SET.has(word.normalized)) {
      continue;
    }

    issues.push({
      word: word.raw,
      normalizedWord: word.normalized,
      start: word.start,
      end: word.end,
      suggestions: suggestionCandidates(word.normalized),
    });
  }

  return issues;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a !== "object" || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const objectA = a as Record<string, unknown>;
  const objectB = b as Record<string, unknown>;
  const keysA = Object.keys(objectA);
  const keysB = Object.keys(objectB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every((key) => deepEqual(objectA[key], objectB[key]));
}

function valueToText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function runCodingTask(code: string, question: ExamQuestion): CodingCheckReport {
  const task = question.codingTask as CodingTask | undefined;

  if (!task) {
    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      tests: [],
      compileError: "Coding task is not configured.",
    };
  }

  let callable: unknown;

  try {
    callable = new Function(`${code}\n; return typeof ${task.functionName} === "function" ? ${task.functionName} : null;`)();
  } catch (error) {
    return {
      score: 0,
      maxScore: task.tests.length,
      percentage: 0,
      tests: [],
      compileError: error instanceof Error ? error.message : "Compilation failed.",
    };
  }

  if (typeof callable !== "function") {
    return {
      score: 0,
      maxScore: task.tests.length,
      percentage: 0,
      tests: [],
      compileError: `Function ${task.functionName} was not found in your code.`,
    };
  }

  const fn = callable as (...args: unknown[]) => unknown;
  const startedAt = Date.now();
  const results: CodingTestResult[] = [];

  for (const test of task.tests) {
    if (Date.now() - startedAt > CODING_TEST_TIMEOUT_MS) {
      results.push({
        id: test.id,
        description: test.description,
        passed: false,
        expected: valueToText(test.expected),
        actual: "<timeout>",
        error: `Execution exceeded ${CODING_TEST_TIMEOUT_MS}ms`,
      });
      continue;
    }

    try {
      const actual = fn(...test.args);
      if (actual instanceof Promise) {
        results.push({
          id: test.id,
          description: test.description,
          passed: false,
          expected: valueToText(test.expected),
          actual: "<promise>",
          error: "Async return values are not supported in this checker.",
        });
        continue;
      }

      const passed = deepEqual(actual, test.expected);
      results.push({
        id: test.id,
        description: test.description,
        passed,
        expected: valueToText(test.expected),
        actual: valueToText(actual),
      });
    } catch (error) {
      results.push({
        id: test.id,
        description: test.description,
        passed: false,
        expected: valueToText(test.expected),
        actual: "<runtime error>",
        error: error instanceof Error ? error.message : "Runtime error",
      });
    }
  }

  const passedCount = results.filter((result) => result.passed).length;
  const maxScore = task.tests.length;
  const percentage = maxScore > 0 ? Math.round((passedCount / maxScore) * 100) : 0;

  return {
    score: passedCount,
    maxScore,
    percentage,
    tests: results,
  };
}

export function evaluateExamResponse(question: ExamQuestion, response: string): AnswerCheckReport {
  if (question.answerType === "coding") {
    const codingReport = runCodingTask(response, question);
    return {
      questionId: question.id,
      paperId: question.paperId,
      questionTitle: question.title,
      answerType: question.answerType,
      response,
      codingReport,
      score: codingReport.score,
      maxScore: codingReport.maxScore,
      percentage: codingReport.percentage,
      checkedAt: new Date().toISOString(),
    };
  }

  const rubricReport = evaluateRubricAnswer(response, question);
  const spellIssues = runSpellcheck(response);

  return {
    questionId: question.id,
    paperId: question.paperId,
    questionTitle: question.title,
    answerType: question.answerType,
    response,
    rubricReport,
    spellIssues,
    score: rubricReport.score,
    maxScore: rubricReport.maxScore,
    percentage: rubricReport.percentage,
    checkedAt: new Date().toISOString(),
  };
}

export function buildSpellSegments(answer: string, spellIssues: SpellIssue[]): SpellSegment[] {
  if (spellIssues.length === 0) {
    return [{ text: answer }];
  }

  const sorted = [...spellIssues].sort((a, b) => a.start - b.start);
  const segments: SpellSegment[] = [];
  let cursor = 0;

  for (const issue of sorted) {
    if (cursor < issue.start) {
      segments.push({ text: answer.slice(cursor, issue.start) });
    }

    segments.push({
      text: answer.slice(issue.start, issue.end),
      issue,
    });

    cursor = issue.end;
  }

  if (cursor < answer.length) {
    segments.push({ text: answer.slice(cursor) });
  }

  return segments;
}

export type { SpellSegment };
