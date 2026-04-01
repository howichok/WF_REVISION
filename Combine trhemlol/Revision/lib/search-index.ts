import { allTopics, getOutcomeText, glossaryTerms, papersById, topicById } from "@/lib/content";
import type { GlossaryTerm, PaperId } from "@/lib/types";

export type SearchResultType = "topic" | "subtopic" | "outcome" | "term";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  specRef: string;
  path: string;
  href: string;
  paperId?: PaperId;
  score: number;
}

interface SearchIndexEntry {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  specRef: string;
  path: string;
  href: string;
  paperId?: PaperId;
  normalizedTitle: string;
  normalizedDescription: string;
  normalizedSpecRef: string;
  normalizedPath: string;
  tokens: string[];
}

const FUZZY_THRESHOLD = 0.8;
const MAX_RESULTS = 40;
const OUTCOME_DESCRIPTION_LIMIT = 190;
const SHORT_TOKEN_FUZZY_MIN_LENGTH = 5;

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeSearchText(value)
    .split(/[.\s]/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function createPath(paperId: PaperId, pathIds: string[]): string {
  const paperTitle = papersById[paperId]?.title ?? paperId;
  const pathLabels = pathIds.map((pathId) => topicById[pathId]?.title ?? pathId);
  return [paperTitle, ...pathLabels].join(" > ");
}

function toLibraryHref(paperId: PaperId, nodeId: string, outcomeId?: string): string {
  const params = new URLSearchParams();
  params.set("paper", paperId);
  params.set("node", nodeId);
  if (outcomeId) {
    params.set("outcome", outcomeId);
  }
  return `/library?${params.toString()}`;
}

function createEntry(entry: Omit<SearchIndexEntry, "normalizedTitle" | "normalizedDescription" | "normalizedSpecRef" | "normalizedPath" | "tokens">): SearchIndexEntry {
  const tokenSource = `${entry.title} ${entry.specRef} ${entry.path} ${entry.description}`;
  return {
    ...entry,
    normalizedTitle: normalizeSearchText(entry.title),
    normalizedDescription: normalizeSearchText(entry.description),
    normalizedSpecRef: normalizeSearchText(entry.specRef),
    normalizedPath: normalizeSearchText(entry.path),
    tokens: tokenize(tokenSource),
  };
}

function buildTopicEntries(): SearchIndexEntry[] {
  return allTopics.map((topic) => {
    const pathIds = topic.pathIds ?? [topic.id];
    const path = createPath(topic.paperId, pathIds);
    const outcomeText = (topic.outcomes ?? []).map((outcomeId) => getOutcomeText(outcomeId)).join(" ");
    const type: SearchResultType = (topic.depth ?? 0) <= 0 ? "topic" : "subtopic";

    return createEntry({
      id: `node-${topic.id}`,
      type,
      title: topic.title,
      description: topic.summary ? `${topic.summary} ${outcomeText}`.trim() : outcomeText,
      specRef: topic.id,
      path,
      href: toLibraryHref(topic.paperId, topic.id),
      paperId: topic.paperId,
    });
  });
}

function buildOutcomeEntries(): SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = [];

  for (const topic of allTopics) {
    const pathIds = topic.pathIds ?? [topic.id];
    const basePath = createPath(topic.paperId, pathIds);

    for (const outcomeId of topic.outcomes ?? []) {
      const outcomeText = getOutcomeText(outcomeId);
      entries.push(
        createEntry({
          id: `outcome-${outcomeId}`,
          type: "outcome",
          title: `Outcome ${outcomeId}`,
          description:
            outcomeText.length > OUTCOME_DESCRIPTION_LIMIT
              ? `${outcomeText.slice(0, OUTCOME_DESCRIPTION_LIMIT - 3)}...`
              : outcomeText,
          specRef: outcomeId,
          path: `${basePath} > Outcome ${outcomeId}`,
          href: toLibraryHref(topic.paperId, topic.id, outcomeId),
          paperId: topic.paperId,
        })
      );
    }
  }

  return entries;
}

function buildGlossaryEntries(): SearchIndexEntry[] {
  return glossaryTerms.map((term) => {
    const aliases = ((term as GlossaryTerm & { aliases?: string[] }).aliases ?? []).join(" ");
    const topicTitle = topicById[term.topicId]?.title ?? term.topicId;
    const path = `${papersById[term.paperId]?.title ?? term.paperId} > ${topicTitle}`;
    return createEntry({
      id: `term-${term.id}`,
      type: "term",
      title: term.term,
      description: `${term.definition} ${aliases}`.trim(),
      specRef: term.topicId,
      path,
      href: toLibraryHref(term.paperId, term.topicId),
      paperId: term.paperId,
    });
  });
}

const TOPIC_INDEX = buildTopicEntries();
const OUTCOME_INDEX = buildOutcomeEntries();
const GLOSSARY_INDEX = buildGlossaryEntries();
const BASE_INDEX = [...TOPIC_INDEX, ...GLOSSARY_INDEX];
const FULL_INDEX = [...BASE_INDEX, ...OUTCOME_INDEX];

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
  if (!a || !b) {
    return 0;
  }

  const distance = levenshteinDistance(a, b);
  const max = Math.max(a.length, b.length);
  if (max === 0) {
    return 1;
  }

  return 1 - distance / max;
}

function bestTokenSimilarity(query: string, tokens: string[]): number {
  if (query.length < SHORT_TOKEN_FUZZY_MIN_LENGTH) {
    return 0;
  }

  let best = 0;
  for (const token of tokens) {
    if (Math.abs(token.length - query.length) > 4) {
      continue;
    }

    const similarity = levenshteinSimilarity(query, token);
    if (similarity > best) {
      best = similarity;
    }
  }

  return best;
}

function scoreEntry(entry: SearchIndexEntry, normalizedQuery: string, queryTokens: string[]): number {
  let score = 0;

  if (entry.normalizedTitle.includes(normalizedQuery)) {
    score = Math.max(score, 130);
  }
  if (entry.normalizedSpecRef.includes(normalizedQuery)) {
    score = Math.max(score, 120);
  }
  if (entry.normalizedPath.includes(normalizedQuery)) {
    score = Math.max(score, 90);
  }
  if (entry.normalizedDescription.includes(normalizedQuery)) {
    score = Math.max(score, 82);
  }

  if (queryTokens.length > 1) {
    const tokenMatches = queryTokens.reduce((count, token) => {
      return entry.tokens.some((entryToken) => entryToken === token || entryToken.includes(token))
        ? count + 1
        : count;
    }, 0);

    if (tokenMatches > 0) {
      score += tokenMatches * 12;
      if (tokenMatches === queryTokens.length) {
        score += 18;
      }
    }
  }

  if (score > 0) {
    return score;
  }

  const similarity = bestTokenSimilarity(normalizedQuery, entry.tokens);
  if (similarity >= FUZZY_THRESHOLD) {
    return Math.round(similarity * 75);
  }

  return 0;
}

export function searchKnowledgeIndex(
  query: string,
  options?: {
    includeOutcomes?: boolean;
    limit?: number;
  }
): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const queryTokens = tokenize(normalizedQuery);
  const includeOutcomes = options?.includeOutcomes ?? false;
  const limit = options?.limit ?? MAX_RESULTS;
  const entries = includeOutcomes ? FULL_INDEX : BASE_INDEX;

  return entries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, normalizedQuery, queryTokens),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit)
    .map(({ entry, score }) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      description: entry.description,
      specRef: entry.specRef,
      path: entry.path,
      href: entry.href,
      paperId: entry.paperId,
      score,
    }));
}

export function groupSearchResults(results: SearchResult[]): Record<SearchResultType, SearchResult[]> {
  return results.reduce<Record<SearchResultType, SearchResult[]>>(
    (groups, item) => {
      groups[item.type].push(item);
      return groups;
    },
    {
      topic: [],
      subtopic: [],
      outcome: [],
      term: [],
    }
  );
}

