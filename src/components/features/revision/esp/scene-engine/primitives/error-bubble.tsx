"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorBubble({
  visible,
  message,
  className,
}: {
  visible: boolean;
  message: string;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className={cn(
            "inline-flex items-start gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-2.5 py-1.5 text-[11px] font-medium text-danger shadow-sm",
            className
          )}
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
