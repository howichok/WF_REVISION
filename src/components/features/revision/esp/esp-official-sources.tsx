"use client";

import { FileArchive, FileText, Download } from "lucide-react";
import {
  ESP_OFFICIAL_SOURCE_ASSETS,
  type EspBoardTaskGroup,
} from "@/data/esp/official-task-sources";
import { cn } from "@/lib/utils";

const GROUP_ORDER: EspBoardTaskGroup[] = ["task-1", "task-2", "task-3", "task-4a", "task-4b"];

const GROUP_TITLE: Record<EspBoardTaskGroup, string> = {
  overview: "General",
  "task-1": "Task 1 — Project plan",
  "task-2": "Task 2 — Defect fixing",
  "task-3": "Task 3 — Design",
  "task-4a": "Task 4a — Development",
  "task-4b": "Task 4b — Evaluation",
};

function assetHref(id: string) {
  return `/api/esp/source-asset?id=${encodeURIComponent(id)}`;
}

export function EspOfficialSources() {
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: ESP_OFFICIAL_SOURCE_ASSETS.filter((a) => a.group === g),
  })).filter((x) => x.items.length > 0);

  return (
    <section className="rounded-3xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-sm sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Board materials</p>
      <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">Official ESP papers (from your course pack)</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        These files live in the project under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">sources/myexperience/Task</code>.
        Use the buttons to download the same PDFs/ZIPs for the real task wording. If a download fails on a deployed site,
        the folder may not be on the server — open them from your local clone instead.
      </p>

      <div className="mt-5 space-y-6">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">{GROUP_TITLE[group]}</p>
            <ul className="mt-2 space-y-2">
              {items.map((a) => {
                const zip = a.relativePath.toLowerCase().endsWith(".zip");
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-background/70 px-3 py-2.5 transition-colors hover:border-accent/25 hover:bg-muted/25"
                  >
                    <div className="flex min-w-0 flex-1 gap-2">
                      {zip ? (
                        <FileArchive className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                      ) : (
                        <FileText className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{a.note}</p>
                      </div>
                    </div>
                    <a
                      href={assetHref(a.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors",
                        "hover:border-accent/40 hover:bg-accent/10"
                      )}
                    >
                      <Download className="size-3.5" />
                      Download
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
