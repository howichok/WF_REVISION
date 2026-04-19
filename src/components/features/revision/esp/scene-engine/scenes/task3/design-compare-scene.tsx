"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSceneBeat, useSceneStageRef, useSceneCursor } from "../../scene-stage";
import { ConnectorArrow } from "../../primitives/connector-arrow";
import type { SceneProps } from "../../registry";

/**
 * Two IPO diagrams side-by-side. Left (weak) loses connectors — boxes drift
 * apart. Right (strong) gains connectors and a pass badge.
 */

export function DesignCompareScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const stageRef = useSceneStageRef();

  const weakInRef = useRef<HTMLDivElement | null>(null);
  const weakProcRef = useRef<HTMLDivElement | null>(null);
  const weakOutRef = useRef<HTMLDivElement | null>(null);

  const strongInRef = useRef<HTMLDivElement | null>(null);
  const strongProcRef = useRef<HTMLDivElement | null>(null);
  const strongOutRef = useRef<HTMLDivElement | null>(null);

  useSceneCursor(beatIndex < 3 ? weakProcRef.current : strongProcRef.current);

  const weakConnected = beatIndex === 0;
  const strongA = beatIndex >= 3;
  const strongB = beatIndex >= 4;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="relative rounded-xl border border-border/60 bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <XCircle className="size-3.5 text-danger" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-danger">Weak</p>
          <span className="ml-auto text-[10px] text-muted-foreground">Disconnected IPO</span>
        </div>
        <div className="flex items-center justify-between">
          <MiniBox innerRef={weakInRef} label="In" color="#64748b" text="rows" drifted={beatIndex >= 1} side="left" />
          <MiniBox innerRef={weakProcRef} label="?" color="#64748b" text="???" drifted={beatIndex >= 2} side="middle" />
          <MiniBox innerRef={weakOutRef} label="Out" color="#64748b" text="report" drifted={beatIndex >= 1} side="right" />
        </div>
        <ConnectorArrow
          stageRef={stageRef}
          fromRef={weakInRef as React.RefObject<HTMLElement | null>}
          toRef={weakProcRef as React.RefObject<HTMLElement | null>}
          drawn={weakConnected}
          color="var(--color-danger)"
        />
        <ConnectorArrow
          stageRef={stageRef}
          fromRef={weakProcRef as React.RefObject<HTMLElement | null>}
          toRef={weakOutRef as React.RefObject<HTMLElement | null>}
          drawn={weakConnected}
          color="var(--color-danger)"
        />
      </div>

      <div className="relative rounded-xl border-2 border-success/40 bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-success" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-success">Strong</p>
          <span className="ml-auto text-[10px] text-muted-foreground">Flow traceable</span>
        </div>
        <div className="flex items-center justify-between">
          <MiniBox innerRef={strongInRef} label="In" color="#2563eb" text="CSV" side="left" />
          <MiniBox innerRef={strongProcRef} label="Proc" color="#9333ea" text="validate+count" side="middle" />
          <MiniBox innerRef={strongOutRef} label="Out" color="#16a34a" text="summary" side="right" />
        </div>
        <ConnectorArrow
          stageRef={stageRef}
          fromRef={strongInRef as React.RefObject<HTMLElement | null>}
          toRef={strongProcRef as React.RefObject<HTMLElement | null>}
          drawn={strongA}
          color="var(--color-accent)"
        />
        <ConnectorArrow
          stageRef={stageRef}
          fromRef={strongProcRef as React.RefObject<HTMLElement | null>}
          toRef={strongOutRef as React.RefObject<HTMLElement | null>}
          drawn={strongB}
          color="var(--color-accent)"
        />
      </div>
    </div>
  );
}

function MiniBox({
  innerRef,
  label,
  color,
  text,
  drifted,
  side,
}: {
  innerRef: React.RefObject<HTMLDivElement | null>;
  label: string;
  color: string;
  text: string;
  drifted?: boolean;
  side: "left" | "middle" | "right";
}) {
  const drift = drifted ? (side === "left" ? -6 : side === "right" ? 6 : 0) : 0;
  return (
    <motion.div
      ref={innerRef}
      animate={{ x: drift, opacity: drifted ? 0.6 : 1 }}
      className="min-w-[70px] rounded-lg border-2 bg-background/70 p-1.5 text-center"
      style={{ borderColor: color }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </p>
      <p className="font-mono text-[10px] text-foreground">{text}</p>
    </motion.div>
  );
}

export const DESIGN_COMPARE_BEATS = [
  { caption: "Two IPO diagrams side-by-side.", after: 1000 },
  { caption: "Weak: arrows start to fray — the flow is not traceable.", after: 1000 },
  { caption: "Weak: boxes drift apart — a marker cannot follow the data.", after: 1000 },
  { caption: "Strong: Input is wired to Process — a live flow appears.", after: 1000 },
  { caption: "Strong: Process is wired to Output — the full IPO is intact.", after: 900 },
];
