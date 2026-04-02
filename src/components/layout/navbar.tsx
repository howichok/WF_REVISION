"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Library, Home, LogOut, Settings2, CalendarDays, Sun, Moon } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/revision", label: "Revision", icon: BookOpen },
  { href: "/library", label: "Library", icon: Library },
  { href: "/planner", label: "Exam plan", icon: CalendarDays },
];

export function Navbar() {
  const pathname = usePathname();
  const { signOut, user } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-card shadow-sm">
            <span className="text-accent font-bold text-[10px] leading-none">DSD</span>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">
            Revision hub
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 shadow-sm">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/revision"
                ? pathname.startsWith("/revision")
                : href === "/planner"
                  ? pathname.startsWith("/planner")
                  : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-accent/10 text-accent shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-background/70"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User section */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground cursor-pointer"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            href="/settings"
            className={cn(
              "hidden min-w-0 items-center gap-2 rounded-full border border-border/60 px-3 py-2 text-xs transition-colors sm:flex",
              isSettingsActive
                ? "bg-accent/10 text-accent shadow-sm"
                : "text-muted hover:border-border hover:text-foreground hover:bg-background/70"
            )}
            title="Account settings"
          >
            <span className="truncate max-w-[120px]">{user?.nickname ?? "\u00A0"}</span>
            <Settings2 size={14} className="shrink-0" />
          </Link>
          <Link
            href="/settings"
            className={cn(
              "rounded-full border border-border/60 p-2 transition-colors sm:hidden",
              isSettingsActive
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            )}
            title="Account settings"
          >
            <Settings2 size={16} />
          </Link>
          <button
            onClick={() => void signOut()}
            className="rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
