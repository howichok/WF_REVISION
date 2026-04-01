import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md";
  color?: "accent" | "success" | "warning" | "danger";
  className?: string;
}

function getColor(score: number, color?: string): string {
  if (color) {
    const colors = {
      accent: "bg-accent",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
    };
    return colors[color as keyof typeof colors] || "bg-accent";
  }
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
}

function ProgressBar({ value, max = 100, size = "sm", color, className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        "w-full rounded-full bg-border/50 overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", getColor(percentage, color))}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { ProgressBar };
