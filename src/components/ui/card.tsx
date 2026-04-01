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
  default: "bg-card border-border",
  navigation:
    "border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(17,17,19,0.88))] shadow-[0_10px_40px_-28px_rgba(0,0,0,0.8)]",
  task:
    "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(11,11,15,0.97))] shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]",
  input:
    "border-border-light bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(9,9,11,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  support:
    "border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,15,18,0.95))]",
  accent:
    "border-accent/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.14),rgba(17,17,19,0.96)_48%,rgba(17,17,19,1))] shadow-[0_20px_45px_-32px_rgba(139,92,246,0.5)]",
  success:
    "border-success/20 bg-[linear-gradient(145deg,rgba(34,197,94,0.10),rgba(13,16,15,0.97)_50%,rgba(13,16,15,1))]",
  warning:
    "border-warning/20 bg-[linear-gradient(145deg,rgba(245,158,11,0.12),rgba(18,15,10,0.97)_50%,rgba(18,15,10,1))]",
  danger:
    "border-danger/18 bg-[linear-gradient(145deg,rgba(239,68,68,0.10),rgba(18,13,13,0.97)_52%,rgba(18,13,13,1))]",
  "paper-1":
    "border-accent/22 bg-[linear-gradient(145deg,rgba(99,102,241,0.15),rgba(17,17,19,0.95)_44%,rgba(17,17,19,1))] shadow-[0_18px_42px_-30px_rgba(99,102,241,0.45)]",
  "paper-2":
    "border-warning/22 bg-[linear-gradient(145deg,rgba(245,158,11,0.14),rgba(17,17,19,0.95)_44%,rgba(17,17,19,1))] shadow-[0_18px_42px_-30px_rgba(245,158,11,0.42)]",
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
        "rounded-2xl border p-6",
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
