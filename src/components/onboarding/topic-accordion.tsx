"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FocusTopicOrigin } from "@/lib/focus-draft";
import type { TopicTree } from "@/lib/types";

interface TopicAccordionProps {
  tree: TopicTree;
  topicIcon: string;
  topicLabel: string;
  topicOrigin?: FocusTopicOrigin;
  isOpen: boolean;
  onToggle: () => void;
  selectedSubtopics: string[];
  onSubtopicToggle: (subtopicId: string) => void;
}

const TOPIC_ORIGIN_META: Record<
  FocusTopicOrigin,
  { label: string; className: string }
> = {
  "weak-area": {
    label: "Weak topic",
    className: "bg-warning/10 text-warning border border-warning/20",
  },
  "auto-added": {
    label: "Auto-added",
    className: "bg-accent/10 text-accent border border-accent/20",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-success/10 text-success border border-success/20",
  },
};

export function TopicAccordion({
  tree,
  topicIcon,
  topicLabel,
  topicOrigin = "weak-area",
  isOpen,
  onToggle,
  selectedSubtopics,
  onSubtopicToggle,
}: TopicAccordionProps) {
  const selectedCount = selectedSubtopics.length;
  const totalCount = tree.subtopics.length;
  const progress = totalCount > 0 ? selectedCount / totalCount : 0;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className={cn(
        "rounded-2xl border transition-colors duration-300 overflow-hidden",
        isOpen
          ? "bg-card border-accent/25 shadow-[0_0_32px_-12px_rgba(139,92,246,0.12)]"
          : "bg-card/50 border-border hover:border-border-light"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 p-4 cursor-pointer group relative"
      >
        {/* Topic icon with glow when open */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg transition-all duration-300",
            isOpen
              ? "bg-accent/10 shadow-[0_0_20px_-6px_rgba(139,92,246,0.2)]"
              : "bg-surface group-hover:bg-surface/80"
          )}
        >
          {topicIcon}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{topicLabel}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} of ${totalCount} selected`
                : `${totalCount} subtopics`}
            </p>
            <span
              className={cn(
                "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium",
                TOPIC_ORIGIN_META[topicOrigin].className
              )}
            >
              {TOPIC_ORIGIN_META[topicOrigin].label}
            </span>
            {/* Mini progress indicator */}
            {selectedCount > 0 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 40, opacity: 1 }}
                className="h-1 rounded-full bg-surface overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
                  className="h-full rounded-full bg-accent"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Selected count badge */}
        <AnimatePresence>
          {selectedCount > 0 && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-6 h-6 rounded-full bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center shrink-0"
            >
              {selectedCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={cn(
            "shrink-0 transition-colors",
            isOpen ? "text-accent" : "text-muted-foreground group-hover:text-muted"
          )}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3 mx-1" />
              <div className="space-y-1">
                {tree.subtopics.map((sub, i) => {
                  const isSelected = selectedSubtopics.includes(sub.id);
                  return (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        delay: i * 0.03,
                      }}
                      onClick={() => onSubtopicToggle(sub.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group/sub",
                        isSelected
                          ? "bg-accent/8 border border-accent/20"
                          : "hover:bg-surface/80 border border-transparent"
                      )}
                    >
                      {/* Checkbox */}
                      <motion.div
                        animate={{
                          scale: isSelected ? 1 : 0.9,
                          backgroundColor: isSelected ? "rgb(139, 92, 246)" : "transparent",
                          borderColor: isSelected ? "rgb(139, 92, 246)" : "var(--color-border)",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            >
                              <Check size={12} strokeWidth={3} className="text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-[13px] transition-colors truncate",
                            isSelected
                              ? "text-foreground font-medium"
                              : "text-muted group-hover/sub:text-foreground"
                          )}
                        >
                          <span className="text-muted-foreground/60 font-mono text-[10px] mr-1.5">
                            {sub.id}
                          </span>
                          {sub.label}
                        </p>
                      </div>

                      {/* Keyword count hint */}
                      {!isSelected && (
                        <span className="text-[9px] text-muted-foreground/40 shrink-0 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                          {sub.keywords.length} keywords
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
