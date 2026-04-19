"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSceneBeat, useSceneStageRef, useSceneCursor } from "../scene-stage";
import { FileCard, type FileKind } from "../primitives/file-card";
import { ErrorBubble } from "../primitives/error-bubble";
import { SuccessState } from "../primitives/success-state";
import { cn } from "@/lib/utils";
import type { SceneProps } from "../registry";

interface Slot {
  id: string;
  label: string;
  accepts: FileKind[];
}

const SLOTS: Slot[] = [
  { id: "plan",    label: "Plan",       accepts: ["xlsx"] },
  { id: "fix",     label: "Defect fix", accepts: ["py", "txt"] },
  { id: "design",  label: "Design",     accepts: ["docx", "png"] },
  { id: "build",   label: "Build",      accepts: ["py", "csv"] },
  { id: "eval",    label: "Evaluate",   accepts: ["docx"] },
];

interface PendingFile {
  id: string;
  name: string;
  kind: FileKind;
  correctSlot: string;
}

const FILES: PendingFile[] = [
  { id: "f1", name: "plan.xlsx",     kind: "xlsx", correctSlot: "plan" },
  { id: "f2", name: "fix.py",        kind: "py",   correctSlot: "fix" },
  { id: "f3", name: "design.docx",   kind: "docx", correctSlot: "design" },
  { id: "f4", name: "build.py",      kind: "py",   correctSlot: "build" },
  { id: "f5", name: "evaluate.docx", kind: "docx", correctSlot: "eval" },
];

// Beat plan (8 beats):
// 0 intro — files sit below, 5 empty slots above
// 1 drag plan.xlsx -> Plan slot (pass)
// 2 drag fix.py -> Defect fix
// 3 WRONG: attempt design.docx onto Build (reject)
// 4 correct: design.docx -> Design
// 5 build.py -> Build
// 6 evaluate.docx -> Evaluate
// 7 success

export function DeliverablesPipelineScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const stageRef = useSceneStageRef();
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Which file is the cursor currently carrying / hovering?
  const active = describeBeat(beatIndex);
  const cursorTargetEl =
    active?.cursorOn === "slot"
      ? slotRefs.current[active.targetSlot!] ?? null
      : active?.cursorOn === "file"
        ? fileRefs.current[active.fileId!] ?? null
        : null;
  useSceneCursor(cursorTargetEl, { offsetX: -2, offsetY: -4 });

  const placed: Record<string, string> = {}; // slotId -> fileId
  for (let b = 0; b < beatIndex; b++) {
    const step = describeBeat(b);
    if (step?.place && step.correctPlacement) placed[step.targetSlot!] = step.fileId!;
  }

  const rejectFileId = beatIndex === 3 ? "f3" : undefined;

  return (
    <LayoutGroup>
      <div ref={stageRef} className="space-y-5">
        {/* Pipeline slots */}
        <div className="grid grid-cols-5 gap-2">
          {SLOTS.map((slot, i) => {
            const placedFileId = placed[slot.id];
            const placedFile = FILES.find((f) => f.id === placedFileId);
            return (
              <div key={slot.id} className="flex items-center gap-1">
                <div
                  ref={(el) => {
                    slotRefs.current[slot.id] = el;
                  }}
                  className={cn(
                    "flex min-h-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2 py-2 transition-colors",
                    placedFile
                      ? "border-success/60 bg-success/8"
                      : active?.targetSlot === slot.id
                        ? "border-accent/60 bg-accent/8"
                        : "border-border/60 bg-muted/20"
                  )}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {slot.label}
                  </span>
                  <AnimatePresence mode="popLayout">
                    {placedFile ? (
                      <FileCard
                        key={`${slot.id}-${placedFile.id}`}
                        layoutId={`file-${placedFile.id}`}
                        name={placedFile.name}
                        kind={placedFile.kind}
                        state="placed"
                        small
                      />
                    ) : (
                      <span
                        key="empty"
                        className="text-[9px] text-muted-foreground/60"
                        aria-hidden
                      >
                        {slot.accepts.map((a) => `.${a}`).join(" / ")}
                      </span>
                    )}
                  </AnimatePresence>
                </div>
                {i < SLOTS.length - 1 ? (
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* File pool */}
        <div className="rounded-xl border border-border/50 bg-muted/15 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pending deliverables
          </p>
          <div className="flex flex-wrap gap-2">
            {FILES.map((f) => {
              const placedSomewhere = Object.values(placed).includes(f.id);
              if (placedSomewhere) return <span key={f.id} className="invisible text-[10px]">.</span>;
              const rejected = rejectFileId === f.id;
              return (
                <FileCard
                  key={f.id}
                  ref={(el) => {
                    fileRefs.current[f.id] = el;
                  }}
                  layoutId={`file-${f.id}`}
                  name={f.name}
                  kind={f.kind}
                  state={
                    rejected ? "rejected" : active?.fileId === f.id ? "lifted" : "idle"
                  }
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ErrorBubble
              visible={beatIndex === 3}
              message="Wrong slot — design evidence is not a build artefact."
            />
            <SuccessState visible={beatIndex >= 7} message="Every deliverable has a home." />
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}

interface StepDef {
  cursorOn?: "file" | "slot";
  fileId?: string;
  targetSlot?: string;
  place?: boolean;
  correctPlacement?: boolean;
}

function describeBeat(index: number): StepDef | null {
  switch (index) {
    case 0:
      return null;
    case 1:
      return { cursorOn: "slot", fileId: "f1", targetSlot: "plan", place: true, correctPlacement: true };
    case 2:
      return { cursorOn: "slot", fileId: "f2", targetSlot: "fix", place: true, correctPlacement: true };
    case 3:
      return { cursorOn: "slot", fileId: "f3", targetSlot: "build", place: false };
    case 4:
      return { cursorOn: "slot", fileId: "f3", targetSlot: "design", place: true, correctPlacement: true };
    case 5:
      return { cursorOn: "slot", fileId: "f4", targetSlot: "build", place: true, correctPlacement: true };
    case 6:
      return { cursorOn: "slot", fileId: "f5", targetSlot: "eval", place: true, correctPlacement: true };
    case 7:
      return null;
    default:
      return null;
  }
}

export const DELIVERABLES_PIPELINE_BEATS = [
  { caption: "Five empty slots — one per ESP stage. A file card pool waits below.", after: 900 },
  { caption: "Plan goes in first: plan.xlsx snaps into the Plan slot.", after: 900 },
  { caption: "fix.py is the defect-fix evidence — placed in Defect fix.", after: 900 },
  { caption: "Careful — design.docx is not build evidence. The slot rejects it.", after: 1100 },
  { caption: "Correct home: design.docx belongs in the Design slot.", after: 900 },
  { caption: "build.py is the build artefact — into Build.", after: 900 },
  { caption: "evaluate.docx proves the evaluation — into Evaluate.", after: 900 },
  { caption: "Every stage now has a named file to hand in.", after: 800 },
];
