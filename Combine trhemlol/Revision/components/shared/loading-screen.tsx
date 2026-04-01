export function LoadingScreen({ label = "Loading your revision cockpit..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="rounded-full border border-border bg-card px-5 py-2 text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
