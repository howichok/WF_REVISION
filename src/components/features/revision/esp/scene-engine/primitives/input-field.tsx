"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type InputState = "neutral" | "typing" | "invalid" | "valid";

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  state: InputState;
  caretVisible?: boolean;
  helper?: string;
  errorMessage?: string;
  multiline?: boolean;
  icon?: ReactNode;
  className?: string;
}

export const InputField = forwardRef<HTMLDivElement, InputFieldProps>(function InputField(
  { label, placeholder, value, state, caretVisible, helper, errorMessage, multiline, icon, className },
  ref
) {
  const color =
    state === "invalid"
      ? "var(--color-danger)"
      : state === "valid"
        ? "var(--color-success)"
        : state === "typing"
          ? "var(--color-accent)"
          : "rgba(127,127,127,0.6)";

  return (
    <div ref={ref} className={cn("space-y-1", className)}>
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      ) : null}
      <motion.div
        animate={{ borderColor: color, boxShadow: state === "typing" ? `0 0 0 3px ${color}22` : "0 0 0 0 transparent" }}
        transition={{ duration: 0.22 }}
        className={cn(
          "flex items-start gap-2 rounded-lg border-2 bg-background/80 px-3 py-2 text-[13px]",
          multiline ? "min-h-[84px]" : "min-h-[42px]"
        )}
      >
        {icon ? <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span> : null}
        <div className="relative min-w-0 flex-1 font-sans">
          {value.length === 0 && placeholder ? (
            <span className="text-muted-foreground/70">{placeholder}</span>
          ) : (
            <span className={cn("whitespace-pre-wrap break-words text-foreground")}>{value}</span>
          )}
          {caretVisible ? (
            <motion.span
              aria-hidden
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-foreground"
            />
          ) : null}
        </div>
        {state === "valid" ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: "var(--color-success)" }} />
        ) : state === "invalid" ? (
          <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: "var(--color-danger)" }} />
        ) : null}
      </motion.div>
      <AnimatePresence mode="wait">
        {state === "invalid" && errorMessage ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-medium text-danger"
          >
            {errorMessage}
          </motion.p>
        ) : helper ? (
          <motion.p
            key="helper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-muted-foreground"
          >
            {helper}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
});
