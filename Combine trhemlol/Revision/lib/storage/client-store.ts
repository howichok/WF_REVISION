"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { allTopics, flashcards } from "@/lib/content";
import type { PersistedAppState, TopicProgress, FlashcardProgress } from "@/lib/types";

interface RevisionDB extends DBSchema {
  app_state: {
    key: string;
    value: PersistedAppState;
  };
}

const DB_NAME = "tlevel-revision-db";
const DB_VERSION = 1;
const STORE_NAME = "app_state";
const STATE_KEY = "single-profile-state";
const FALLBACK_STORAGE_KEY = "tlevel-revision-local-state";

let dbPromise: Promise<IDBPDatabase<RevisionDB>> | null = null;

function todayIsoDate(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function defaultTopicProgress(): Record<string, TopicProgress> {
  return Object.fromEntries(
    allTopics.map((topic) => [
      topic.id,
      {
        topicId: topic.id,
        paperId: topic.paperId,
        mastery: 55,
        weakManual: false,
        weakBonus: 0,
        correctAnswers: 0,
        totalAnswers: 0,
      },
    ])
  );
}

function defaultFlashcardProgress(): Record<string, FlashcardProgress> {
  const dueDate = todayIsoDate();

  return Object.fromEntries(
    flashcards.map((card) => [
      card.id,
      {
        cardId: card.id,
        box: 1,
        dueDate,
      },
    ])
  );
}

export function createDefaultState(): PersistedAppState {
  return {
    profile: null,
    settings: {
      daysPerWeek: 5,
      onboardingComplete: false,
    },
    topicProgress: defaultTopicProgress(),
    flashcardProgress: defaultFlashcardProgress(),
    sessionLogs: [],
    examAttempts: [],
    answerCheckHistory: [],
    dailyMinutes: {},
    streak: {
      current: 0,
      best: 0,
    },
  };
}

function mergeState(raw: Partial<PersistedAppState> | null): PersistedAppState {
  const fallback = createDefaultState();

  if (!raw) {
    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    settings: {
      ...fallback.settings,
      ...(raw.settings ?? {}),
    },
    topicProgress: {
      ...fallback.topicProgress,
      ...(raw.topicProgress ?? {}),
    },
    flashcardProgress: {
      ...fallback.flashcardProgress,
      ...(raw.flashcardProgress ?? {}),
    },
    sessionLogs: raw.sessionLogs ?? fallback.sessionLogs,
    examAttempts: raw.examAttempts ?? fallback.examAttempts,
    answerCheckHistory: raw.answerCheckHistory ?? fallback.answerCheckHistory,
    dailyMinutes: raw.dailyMinutes ?? fallback.dailyMinutes,
    streak: {
      ...fallback.streak,
      ...(raw.streak ?? {}),
    },
  };
}

function hasIndexedDB(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

async function getDatabase(): Promise<IDBPDatabase<RevisionDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RevisionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  return dbPromise;
}

async function loadFromIndexedDB(): Promise<PersistedAppState | null> {
  const db = await getDatabase();
  const value = await db.get(STORE_NAME, STATE_KEY);
  return value ?? null;
}

async function saveToIndexedDB(state: PersistedAppState): Promise<void> {
  const db = await getDatabase();
  await db.put(STORE_NAME, state, STATE_KEY);
}

function loadFromLocalStorage(): PersistedAppState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedAppState;
  } catch {
    return null;
  }
}

function saveToLocalStorage(state: PersistedAppState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(state));
}

export async function loadState(): Promise<PersistedAppState> {
  if (!hasIndexedDB()) {
    return mergeState(loadFromLocalStorage());
  }

  try {
    const state = await loadFromIndexedDB();
    return mergeState(state);
  } catch {
    return mergeState(loadFromLocalStorage());
  }
}

export async function saveState(state: PersistedAppState): Promise<void> {
  if (!hasIndexedDB()) {
    saveToLocalStorage(state);
    return;
  }

  try {
    await saveToIndexedDB(state);
  } catch {
    saveToLocalStorage(state);
  }
}

export function isoDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
