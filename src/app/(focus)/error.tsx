"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function FocusError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FocusError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <AlertTriangle size={22} className="text-amber-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Session error</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Something went wrong loading this session. Try again, or return to the topic page.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground/50 font-mono">ref: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent cursor-pointer"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <Link
          href="/revision"
          className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          Back to hub
        </Link>
      </div>
    </div>
  );
}
