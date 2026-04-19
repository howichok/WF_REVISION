"use client";

import { useMemo, useRef } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useSceneBeat, useSceneCursor } from "../scene-stage";
import { FileCard, type FileKind } from "../primitives/file-card";
import { AnimatedButton } from "../primitives/animated-button";
import { SuccessState } from "../primitives/success-state";
import { cn } from "@/lib/utils";
import type { SceneProps } from "../registry";

// Beat plan:
// 0 empty drop-zone + file card
// 1 cursor hovers file card (lifted)
// 2 cursor drags to drop-zone (file in zone)
// 3 progress bar animates 0 -> 100%
// 4 submit button hovered
// 5 submit pressed
// 6 success state

const FILE_BY_TASK: Record<string, { kind: FileKind; name: string; button: string }> = {
  pre_release: { kind: "docx", name: "brief-triage.docx", button: "Upload triage" },
  task_1: { kind: "xlsx", name: "project-plan.xlsx", button: "Submit plan" },
  task_2: { kind: "py", name: "fix.py", button: "Submit fix" },
  task_3: { kind: "docx", name: "design.docx", button: "Submit design" },
  task_4a: { kind: "py", name: "build.py", button: "Submit build" },
  task_4b: { kind: "docx", name: "evaluate.docx", button: "Submit evaluation" },
};

export function PracticeUploadScene({ scenario, data }: SceneProps) {
  const { beatIndex } = useSceneBeat();
  const taskId = (data?.taskId as string | undefined) ?? "pre_release";
  const file = FILE_BY_TASK[taskId] ?? FILE_BY_TASK.pre_release;

  const fileRef = useRef<HTMLDivElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const cursorTarget =
    beatIndex === 1 || beatIndex === 2
      ? fileRef.current
      : beatIndex === 3
        ? dropRef.current
        : beatIndex === 4 || beatIndex === 5
          ? buttonRef.current
          : null;
  useSceneCursor(cursorTarget, { offsetX: -2, offsetY: -4 });

  const fileInZone = beatIndex >= 2 && beatIndex < 7;
  const progressPct = useMemo(() => {
    if (beatIndex < 3) return 0;
    if (beatIndex === 3) return 70;
    return 100;
  }, [beatIndex]);
  const submitState =
    beatIndex === 4 ? "hover" : beatIndex === 5 ? "active" : beatIndex >= 6 ? "idle" : "idle";

  return (
    <LayoutGroup>
      <div className="space-y-4">
        <div
          ref={dropRef}
          className={cn(
            "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors",
            fileInZone
              ? "border-success/60 bg-success/8"
              : "border-border/60 bg-muted/20"
          )}
        >
          <AnimatePresence mode="popLayout">
            {fileInZone ? (
              <FileCard
                key="in-zone"
                layoutId={`practice-file-${taskId}`}
                name={file.name}
                kind={file.kind}
                state="placed"
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1 text-muted-foreground"
              >
                <Upload className="size-6" />
                <span className="text-[11px]">Drop {file.name} to upload</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          {fileInZone ? (
            <div className="mt-2 h-1 w-3/4 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-success"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          ) : null}
        </div>

        {/* File pool */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {!fileInZone ? (
              <FileCard
                ref={fileRef}
                layoutId={`practice-file-${taskId}`}
                name={file.name}
                kind={file.kind}
                state={beatIndex === 1 ? "lifted" : "idle"}
              />
            ) : (
              <span className="text-[11px] text-muted-foreground">Scenario: {scenario.title}</span>
            )}
          </div>
          <div ref={buttonRef}>
            <AnimatedButton
              label={file.button}
              state={beatIndex >= 6 ? "disabled" : submitState}
              tone={beatIndex >= 6 ? "success" : "primary"}
              icon={<Upload className="size-3.5" />}
            />
          </div>
        </div>

        <SuccessState visible={beatIndex >= 6} message="Submitted for marking" />
      </div>
    </LayoutGroup>
  );
}

export const PRACTICE_UPLOAD_BEATS = [
  { caption: "An empty drop-zone waits for your evidence file.", after: 900 },
  { caption: "You pick up the correct file from your machine.", after: 900 },
  { caption: "Drag it into the drop-zone — the border turns green.", after: 900 },
  { caption: "The upload progresses as the file is prepared for marking.", after: 900 },
  { caption: "Hover the submit button — ready when you are.", after: 900 },
  { caption: "Press submit to send the file off.", after: 900 },
  { caption: "Confirmation lands: your submission is queued.", after: 800 },
];
