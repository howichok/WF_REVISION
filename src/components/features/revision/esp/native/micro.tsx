"use client";

import { motion, useMotionValue, useSpring, useTransform, type MotionProps } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Spring preset used across ESP sandboxes so animations feel unified. */
export const SPRING = { type: "spring" as const, stiffness: 220, damping: 24 };
export const SPRING_SOFT = { type: "spring" as const, stiffness: 140, damping: 22 };
export const SPRING_SNAP = { type: "spring" as const, stiffness: 340, damping: 20 };

/** Animated number that ticks between integers with a subtle spring. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20, mass: 0.8 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={cn("tabular-nums", className)}>{rounded}</motion.span>;
}

/** Button with press / hover micro-interaction. */
export function SoftButton({
  children,
  className,
  active,
  tone = "neutral",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: "neutral" | "accent" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-border/70 bg-card text-foreground hover:bg-muted/50",
    accent: "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25",
    success: "border-success/40 bg-success/15 text-success hover:bg-success/25",
    danger: "border-danger/40 bg-danger/15 text-danger hover:bg-danger/25",
  } as const;
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING_SNAP}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        tones[tone],
        active && "shadow-[0_8px_24px_-16px_rgba(103,92,241,0.4)]",
        className
      )}
      {...(props as MotionProps & ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </motion.button>
  );
}

/** Small pill used for tool chips, accent tags. */
export function AccentPill({ children, tone = "accent", className }: { children: ReactNode; tone?: "accent" | "success" | "warning" | "danger"; className?: string }) {
  const tones = {
    accent: "bg-accent/15 text-accent border-accent/30",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-danger/15 text-danger border-danger/30",
  } as const;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_SNAP}
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", tones[tone], className)}
    >
      {children}
    </motion.span>
  );
}

/** Container that fades-in children with a small stagger. */
export function StaggerIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05, delayChildren: delay } },
      }}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const FadeItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 26 } },
};
