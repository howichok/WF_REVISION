import {
  getResourceHref,
  getTopicContentBundle,
  isResourceExternal,
} from "@/lib/content";
import { getTopicById } from "@/lib/types";
import type {
  GroundedResearchEvidence,
  GroundedResearchRequest,
  GroundedResearchResponse,
  GroundedResearchSource,
} from "@/lib/research/types";

const GOOGLE_GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GOOGLE_GEMINI_GROUNDED_MODEL =
  process.env.GEMINI_GROUNDED_MODEL?.trim() || "gemini-2.5-flash";

interface GeminiContentPart {
  text?: string;
}

interface GeminiGroundingWebChunk {
  uri?: string;
  title?: string;
}

interface GeminiGroundingChunk {
  web?: GeminiGroundingWebChunk;
}

interface GeminiGroundingSupport {
  groundingChunkIndices?: number[];
  segment?: {
    text?: string;
  };
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiContentPart[];
  };
  groundingMetadata?: {
    groundingChunks?: GeminiGroundingChunk[];
    groundingSupports?: GeminiGroundingSupport[];
    webSearchQueries?: string[];
  };
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
}

function requireGeminiGroundingConfig() {
  if (!GOOGLE_GEMINI_API_KEY) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add a Gemini API key to enable grounded web answers."
    );
  }

  return {
    apiKey: GOOGLE_GEMINI_API_KEY,
    model: GOOGLE_GEMINI_GROUNDED_MODEL,
  };
}

function cleanQuery(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return value;
  }
}

function buildTopicMaterialPack(topicId: string) {
  const topic = getTopicById(topicId);
  const bundle = getTopicContentBundle(topicId);

  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  const officialPoints = bundle.officialPoints
    .slice(0, 8)
    .map((point) => `- ${point.code}: ${point.title}. ${point.summary}`)
    .join("\n");
  const glossary = bundle.terms
    .slice(0, 10)
    .map((term) => `- ${term.term}: ${term.definition}`)
    .join("\n");
  const examSignals = bundle.questions
    .slice(0, 8)
    .map((question) => `- ${question.title}: ${question.practicePrompt}`)
    .join("\n");
  const officialResources = bundle.resources
    .filter((resource) => isResourceExternal(resource) && Boolean(getResourceHref(resource)))
    .slice(0, 6)
    .map((resource) => `- ${resource.title}: ${getResourceHref(resource)}`)
    .join("\n");

  return {
    topic,
    bundle,
    materialPack: [
      `Topic: ${topic.label}`,
      bundle.mapping?.note ? `Curriculum mapping note: ${bundle.mapping.note}` : null,
      officialPoints ? `Official curriculum points:\n${officialPoints}` : null,
      glossary ? `Key glossary:\n${glossary}` : null,
      examSignals ? `Mapped exam prompts:\n${examSignals}` : null,
      officialResources ? `Priority official resources:\n${officialResources}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

function buildResearchPrompt(topicId: string, query: string) {
  const { topic, materialPack } = buildTopicMaterialPack(topicId);

  return {
    topicLabel: topic.label,
    systemInstruction: [
      "You are a tightly scoped research assistant for T Level Digital Software Development revision.",
      "Use the supplied topic material pack as your scope anchor and use Google Search grounding to verify and update details.",
      "Stay focused on the current DSD topic. If the learner asks something outside the topic or outside DSD, say that clearly instead of drifting.",
      "Prefer official or curriculum-aligned sources when grounding, especially Pearson, T Levels, or official support pages.",
      "Do not fabricate facts or sources.",
      "Do not write a full essay answer for the learner.",
      "Return plain text with these sections:",
      "Direct answer:",
      "Exam-safe focus:",
      "Limits:",
    ].join(" "),
    userPrompt: [
      `Learner query: ${query}`,
      "Use this local curriculum pack to stay aligned with what the revision site already knows.",
      materialPack,
      "Keep the answer concise, specific, and useful for revision.",
      "In 'Exam-safe focus', give exactly 3 bullet points describing what the learner should mention.",
      "In 'Limits', say briefly if the evidence is mixed, incomplete, or outside scope.",
    ].join("\n\n"),
  };
}

function dedupeSources(chunks: GeminiGroundingChunk[]) {
  const sources: GroundedResearchSource[] = [];
  const keyToIndex = new Map<string, number>();
  const chunkIndexToSourceIndex = new Map<number, number>();

  chunks.forEach((chunk, chunkIndex) => {
    const uri = chunk.web?.uri?.trim();
    if (!uri) {
      return;
    }

    const title = chunk.web?.title?.trim() || toHost(uri);
    const key = `${title}::${uri}`;
    const existing = keyToIndex.get(key);

    if (existing) {
      chunkIndexToSourceIndex.set(chunkIndex, existing);
      return;
    }

    const nextIndex = sources.length + 1;
    keyToIndex.set(key, nextIndex);
    chunkIndexToSourceIndex.set(chunkIndex, nextIndex);
    sources.push({
      index: nextIndex,
      title,
      uri,
      host: toHost(uri),
    });
  });

  return { sources, chunkIndexToSourceIndex };
}

function buildEvidenceTrail(
  supports: GeminiGroundingSupport[],
  chunkIndexToSourceIndex: Map<number, number>
) {
  const evidenceTrail: GroundedResearchEvidence[] = [];

  supports.forEach((support, index) => {
    const snippet = support.segment?.text?.trim();
    if (!snippet) {
      return;
    }

    const sourceIndices = Array.from(
      new Set(
        (support.groundingChunkIndices ?? [])
          .map((chunkIndex) => chunkIndexToSourceIndex.get(chunkIndex))
          .filter((value): value is number => typeof value === "number")
      )
    );

    if (sourceIndices.length === 0) {
      return;
    }

    evidenceTrail.push({
      id: `evidence-${index + 1}`,
      snippet,
      sourceIndices,
    });
  });

  return evidenceTrail.slice(0, 6);
}

export async function generateGroundedResearchAnswer(
  request: GroundedResearchRequest
): Promise<GroundedResearchResponse> {
  const topicId = request.topicId.trim();
  const query = cleanQuery(request.query);

  if (!topicId) {
    throw new Error("Topic id is required for grounded research.");
  }

  if (query.length < 4) {
    throw new Error("Research query is too short. Use at least 4 characters.");
  }

  const { apiKey, model } = requireGeminiGroundingConfig();
  const { topicLabel, systemInstruction, userPrompt } = buildResearchPrompt(topicId, query);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 900,
        },
      }),
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini grounded research request failed.");
  }

  const candidate = payload.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini did not return a response candidate.");
  }

  const answer = candidate?.content?.parts
    ?.map((part) => part.text?.trim())
    .filter((value): value is string => Boolean(value))
    .join("\n\n")
    .trim();

  if (!answer) {
    throw new Error("Gemini did not return a grounded answer.");
  }

  const groundingMetadata = candidate.groundingMetadata;
  const groundingChunks = groundingMetadata?.groundingChunks ?? [];
  const groundingSupports = groundingMetadata?.groundingSupports ?? [];
  const searchQueries = groundingMetadata?.webSearchQueries ?? [];
  const { sources, chunkIndexToSourceIndex } = dedupeSources(groundingChunks);
  const evidenceTrail = buildEvidenceTrail(groundingSupports, chunkIndexToSourceIndex);

  return {
    topicId,
    topicLabel,
    model,
    answer,
    searchQueries,
    sources,
    evidenceTrail,
    sourceStrategy:
      "Grounded with Google Search and constrained by the local DSD curriculum pack for this topic.",
  };
}
