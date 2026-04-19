"use client";

import { useEffect, useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FocusRingProps {
  stageRef: RefObject<HTMLDivElement | null>;
  target: HTMLElement | null;
  color?: string;
  pad?: number;
}

/** Animated selection ring around a target element, relative to the stage. */
export function FocusRing({ stageRef, target, color = "var(--color-accent)", pad = 6 }: FocusRingProps) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const compute = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const t = target.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      setRect({
        x: t.left - s.left - pad,
        y: t.top - s.top - pad,
        w: t.width + pad * 2,
        h: t.height + pad * 2,
      });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(target);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [target, stageRef, pad]);

  return (
    <AnimatePresence>
      {rect ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1, x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="pointer-events-none absolute left-0 top-0 z-30 rounded-lg"
          style={{
            boxShadow: `0 0 0 2px ${color}, 0 0 0 6px ${color}22`,
            mixBlendMode: "multiply",
          }}
        />
      ) : null}
    </AnimatePresence>
  );
}
