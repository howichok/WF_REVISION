"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, Target, type LucideIcon } from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";

type Tone = "success" | "warning" | "danger" | "accent" | "default";

const toneMeta: Record<Tone, { icon: LucideIcon; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  danger: { icon: AlertTriangle, className: "text-danger" },
  accent: { icon: Target, className: "text-accent" },
  default: { icon: Target, className: "text-muted-foreground" },
};

interface ActionLink {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

export interface LearningOutcomePanelProps {
  eyebrow?: string;
  title: string;
  summary: string;
  tone?: Tone;
  progressLabel?: string;
  progressValue?: number;
  badges?: Array<{ label: string; variant?: Tone }>;
  primaryAction?: ActionLink;
  secondaryAction?: ActionLink;
  children?: React.ReactNode;
}

function ActionButton({ action }: { action: ActionLink }) {
  const variant =
    action.variant === "secondary"
      ? "outline"
      : action.variant === "ghost"
        ? "ghost"
        : undefined;

  const button = (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
      {action.variant === "ghost" ? null : <ArrowRight size={14} />}
    </Button>
  );

  if (action.href) {
    return <Link href={action.href}>{button}</Link>;
  }

  return button;
}

export function LearningOutcomePanel({
  eyebrow,
  title,
  summary,
  tone = "default",
  progressLabel,
  progressValue,
  badges = [],
  primaryAction,
  secondaryAction,
  children,
}: LearningOutcomePanelProps) {
  const Icon = toneMeta[tone].icon;
  const cardVariant =
    tone === "success"
      ? "success"
      : tone === "warning"
        ? "warning"
        : tone === "danger"
          ? "danger"
          : tone === "accent"
            ? "accent"
            : "task";

  return (
    <Card variant={cardVariant} className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Icon size={16} className={toneMeta[tone].className} />
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge.label} variant={badge.variant ?? tone}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {typeof progressValue === "number" && progressLabel && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progressLabel}</span>
            <span>{progressValue}%</span>
          </div>
          <ProgressBar value={progressValue} size="sm" className="mt-2" />
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}

      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {secondaryAction && <ActionButton action={secondaryAction} />}
          {primaryAction && <ActionButton action={primaryAction} />}
        </div>
      )}
    </Card>
  );
}
