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
}

const COMMAND_WORD_REGISTRY: CommandWordEntry[] = [
  { id: "state", word: "State", guidance: "Give the fact directly. No explanation needed." },
  { id: "identify", word: "Identify", guidance: "Name the specific thing being asked about." },
  { id: "describe", word: "Describe", guidance: "Say what it is and how it works." },
  { id: "outline", word: "Outline", guidance: "Cover the main points without deep detail." },
  { id: "explain", word: "Explain", guidance: "Say what happens and say why." },
  { id: "discuss", word: "Discuss", guidance: "Explore more than one side of the argument." },
  { id: "compare", word: "Compare", guidance: "Show similarities and differences between them." },
  { id: "evaluate", word: "Evaluate", guidance: "Weigh up the arguments and give a judgement." },
  { id: "justify", word: "Justify", guidance: "Give reasons that support your conclusion." },
  { id: "analyse", word: "Analyse", guidance: "Break it down into parts and examine each one." },
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
      return { word: entry.word, id: entry.id, guidance: entry.guidance };
    }
  }

  return null;
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
