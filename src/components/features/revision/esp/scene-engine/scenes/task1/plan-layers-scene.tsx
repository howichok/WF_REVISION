"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { CalendarDays, Users, Beaker, PenTool } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { cn } from "@/lib/utils";
import type { SceneProps } from "../../registry";

/**
 * Four stacked layers of a plan — each beat "drops" a concrete artefact into
 * the right layer so the plan builds up in front of the learner.
 *
 * 0 empty layers
 * 1 schedule: gantt bar lands
 * 2 roles: role avatar lands
 * 3 testing: test block lands
 * 4 rationale: paragraph lands
 * 5 completed plan
 */

const LAYERS = [
  { id: "schedule", title: "Schedule", hint: "Gantt bars + week grid",   icon: CalendarDays, color: "#16a34a" },
  { id: "roles",    title: "Roles",    hint: "Named owner on every bar", icon: Users,        color: "#9333ea" },
  { id: "testing",  title: "Testing",  hint: "Test + regression windows", icon: Beaker,      color: "#f59e0b" },
  { id: "rationale",title: "Rationale",hint: "Why — not what",            icon: PenTool,      color: "#dc2626" },
];

export function PlanLayersScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeLayer = beatIndex >= 1 && beatIndex <= 4 ? LAYERS[beatIndex - 1]!.id : null;
  useSceneCursor(activeLayer ? layerRefs.current[activeLayer] ?? null : null, { offsetX: 40, offsetY: -4 });

  const filled = (layerId: string): boolean => {
    const idx = LAYERS.findIndex((l) => l.id === layerId);
    return beatIndex > idx + 0;
  };

  return (
    <LayoutGroup>
      <div className="space-y-2">
        {LAYERS.map((l, i) => {
          const isFilled = beatIndex > i;
          const isActive = beatIndex === i + 1;
          return (
            <motion.div
              key={l.id}
              ref={(el) => {
                layerRefs.current[l.id] = el;
              }}
              animate={{
                borderColor: isActive ? l.color : isFilled ? `${l.color}66` : "rgba(127,127,127,0.25)",
                backgroundColor: isFilled ? `${l.color}10` : "rgba(127,127,127,0.05)",
              }}
              className="flex min-h-[58px] items-center gap-3 rounded-xl border-2 px-3 py-2"
            >
              <span
                className="inline-flex size-7 items-center justify-center rounded-md"
                style={{ backgroundColor: `${l.color}1e`, color: l.color }}
              >
                <l.icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: l.color }}>
                  {l.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{l.hint}</p>
              </div>
              <div className="ml-auto flex min-h-[32px] min-w-[180px] items-center justify-end gap-2">
                <AnimatePresence>
                  {isFilled ? <LayerArtefact key={l.id} layer={l.id} color={l.color} /> : null}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function LayerArtefact({ layer, color }: { layer: string; color: string }) {
  switch (layer) {
    case "schedule":
      return (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 180, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-6 items-center rounded-md px-2 text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          Requirements · Design · Build · Test
        </motion.div>
      );
    case "roles":
      return (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1"
        >
          {["PM", "Dev", "DBA", "UX", "QA"].map((r) => (
            <span
              key={r}
              className="inline-flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {r}
            </span>
          ))}
        </motion.div>
      );
    case "testing":
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1"
        >
          {["Int test", "Regression", "UAT"].map((t) => (
            <span
              key={t}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {t}
            </span>
          ))}
        </motion.div>
      );
    case "rationale":
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-[220px] rounded-md border px-2 py-1 text-[10px] italic leading-snug"
          style={{ borderColor: color, color }}
        >
          “Waterfall fits — spec is fixed and the deadline is six weeks.”
        </motion.div>
      );
  }
  return null;
}

export const PLAN_LAYERS_BEATS = [
  { caption: "A Task 1 plan is four layers stacked — all four must be present.", after: 900 },
  { caption: "The Schedule layer gets a Gantt sequence: requirements → build → test.", after: 1000 },
  { caption: "Every bar needs an owner — role avatars drop onto the Roles layer.", after: 1000 },
  { caption: "Testing is not last — int-test, regression and UAT occupy their own layer.", after: 1000 },
  { caption: "The Rationale layer explains the why. A plan without it scores half.", after: 1000 },
  { caption: "Four layers filled = a plan a marker can assess.", after: 800 },
];
