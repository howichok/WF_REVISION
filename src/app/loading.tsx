import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="flex min-h-[40dvh] flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-muted-foreground"
      aria-busy="true"
      aria-label="Loading page"
    >
      <Loader2 className="h-7 w-7 animate-spin text-accent opacity-70" aria-hidden />
      <p className="text-xs font-medium text-foreground/70">Loading page…</p>
    </div>
  );
}
