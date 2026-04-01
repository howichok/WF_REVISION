"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, FolderKanban, LogOut } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/revision", label: "Revision" },
  { href: "/library", label: "Library" },
];

const secondaryItems = [
  { href: "/paper-1", label: "Core Paper 1" },
  { href: "/paper-2", label: "Core Paper 2" },
  { href: "/esp", label: "ESP" },
  { href: "/os", label: "Occupational Specialism" },
  { href: "/question-bank", label: "Question Bank" },
  { href: "/planner", label: "Planner" },
  { href: "/progress", label: "Progress" },
];

export function TopBar() {
  const auth = useAuth();
  const pathname = usePathname();
  const isHomeSurface =
    pathname === "/" || pathname === "/setup" || pathname === "/revision" || pathname === "/library";

  if (isHomeSurface) {
    return null;
  }

  return (
    <header className="rounded-[2rem] border border-[#ddd5ca] bg-[#f7f3ed] px-5 py-4 shadow-[0_28px_60px_-42px_rgba(15,35,72,0.5)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <Link href="/revision" className="shrink-0">
            <BrandMark />
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {primaryItems.map((item) => {
              const active =
                item.href === "/library"
                  ? pathname.startsWith("/library") || pathname.startsWith("/past-papers")
                  : pathname.startsWith("/revision") ||
                    pathname === "/" ||
                    pathname.startsWith("/paper-") ||
                    pathname.startsWith("/esp") ||
                    pathname.startsWith("/os") ||
                    pathname.startsWith("/question-bank") ||
                    pathname.startsWith("/planner") ||
                    pathname.startsWith("/progress") ||
                    pathname.startsWith("/weak-topics") ||
                    pathname.startsWith("/mistakes") ||
                    pathname.startsWith("/mock-exams");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-[#2f69b5] text-white shadow-[0_14px_24px_-18px_rgba(47,105,181,0.85)]"
                      : "bg-white/80 text-slate-700 hover:bg-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {auth.currentUser ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700">
                <FolderKanban className="h-4 w-4 text-[#2f69b5]" />
                {auth.currentUser.username}
              </span>
              <button type="button" onClick={auth.logout} className="app-button-muted !rounded-full !px-4 !py-2 !text-sm">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm text-slate-600">
              <BookOpenText className="h-4 w-4 text-[#d97b2f]" />
              Local study account
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e4dbd0] pt-4">
        {secondaryItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full border px-3 py-2 text-sm transition",
                active
                  ? "border-[#bdd3ef] bg-[#edf4fd] text-[#2f69b5]"
                  : "border-[#ddd5ca] bg-white/65 text-slate-600 hover:bg-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
