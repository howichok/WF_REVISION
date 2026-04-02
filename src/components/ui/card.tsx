import { cn } from "@/lib/utils";

type CardVariant =
  | "default"
  | "navigation"
  | "task"
  | "input"
  | "support"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "paper-1"
  | "paper-2";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-card border-border/80 shadow-sm",
  navigation:
    "border-[var(--card-nav-border)] bg-[var(--card-nav-bg)] shadow-[var(--card-nav-shadow)]",
  task:
    "border-border/80 bg-card shadow-[0_18px_40px_-34px_rgba(17,24,39,0.18)]",
  input:
    "border-border-light bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  support:
    "border-border/80 bg-card/95",
  accent:
    "border-accent/18 bg-[linear-gradient(145deg,rgba(103,92,241,0.07),rgba(255,255,255,0.96)_48%,rgba(255,255,255,1))] shadow-[0_20px_45px_-34px_rgba(103,92,241,0.28)]",
  success:
    "border-success/20 bg-[linear-gradient(145deg,rgba(34,197,94,0.06),rgba(255,255,255,0.97)_50%)]",
  warning:
    "border-warning/20 bg-[linear-gradient(145deg,rgba(245,158,11,0.06),rgba(255,255,255,0.97)_50%)]",
  danger:
    "border-danger/18 bg-[linear-gradient(145deg,rgba(239,68,68,0.06),rgba(255,255,255,0.97)_52%)]",
  "paper-1":
    "border-accent/18 bg-[linear-gradient(145deg,rgba(99,102,241,0.08),rgba(255,255,255,0.95)_44%)] shadow-[0_18px_42px_-32px_rgba(99,102,241,0.22)]",
  "paper-2":
    "border-warning/18 bg-[linear-gradient(145deg,rgba(245,158,11,0.08),rgba(255,255,255,0.95)_44%)] shadow-[0_18px_42px_-32px_rgba(245,158,11,0.2)]",
};

function Card({
  className,
  hover,
  glow,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const hoverStyles =
    hover
      ? variant === "default" ||
        variant === "support" ||
        variant === "navigation" ||
        variant === "input"
        ? "hover:bg-card-hover hover:border-border-light cursor-pointer card-interactive"
        : "hover:border-white/15 cursor-pointer card-interactive"
      : null;

  return (
    <div
      className={cn(
        "rounded-3xl border p-6",
        "transition-all duration-300",
        variantStyles[variant],
        hoverStyles,
        glow && "glow-accent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted", className)} {...props}>
      {children}
    </p>
  );
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-4", className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
