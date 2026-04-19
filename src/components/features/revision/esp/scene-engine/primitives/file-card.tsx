"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, FileCode2, FileImage, FileArchive, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FileKind = "xlsx" | "docx" | "py" | "png" | "zip" | "txt" | "csv";

const ICONS = {
  xlsx: FileSpreadsheet,
  docx: FileText,
  py: FileCode2,
  png: FileImage,
  zip: FileArchive,
  csv: FileSpreadsheet,
  txt: FileText,
} as const;

const ACCENT: Record<FileKind, string> = {
  xlsx: "#16a34a",
  docx: "#2563eb",
  py: "#9333ea",
  png: "#f59e0b",
  zip: "#64748b",
  csv: "#10b981",
  txt: "#475569",
};

interface FileCardProps {
  name: string;
  kind: FileKind;
  layoutId?: string;
  state?: "idle" | "lifted" | "placed" | "rejected";
  small?: boolean;
  className?: string;
}

export const FileCard = forwardRef<HTMLDivElement, FileCardProps>(function FileCard(
  { name, kind, layoutId, state = "idle", small, className },
  ref
) {
  const Icon = ICONS[kind] ?? FileIcon;
  const color = ACCENT[kind];

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      initial={false}
      animate={{
        y: state === "lifted" ? -4 : 0,
        scale: state === "lifted" ? 1.04 : state === "rejected" ? 0.96 : 1,
        rotate: state === "rejected" ? [-2, 2, -2, 0] : 0,
        borderColor:
          state === "placed"
            ? "var(--color-success)"
            : state === "rejected"
              ? "var(--color-danger)"
              : "rgba(127,127,127,0.35)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border bg-card shadow-sm",
        small ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]",
        className
      )}
    >
      <span
        className={cn("inline-flex items-center justify-center rounded", small ? "size-5" : "size-6")}
        style={{ backgroundColor: `${color}1e`, color }}
      >
        <Icon className={small ? "size-3" : "size-3.5"} />
      </span>
      <span className="font-mono text-foreground">{name}</span>
    </motion.div>
  );
});
