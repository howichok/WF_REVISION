"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { createEmptyLearnerProfile } from "@/lib/domain/personalisation";
import type { LearnerProfileState, RevisionUser } from "@/lib/domain/types";

const STORAGE_KEY = "revision-os.accounts.v3";

interface AuthStore {
  version: 1;
  currentUserId: string | null;
  users: RevisionUser[];
}

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  hydrated: boolean;
  currentUser: RevisionUser | null;
  login: (username: string, password: string) => Promise<AuthActionResult>;
  signUp: (username: string, password: string) => Promise<AuthActionResult>;
  logout: () => void;
  updateCurrentUser: (updater: (user: RevisionUser) => RevisionUser) => void;
  saveProfile: (profile: LearnerProfileState) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultStore: AuthStore = {
  version: 1,
  currentUserId: null,
  users: [],
};

function normaliseUsername(value: string): string {
  return value.trim().toLowerCase();
}

async function hashPassword(username: string, password: string): Promise<string> {
  const payload = new TextEncoder().encode(`${normaliseUsername(username)}::${password}`);
  const buffer = await window.crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(buffer))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

function touchUser(user: RevisionUser): RevisionUser {
  return {
    ...user,
    updatedAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AuthStore>(defaultStore);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthStore;
        setStore({
          version: 1,
          currentUserId: parsed.currentUserId ?? null,
          users: parsed.users ?? [],
        });
      } else {
        setStore(defaultStore);
      }
    } catch {
      setStore(defaultStore);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [hydrated, store]);

  const currentUser = store.users.find((user) => user.id === store.currentUserId) ?? null;

  return (
    <AuthContext.Provider
      value={{
        hydrated,
        currentUser,
        login: async (username, password) => {
          const usernameKey = normaliseUsername(username);
          const user = store.users.find((candidate) => candidate.usernameKey === usernameKey);

          if (!user) {
            return { ok: false, error: "No account exists for that username." };
          }

          const passwordHash = await hashPassword(username, password);

          if (user.passwordHash !== passwordHash) {
            return { ok: false, error: "Incorrect password." };
          }

          setStore((current) => ({
            ...current,
            currentUserId: user.id,
            users: current.users.map((candidate) =>
              candidate.id === user.id
                ? touchUser({
                    ...candidate,
                    lastLoginAt: new Date().toISOString(),
                  })
                : candidate,
            ),
          }));

          return { ok: true };
        },
        signUp: async (username, password) => {
          const trimmedUsername = username.trim();
          const usernameKey = normaliseUsername(trimmedUsername);

          if (trimmedUsername.length < 3) {
            return { ok: false, error: "Username must be at least 3 characters long." };
          }

          if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            return { ok: false, error: "Use letters, numbers, underscores, or hyphens only." };
          }

          if (password.length < 6) {
            return { ok: false, error: "Password must be at least 6 characters long." };
          }

          if (store.users.some((candidate) => candidate.usernameKey === usernameKey)) {
            return { ok: false, error: "That username is already in use." };
          }

          const now = new Date().toISOString();
          const nextUser: RevisionUser = {
            id: window.crypto.randomUUID(),
            username: trimmedUsername,
            usernameKey,
            passwordHash: await hashPassword(trimmedUsername, password),
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            progress: {
              attempts: [],
              bookmarks: [],
            },
            profile: createEmptyLearnerProfile(now),
          };

          setStore((current) => ({
            version: 1,
            currentUserId: nextUser.id,
            users: [...current.users, nextUser],
          }));

          return { ok: true };
        },
        logout: () => {
          setStore((current) => ({
            ...current,
            currentUserId: null,
          }));
        },
        updateCurrentUser: (updater) => {
          setStore((current) => {
            if (!current.currentUserId) return current;

            return {
              ...current,
              users: current.users.map((user) =>
                user.id === current.currentUserId ? touchUser(updater(user)) : user,
              ),
            };
          });
        },
        saveProfile: (profile) => {
          setStore((current) => {
            if (!current.currentUserId) return current;

            return {
              ...current,
              users: current.users.map((user) =>
                user.id === current.currentUserId
                  ? touchUser({
                      ...user,
                      profile,
                    })
                  : user,
              ),
            };
          });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
