"use client";

import { forwardRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BucketItem {
  id: string;
  text: string;
  color?: string;
  /** layoutId so the item can visually fly from its source to this bucket. */
  layoutId?: string;
}

interface BucketCardProps {
  title: string;
  hint?: string;
  color: string;
  icon?: ReactNode;
  items: BucketItem[];
  active?: boolean;
  revealed: boolean;
  className?: string;
}

/** Drop target card that holds chips arriving from a document. */
export const BucketCard = forwardRef<HTMLDivElement, BucketCardProps>(function BucketCard(
  { title, hint, color, icon, items, active, revealed, className },
  ref
) {
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{
        opacity: revealed ? 1 : 0,
        scale: revealed ? 1 : 0.9,
        borderColor: active ? color : `${color}55`,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 bg-card/80 p-3 shadow-sm",
        className
      )}
      style={{
        background: revealed
          ? `linear-gradient(180deg, ${color}10, rgba(0,0,0,0))`
          : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {icon ? (
          <span
            className="inline-flex size-6 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {icon}
          </span>
        ) : null}
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
          {title}
        </p>
        <span
          className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums"
          style={{
            backgroundColor: items.length ? `${color}22` : "rgba(127,127,127,0.15)",
            color: items.length ? color : "var(--muted-foreground)",
          }}
        >
          {items.length}
        </span>
      </div>
      {hint ? <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p> : null}

      <ul className="mt-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it.id}
              layoutId={it.layoutId}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex items-start gap-1.5 rounded-md bg-background/70 px-2 py-1.5 text-[11px] leading-snug text-foreground shadow-sm ring-1 ring-border/40"
            >
              <Check
                className="mt-0.5 size-3 shrink-0"
                style={{ color: it.color ?? color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 text-[11px]">{it.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
});
