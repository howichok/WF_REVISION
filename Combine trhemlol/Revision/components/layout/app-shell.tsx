"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartSpline,
  CirclePlay,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Library,
  ScrollText,
} from "lucide-react";
import { WorkspaceGuard } from "@/components/guards/workspace-guard";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/app-state-provider";
import { APP_TITLE } from "@/lib/constants";

const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
  { href: "/revision", label: "Revision", icon: CirclePlay },
  { href: "/quiz", label: "Quiz", icon: FlaskConical },
  { href: "/exam", label: "Exam", icon: ScrollText },
  { href: "/stats", label: "Stats", icon: ChartSpline },
  { href: "/glossary", label: "Glossary", icon: BookOpen },
];

const mobileNavItems = navItems.slice(0, 5);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useAppState();

  return (
    <WorkspaceGuard>
      <div className="min-h-screen bg-background pb-24 md:pb-6">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-[1260px] items-center gap-3 px-4 py-3 md:px-6">
            <Link href="/app" className="flex shrink-0 items-center gap-2">
              <div className="rounded-md border border-border bg-card p-2 text-foreground">
                <GraduationCap className="size-4" />
              </div>
              <p className="hidden text-sm font-semibold leading-tight sm:block">{APP_TITLE}</p>
            </Link>

            <div className="min-w-0 flex-1">
              <GlobalSearch />
            </div>

            <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline">
              {state.profile?.nickname ?? "Profile"}
            </span>

            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto grid max-w-[1260px] grid-cols-1 gap-4 px-4 pt-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:px-6">
          <aside className="hidden rounded-lg border border-border bg-card p-2 md:sticky md:top-24 md:block md:h-[calc(100vh-7rem)] md:overflow-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="pb-6">{children}</main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-2 py-2 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </WorkspaceGuard>
  );
}

