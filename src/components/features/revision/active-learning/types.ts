import type { ReactNode } from "react";

export type LearningRailState = "completed" | "current" | "upcoming" | "locked";

export interface LearningRailItem {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  state: LearningRailState;
  href?: string;
}

export interface LearningRailSummary {
  label: string;
  value: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}

export interface ActiveTaskAction {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export interface ActiveLearningLayoutProps {
  /** When true, hides desktop + mobile rails (e.g. minimal quick quiz). */
  hideRail?: boolean;
  backHref?: string;
  railTitle: string;
  railSubtitle?: string;
  railIcon?: ReactNode;
  railItems: LearningRailItem[];
  railSummary?: LearningRailSummary[];
  mobileSummaryLabel?: string;
  contextStrip: ReactNode;
  task: ReactNode;
  response: ReactNode;
  feedback?: ReactNode;
  primaryAction: ActiveTaskAction;
  secondaryAction?: ActiveTaskAction;
  tertiaryAction?: ActiveTaskAction;
}
