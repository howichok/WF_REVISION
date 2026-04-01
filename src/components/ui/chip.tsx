"use client";

import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function Chip({ label, icon, selected, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
        "border transition-all duration-200 cursor-pointer",
        "focus-ring",
        selected
          ? "bg-accent/15 border-accent/40 text-accent shadow-sm shadow-accent/10"
          : "bg-card border-border text-muted hover:text-foreground hover:border-border-light hover:bg-card-hover",
        className
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </button>
  );
}

export { Chip };
