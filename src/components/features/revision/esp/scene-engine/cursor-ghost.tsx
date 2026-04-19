"use client";

import { useEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";

interface CursorGhostProps {
  stageRef: RefObject<HTMLDivElement | null>;
  target: HTMLElement | null;
  offsetX?: number;
  offsetY?: number;
  hidden?: boolean;
}

/**
 * A product-style pointer that glides to the bounding rect of `target`,
 * relative to `stageRef`. Hidden entirely when `hidden` (reduced motion).
 */
export function CursorGhost({ stageRef, target, offsetX = 0, offsetY = 0, hidden }: CursorGhostProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hidden) {
      setVisible(false);
      return;
    }
    if (!target) {
      setVisible(false);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const t = target.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      setPos({
        x: t.left - s.left + t.width * 0.2 + offsetX,
        y: t.top - s.top + t.height * 0.6 + offsetY,
      });
      setVisible(true);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(target);
    ro.observe(stage);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [target, stageRef, offsetX, offsetY, hidden]);

  if (hidden || !visible || !pos) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-40"
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 140, damping: 22, mass: 0.7 }}
    >
      <div className="relative">
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_4px_12px_rgba(15,23,42,0.45)]"
        >
          <path
            d="M3 2L3 17L7 13L9.5 19L12 18L9.5 12.3L15 12L3 2Z"
            fill="white"
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute left-1/2 top-1/2 -z-10 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-md" />
      </div>
    </motion.div>
  );
}
