"use client";

import { forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CellState = "empty" | "active" | "pending" | "pass" | "fail" | "filled";

interface TableGridProps {
  columns: { id: string; label: string; widthClass?: string }[];
  children: ReactNode;
  className?: string;
  caption?: string;
}

export const TableGrid = forwardRef<HTMLDivElement, TableGridProps>(function TableGrid(
  { columns, children, className, caption },
  ref
) {
  return (
    <div ref={ref} className={cn("overflow-hidden rounded-xl border border-border/60 bg-card", className)}>
      {caption ? (
        <div className="border-b border-border/40 bg-background/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {caption}
        </div>
      ) : null}
      <table className="w-full border-collapse text-left text-[11px]">
        <thead className="bg-muted/25">
          <tr>
            {columns.map((c) => (
              <th
                key={c.id}
                className={cn(
                  "border-b border-border/40 px-2.5 py-1.5 font-semibold text-muted-foreground",
                  c.widthClass
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
});

export const TableRow = forwardRef<
  HTMLTableRowElement,
  { children: ReactNode; active?: boolean; tone?: "pass" | "fail" | "warn" | "neutral"; className?: string }
>(function TableRow({ children, active, tone = "neutral", className }, ref) {
  const color =
    tone === "pass"
      ? "rgba(34,197,94,0.12)"
      : tone === "fail"
        ? "rgba(239,68,68,0.14)"
        : tone === "warn"
          ? "rgba(245,158,11,0.14)"
          : "transparent";

  return (
    <motion.tr
      ref={ref}
      animate={{
        backgroundColor: color,
        outline: active ? "2px solid var(--color-accent)" : "2px solid transparent",
      }}
      transition={{ duration: 0.28 }}
      className={cn("border-b border-border/40 align-top [outline-offset:-2px]", className)}
    >
      {children}
    </motion.tr>
  );
});

interface TableCellProps {
  children?: ReactNode;
  state?: CellState;
  caretVisible?: boolean;
  className?: string;
}

export function TableCell({ children, state = "empty", caretVisible, className }: TableCellProps) {
  const color =
    state === "pass"
      ? "var(--color-success)"
      : state === "fail"
        ? "var(--color-danger)"
        : state === "active"
          ? "var(--color-accent)"
          : state === "pending"
            ? "var(--muted-foreground)"
            : "inherit";

  return (
    <td
      className={cn(
        "px-2.5 py-1.5 text-foreground",
        state === "empty" && "text-muted-foreground/60",
        className
      )}
      style={state !== "empty" && state !== "filled" ? { color } : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {caretVisible ? (
          <motion.span
            aria-hidden
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="inline-block h-3 w-[2px] bg-foreground"
          />
        ) : null}
      </span>
    </td>
  );
}
