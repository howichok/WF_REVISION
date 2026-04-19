"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { FileCard, type FileKind } from "../../primitives/file-card";
import { ErrorBubble } from "../../primitives/error-bubble";
import { SuccessState } from "../../primitives/success-state";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Portfolio with three slots (Data dictionary, Flowchart, Wireframe). A file
 * pool sits beside them. Right files go in; wrong ones get rejected.
 */

interface Slot {
  id: string;
  label: string;
  accepts: FileKind[];
  hint: string;
}

const SLOTS: Slot[] = [
  { id: "dict", label: "Data dictionary", accepts: ["xlsx", "docx"], hint: "Names, types, validation" },
  { id: "flow", label: "Flowchart",       accepts: ["png"],          hint: "Process path" },
  { id: "wire", label: "Wireframe",       accepts: ["png"],          hint: "Screen layout" },
];

interface Pool {
  id: string;
  name: string;
  kind: FileKind;
  slotId: string;
}

const FILES: Pool[] = [
  { id: "f1", name: "data-dict.xlsx", kind: "xlsx", slotId: "dict" },
  { id: "f2", name: "process.png",    kind: "png",  slotId: "flow" },
  { id: "f3", name: "wireframe.png",  kind: "png",  slotId: "wire" },
];

/**
 * 0 empty portfolio
 * 1 drag data-dict → dict slot
 * 2 attempt wireframe → dict (rejected)
 * 3 process.png → flow
 * 4 wireframe.png → wire
 * 5 success
 */
export function DesignArtefactsScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const placed: Record<string, string> = {};
  if (beatIndex >= 1) placed["dict"] = "f1";
  // beat 2 = attempt reject (no placement)
  if (beatIndex >= 3) placed["flow"] = "f2";
  if (beatIndex >= 4) placed["wire"] = "f3";

  const rejecting = beatIndex === 2;

  useSceneCursor(
    beatIndex === 1
      ? slotRefs.current["dict"] ?? null
      : beatIndex === 2
        ? slotRefs.current["dict"] ?? null
        : beatIndex === 3
          ? slotRefs.current["flow"] ?? null
          : beatIndex === 4
            ? slotRefs.current["wire"] ?? null
            : null
  );

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <div className="grid gap-2 md:grid-cols-3">
          {SLOTS.map((s) => {
            const placedId = placed[s.id];
            const placedFile = placedId ? FILES.find((f) => f.id === placedId) : null;
            const isActive = beatIndex >= 1 && beatIndex <= 4 &&
              ((s.id === "dict" && (beatIndex === 1 || beatIndex === 2)) ||
                (s.id === "flow" && beatIndex === 3) ||
                (s.id === "wire" && beatIndex === 4));
            return (
              <div
                key={s.id}
                ref={(el) => {
                  slotRefs.current[s.id] = el;
                }}
                className={cn(
                  "flex min-h-[100px] flex-col gap-2 rounded-xl border-2 border-dashed p-3 transition-colors",
                  placedFile
                    ? "border-success/50 bg-success/8"
                    : rejecting && s.id === "dict"
                      ? "border-danger bg-danger/8"
                      : isActive
                        ? "border-accent/60 bg-accent/8"
                        : "border-border/60 bg-muted/20"
                )}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-[10px] text-muted-foreground/80">{s.hint}</p>
                <AnimatePresence>
                  {placedFile ? (
                    <FileCard
                      key={placedFile.id}
                      layoutId={`artefact-${placedFile.id}`}
                      name={placedFile.name}
                      kind={placedFile.kind}
                      state="placed"
                    />
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/15 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Candidate artefacts
          </p>
          <div className="flex flex-wrap gap-2">
            {FILES.map((f) => {
              const isPlaced = Object.values(placed).includes(f.id);
              if (isPlaced) return null;
              const isLifted =
                (beatIndex === 1 && f.id === "f1") ||
                (beatIndex === 2 && f.id === "f3") ||
                (beatIndex === 3 && f.id === "f2") ||
                (beatIndex === 4 && f.id === "f3");
              const isRejected = beatIndex === 2 && f.id === "f3";
              return (
                <FileCard
                  key={f.id}
                  layoutId={`artefact-${f.id}`}
                  name={f.name}
                  kind={f.kind}
                  state={isRejected ? "rejected" : isLifted ? "lifted" : "idle"}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ErrorBubble
            visible={rejecting}
            message="Wrong slot — a wireframe is not a data dictionary."
          />
          <SuccessState visible={beatIndex >= 5} message="Portfolio complete" />
        </div>
      </div>
    </LayoutGroup>
  );
}

export const DESIGN_ARTEFACTS_BEATS = [
  { caption: "Three empty portfolio slots — one per design artefact.", after: 900 },
  { caption: "Data dictionary: a spreadsheet of fields, types and validation.", after: 900 },
  { caption: "Trying to drop a wireframe into Data dictionary — rejected.", after: 1100 },
  { caption: "Flowchart gets the process PNG.", after: 900 },
  { caption: "Wireframe slot accepts the screen layout.", after: 900 },
  { caption: "All three artefacts present. Portfolio is markable.", after: 800 },
];
