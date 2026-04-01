"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: { label: string; value: number; max?: number }[];
  height?: number;
  className?: string;
}

function getBarColor(pct: number): string {
  if (pct >= 75) return "bg-success";
  if (pct >= 50) return "bg-warning";
  return "bg-danger";
}

export function BarChart({ data, height = 100, className }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.max ?? d.value));

  return (
    <div className={cn("flex items-end gap-2", className)} style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / (d.max ?? maxVal)) * 100;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full bg-border/30 rounded-full overflow-hidden relative" style={{ height: height - 20 }}>
              <motion.div
                className={cn("absolute bottom-0 left-0 right-0 rounded-full", getBarColor(pct))}
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground truncate max-w-full text-center leading-tight">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface WeekActivityProps {
  data: number[]; // 7 values for each day
  className?: string;
}

export function WeekActivity({ data, className }: WeekActivityProps) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const maxVal = Math.max(...data, 1);

  return (
    <div className={cn("flex items-end gap-1.5", className)}>
      {data.map((val, i) => {
        const h = Math.max(3, (val / maxVal) * 24);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              className={cn("w-full rounded-sm", val > 0 ? "bg-accent" : "bg-border/40")}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: h, opacity: val > 0 ? 1 : 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            />
            <span className="text-[9px] text-muted-foreground">{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
