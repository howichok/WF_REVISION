import { cn } from "@/lib/utils";
import type { ElementType } from "react";

export function Pill({
  children,
  tone = "default",
  variant,
  icon: Icon,
}: {
  children: React.ReactNode;
  tone?: "default" | "warning" | "success" | "danger";
  variant?: "accent" | "destructive" | "default";
  icon?: ElementType;
}) {
  const tones = {
    default: "border-[#ddd5ca] bg-white/70 text-slate-600 shadow-sm",
    warning: "border-[#f0c896] bg-[#fff3e6] text-[#c1651b] shadow-sm",
    success: "border-[#b7d3bf] bg-[#edf7ef] text-[#3d7f54] shadow-sm",
    danger: "border-[#e8beb4] bg-[#faece8] text-[#b45847] shadow-sm",
  };

  const variants = {
    accent: "border-[#b8d1ef] bg-[#edf4fd] text-[#2f69b5] shadow-sm",
    destructive: "border-[#e8beb4] bg-[#faece8] text-[#b45847] shadow-sm",
    default: "",
  };

  const activeClass = variant ? variants[variant] : tones[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        activeClass,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
