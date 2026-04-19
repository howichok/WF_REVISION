"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ActiveTaskAction } from "./types";

interface TaskActionBarProps {
  primaryAction: ActiveTaskAction;
  secondaryAction?: ActiveTaskAction;
  tertiaryAction?: ActiveTaskAction;
}

const linkVariantClasses: Record<NonNullable<ActiveTaskAction["variant"]>, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-soft shadow-lg shadow-accent/20 hover:shadow-accent/30",
  secondary:
    "bg-card text-foreground border border-border hover:bg-card-hover hover:border-border-light",
  ghost: "text-muted hover:text-foreground hover:bg-card",
};

function ActionControl({
  action,
  primary = false,
}: {
  action: ActiveTaskAction;
  primary?: boolean;
}) {
  const variant = action.variant ?? (primary ? "primary" : "secondary");
  const className = primary ? "min-w-[11rem]" : undefined;

  if (action.href) {
    return (
      <Link
        href={action.href}
        aria-disabled={action.disabled || action.loading}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200",
          "disabled:pointer-events-none",
          linkVariantClasses[variant],
          (action.disabled || action.loading) && "pointer-events-none opacity-50",
          className
        )}
      >
        {action.loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {action.label}
      </Link>
    );
  }

  return (
    <Button
      variant={variant}
      size="md"
      isLoading={action.loading}
      disabled={action.disabled}
      onClick={action.onClick}
      className={className}
    >
      {action.label}
    </Button>
  );
}

export function TaskActionBar({
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: TaskActionBarProps) {
  return (
    <div className="al-action-bar">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {tertiaryAction ? <ActionControl action={tertiaryAction} /> : null}
          {secondaryAction ? <ActionControl action={secondaryAction} /> : null}
        </div>

        <ActionControl action={primaryAction} primary />
      </div>
    </div>
  );
}

export type { TaskActionBarProps };
