"use client";

import { useEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";

interface ConnectorArrowProps {
  stageRef: RefObject<HTMLDivElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  drawn: boolean;
  color?: string;
  strokeWidth?: number;
  /** curvature multiplier (0 = straight). */
  curve?: number;
}

/** Animated SVG curve from one scene element to another, scoped to the stage. */
export function ConnectorArrow({
  stageRef,
  fromRef,
  toRef,
  drawn,
  color = "var(--color-accent)",
  strokeWidth = 2,
  curve = 0.35,
}: ConnectorArrowProps) {
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    const compute = () => {
      const stage = stageRef.current;
      const a = fromRef.current;
      const b = toRef.current;
      if (!stage || !a || !b) return setPath(null);
      const sr = stage.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const x1 = ar.right - sr.left;
      const y1 = ar.top + ar.height / 2 - sr.top;
      const x2 = br.left - sr.left;
      const y2 = br.top + br.height / 2 - sr.top;
      const midX = (x1 + x2) / 2;
      const dx = Math.abs(x2 - x1);
      const ctrlY = Math.min(y1, y2) - dx * curve;
      setPath(`M ${x1},${y1} Q ${midX},${ctrlY} ${x2},${y2}`);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    if (fromRef.current) ro.observe(fromRef.current);
    if (toRef.current) ro.observe(toRef.current);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [stageRef, fromRef, toRef]);

  if (!path) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id={`arrow-head-${color.replace(/[^a-z0-9]/gi, "")}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        markerEnd={`url(#arrow-head-${color.replace(/[^a-z0-9]/gi, "")})`}
      />
    </svg>
  );
}
