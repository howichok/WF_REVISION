import { getCurriculumAreaById, getTopicContentBundle } from "@/lib/content";
import { findPhraseEvidence, stringSimilarity, tokenOverlapScore } from "@/lib/intelligence/fuzzy";
import { normalizeText } from "@/lib/intelligence/normalize";
import { TOPICS, TOPIC_TREES, type TopicId } from "@/lib/types";

export type SearchMatchLabel = "Strong match" | "Partial match" | "Related";

export interface TopicSearchResult {
  id: string;
  topicId: TopicId;
  topicTitle: string;
  topicIcon: string;
  subtopicId: string;
  subtopicTitle: string;
  section: string;
  shortDescription: string;
  longDescription: string;
  score: number;
  confidence: number;
  matchLabel: SearchMatchLabel;
  matchedTerms: string[];
  reasons: string[];
  keywords: string[];
  examVocabulary: string[];
  weakSpots: string[];
  revisionPriorities: string[];
  relatedSubtopics: Array<{ id: string; title: string }>;
  relatedTopics: Array<{ id: string; title: string; icon: string }>;
  officialPointCodes: string[];
}

export interface TopicSearchSuggestion {
  topicId: TopicId;
  topicTitle: string;
  topicIcon: string;
  section: string;
  shortDescription: string;
  score: number;
  matchLabel: SearchMatchLabel;
  matchedTerms: string[];
  reasons: string[];
  relatedSubtopics: Array<{ id: string; title: string }>;
}

export interface TopicSearchResponse {
  directMatches: TopicSearchResult[];
  relatedMatches: TopicSearchResult[];
  suggestedTopics: TopicSearchSuggestion[];
  topMatch: TopicSearchResult | null;
  noDirectMatch: boolean;
  querySummary: string;
}

interface TopicHintConfig {
  aliases: string[];
  revisionPriorities: string[];
  weakSpots: string[];
  relatedTopics: TopicId[];
}

interface SubtopicHintConfig {
  aliases: string[];
}

interface TopicMetadata {
  id: TopicId;
  title: string;
  icon: string;
  section: string;
  shortDescription: string;
  longDescription: string;
  aliases: string[];
  keywords: string[];
  examVocabulary: string[];
  revisionPriorities: string[];
  weakSpots: string[];
  relatedTopics: TopicId[];
  officialPointCodes: string[];
}

interface SubtopicMetadata {
  id: string;
  topicId: TopicId;
  title: string;
  section: string;
  shortDescription: string;
  longDescription: string;
  aliases: string[];
  keywords: string[];
  examVocabulary: string[];
  searchableText: string;
  officialPointCodes: string[];
}

interface FieldContribution {
  score: number;
  matchedTerm: string;
  reason: string;
}

const TOPIC_HINTS: Record<TopicId, TopicHintConfig> = {
  "problem-solving": {
    aliases: ["algorithm design", "problem analysis", "flowchart planning", "pseudocode"],
    revisionPriorities: [
      "Separate decomposition, abstraction, and pattern recognition clearly.",
      "Practice turning short scenarios into pseudocode or flowcharts.",
      "Compare algorithms by steps and efficiency, not just by name.",
    ],
    weakSpots: [
      "Mixing abstraction and decomposition together.",
      "Describing a method without explaining when it should be used.",
    ],
    relatedTopics: ["intro-programming", "business", "data"],
  },
  "intro-programming": {
    aliases: ["coding basics", "programming basics", "code structure", "python basics"],
    revisionPriorities: [
      "Revise data types, loops, functions, and validation as one connected system.",
      "Use scenario questions to justify the right control structure.",
      "Review built-in functions and testing terms with examples.",
    ],
    weakSpots: [
      "Forgetting how data types affect operations or conversion.",
      "Naming a testing term without saying what it checks.",
    ],
    relatedTopics: ["problem-solving", "data", "security"],
  },
  "emerging-issues": {
    aliases: ["digital impact", "technology ethics", "future tech"],
    revisionPriorities: [
      "Pair each technology with a realistic benefit and limitation.",
      "Link accessibility and ethics to actual user impact.",
    ],
    weakSpots: [
      "Listing technology names without explaining impact.",
      "Giving only benefits and ignoring risk or ethics.",
    ],
    relatedTopics: ["legislation", "security", "business"],
  },
  legislation: {
    aliases: ["law", "compliance", "regulation", "digital law"],
    revisionPriorities: [
      "Match each law to the behaviour it controls in practice.",
      "Separate legislation from guidance and codes of conduct.",
    ],
    weakSpots: [
      "Naming a law without explaining what it requires or restricts.",
      "Treating professional guidance like legislation.",
    ],
    relatedTopics: ["security", "business", "emerging-issues"],
  },
  business: {
    aliases: ["business context", "project delivery", "change management"],
    revisionPriorities: [
      "Explain decisions from different stakeholder perspectives.",
      "Compare rollout and migration choices by disruption, cost, and risk.",
    ],
    weakSpots: [
      "Using generic business benefits with no scenario context.",
      "Ignoring stakeholder trade-offs.",
    ],
    relatedTopics: ["problem-solving", "legislation", "digital-environments"],
  },
  data: {
    aliases: ["databases", "data storage", "sql", "data handling"],
    revisionPriorities: [
      "Revise relational database terms and what SQL queries actually do.",
      "Compare JSON, XML, CSV, and other data formats clearly.",
      "Separate backup, archive, retention, and disposal decisions.",
    ],
    weakSpots: [
      "Confusing data formats with database structures.",
      "Ignoring why keys and normalisation matter.",
    ],
    relatedTopics: ["intro-programming", "digital-environments", "security"],
  },
  "digital-environments": {
    aliases: ["infrastructure", "networking", "cloud", "deployment environment"],
    revisionPriorities: [
      "Match each network component or service to its role.",
      "Compare physical, virtual, and cloud environments in context.",
      "Explain how resilience features reduce downtime.",
    ],
    weakSpots: [
      "Mixing devices, services, and protocols together.",
      "Naming cloud models without linking them to control or cost.",
    ],
    relatedTopics: ["data", "security", "business"],
  },
  security: {
    aliases: ["cyber security", "cybersecurity", "threats and controls"],
    revisionPriorities: [
      "Pair each attack with the best-fit mitigation and explain why it works.",
      "Differentiate authentication, authorisation, and access control.",
      "Link patching, testing, and maintenance to ongoing security.",
    ],
    weakSpots: [
      "Naming a control without saying which threat it addresses.",
      "Treating backup like a replacement for wider security practice.",
    ],
    relatedTopics: ["legislation", "digital-environments", "data"],
  },
  esp: {
    aliases: ["employer set project", "synoptic", "project brief"],
    revisionPriorities: [
      "Turn the brief into requirements before picking solutions.",
      "Link design, build, testing, and evaluation choices back to the brief.",
    ],
    weakSpots: [
      "Treating the project like unrelated theory points.",
      "Ignoring the brief when justifying choices.",
    ],
    relatedTopics: ["problem-solving", "intro-programming", "business"],
  },
};

const SUBTOPIC_HINTS: Record<string, SubtopicHintConfig> = {
  "1.1": { aliases: ["abstraction", "decomposition", "pattern recognition", "trace tables"] },
  "1.2": { aliases: ["sorting", "searching", "binary search", "bubble sort", "merge sort"] },
  "2.1": { aliases: ["string", "strings", "variables", "constants", "data types", "casting", "text data"] },
  "2.2": { aliases: ["operators", "modulus", "and or not", "expressions"] },
  "2.3": { aliases: ["read", "write", "append", "file input", "file output", "csv"] },
  "2.4": { aliases: ["loops", "loop", "if statements", "iteration", "selection", "functions"] },
  "2.5": { aliases: ["string methods", "built in functions", "len", "range", "input", "print", "str", "int"] },
  "2.6": { aliases: ["validation", "error handling", "type check", "range check", "try except"] },
  "2.7": { aliases: ["maintainable code", "readability", "comments", "naming conventions"] },
  "2.8": { aliases: ["testing", "test data", "boundary", "erroneous", "debugging"] },
  "3.1": { aliases: ["ethics", "privacy", "surveillance", "bias", "accessibility", "digital divide"] },
  "3.2": { aliases: ["ai", "iot", "blockchain", "vr", "ar", "automation", "machine learning"] },
  "4.1": { aliases: ["gdpr", "dpa", "computer misuse act", "copyright", "pecr"] },
  "4.2": { aliases: ["code of conduct", "professional standards", "bcs", "acceptable use"] },
  "5.1": { aliases: ["stakeholders", "organisational structure", "departments", "hierarchy"] },
  "5.2": { aliases: ["digital transformation", "efficiency", "competitive advantage", "customer experience"] },
  "5.3": { aliases: ["change management", "migration", "rollout", "parallel running", "phased"] },
  "5.4": { aliases: ["risk assessment", "contingency", "business continuity", "disaster recovery", "downtime"] },
  "6.1": { aliases: ["data vs information", "qualitative data", "quantitative data", "primary data", "secondary data"] },
  "6.2": { aliases: ["csv", "json", "xml", "binary", "text format"] },
  "6.3": { aliases: ["database", "sql", "primary key", "foreign key", "normalisation", "query"] },
  "6.4": { aliases: ["backup", "archive", "retention", "disposal", "integrity"] },
  "7.1": { aliases: ["hardware", "cpu", "ram", "storage", "server", "peripheral"] },
  "7.2": { aliases: ["network", "lan", "wan", "tcp ip", "router", "switch", "dns", "dhcp"] },
  "7.3": { aliases: ["virtual machine", "hypervisor", "container", "sandbox", "snapshot"] },
  "7.4": { aliases: ["cloud", "iaas", "paas", "saas", "public cloud", "private cloud", "hybrid cloud"] },
  "7.5": { aliases: ["resilience", "redundancy", "failover", "load balancing", "uptime", "raid"] },
  "8.1": { aliases: ["malware", "phishing", "social engineering", "sql injection", "ddos", "ransomware", "zero day"] },
  "8.2": { aliases: ["encryption", "firewall", "antivirus", "authentication", "two factor", "patching", "backup"] },
  "esp.1": { aliases: ["brief", "requirements", "client needs", "scope", "acceptance criteria"] },
  "esp.2": { aliases: ["planning", "design", "wireframe", "prototype", "flowchart", "algorithm"] },
  "esp.3": { aliases: ["implementation", "code evidence", "testing evidence", "screenshots", "iteration"] },
  "esp.4": { aliases: ["evaluation", "justification", "reflection", "improvements", "success criteria"] },
};

function unique(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function getTopicMetadata(topicId: TopicId): TopicMetadata {
  const topic = TOPICS.find((entry) => entry.id === topicId);
  const tree = TOPIC_TREES.find((entry) => entry.topicId === topicId);
  const bundle = getTopicContentBundle(topicId);
  const hints = TOPIC_HINTS[topicId];

  if (!topic || !tree || !hints) {
    throw new Error(`Missing topic search metadata for "${topicId}".`);
  }

  const firstPoint = bundle.officialPoints[0];
  const area = firstPoint ? getCurriculumAreaById(firstPoint.areaId) : null;
  const section = area ? `${firstPoint?.areaCode}. ${area.title}` : "Curriculum topic";
  const glossaryTerms = bundle.terms.flatMap((term) => [term.term, ...(term.aliases ?? [])]);
  const pointTerms = bundle.officialPoints.flatMap((point) => [
    point.code,
    point.title,
    ...point.relatedTerms,
    ...point.relatedConcepts,
  ]);

  return {
    id: topicId,
    title: topic.label,
    icon: topic.icon,
    section,
    shortDescription: tree.description,
    longDescription: `${tree.description} This topic is tied to ${section.toLowerCase()} and often appears through scenario-based explanations, comparisons, and exam vocabulary.`,
    aliases: hints.aliases,
    keywords: unique([
      ...tree.subtopics.flatMap((subtopic) => subtopic.keywords),
      ...glossaryTerms,
      ...pointTerms,
    ]),
    examVocabulary: unique([
      ...glossaryTerms,
      ...bundle.officialPoints.flatMap((point) => point.relatedTerms),
      ...tree.subtopics.flatMap((subtopic) => subtopic.keywords),
    ]),
    revisionPriorities: hints.revisionPriorities,
    weakSpots: hints.weakSpots,
    relatedTopics: hints.relatedTopics,
    officialPointCodes: unique(bundle.officialPoints.map((point) => point.code)),
  };
}

function getSubtopicMetadata(topicId: TopicId, subtopicId: string): SubtopicMetadata {
  const topic = TOPICS.find((entry) => entry.id === topicId);
  const tree = TOPIC_TREES.find((entry) => entry.topicId === topicId);
  const bundle = getTopicContentBundle(topicId);
  const hints = SUBTOPIC_HINTS[subtopicId];
  const subtopic = tree?.subtopics.find((entry) => entry.id === subtopicId);

  if (!topic || !tree || !subtopic || !hints) {
    throw new Error(`Missing subtopic search metadata for "${topicId}:${subtopicId}".`);
  }

  const firstPoint = bundle.officialPoints[0];
  const area = firstPoint ? getCurriculumAreaById(firstPoint.areaId) : null;
  const section = area ? `${firstPoint?.areaCode}. ${area.title}` : topic.label;
  const examVocabulary = unique([
    ...subtopic.keywords,
    ...bundle.terms.map((term) => term.term),
    ...bundle.officialPoints.flatMap((point) => point.relatedTerms),
  ]);
  const shortDescription = `Focuses on ${subtopic.keywords.slice(0, 4).join(", ")} within ${topic.label}.`;
  const longDescription = `${shortDescription} When this shows up in an exam, you normally need to explain what it means, when it should be used, and what can go wrong if it is misunderstood.`;

  return {
    id: subtopic.id,
    topicId,
    title: subtopic.label,
    section,
    shortDescription,
    longDescription,
    aliases: hints.aliases,
    keywords: unique(subtopic.keywords),
    examVocabulary,
    searchableText: [
      topic.label,
      subtopic.label,
      shortDescription,
      longDescription,
      ...subtopic.keywords,
      ...hints.aliases,
      ...examVocabulary,
      ...bundle.questions.map((question) => question.title),
      ...bundle.questions.map((question) => question.expectation),
    ].join(" "),
    officialPointCodes: unique(bundle.officialPoints.map((point) => point.code)),
  };
}

const TOPIC_METADATA = TOPICS.map((topic) => getTopicMetadata(topic.id));
const TOPIC_METADATA_BY_ID = Object.fromEntries(
  TOPIC_METADATA.map((metadata) => [metadata.id, metadata])
) as Record<TopicId, TopicMetadata>;
const SUBTOPIC_METADATA = TOPIC_TREES.flatMap((tree) =>
  tree.subtopics.map((subtopic) => getSubtopicMetadata(tree.topicId, subtopic.id))
);

function getQueryContext(query: string) {
  const normalized = normalizeText(query);
  return {
    raw: query.trim(),
    normalized: normalized.normalized,
    tokens: normalized.tokens,
  };
}

function getMatchLabel(score: number): SearchMatchLabel {
  if (score >= 72) return "Strong match";
  if (score >= 46) return "Partial match";
  return "Related";
}

function getFieldContributions(
  query: ReturnType<typeof getQueryContext>,
  values: string[],
  weights: { exact: number; partial: number; fuzzy: number },
  reasonPrefix: string
) {
  if (!query.normalized) {
    return [] as FieldContribution[];
  }

  const contributions: FieldContribution[] = [];

  values.forEach((value) => {
    const normalizedValue = normalizeText(value).normalized;
    if (!normalizedValue) {
      return;
    }

    if (normalizedValue === query.normalized) {
      contributions.push({ score: weights.exact, matchedTerm: value, reason: `${reasonPrefix}: ${value}` });
      return;
    }

    const canReverseContain =
      normalizedValue.length >= 5 || normalizedValue.includes(" ");

    if (
      normalizedValue.includes(query.normalized) ||
      (query.normalized.length > 4 &&
        canReverseContain &&
        query.normalized.includes(normalizedValue))
    ) {
      contributions.push({ score: weights.partial, matchedTerm: value, reason: `${reasonPrefix}: ${value}` });
      return;
    }

    const phraseEvidence = findPhraseEvidence(normalizeText(value), query.normalized);
    if (phraseEvidence && phraseEvidence.similarity >= 0.84) {
      contributions.push({
        score: Math.round(weights.fuzzy * phraseEvidence.similarity),
        matchedTerm: value,
        reason: `${reasonPrefix}: ${value}`,
      });
      return;
    }

    const similarity = stringSimilarity(query.normalized, normalizedValue);
    if (similarity >= 0.84) {
      contributions.push({
        score: Math.round(weights.fuzzy * similarity),
        matchedTerm: value,
        reason: `${reasonPrefix}: ${value}`,
      });
    }
  });

  return contributions;
}

function scoreSubtopic(
  query: ReturnType<typeof getQueryContext>,
  metadata: SubtopicMetadata,
  activeTopicId?: string | null
): TopicSearchResult | null {
  const topicMetadata = TOPIC_METADATA_BY_ID[metadata.topicId];
  const contributions = [
    ...getFieldContributions(query, [metadata.id, metadata.title], { exact: 28, partial: 20, fuzzy: 16 }, "Matched title"),
    ...getFieldContributions(query, metadata.aliases, { exact: 24, partial: 18, fuzzy: 14 }, "Matched alias"),
    ...getFieldContributions(query, metadata.keywords, { exact: 22, partial: 16, fuzzy: 12 }, "Matched keyword"),
    ...getFieldContributions(query, metadata.examVocabulary, { exact: 16, partial: 11, fuzzy: 8 }, "Matched exam term"),
    ...getFieldContributions(query, [metadata.shortDescription, metadata.longDescription, metadata.section], { exact: 10, partial: 8, fuzzy: 6 }, "Matched description"),
  ]
    .sort((left, right) => right.score - left.score)
    .filter((contribution, index, all) => {
      return (
        index ===
        all.findIndex((entry) => {
          return entry.reason === contribution.reason && entry.matchedTerm === contribution.matchedTerm;
        })
      );
    });

  const searchableTokens = normalizeText(metadata.searchableText).tokens;
  const tokenScore = query.tokens.reduce((score, token) => {
    if (searchableTokens.includes(token)) {
      return score + 6;
    }

    const fuzzyToken = searchableTokens.some((candidate) => stringSimilarity(token, candidate) >= 0.84);
    return fuzzyToken ? score + 3 : score;
  }, 0);
  const overlapBonus = Math.round(tokenOverlapScore(query.tokens, searchableTokens) * 16);
  const activeTopicBonus = activeTopicId && metadata.topicId === activeTopicId ? 8 : 0;
  const score =
    contributions.slice(0, 4).reduce((sum, contribution) => sum + contribution.score, 0) +
    tokenScore +
    overlapBonus +
    activeTopicBonus;

  if (score < 22) {
    return null;
  }

  const relatedSubtopics = TOPIC_TREES.find((tree) => tree.topicId === metadata.topicId)?.subtopics
    .filter((subtopic) => subtopic.id !== metadata.id)
    .slice(0, 3)
    .map((subtopic) => ({ id: subtopic.id, title: subtopic.label })) ?? [];
  const matchedTerms = unique([
    ...contributions.slice(0, 4).map((contribution) => contribution.matchedTerm),
    ...metadata.keywords.filter((keyword) => {
      const normalizedKeyword = normalizeText(keyword).normalized;
      return query.tokens.some((token) => normalizedKeyword.includes(token));
    }),
  ]);
  const conciseMatchedTerms = matchedTerms.filter((term) => term.length <= 36);

  return {
    id: `${metadata.topicId}:${metadata.id}`,
    topicId: metadata.topicId,
    topicTitle: topicMetadata.title,
    topicIcon: topicMetadata.icon,
    subtopicId: metadata.id,
    subtopicTitle: metadata.title,
    section: metadata.section,
    shortDescription: metadata.shortDescription,
    longDescription: metadata.longDescription,
    score: Math.min(100, score),
    confidence: Math.max(0.3, Math.min(0.98, score / 100)),
    matchLabel: getMatchLabel(score),
    matchedTerms: (conciseMatchedTerms.length > 0 ? conciseMatchedTerms : matchedTerms).slice(0, 6),
    reasons: unique(contributions.slice(0, 4).map((contribution) => contribution.reason)).slice(0, 4),
    keywords: metadata.keywords,
    examVocabulary: metadata.examVocabulary.slice(0, 8),
    weakSpots: topicMetadata.weakSpots,
    revisionPriorities: topicMetadata.revisionPriorities,
    relatedSubtopics,
    relatedTopics: topicMetadata.relatedTopics.map((topicId) => ({
      id: topicId,
      title: TOPIC_METADATA_BY_ID[topicId]?.title ?? topicId,
      icon: TOPIC_METADATA_BY_ID[topicId]?.icon ?? "*",
    })),
    officialPointCodes: metadata.officialPointCodes.slice(0, 5),
  } satisfies TopicSearchResult;
}

function scoreTopicSuggestion(
  query: ReturnType<typeof getQueryContext>,
  metadata: TopicMetadata,
  matches: TopicSearchResult[]
): TopicSearchSuggestion | null {
  const contributions = [
    ...getFieldContributions(query, [metadata.title, metadata.section], { exact: 18, partial: 14, fuzzy: 10 }, "Matched topic"),
    ...getFieldContributions(query, metadata.aliases, { exact: 16, partial: 12, fuzzy: 8 }, "Matched topic alias"),
    ...getFieldContributions(query, metadata.keywords, { exact: 12, partial: 9, fuzzy: 6 }, "Connected through topic keyword"),
  ].sort((left, right) => right.score - left.score);

  const score =
    contributions.slice(0, 3).reduce((sum, contribution) => sum + contribution.score, 0) +
    Math.round((matches[0]?.score ?? 0) / 2);

  if (score < 24) {
    return null;
  }

  return {
    topicId: metadata.id,
    topicTitle: metadata.title,
    topicIcon: metadata.icon,
    section: metadata.section,
    shortDescription: metadata.shortDescription,
    score: Math.min(100, score),
    matchLabel: getMatchLabel(score),
    matchedTerms: unique([
      ...contributions.slice(0, 3).map((contribution) => contribution.matchedTerm),
      ...matches.flatMap((match) => match.matchedTerms),
    ]).slice(0, 6),
    reasons: unique([
      ...contributions.slice(0, 3).map((contribution) => contribution.reason),
      ...matches.slice(0, 2).map((match) => `Related subtopic: ${match.subtopicTitle}`),
    ]).slice(0, 4),
    relatedSubtopics: matches.slice(0, 3).map((match) => ({
      id: match.subtopicId,
      title: match.subtopicTitle,
    })),
  } satisfies TopicSearchSuggestion;
}

export function getSuggestedSearchTerms(topicId?: string | null) {
  if (topicId && TOPIC_METADATA_BY_ID[topicId as TopicId]) {
    const topic = TOPIC_METADATA_BY_ID[topicId as TopicId];
    return unique([
      ...topic.aliases,
      ...topic.examVocabulary,
      ...TOPIC_TREES.find((tree) => tree.topicId === topicId)?.subtopics.flatMap((subtopic) => subtopic.keywords.slice(0, 2)) ?? [],
    ]).slice(0, 8);
  }

  return unique(
    TOPIC_METADATA.flatMap((topic) => [topic.title, ...topic.aliases.slice(0, 2), ...topic.examVocabulary.slice(0, 2)])
  ).slice(0, 8);
}

export function searchTopicMetadata(
  query: string,
  options: { activeTopicId?: string | null } = {}
): TopicSearchResponse {
  const queryContext = getQueryContext(query);

  if (!queryContext.normalized) {
    return {
      directMatches: [],
      relatedMatches: [],
      suggestedTopics: [],
      topMatch: null,
      noDirectMatch: false,
      querySummary: "",
    };
  }

  const results = SUBTOPIC_METADATA.map((metadata) => scoreSubtopic(queryContext, metadata, options.activeTopicId))
    .filter((result): result is TopicSearchResult => result !== null)
    .sort((left, right) => right.score - left.score);

  let directMatches: TopicSearchResult[] = [];
  let relatedMatches: TopicSearchResult[] = [];

  if (options.activeTopicId) {
    directMatches = results.filter((result) => result.topicId === options.activeTopicId && result.score >= 34).slice(0, 5);
    relatedMatches = results.filter((result) => result.topicId !== options.activeTopicId || result.score < 34).slice(0, 6);
  } else {
    directMatches = results.filter((result) => result.score >= 56).slice(0, 6);
    relatedMatches = results.filter((result) => result.score < 56).slice(0, 6);
  }

  const resultsByTopic = results.reduce<Record<string, TopicSearchResult[]>>((accumulator, result) => {
    accumulator[result.topicId] = accumulator[result.topicId] ?? [];
    accumulator[result.topicId].push(result);
    return accumulator;
  }, {});

  const occupiedTopicIds = new Set(directMatches.map((match) => match.topicId));

  const suggestedTopics = TOPIC_METADATA.map((metadata) => {
    return scoreTopicSuggestion(queryContext, metadata, resultsByTopic[metadata.id] ?? []);
  })
    .filter((suggestion): suggestion is TopicSearchSuggestion => suggestion !== null)
    .filter((suggestion) => !occupiedTopicIds.has(suggestion.topicId))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return {
    directMatches,
    relatedMatches,
    suggestedTopics,
    topMatch: directMatches[0] ?? relatedMatches[0] ?? null,
    noDirectMatch: directMatches.length === 0,
    querySummary:
      directMatches.length > 0
        ? "Results are ranked using exact, partial, fuzzy, alias, and curriculum-term matches."
        : "No exact hit yet. These are the closest curriculum matches and suggested topics.",
  };
}

/** Extra free-text phrases (e.g. from chat onboarding) merged with TOPIC_HINTS for coarse matching */
const CHAT_EXTRA_ALIASES: Record<TopicId, string[]> = {
  "problem-solving": ["problem", "problems", "decomposition", "algorithms", "logic"],
  "intro-programming": [
    "programming",
    "code",
    "coding",
    "python",
    "javascript",
    "variables",
    "loops",
  ],
  "emerging-issues": [
    "emerging",
    "technology",
    "impact",
    "ai",
    "iot",
    "ethical",
    "sustainability",
    "digital technology",
  ],
  legislation: [
    "legislation",
    "gdpr",
    "dpa",
    "law",
    "legal",
    "regulatory",
    "regulation",
    "compliance",
    "privacy",
  ],
  business: ["business", "stakeholder", "market", "organisation", "organization"],
  data: ["database", "sql", "normalisation", "normalization", "spreadsheet", "datasets"],
  "digital-environments": ["cloud", "hosting", "api", "deployment", "environment", "infrastructure"],
  security: ["cyber", "malware", "encryption", "access control", "threat", "vulnerability"],
  esp: ["employer", "project", "esp", "set project", "employer set"],
};

function normalizeChatQuery(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[…']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chatHaystackForTopic(topicId: TopicId): string {
  const topic = TOPICS.find((t) => t.id === topicId);
  const hints = TOPIC_HINTS[topicId];
  const extra = CHAT_EXTRA_ALIASES[topicId] ?? [];
  if (!topic || !hints) return "";
  const slugish = topicId.replace(/-/g, " ");
  return normalizeChatQuery(`${slugish} ${topic.label} ${topic.shortLabel} ${hints.aliases.join(" ")} ${extra.join(" ")}`);
}

/** Match curriculum topics from free text (comma / “and” / newlines). Uses topic ids + merged aliases. */
export function matchTopicsFromText(raw: string): Array<(typeof TOPICS)[number]> {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const chunks = trimmed
    .split(/(?:[,;]|\n|\band\b|\bor\b)+/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const queries = chunks.length ? chunks : [trimmed];
  const seen = new Set<TopicId>();
  const out: Array<(typeof TOPICS)[number]> = [];

  for (const q of queries) {
    const nq = normalizeChatQuery(q);
    if (!nq) continue;

    for (const t of TOPICS) {
      if (seen.has(t.id)) continue;
      const hay = chatHaystackForTopic(t.id);

      if (hay.includes(nq)) {
        seen.add(t.id);
        out.push(t);
        continue;
      }

      const words = nq.split(/\s+/).filter((w) => w.length >= 2);
      const significant = words.filter((w) => w.length >= 3 || /^\d+$/.test(w));
      const allAliases = [...(TOPIC_HINTS[t.id]?.aliases ?? []), ...(CHAT_EXTRA_ALIASES[t.id] ?? [])];
      const aliasHits = allAliases.some((alias) => {
        const a = normalizeChatQuery(alias);
        return a.length > 0 && (nq === a || nq.includes(a) || a.includes(nq));
      });
      if (aliasHits) {
        seen.add(t.id);
        out.push(t);
        continue;
      }
      if (
        significant.length > 0 &&
        significant.some((w) => hay.includes(w) || t.id.replace(/-/g, "").includes(w))
      ) {
        seen.add(t.id);
        out.push(t);
      }
    }

    const numMatch = nq.match(/^(\d)$|^unit\s*(\d)$/i);
    if (numMatch) {
      const num = numMatch[1] ?? numMatch[2];
      const topic = TOPICS.find((x) => x.shortLabel === num);
      if (topic && !seen.has(topic.id)) {
        seen.add(topic.id);
        out.push(topic);
      }
    }
  }

  return out;
}
