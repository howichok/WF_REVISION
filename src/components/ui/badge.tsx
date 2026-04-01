import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "paper-1"
  | "paper-2";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "border border-border/70 bg-border/35 text-muted",
  accent: "border border-accent/20 bg-accent/15 text-accent",
  success: "border border-success/20 bg-success/15 text-success",
  warning: "border border-warning/20 bg-warning/15 text-warning",
  danger: "border border-danger/20 bg-danger/15 text-danger",
  "paper-1": "border border-accent/22 bg-accent/15 text-accent",
  "paper-2":
    "border border-warning/22 bg-warning/15 text-warning",
};

function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
