"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
            <span className="text-accent font-bold text-[11px] leading-none">DSD</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              An unexpected error occurred. This has been noted — you can try refreshing or go back to the revision hub.
            </p>
            {error.digest ? (
              <p className="text-xs text-muted-foreground/60 font-mono">ref: {error.digest}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent cursor-pointer"
            >
              Try again
            </button>
            <a
              href="/revision"
              className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Back to Revision hub
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
