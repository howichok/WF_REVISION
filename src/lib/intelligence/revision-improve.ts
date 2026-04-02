import { extractCommandWord } from "@/lib/command-words";
import { getTopicCoverageGraph } from "@/lib/content";
import { findPhraseEvidence } from "@/lib/intelligence/fuzzy";
import { normalizeString, normalizeText, tokenizeNormalized } from "@/lib/intelligence/normalize";
import { REVISION_QUESTION_SCHEMAS } from "@/lib/intelligence/rules/revision";
import { evaluateRevisionAnswerWithSchema } from "@/lib/intelligence/scoring";
import {
  generateGeminiRevisionPolish,
  type GeminiRevisionPolishResponse,
} from "@/lib/research/gemini-revision-polish";
import {
  TOPIC_WEAK_PHRASE_DICTIONARIES,
  type RevisionWeakPhraseRule,
} from "./revision-improve-dictionaries";
import { isSafeMicroRewrite } from "./revision-improve-guards";
import type {
  RevisionImprovementChange,
  RevisionImprovementRequest,
  RevisionImprovementResponse,
  RevisionImprovementSpan,
  RevisionQuestionSchema,
} from "./types";

interface RevisionImproveDependencies {
  polishResolver?: (
    request: {
      topicId: string;
      questionPrompt: string;
      learnerAnswer: string;
      localImprovement: RevisionImprovementResponse;
    }
  ) => Promise<GeminiRevisionPolishResponse>;
}

interface TokenOffset {
  normalized: string;
  start: number;
  end: number;
  raw: string;
}

const GENERIC_WEAK_PHRASES: Array<{
  phrase: string;
  replacementHint: string;
  reason: string;
  microRewriteText: string;
}> = [
  {
    phrase: "important",
    replacementHint: "Name the exact impact instead of calling it important.",
    reason: "This word is too vague on its own.",
    microRewriteText: "significant",
  },
  {
    phrase: "good",
    replacementHint: "Replace this with a technical effect or benefit.",
    reason: "This is generic praise, not exam evidence.",
    microRewriteText: "effective",
  },
  {
    phrase: "better",
    replacementHint: "Explain what is better and why.",
    reason: "Comparative wording needs a clear reason.",
    microRewriteText: "more appropriate",
  },
  {
    phrase: "secure",
    replacementHint: "Name the control or property that makes it secure.",
    reason: "Security claims need a precise mechanism.",
    microRewriteText: "access-controlled",
  },
  {
    phrase: "efficient",
    replacementHint: "State what becomes faster, cheaper, or easier to manage.",
    reason: "Efficiency needs a named effect.",
    microRewriteText: "resource-efficient",
  },
  {
    phrase: "safe",
    replacementHint: "Explain what risk is reduced or what protection is added.",
    reason: "This is too broad without a risk or control.",
    microRewriteText: "protected",
  },
];

const REVISION_IMPROVEMENT_CACHE = new Map<string, RevisionImprovementResponse>();

function getRevisionSchema(questionId: string): RevisionQuestionSchema | null {
  return REVISION_QUESTION_SCHEMAS.find((schema) => schema.id === questionId) ?? null;
}

function buildTokenOffsets(answer: string): TokenOffset[] {
  const offsets: TokenOffset[] = [];
  const matches = answer.matchAll(/[\p{L}\p{N}']+/gu);

  for (const match of matches) {
    const raw = match[0] ?? "";
    const start = match.index ?? 0;
    const end = start + raw.length;
    const normalizedTokens = tokenizeNormalized(normalizeString(raw));

    if (normalizedTokens.length === 0) {
      continue;
    }

    for (const token of normalizedTokens) {
      offsets.push({
        normalized: token,
        start,
        end,
        raw,
      });
    }
  }

  return offsets;
}

function clampWords(value: string, maxWords = 24) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function buildImprovementCacheKey(request: RevisionImprovementRequest) {
  const normalizedAnswer = request.answer.trim().replace(/\s+/g, " ").toLowerCase();

  return `${request.questionId}::${request.outputMode ?? "commentator"}::${normalizedAnswer}`;
}

function toCharSpan(answer: string, phrase: string) {
  const normalized = normalizeText(answer);
  const evidence = findPhraseEvidence(normalized, phrase);
  if (!evidence) {
    return null;
  }

  const offsets = buildTokenOffsets(answer);
  const startOffset = offsets[evidence.start];
  const endOffset = offsets[evidence.end];
  if (!startOffset || !endOffset) {
    return null;
  }

  return {
    start: startOffset.start,
    end: endOffset.end,
    targetText: answer.slice(startOffset.start, endOffset.end),
  };
}

function addSpan(
  spans: RevisionImprovementSpan[],
  next: RevisionImprovementSpan
) {
  const overlaps = spans.some(
    (span) =>
      Math.max(span.start, next.start) < Math.min(span.end, next.end)
  );

  if (overlaps) {
    return;
  }

  spans.push(next);
}

function buildSummary(
  scorePercent: number,
  missingCount: number,
  misconceptionCount: number
) {
  if (misconceptionCount > 0) {
    return "Fix the misconception first, then add the missing mark-scheme ideas.";
  }

  if (missingCount >= 2) {
    return "The fastest gain is to add the missing marking ideas before polishing style.";
  }

  if (scorePercent >= 70) {
    return "This is close to a strong answer. Tighten precision and development rather than rewriting everything.";
  }

  return "Keep the structure, but make the explanation more precise and better developed.";
}

function buildCommentator(
  schema: RevisionQuestionSchema,
  scorePercent: number,
  missingConcepts: string[],
  misconceptionLabels: string[]
) {
  const commandWord = extractCommandWord(schema.prompt);
  const points = [
    commandWord
      ? `Stay faithful to ${commandWord.word.toLowerCase()}: ${commandWord.guidance}`
      : "Make one direct point, then explain it and link it back to the question.",
    missingConcepts[0]
      ? `Add a clear sentence for ${missingConcepts[0]}.`
      : "Develop one point further with a consequence or example.",
    misconceptionLabels[0]
      ? `Fix this confusion: ${misconceptionLabels[0]}.`
      : scorePercent >= 70
        ? "Replace vague wording with precise technical language."
        : "Name the effect on the system, user, or data instead of staying generic.",
  ];

  return points.slice(0, 3).map((point) => clampWords(point, 18));
}

function buildChecklist(
  schema: RevisionQuestionSchema,
  missingConcepts: string[],
  partialConcepts: string[],
  improvementSignals: string[]
) {
  const commandWord = extractCommandWord(schema.prompt);
  const checklist = [
    commandWord
      ? `Answer the ${commandWord.word.toLowerCase()} part of the question explicitly.`
      : "Answer the question directly before adding detail.",
    missingConcepts[0]
      ? `Mention ${missingConcepts[0]}.`
      : "Add one missing mark-scheme idea.",
    partialConcepts[0]
      ? `Develop ${partialConcepts[0]} further.`
      : improvementSignals[0]
        ? `Add this missing gain: ${improvementSignals[0]}.`
        : "Develop one point with an example or effect.",
    improvementSignals[1]
      ? `Tighten this detail: ${improvementSignals[1]}.`
      : "Keep the wording technical, not generic.",
  ];

  return checklist.slice(0, 4);
}

function getCoverageCoachingSignals(topicId: string) {
  const graph = getTopicCoverageGraph(topicId);
  const rewriteRules = graph?.coverageByPoint.flatMap((node) =>
    node.rewriteRules.map((rule) => ({
      phrase: rule.target,
      replacementHint: rule.hint,
      reason: `Coverage graph signal for ${node.pointCode} ${node.pointTitle}.`,
      microRewriteText: rule.microRewrite,
    }))
  ) ?? [];
  const improvementSignals =
    graph?.coverageByPoint.flatMap((node) => node.improvementSignals).slice(0, 8) ?? [];

  return {
    rewriteRules,
    improvementSignals,
  };
}

export function generateRevisionImprovement(
  request: RevisionImprovementRequest
): RevisionImprovementResponse {
  const schema = getRevisionSchema(request.questionId);
  if (!schema) {
    throw new Error(`Unknown revision question: ${request.questionId}`);
  }

  const answer = request.answer.trim();
  const evaluation = evaluateRevisionAnswerWithSchema(schema, answer);
  const scorePercent = Math.round((evaluation.score / evaluation.maxScore) * 100);
  const partialConcepts = evaluation.conceptBreakdown.filter(
    (concept) => concept.coverage > 0 && concept.coverage < 1
  );
  const coverageSignals = getCoverageCoachingSignals(schema.topicId);
  const weakSpans: RevisionImprovementSpan[] = [];
  const changes: RevisionImprovementChange[] = [];

  for (const misconception of evaluation.misconceptionBreakdown.slice(0, 2)) {
    const cue = schema.misconceptions.find((item) => item.id === misconception.id)?.groups[0]?.anyOf[0];
    const span = cue ? toCharSpan(answer, cue) : null;

    if (span) {
      addSpan(weakSpans, {
        id: `misconception-${misconception.id}`,
        label: misconception.label,
        start: span.start,
        end: span.end,
        severity: "high",
        reason: misconception.explanation,
        replacementHint: "Replace this with the correct distinction or definition.",
      });
    }

    changes.push({
      id: `misconception-change-${misconception.id}`,
      kind: "replace",
      label: misconception.label,
      targetText: span?.targetText,
      replacementText: clampWords(
        `Replace this with a precise distinction that avoids ${misconception.label.toLowerCase()}.`,
        16
      ),
      rationale: misconception.explanation,
    });
  }

  for (const concept of partialConcepts.slice(0, 2)) {
    const cue = concept.matchedEvidence[0];
    const missing = concept.missingEvidence[0];
    const span = cue ? toCharSpan(answer, cue) : null;

    if (span) {
      addSpan(weakSpans, {
        id: `partial-${concept.id}`,
        label: concept.label,
        start: span.start,
        end: span.end,
        severity: "medium",
        reason: `Good start, but this point still needs ${missing || "more development"}.`,
        replacementHint: missing
          ? `Develop this by adding ${missing}.`
          : "Develop this with a clearer consequence or example.",
      });
    }

    changes.push({
      id: `partial-change-${concept.id}`,
      kind: "add",
      label: concept.label,
      replacementText: clampWords(
        missing
          ? `Add ${missing} and explain why it matters in this answer.`
          : `Develop ${concept.label} with an example, consequence, or trade-off.`,
        18
      ),
      rationale: `${concept.label} is only partially developed right now.`,
    });
  }

  for (const concept of evaluation.conceptBreakdown.filter((item) => item.coverage === 0).slice(0, 2)) {
    const missing = concept.missingEvidence[0];
    changes.push({
      id: `missing-change-${concept.id}`,
      kind: "add",
      label: concept.label,
      replacementText: clampWords(
        missing
          ? `Add a sentence covering ${missing} so this marking idea is present.`
          : `Add a direct sentence for ${concept.label}.`,
        18
      ),
      rationale: `${concept.label} is missing from the current draft.`,
    });
  }

  const phraseRules: RevisionWeakPhraseRule[] = [
    ...GENERIC_WEAK_PHRASES,
    ...(TOPIC_WEAK_PHRASE_DICTIONARIES[schema.topicId] ?? []),
    ...coverageSignals.rewriteRules,
  ];

  for (const phrase of phraseRules) {
    const span = toCharSpan(answer, phrase.phrase);
    if (!span) {
      continue;
    }

    addSpan(weakSpans, {
      id: `generic-${phrase.phrase}-${span.start}`,
      label: phrase.phrase,
      start: span.start,
      end: span.end,
      severity: "medium",
      reason: phrase.reason,
      replacementHint: phrase.replacementHint,
    });

    changes.push({
      id: `generic-change-${phrase.phrase}-${span.start}`,
      kind: "replace",
      label: `Replace "${phrase.phrase}"`,
      targetText: span.targetText,
      replacementText: clampWords(phrase.replacementHint, 18),
      rationale: phrase.reason,
      microRewriteText: phrase.microRewriteText &&
        isSafeMicroRewrite(phrase.microRewriteText, span.targetText)
        ? phrase.microRewriteText
        : undefined,
    });
  }

  const uniqueChanges = Array.from(
    new Map(changes.map((change) => [change.id, change])).values()
  ).slice(0, 5);

  return {
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "revision-improve",
    provider: "local-rule-engine",
    questionId: schema.id,
    topicId: schema.topicId,
    outputMode: request.outputMode ?? "commentator",
    summary: buildSummary(
      scorePercent,
      evaluation.missingConcepts.length,
      evaluation.misconceptionBreakdown.length
    ),
    commentator: buildCommentator(
      schema,
      scorePercent,
      evaluation.missingConcepts,
      evaluation.misconceptionBreakdown.map((item) => item.label)
    ),
    checklist: buildChecklist(
      schema,
      evaluation.missingConcepts,
      partialConcepts.map((item) => item.label),
      coverageSignals.improvementSignals
    ),
    weakSpans: weakSpans
      .sort((left, right) => left.start - right.start)
      .slice(0, 6),
    changes: uniqueChanges,
    basedOnScore: {
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      confidence: evaluation.confidence,
    },
  };
}

function shouldUseGeminiPolish(response: RevisionImprovementResponse) {
  return response.changes.length > 0 || response.commentator.length > 0;
}

function mergePolishedChanges(
  localChanges: RevisionImprovementResponse["changes"],
  polishedChanges: GeminiRevisionPolishResponse["changes"]
) {
  if (polishedChanges.length === 0) {
    return localChanges;
  }

  const polishedMap = new Map(polishedChanges.map((change) => [change.id, change]));

  return localChanges.map((change) => {
    const polished = polishedMap.get(change.id);
    if (!polished) {
      return change;
    }

    return {
      ...change,
      replacementText: polished.replacementText || change.replacementText,
      rationale: polished.rationale || change.rationale,
      microRewriteText:
        polished.microRewriteText &&
        change.kind === "replace" &&
        isSafeMicroRewrite(polished.microRewriteText, change.targetText)
          ? polished.microRewriteText
          : change.microRewriteText,
    };
  });
}

export async function generateRevisionImprovementResponse(
  request: RevisionImprovementRequest,
  deps: RevisionImproveDependencies = {}
): Promise<RevisionImprovementResponse> {
  const cacheKey = buildImprovementCacheKey(request);
  const cached = REVISION_IMPROVEMENT_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const local = generateRevisionImprovement(request);

  if (!shouldUseGeminiPolish(local)) {
    REVISION_IMPROVEMENT_CACHE.set(cacheKey, local);
    return local;
  }

  const schema = getRevisionSchema(request.questionId);
  if (!schema) {
    return local;
  }

  const polishResolver = deps.polishResolver ?? generateGeminiRevisionPolish;

  try {
    const polished = await polishResolver({
      topicId: local.topicId,
      questionPrompt: schema.prompt,
      learnerAnswer: request.answer.trim(),
      localImprovement: local,
    });

    if (polished.outOfScope) {
      REVISION_IMPROVEMENT_CACHE.set(cacheKey, local);
      return local;
    }

    const merged = {
      ...local,
      provider: polished.provider,
      model: polished.model,
      summary: polished.summary || local.summary,
      commentator:
        polished.commentator.length > 0
          ? polished.commentator.slice(0, local.commentator.length || 3)
          : local.commentator,
      checklist:
        polished.checklist.length > 0
          ? polished.checklist.slice(0, local.checklist.length || 4)
          : local.checklist,
      changes: mergePolishedChanges(local.changes, polished.changes),
    };
    REVISION_IMPROVEMENT_CACHE.set(cacheKey, merged);
    return merged;
  } catch {
    REVISION_IMPROVEMENT_CACHE.set(cacheKey, local);
    return local;
  }
}
