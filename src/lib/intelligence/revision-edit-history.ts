import { stripInsertedCueTokens } from "./revision-improve-guards";

export type RevisionEditKind = "insert-cue" | "rewrite" | "clear-cues";

export interface RevisionEditHistoryEntry {
  kind: RevisionEditKind;
  previousAnswer: string;
  nextAnswer: string;
}

export function pushRevisionEditEntry(
  history: RevisionEditHistoryEntry[],
  entry: RevisionEditHistoryEntry
) {
  return [...history, entry];
}

export function undoLastRevisionEdit(history: RevisionEditHistoryEntry[]) {
  if (history.length === 0) {
    return null;
  }

  const lastEntry = history[history.length - 1];
  return {
    answer: lastEntry.previousAnswer,
    history: history.slice(0, -1),
  };
}

export function clearInsertedCueEdits(
  answer: string,
  history: RevisionEditHistoryEntry[]
) {
  const clearedAnswer = stripInsertedCueTokens(answer);
  if (clearedAnswer === answer) {
    return null;
  }

  return {
    answer: clearedAnswer,
    history: pushRevisionEditEntry(history, {
      kind: "clear-cues",
      previousAnswer: answer,
      nextAnswer: clearedAnswer,
    }),
  };
}
