"use client";

import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../../scene-stage";
import { FileCard, type FileKind } from "../../primitives/file-card";
import type { SceneProps } from "../../registry";
import { cn } from "@/lib/utils";

/**
 * Requirements (rows) × Evidence slot (cols). Files drag from the pool into
 * the right cell. Each placement triggers a "covered" row.
 */

interface Req {
  id: string;
  label: string;
  fileId: string;
}

const REQS: Req[] = [
  { id: "r1", label: "Accurate counts",     fileId: "f1" },
  { id: "r2", label: "Handles empty file",  fileId: "f2" },
  { id: "r3", label: "Menu-driven flow",    fileId: "f3" },
];

const FILES: { id: string; name: string; kind: FileKind }[] = [
  { id: "f1", name: "test-log.txt",   kind: "txt" },
  { id: "f2", name: "empty-test.py",  kind: "py"  },
  { id: "f3", name: "menu.png",       kind: "png" },
];

export function EvalMatrixScene({}: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const reqRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const activeReqIdx = beatIndex >= 1 && beatIndex <= REQS.length ? beatIndex - 1 : -1;
  useSceneCursor(activeReqIdx >= 0 ? reqRefs.current[REQS[activeReqIdx]!.id] ?? null : null);

  const placedFor = (reqId: string) => {
    const idx = REQS.findIndex((r) => r.id === reqId);
    return beatIndex > idx && idx !== -1 ? REQS[idx]!.fileId : null;
  };

  return (
    <LayoutGroup>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Requirement</th>
                <th className="px-3 py-2 font-semibold">Evidence</th>
                <th className="px-3 py-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {REQS.map((r, i) => {
                const placedId = placedFor(r.id);
                const file = placedId ? FILES.find((f) => f.id === placedId) : null;
                return (
                  <motion.tr
                    key={r.id}
                    ref={(el) => {
                      reqRefs.current[r.id] = el;
                    }}
                    animate={{
                      backgroundColor: file ? "rgba(34,197,94,0.1)" : "transparent",
                    }}
                    className={cn("border-t border-border/40")}
                  >
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2">
                      <AnimatePresence mode="popLayout">
                        {file ? (
                          <FileCard
                            key={file.id}
                            layoutId={`evidence-${file.id}`}
                            name={file.name}
                            kind={file.kind}
                            state="placed"
                            small
                          />
                        ) : (
                          <span
                            key="placeholder"
                            className="inline-flex items-center gap-1 rounded-md border-2 border-dashed border-border/50 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground"
                          >
                            drop evidence
                          </span>
                        )}
                      </AnimatePresence>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {file ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="size-3" /> covered
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/15 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence pool
          </p>
          <div className="flex flex-wrap gap-2">
            {FILES.map((f) => {
              const isPlaced = REQS.some((r) => placedFor(r.id) === f.id);
              if (isPlaced) return null;
              return (
                <FileCard
                  key={f.id}
                  layoutId={`evidence-${f.id}`}
                  name={f.name}
                  kind={f.kind}
                  state="idle"
                />
              );
            })}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}

export const EVAL_MATRIX_BEATS = [
  { caption: "Requirements listed without evidence. Nothing to mark yet.", after: 900 },
  { caption: "Accurate counts — test-log.txt proves the numbers.", after: 1000 },
  { caption: "Empty-file handling — empty-test.py proves the branch.", after: 1000 },
  { caption: "Menu-driven flow — a screenshot proves it walks.", after: 1000 },
  { caption: "Every requirement has a file. The evaluation is defendable.", after: 900 },
];
