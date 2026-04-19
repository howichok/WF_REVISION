"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { REVISION_ROUTE_ITEMS, type RevisionRouteId } from "@/lib/revision-routes";

interface RevisionSubnavProps {
  activeRoute?: RevisionRouteId;
}

export function RevisionSubnav({ activeRoute }: RevisionSubnavProps) {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto">
      <div className="flex min-w-max gap-1.5 rounded-2xl border border-border/70 bg-gradient-to-b from-card/80 to-background/70 p-1.5 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.35)] backdrop-blur">
        {REVISION_ROUTE_ITEMS.map((item) => {
          const pathForMatch = item.href.split("?")[0];
          const isActive =
            activeRoute
              ? item.id === activeRoute
              : pathForMatch === "/revision"
                ? pathname === "/revision"
                : pathname === pathForMatch || pathname.startsWith(`${pathForMatch}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? item.id === "paper-2"
                    ? "border border-warning/20 bg-warning/15 text-warning shadow-sm"
                    : item.id === "progress"
                      ? "border border-success/20 bg-success/15 text-success shadow-sm"
                      : "border border-accent/20 bg-accent/12 text-accent shadow-sm"
                  : "text-muted-foreground hover:border-border/70 hover:bg-background/70 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
