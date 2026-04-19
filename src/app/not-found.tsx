import Link from "next/link";
import { BookOpen, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-7 px-6 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-accent/8 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
          <span className="text-3xl font-bold text-accent/60 leading-none select-none">?</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">404</p>
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          This page doesn&apos;t exist or has been moved. Head back to the hub to pick up where you left off.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <Home size={14} />
          Home
        </Link>
        <Link
          href="/revision"
          className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <BookOpen size={14} />
          Revision hub
        </Link>
      </div>
    </div>
  );
}
