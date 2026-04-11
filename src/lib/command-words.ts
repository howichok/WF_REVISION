export type CommandWordId =
  | "state"
  | "identify"
  | "describe"
  | "outline"
  | "explain"
  | "discuss"
  | "compare"
  | "evaluate"
  | "justify"
  | "analyse";

export interface CommandWordEntry {
  id: CommandWordId;
  word: string;
  guidance: string;
  /** Longer examiner-style hint for UI (e.g. exam-question paper hover). */
  examHint: string;
}

const COMMAND_WORD_REGISTRY: CommandWordEntry[] = [
  {
    id: "state",
    word: "State",
    guidance: "Give the fact directly. No explanation needed.",
    examHint:
      "Give a direct fact, name, or choice. Examiners want precision, not a paragraph. Avoid “because…” unless the question or mark scheme clearly asks for a reason.",
  },
  {
    id: "identify",
    word: "Identify",
    guidance: "Name the specific thing being asked about.",
    examHint:
      "Pick out exactly what the question is pointing at (e.g. a method, risk, or term) and name it clearly. One or two short phrases are usually enough before you move on to any follow‑on parts.",
  },
  {
    id: "describe",
    word: "Describe",
    guidance: "Say what it is and how it works.",
    examHint:
      "Say what it is and what it does in context—features, behaviour, or steps. Stay concrete; “describe” is about accurate coverage, not arguing a verdict.",
  },
  {
    id: "outline",
    word: "Outline",
    guidance: "Cover the main points without deep detail.",
    examHint:
      "Cover the main points in order. You can be lighter on depth than in “explain”, but still make each point understandable on its own.",
  },
  {
    id: "explain",
    word: "Explain",
    guidance: "Say what happens and say why.",
    examHint:
      "Give a clear account of what happens or what is true, and give reasons, causes, or consequences so the marker can see you understand “why”, not only “what”. Link each reason to the scenario where you can.",
  },
  {
    id: "discuss",
    word: "Discuss",
    guidance: "Explore more than one side of the argument.",
    examHint:
      "Present more than one angle (benefits/limitations, views for and against, or alternative approaches), then—if the marks allow—signal where the balance lies. Avoid only listing one side unless the question is narrow.",
  },
  {
    id: "compare",
    word: "Compare",
    guidance: "Show similarities and differences between them.",
    examHint:
      "Make both similarities and differences explicit, ideally paired so the marker can follow. Naming both items in the same sentence often helps; vague “they are different” without detail loses marks.",
  },
  {
    id: "evaluate",
    word: "Evaluate",
    guidance: "Weigh up the arguments and give a judgement.",
    examHint:
      "Weigh evidence or criteria, then give a supported judgement (e.g. strongest option, recommendation, or extent). Your conclusion should follow from the points you have already made, not appear from nowhere.",
  },
  {
    id: "justify",
    word: "Justify",
    guidance: "Give reasons that support your conclusion.",
    examHint:
      "Every claim or choice should be backed with reasons tied to the question context. Show the chain: claim → reason → (brief) link to evidence or scenario.",
  },
  {
    id: "analyse",
    word: "Analyse",
    guidance: "Break it down into parts and examine each one.",
    examHint:
      "Split the situation into meaningful parts (e.g. stakeholders, steps, causes/effects) and say what each part shows or implies. Go beyond description by making relationships explicit.",
  },
];

const COMMAND_WORD_MAP = new Map(
  COMMAND_WORD_REGISTRY.map((entry) => [entry.id, entry])
);

const MATCH_PATTERNS: Array<{ pattern: RegExp; id: CommandWordId }> =
  COMMAND_WORD_REGISTRY.map((entry) => ({
    pattern: new RegExp(`^${entry.word}\\b`, "i"),
    id: entry.id,
  }));

export interface ExtractedCommandWord {
  word: string;
  id: CommandWordId;
  guidance: string;
  examHint: string;
}

/**
 * Extracts a recognised command word from the beginning of a prompt string.
 * Returns null when no command word is detected.
 */
export function extractCommandWord(prompt: string): ExtractedCommandWord | null {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return null;
  }

  for (const { pattern, id } of MATCH_PATTERNS) {
    if (pattern.test(trimmed)) {
      const entry = COMMAND_WORD_MAP.get(id)!;
      return {
        word: entry.word,
        id: entry.id,
        guidance: entry.guidance,
        examHint: entry.examHint,
      };
    }
  }

  return null;
}

/**
 * Like {@link extractCommandWord} for a leading stem, otherwise the first
 * recognised command word anywhere in the prompt (word-boundary match).
 */
/** Multi-word stems that map to an existing command word (matched before single-word passes). */
const STEM_PHRASE_PATTERNS: Array<{ pattern: RegExp; id: CommandWordId }> = [
  { pattern: /\bexplain why\b/gi, id: "explain" },
  { pattern: /\band why\??\b/gi, id: "explain" },
];

export type StemCommandWordSpan = {
  start: number;
  end: number;
  command: ExtractedCommandWord;
};

/**
 * Finds non-overlapping command-word spans in a stem: multi-word phrases first, then the
 * primary word (first occurrence only), then any other registered command words. Longer spans win ties.
 */
export function collectStemCommandWordSpans(
  text: string,
  primary: ExtractedCommandWord | null,
): StemCommandWordSpan[] {
  type Cand = StemCommandWordSpan;
  const candidates: Cand[] = [];

  for (const { pattern, id } of STEM_PHRASE_PATTERNS) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const r = new RegExp(pattern.source, flags);
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      const entry = COMMAND_WORD_MAP.get(id);
      if (!entry) continue;
      candidates.push({
        start: m.index,
        end: m.index + m[0].length,
        command: {
          word: entry.word,
          id: entry.id,
          guidance: entry.guidance,
          examHint: entry.examHint,
        },
      });
    }
  }

  if (primary) {
    const lowerText = text.toLowerCase();
    const lw = primary.word.toLowerCase();
    const idx = lowerText.indexOf(lw);
    if (idx !== -1) {
      candidates.push({
        start: idx,
        end: idx + primary.word.length,
        command: primary,
      });
    }
  }

  for (const entry of COMMAND_WORD_REGISTRY) {
    const r = new RegExp(`\\b${entry.word}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      candidates.push({
        start: m.index,
        end: m.index + m[0].length,
        command: {
          word: entry.word,
          id: entry.id,
          guidance: entry.guidance,
          examHint: entry.examHint,
        },
      });
    }
  }

  const key = (c: Cand) => `${c.start}:${c.end}`;
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const k = key(c);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  unique.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const picked: Cand[] = [];
  for (const c of unique) {
    if (picked.some((p) => !(c.end <= p.start || c.start >= p.end))) continue;
    picked.push(c);
  }
  picked.sort((a, b) => a.start - b.start);
  return picked;
}

export function extractCommandWordFromPrompt(prompt: string): ExtractedCommandWord | null {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return null;
  }

  const atStart = extractCommandWord(trimmed);
  if (atStart) {
    return atStart;
  }

  let bestIndex: number | null = null;
  let bestEntry: CommandWordEntry | null = null;

  for (const entry of COMMAND_WORD_REGISTRY) {
    const re = new RegExp(`\\b${entry.word}\\b`, "i");
    const match = trimmed.match(re);
    if (!match || match.index === undefined) {
      continue;
    }
    if (bestIndex === null || match.index < bestIndex) {
      bestIndex = match.index;
      bestEntry = entry;
    }
  }

  if (!bestEntry || bestIndex === null) {
    return null;
  }

  return {
    word: bestEntry.word,
    id: bestEntry.id,
    guidance: bestEntry.guidance,
    examHint: bestEntry.examHint,
  };
}

/**
 * Returns the full list of recognised command words.
 */
export function getCommandWordRegistry(): readonly CommandWordEntry[] {
  return COMMAND_WORD_REGISTRY;
}

/**
 * Looks up a single command word entry by id.
 */
export function getCommandWordById(id: CommandWordId): CommandWordEntry | undefined {
  return COMMAND_WORD_MAP.get(id);
}
