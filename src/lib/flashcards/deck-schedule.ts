import type { FlashCardSchedule } from "./spaced-recall";

const STORAGE_KEY = "wf-flashcard-schedule-v1";

type AllDecks = Record<string, Record<string, FlashCardSchedule>>;

function readAll(): AllDecks {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    return data as AllDecks;
  } catch {
    return {};
  }
}

function writeAll(next: AllDecks): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getCardSchedule(deckId: string, cardId: string): FlashCardSchedule | undefined {
  return readAll()[deckId]?.[cardId];
}

export function setCardSchedule(deckId: string, cardId: string, schedule: FlashCardSchedule): void {
  const all = readAll();
  const deck = all[deckId] ?? {};
  deck[cardId] = schedule;
  all[deckId] = deck;
  writeAll(all);
}

export function getDeckSchedules(deckId: string): Record<string, FlashCardSchedule> {
  return readAll()[deckId] ?? {};
}
