"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { ErrorBubble } from "../../primitives/error-bubble";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Role avatars are dragged onto stage rows. Cost total ticks up per
 * assignment. Wrong match shows an error, then corrects itself.
 */

interface Role {
  id: string;
  label: string;
  rate: number;
  color: string;
}

interface Stage {
  id: string;
  label: string;
  correctRoleId: string;
  days: number;
}

const ROLES: Role[] = [
  { id: "pm",   label: "PM",  rate: 450, color: "#9333ea" },
  { id: "dba",  label: "DBA", rate: 410, color: "#0ea5e9" },
  { id: "dev",  label: "Dev", rate: 320, color: "#16a34a" },
  { id: "ux",   label: "UX",  rate: 360, color: "#f59e0b" },
  { id: "qa",   label: "QA",  rate: 330, color: "#dc2626" },
];

const STAGES: Stage[] = [
  { id: "req",  label: "Requirements", correctRoleId: "pm",  days: 3 },
  { id: "data", label: "Data design",  correctRoleId: "dba", days: 5 },
  { id: "ui",   label: "UI design",    correctRoleId: "ux",  days: 4 },
  { id: "build",label: "Build",        correctRoleId: "dev", days: 8 },
  { id: "test", label: "Testing",      correctRoleId: "qa",  days: 4 },
];

// Beats:
// 0 rows empty, roles sitting below
// 1 PM -> Requirements
// 2 DBA -> Data design
// 3 WRONG: UX -> Build (reject)
// 4 Dev -> Build (correct)
// 5 UX -> UI design
// 6 QA -> Testing
// 7 total £X displayed

export function RolesMapScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const roleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const assignments: Record<string, string | undefined> = {};
  let attemptReject = false;
  const beatPlan: { stageId: string; roleId: string; reject?: boolean }[] = [
    { stageId: "req",   roleId: "pm" },
    { stageId: "data",  roleId: "dba" },
    { stageId: "build", roleId: "ux", reject: true },
    { stageId: "build", roleId: "dev" },
    { stageId: "ui",    roleId: "ux" },
    { stageId: "test",  roleId: "qa" },
  ];
  for (let b = 1; b <= Math.min(beatIndex, beatPlan.length); b++) {
    const step = beatPlan[b - 1]!;
    if (step.reject) {
      if (beatIndex === 3) attemptReject = true;
      continue;
    }
    assignments[step.stageId] = step.roleId;
  }

  const currentStep = beatPlan[beatIndex - 1];
  const cursorTarget =
    currentStep && beatIndex >= 1
      ? stageRefs.current[currentStep.stageId] ?? null
      : null;
  useSceneCursor(cursorTarget);

  const totalCost = STAGES.reduce((sum, s) => {
    const r = assignments[s.id];
    if (!r) return sum;
    const rate = ROLES.find((ro) => ro.id === r)!.rate;
    return sum + rate * s.days;
  }, 0);

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <div className="space-y-1.5">
          {STAGES.map((s) => {
            const roleId = assignments[s.id];
            const role = roleId ? ROLES.find((r) => r.id === roleId) : null;
            const rejecting = attemptReject && s.id === "build";
            return (
              <div
                key={s.id}
                ref={(el) => {
                  stageRefs.current[s.id] = el;
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 bg-card px-3 py-2 transition-colors",
                  rejecting
                    ? "border-danger"
                    : role
                      ? "border-success/50"
                      : "border-border/40"
                )}
              >
                <span className="w-28 text-[11px] font-semibold text-foreground">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">{s.days}d</span>
                <div className="ml-auto flex items-center gap-2">
                  <AnimatePresence mode="popLayout">
                    {role ? (
                      <motion.span
                        key={role.id}
                        layoutId={`role-${role.id}`}
                        className="inline-flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        {role.label}
                      </motion.span>
                    ) : (
                      <span key="empty" className="inline-block size-7 rounded-full border border-dashed border-border/60" />
                    )}
                  </AnimatePresence>
                  <span className="min-w-14 text-right text-[11px] font-semibold tabular-nums text-success">
                    {role ? `£${(role.rate * s.days).toLocaleString()}` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((r) => {
              const used = Object.values(assignments).includes(r.id);
              if (used) return null;
              return (
                <motion.div
                  key={r.id}
                  layoutId={`role-${r.id}`}
                  ref={(el) => {
                    roleRefs.current[r.id] = el;
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2 py-1 text-[10px] font-semibold"
                >
                  <span
                    className="inline-flex size-5 items-center justify-center rounded-full text-[9px] text-white"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.label}
                  </span>
                  <span className="text-muted-foreground">£{r.rate}/d</span>
                </motion.div>
              );
            })}
          </div>
          <span className="rounded-md bg-accent/10 px-2 py-1 text-[11px] font-bold text-accent tabular-nums">
            Total £{totalCost.toLocaleString()}
          </span>
        </div>

        <ErrorBubble
          visible={attemptReject}
          message="UX cannot build. Match the role to the skill named in the brief."
        />
      </div>
    </LayoutGroup>
  );
}

export const ROLES_MAP_BEATS = [
  { caption: "Five stages waiting for an owner. Roles sit below with day rates.", after: 900 },
  { caption: "PM takes Requirements — 3 days × £450.", after: 900 },
  { caption: "DBA is the correct owner for Data design.", after: 900 },
  { caption: "Watch out — UX is not a developer. Build rejects the wrong role.", after: 1100 },
  { caption: "Dev picks up Build — eight days, keeps cost sensible.", after: 900 },
  { caption: "UX designs the UI — that's their skill.", after: 900 },
  { caption: "QA runs Testing — fully owned.", after: 900 },
  { caption: "Cost totals live at the right. A marker can check every £.", after: 800 },
];
