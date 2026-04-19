"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";

const STORAGE_KEY = "wf-footer-expanded";

export function CollapsibleSiteFooter() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default: collapsed (stored === null → collapsed)
    setExpanded(stored === "1");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  // Server render / pre-hydration: show collapsed stub to avoid layout shift
  if (!mounted) {
    return (
      <div className="border-t border-border/50 bg-background/90" suppressHydrationWarning>
        <div className="mx-auto flex h-7 max-w-7xl items-center justify-center px-4" />
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="border-t border-border/50 bg-background/90 backdrop-blur-sm">
        <button
          type="button"
          onClick={toggle}
          className="mx-auto flex w-full max-w-7xl items-center justify-center gap-1 px-4 py-1.5 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          aria-label="Show footer"
        >
          <ChevronUp size={11} strokeWidth={2.5} />
          <span>Footer</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-center gap-1 border-t border-border/40 bg-background/80 py-1 text-[11px] font-medium text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        aria-label="Hide footer"
      >
        <ChevronDown size={11} strokeWidth={2.5} />
        <span>Hide</span>
      </button>
      <SiteFooter />
    </div>
  );
}
