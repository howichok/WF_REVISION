"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SuccessState({
  visible,
  message,
  className,
}: {
  visible: boolean;
  message?: string;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success",
            className
          )}
        >
          <CheckCircle2 className="size-3.5" />
          {message ?? "Done"}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
