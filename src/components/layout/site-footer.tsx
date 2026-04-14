import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background/80 py-8 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
      <div className="mx-auto max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-3xl text-balance font-medium text-foreground/85">
          Not the official college site. Shared revision hub for the course.
        </p>
        <p className="mx-auto max-w-3xl text-balance">
          This website is for educational purposes only. We do not collect, store, or share any personal background data
          or tracking cookies. Only the data manually entered by the user for the study process is processed.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/legal/privacy" className="text-accent hover:underline underline-offset-2">
            Privacy notice
          </Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link href="/legal/disclaimer" className="text-accent hover:underline underline-offset-2">
            Disclaimer
          </Link>
        </nav>
        <p className="pt-1 text-[10px] text-muted-foreground/80 sm:text-[11px]">&copy; {year}</p>
      </div>
    </footer>
  );
}
