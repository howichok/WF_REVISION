"use client";

import type { MouseEvent } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (event?: MouseEvent<HTMLElement>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "wf-revision-theme";

const THEME_SWITCH_SUPPRESS_MS = 48;

function setThemeRevealOrigin(root: HTMLElement, event?: MouseEvent<HTMLElement>) {
  let x = "50%";
  let y = "50%";
  if (event?.currentTarget instanceof HTMLElement) {
    const r = event.currentTarget.getBoundingClientRect();
    x = `${r.left + r.width / 2}px`;
    y = `${r.top + r.height / 2}px`;
  }
  root.style.setProperty("--theme-vt-x", x);
  root.style.setProperty("--theme-vt-y", y);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const themeSwitchClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const resolved =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  }, []);

  useEffect(
    () => () => {
      if (themeSwitchClearRef.current !== null) {
        clearTimeout(themeSwitchClearRef.current);
      }
    },
    [],
  );

  const toggleTheme = useCallback((event?: MouseEvent<HTMLElement>) => {
    const root = document.documentElement;
    setThemeRevealOrigin(root, event);

    const next: Theme = themeRef.current === "dark" ? "light" : "dark";

    const doc = document as Document & {
      startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
    };

    const commit = () => {
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      localStorage.setItem(STORAGE_KEY, next);
      setTheme(next);
    };

    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => {
        flushSync(commit);
      });
    } else {
      if (themeSwitchClearRef.current !== null) {
        clearTimeout(themeSwitchClearRef.current);
      }
      root.classList.add("theme-switching");
      flushSync(commit);
      themeSwitchClearRef.current = setTimeout(() => {
        root.classList.remove("theme-switching");
        themeSwitchClearRef.current = null;
      }, THEME_SWITCH_SUPPRESS_MS);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
