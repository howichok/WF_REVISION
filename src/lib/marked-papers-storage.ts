import type { ExamConditionsReview, ExamConditionsSessionResult } from "@/lib/exam-conditions";
import { getTopicById } from "@/lib/types";

const STORAGE_KEY = "wf-marked-papers-v1";
const MAX_PAPERS = 30;

const TOPIC_FLASHCARDS_STORAGE_KEY = "wf-topic-flashcards-decks-v1";
const MAX_CARDS_PER_TOPIC = 220;

export interface StoredMarkedPaperV1 {
  id: string;
  savedAt: number;
  topicId: string;
  topicLabel: string;
  topicIcon?: string;
  results: ExamConditionsSessionResult;
}

function safeParse(raw: string | null): StoredMarkedPaperV1[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (row): row is StoredMarkedPaperV1 =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as StoredMarkedPaperV1).id === "string" &&
        typeof (row as StoredMarkedPaperV1).savedAt === "number" &&
        typeof (row as StoredMarkedPaperV1).topicId === "string" &&
        typeof (row as StoredMarkedPaperV1).topicLabel === "string" &&
        typeof (row as StoredMarkedPaperV1).results === "object" &&
        (row as StoredMarkedPaperV1).results !== null
    );
  } catch {
    return [];
  }
}

export function listMarkedPapers(): StoredMarkedPaperV1[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort((a, b) => b.savedAt - a.savedAt);
}

export function getMarkedPaper(id: string): StoredMarkedPaperV1 | null {
  return listMarkedPapers().find((p) => p.id === id) ?? null;
}

export type SaveMarkedPaperResult = StoredMarkedPaperV1 & { affectedTopicIds: string[] };

export function saveMarkedPaper(
  entry: Omit<StoredMarkedPaperV1, "id" | "savedAt"> & { id?: string }
): SaveMarkedPaperResult {
  const id = entry.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mp-${Date.now()}`);
  const row: StoredMarkedPaperV1 = {
    id,
    savedAt: Date.now(),
    topicId: entry.topicId,
    topicLabel: entry.topicLabel,
    topicIcon: entry.topicIcon,
    results: entry.results,
  };
  if (typeof window === "undefined") {
    return { ...row, affectedTopicIds: [] };
  }
  const prev = safeParse(window.localStorage.getItem(STORAGE_KEY)).filter((p) => p.id !== id);
  const next = [row, ...prev].slice(0, MAX_PAPERS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  const affectedTopicIds = mergeTopicFlashcardsFromSavedPaper(row);
  return { ...row, affectedTopicIds };
}

export function deleteMarkedPaper(id: string): void {
  if (typeof window === "undefined") return;
  const next = safeParse(window.localStorage.getItem(STORAGE_KEY)).filter((p) => p.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export interface MarkedPaperFlashcard {
  id: string;
  front: string;
  back: string;
}

type TopicFlashcardDecksV1 = Record<string, MarkedPaperFlashcard[]>;

function safeParseTopicDecks(raw: string | null): TopicFlashcardDecksV1 {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    const out: TopicFlashcardDecksV1 = {};
    for (const [topicId, deck] of Object.entries(data as Record<string, unknown>)) {
      if (!topicId || !Array.isArray(deck)) continue;
      const cards = deck.filter(
        (c): c is MarkedPaperFlashcard =>
          typeof c === "object" &&
          c !== null &&
          typeof (c as MarkedPaperFlashcard).id === "string" &&
          typeof (c as MarkedPaperFlashcard).front === "string" &&
          typeof (c as MarkedPaperFlashcard).back === "string"
      );
      if (cards.length) out[topicId] = cards;
    }
    return out;
  } catch {
    return {};
  }
}

function readAllTopicDecks(): TopicFlashcardDecksV1 {
  if (typeof window === "undefined") return {};
  return safeParseTopicDecks(window.localStorage.getItem(TOPIC_FLASHCARDS_STORAGE_KEY));
}

function writeAllTopicDecks(next: TopicFlashcardDecksV1): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOPIC_FLASHCARDS_STORAGE_KEY, JSON.stringify(next));
}

function flashcardDedupeKey(front: string, back: string): string {
  return `${front.trim().toLowerCase()}||${back.trim().toLowerCase()}`;
}

/** Fuzzy dedupe: similar stems + similar backs collapse (not only exact match). */
function nearDedupeKey(front: string, back: string): string {
  const f = front.slice(0, 88).replace(/\s+/g, " ").toLowerCase();
  const b = back.slice(0, 72).replace(/\s+/g, " ").toLowerCase();
  return `${f}::${b}`;
}

/** Topic ids for every marked question in the paper (falls back to the paper’s route topic). */
export function collectDistinctQuestionTopicIds(paper: StoredMarkedPaperV1): string[] {
  const ids = new Set<string>();
  for (const r of paper.results.reviews) {
    if (r.question.topicId) ids.add(r.question.topicId);
  }
  if (ids.size === 0 && paper.topicId) ids.add(paper.topicId);
  return Array.from(ids);
}

function mergeCardsIntoTopicDeck(topicId: string, incoming: MarkedPaperFlashcard[]): void {
  if (typeof window === "undefined" || incoming.length === 0) return;
  const decks = readAllTopicDecks();
  const existing = decks[topicId] ?? [];
  const keys = new Set(existing.map((c) => flashcardDedupeKey(c.front, c.back)));
  const merged = [...existing];
  for (const c of incoming) {
    const k = flashcardDedupeKey(c.front, c.back);
    if (keys.has(k)) continue;
    keys.add(k);
    merged.push({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `tc-${topicId}-${Date.now()}-${merged.length}`,
      front: c.front,
      back: c.back,
    });
  }
  const trimmed =
    merged.length > MAX_CARDS_PER_TOPIC ? merged.slice(merged.length - MAX_CARDS_PER_TOPIC) : merged;
  decks[topicId] = trimmed;
  writeAllTopicDecks(decks);
}

/** Merge feedback from a newly saved paper into per-topic flashcard decks; returns topic ids that gained cards. */
export function mergeTopicFlashcardsFromSavedPaper(paper: StoredMarkedPaperV1): string[] {
  if (typeof window === "undefined") return [];
  const topicIds = collectDistinctQuestionTopicIds(paper);
  const affected: string[] = [];
  for (const tid of topicIds) {
    const built = buildFlashcardsForTopicFromPaper(paper, tid);
    if (built.length === 0) continue;
    mergeCardsIntoTopicDeck(tid, built);
    affected.push(tid);
  }
  return affected;
}

export function getTopicFlashcardDeck(topicId: string): MarkedPaperFlashcard[] {
  if (typeof window === "undefined") return [];
  return readAllTopicDecks()[topicId] ?? [];
}

export function listTopicsWithFlashcardDecks(): { topicId: string; count: number; label: string }[] {
  if (typeof window === "undefined") return [];
  const decks = readAllTopicDecks();
  return Object.entries(decks)
    .map(([topicId, cards]) => ({
      topicId,
      count: cards.length,
      label: getTopicById(topicId)?.label ?? topicId,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

type AddCardFn = (front: string, back: string) => void;

function makeFlashcardCollector() {
  const cards: MarkedPaperFlashcard[] = [];
  const seenExact = new Set<string>();
  const seenNear = new Set<string>();
  let i = 0;
  const add: AddCardFn = (front, back) => {
    const f = front.trim();
    const b = back.trim();
    if (f.length < 6 || b.length < 6) return;
    // Skip near-duplicate of question on back (common generation glitch)
    if (b.length >= 24 && f.toLowerCase().includes(b.slice(0, Math.min(36, b.length)).toLowerCase())) return;
    const ek = flashcardDedupeKey(f, b);
    if (seenExact.has(ek)) return;
    seenExact.add(ek);
    const nk = nearDedupeKey(f, b);
    if (seenNear.has(nk)) return;
    seenNear.add(nk);
    cards.push({ id: `c-${i++}`, front: f.slice(0, 280), back: b.slice(0, 900) });
  };
  return { cards, add };
}

/** One-line stem snippet so the card front is never a bare “Q2 — …” label. */
function questionStemCue(prompt: string, max = 92): string {
  const t = prompt.replace(/\s+/g, " ").trim();
  if (!t) return "Exam-style question";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function promptBlockForBack(r: ExamConditionsReview, max = 220): string {
  const p = r.question.prompt.trim();
  if (!p) return "(stem not stored)";
  const one = p.replace(/\s+/g, " ");
  return one.length <= max ? one : `${one.slice(0, max - 1)}…`;
}

/** `geminiMarking.why` often repeats `evaluation.feedback` (local path copies feedback into why). */
function whyDuplicatesFeedback(why: string, feedback: string): boolean {
  const w = why.replace(/\s+/g, " ").trim().toLowerCase();
  const f = feedback.replace(/\s+/g, " ").trim().toLowerCase();
  if (!w || !f) return false;
  if (w === f) return true;
  const n = 52;
  if (w.length >= n && f.length >= n && w.slice(0, n) === f.slice(0, n)) return true;
  if (f.includes(w.slice(0, Math.min(56, w.length))) || w.includes(f.slice(0, Math.min(56, f.length)))) {
    return true;
  }
  return false;
}

function addReviewFlashcards(add: AddCardFn, r: ExamConditionsReview, qn: number) {
  const cue = questionStemCue(r.question.prompt);
  const stemBack = promptBlockForBack(r);
  const feedback = r.evaluation.feedback.replace(/\s+/g, " ").trim();

  for (const slot of r.evaluation.missingSlots ?? []) {
    const s = slot.trim();
    if (s.length < 4) continue;
    add(
      `Q${qn} · Mark scheme gap\n${cue}`,
      `Next time include:\n${s}\n\n— Full question:\n${stemBack}`,
    );
  }

  for (const slot of r.evaluation.partialSlots ?? []) {
    const s = slot.trim();
    if (s.length < 4) continue;
    add(
      `Q${qn} · Push this further\n${cue}`,
      `Focus:\n${s}\n\nNext step: tie this to a concrete point in your answer (quote or paraphrase the stem).\n\nMarker feedback:\n${feedback.slice(0, 520)}`,
    );
  }

  const why = (r.geminiMarking?.why ?? "").replace(/\s+/g, " ").trim();
  if (why.length >= 20 && !whyDuplicatesFeedback(why, feedback)) {
    add(`Q${qn} · Why these marks\n${cue}`, why);
  }

  const evidence = (r.geminiMarking?.evidence ?? [])
    .map((e) => e.replace(/\s+/g, " ").trim())
    .filter((e) => e.length >= 8)
    .slice(0, 4);
  if (evidence.length > 0) {
    add(
      `Q${qn} · What already scored well\n${cue}`,
      `${evidence.map((e) => `• ${e}`).join("\n")}\n\nReuse this style when the question fits.`,
    );
  }
}

function addSessionClosingFlashcards(add: AddCardFn, results: ExamConditionsSessionResult, topicLabel: string) {
  const tgt = results.sessionClosingFeedback?.targetsToImprove?.trim();
  if (tgt) {
    tgt
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 12)
      .slice(0, 8)
      .forEach((sentence) => {
        const s = sentence.trim();
        if (s.length <= 100) {
          add(
            `Session target · ${topicLabel}\nWhat should you improve next time?`,
            `${s}\n\n(from your last marked paper)`,
          );
        } else {
          add(
            `Session target · ${topicLabel}\n${s.slice(0, 96)}…`,
            `${s}\n\n(from your last marked paper)`,
          );
        }
      });
  }

  const www = results.sessionClosingFeedback?.whatWentWell?.trim();
  if (www) {
    www
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 12)
      .slice(0, 4)
      .forEach((sentence) => {
        const s = sentence.trim();
        if (s.length <= 100) {
          add(
            `Strength · ${topicLabel}\nWhat went well (keep doing it)?`,
            `${s}\n\n(repeat on similar questions)`,
          );
        } else {
          add(`Strength · ${topicLabel}\n${s.slice(0, 96)}…`, `${s}\n\n(repeat on similar questions)`);
        }
      });
  }
}

/** Cards for one curriculum topic drawn from a saved paper (multi-topic sessions supported). */
export function buildFlashcardsForTopicFromPaper(
  paper: StoredMarkedPaperV1,
  topicId: string
): MarkedPaperFlashcard[] {
  const { results } = paper;
  const topicLabel = getTopicById(topicId)?.label ?? topicId;
  const { cards, add } = makeFlashcardCollector();
  results.reviews.forEach((r, qi) => {
    if (r.question.topicId !== topicId) return;
    addReviewFlashcards(add, r, qi + 1);
  });
  addSessionClosingFlashcards(add, results, topicLabel);
  return cards.slice(0, 80);
}

/** Build quick revision cards from marking feedback (missing ideas, session targets, per-question hints). */
export function buildFlashcardsFromMarkedPaper(paper: StoredMarkedPaperV1): MarkedPaperFlashcard[] {
  const { results, topicLabel } = paper;
  const { cards, add } = makeFlashcardCollector();
  results.reviews.forEach((r, qi) => addReviewFlashcards(add, r, qi + 1));
  addSessionClosingFlashcards(add, results, topicLabel);
  return cards.slice(0, 80);
}
