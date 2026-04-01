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
      <div className="flex min-w-max gap-1 rounded-xl border border-border bg-card/40 p-1">
        {REVISION_ROUTE_ITEMS.map((item) => {
          const isActive =
            activeRoute
              ? item.id === activeRoute
              : item.href === "/revision"
                ? pathname === "/revision"
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? item.id === "paper-2"
                    ? "bg-warning/15 text-warning"
                    : item.id === "progress"
                      ? "bg-success/15 text-success"
                      : "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
