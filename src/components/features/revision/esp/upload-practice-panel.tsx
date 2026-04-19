"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Download, Loader2, Sparkles, Upload } from "lucide-react";
import type { PlanMarkResult } from "@/lib/esp/plan-marker";
import type { Task4aParseResult } from "@/lib/esp/task4a-parser";
import type { EspTask } from "@/data/curriculum";
import { ESP_TASK_SLUGS } from "@/components/features/revision/esp/esp-task-meta";
import { SoftButton } from "@/components/features/revision/esp/native/micro";
import { MarkResultPanel, MarkingPlaceholder } from "@/components/features/revision/esp/mark-result-panel";
import { cn } from "@/lib/utils";

export function UploadPracticePanel({ scenarioId, taskId }: { scenarioId: string; taskId: EspTask }) {
  const slug = ESP_TASK_SLUGS[taskId];
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [marking, setMarking] = useState(false);
  const [mark, setMark] = useState<PlanMarkResult | null>(null);
  const [structure, setStructure] = useState<Task4aParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadHref = `/api/esp/download-template?scenario=${encodeURIComponent(scenarioId)}&task=${encodeURIComponent(slug)}`;

  const mainAccept =
    taskId === "task_1"
      ? ".xlsx"
      : taskId === "task_4a"
        ? ".docx"
        : ".docx,.xlsx,.py,.txt,.md,.png,.jpg,.jpeg";

  async function submitFiles(main: FileList | null, extra: FileList | null) {
    setError(null);
    setMark(null);
    setStructure(null);

    if (taskId === "task_4a") {
      const doc = main?.[0];
      if (!doc) {
        setError("Select your Task 4a .docx first.");
        return;
      }
      const fd = new FormData();
      fd.append("document", doc);
      fd.append("scenario", scenarioId);
      if (extra) {
        for (const f of Array.from(extra)) {
          fd.append("images", f);
        }
      }
      setMarking(true);
      try {
        const res = await fetch("/api/esp/mark-task4a", { method: "POST", body: fd });
        const data = (await res.json()) as { structure?: Task4aParseResult; mark?: PlanMarkResult; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Marking failed");
        if (data.structure) setStructure(data.structure);
        if (data.mark) setMark(data.mark);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setMarking(false);
      }
      return;
    }

    if (taskId === "task_1") {
      const file = main?.[0];
      if (!file) {
        setError("Choose your filled .xlsx.");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("scenario", scenarioId);
      setMarking(true);
      try {
        const res = await fetch("/api/esp/mark-plan", { method: "POST", body: fd });
        const data = (await res.json()) as PlanMarkResult & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Marking failed");
        setMark(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setMarking(false);
      }
      return;
    }

    const files = [...Array.from(main ?? []), ...Array.from(extra ?? [])];
    if (files.length === 0) {
      setError("Attach at least one file.");
      return;
    }
    const fd = new FormData();
    fd.append("scenario", scenarioId);
    fd.append("task", slug);
    for (const f of files) {
      fd.append("files", f);
    }
    setMarking(true);
    try {
      const res = await fetch("/api/esp/mark-practice", { method: "POST", body: fd });
      const data = (await res.json()) as { mark?: PlanMarkResult; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Marking failed");
      if (data.mark) setMark(data.mark);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setMarking(false);
    }
  }

  const heading =
    taskId === "task_1"
      ? "AI mark — Task 1 plan"
      : taskId === "task_4a"
        ? "AI mark — Task 4a evidence"
        : `AI mark — ${slug}`;

  const placeholderHint =
    taskId === "task_1"
      ? "Upload your completed Excel workbook for Gemini marking (or connect GEMINI_API_KEY for full feedback)."
      : taskId === "task_4a"
        ? "Upload your Word evidence pack. Add screenshots as image files for vision-assisted marking."
        : "Upload your completed template files for checklist-based feedback.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        <p className="min-w-[200px] flex-1 text-sm text-foreground">
          <span className="font-semibold">Practice:</span> work offline, then upload here.
        </p>
        <SoftButton tone="neutral" onClick={() => window.open(downloadHref, "_blank")}>
          <Download className="size-3.5" />
          Download template
        </SoftButton>
        <SoftButton tone="neutral" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" />
          {taskId === "task_4a" ? "Choose .docx" : "Choose files"}
        </SoftButton>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept={mainAccept}
          multiple={taskId !== "task_1" && taskId !== "task_4a"}
        />
        {taskId === "task_4a" ? (
          <>
            <SoftButton tone="neutral" onClick={() => imgRef.current?.click()}>
              <Upload className="size-3.5" />
              Add screenshots
            </SoftButton>
            <input ref={imgRef} type="file" className="hidden" accept=".png,.jpg,.jpeg" multiple />
          </>
        ) : null}
        <SoftButton
          tone="accent"
          active
          disabled={marking}
          onClick={() => void submitFiles(fileRef.current?.files ?? null, taskId === "task_4a" ? imgRef.current?.files ?? null : null)}
        >
          {marking ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {marking ? "Marking…" : "Submit for marking"}
        </SoftButton>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {structure ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
          <p className="font-semibold text-foreground">Deterministic structure check</p>
          {structure.missingSections.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-danger">
              {structure.missingSections.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[#21a366]">All template sections detected with content.</p>
          )}
          <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <div className={cn(structure.hasCodeEvidence ? "text-[#21a366]" : "")}>Code evidence: {structure.hasCodeEvidence ? "yes" : "no"}</div>
            <div className={cn(structure.hasTestOutput ? "text-[#21a366]" : "")}>Test output cues: {structure.hasTestOutput ? "yes" : "no"}</div>
            <div className={cn(structure.hasEvaluation ? "text-[#21a366]" : "")}>Evaluation depth: {structure.hasEvaluation ? "yes" : "no"}</div>
          </dl>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {mark ? (
          <MarkResultPanel key="mr" result={mark} heading={heading} />
        ) : (
          <MarkingPlaceholder key="ph" title="Ready when you are" hint={placeholderHint} />
        )}
      </AnimatePresence>
    </div>
  );
}
