"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const readyItems = [
  { href: "/revision", label: "Revision" },
  { href: "/library", label: "Library" },
  { href: "/paper-1", label: "Paper 1" },
  { href: "/paper-2", label: "Paper 2" },
  { href: "/progress", label: "Progress" },
];

const guestItems = [
  { href: "/revision", label: "Overview" },
  { href: "/library", label: "Library" },
];

export function MobileNav() {
  const auth = useAuth();
  const pathname = usePathname();
  const items = auth.currentUser?.profile.onboardingCompleted ? readyItems : guestItems;

  return (
    <div className="xl:hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-line/60 bg-slate-950/80 px-4 py-3 backdrop-blur">
        {items.map((item) => {
          const active =
            item.href === "/revision"
              ? pathname === "/" || pathname === "/revision"
              : item.href === "/library"
                ? pathname === "/library" || pathname.startsWith("/library/") || pathname.startsWith("/past-papers")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-sm transition",
                active ? "bg-accent text-white" : "bg-white/5 text-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
