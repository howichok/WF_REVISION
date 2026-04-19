"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DocumentBlockProps {
  title?: string;
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  paper?: boolean;
}

/** Paper-like panel that houses a brief or document content. */
export const DocumentBlock = forwardRef<HTMLDivElement, DocumentBlockProps>(function DocumentBlock(
  { title, badge, footer, children, className, paper = true },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-sm",
        paper
          ? "border-border/60 bg-[linear-gradient(180deg,_rgba(250,250,255,0.98),_rgba(244,244,252,0.98))] text-foreground dark:bg-[linear-gradient(180deg,_rgba(250,250,255,0.04),_rgba(255,255,255,0.02))]"
          : "border-border/60 bg-card",
        className
      )}
    >
      {(title || badge) && (
        <div className="flex items-center gap-2 border-b border-border/40 bg-background/40 px-3 py-2">
          {badge}
          {title && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          )}
        </div>
      )}
      <div className="p-3 sm:p-4">{children}</div>
      {footer && <div className="border-t border-border/40 bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">{footer}</div>}
    </div>
  );
});
