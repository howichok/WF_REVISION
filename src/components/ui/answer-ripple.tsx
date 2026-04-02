"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface AnswerRippleProps {
  /** null = hidden, "correct" = green, "incorrect" = red */
  state: "correct" | "incorrect" | null;
  /** Called when animation finishes */
  onComplete?: () => void;
}

const glow = {
  correct: "rgba(34, 197, 94, 0.22)",
  incorrect: "rgba(239, 68, 68, 0.22)",
};

const ring = {
  correct: "rgba(34, 197, 94, 0.55)",
  incorrect: "rgba(239, 68, 68, 0.55)",
};

const DURATION_MS = 780;

export function AnswerRipple({ state, onComplete }: AnswerRippleProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!state) return;
    if (reduceMotion) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => onComplete?.(), DURATION_MS);
    return () => clearTimeout(timer);
  }, [state, onComplete, reduceMotion]);

  if (reduceMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      {state ? (
        <motion.div
          key={state}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: `radial-gradient(ellipse 130% 70% at 50% 100%, ${glow[state]}, transparent 58%)`,
            }}
          />
          {[0, 1].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute left-1/2 top-[78%] size-[min(42vw,280px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-transparent"
              style={{ borderColor: ring[state] }}
              initial={{ scale: 0.15, opacity: 0.85 }}
              animate={{ scale: 4.2, opacity: 0 }}
              transition={{
                duration: 0.78,
                delay: i * 0.09,
                ease: [0.16, 0.84, 0.24, 1],
              }}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
