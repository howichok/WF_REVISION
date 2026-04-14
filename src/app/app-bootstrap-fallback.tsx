import { Loader2 } from "lucide-react";

export function AppBootstrapFallback() {
  return (
    <div
      className="flex min-h-[50dvh] flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-muted-foreground"
      aria-busy="true"
      aria-label="Loading app"
    >
      <Loader2 className="h-8 w-8 animate-spin text-accent opacity-80" aria-hidden />
      <p className="text-sm font-medium text-foreground/80">Loading…</p>
    </div>
  );
}
