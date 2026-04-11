/**
 * Shared pulse placeholder for revision route segments (`loading.tsx` + dynamic imports).
 */
export function RevisionRouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 max-w-[60%] rounded-lg bg-muted/60 animate-pulse" />
      <div className="h-4 w-full max-w-xl rounded-md bg-muted/40 animate-pulse" />
      <div className="min-h-[280px] rounded-2xl border border-border bg-card/50 animate-pulse" />
    </div>
  );
}
