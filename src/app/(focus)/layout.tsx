"use client";

import { useEffect, type ReactNode } from "react";

function FocusThemeLayer({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const previousScheme = root.style.colorScheme;

    if (hadDark) {
      root.classList.remove("dark");
    }
    root.style.colorScheme = "light";

    return () => {
      if (hadDark) {
        root.classList.add("dark");
      }
      root.style.colorScheme = previousScheme;
    };
  }, []);

  return <>{children}</>;
}

export default function FocusLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FocusThemeLayer>
      <div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(247,244,238,1)_38%,rgba(241,236,228,1))] text-slate-900">
        {children}
      </div>
    </FocusThemeLayer>
  );
}
