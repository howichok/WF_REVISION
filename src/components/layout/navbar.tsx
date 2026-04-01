"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Library, Home, LogOut, Settings2, CalendarDays } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
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
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-[10px] leading-none">DSD</span>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">
            Revision hub
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
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
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground hover:bg-card"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User section — always renders same structure; nickname populates after mount */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors min-w-0",
              isSettingsActive
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground hover:bg-card"
            )}
            title="Account settings"
          >
            <span className="truncate max-w-[120px]">{user?.nickname ?? "\u00A0"}</span>
            <Settings2 size={14} className="shrink-0" />
          </Link>
          <Link
            href="/settings"
            className={cn(
              "sm:hidden p-2 rounded-lg transition-colors",
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
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
