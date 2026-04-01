import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  percent,
  className,
}: {
  value?: number;
  percent?: number;
  className?: string;
}) {
  const resolvedValue = percent ?? value ?? 0;
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-[#d9e5f4]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#5f93d4] to-[#2f69b5] shadow-[0_10px_18px_-10px_rgba(47,105,181,0.8)] transition-all duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, resolvedValue))}%` }}
      />
    </div>
  );
}
