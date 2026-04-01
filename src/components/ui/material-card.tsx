"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight, BookOpen, FileText, PenLine, Zap, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { ProgressBar } from "./progress-bar";

export interface MaterialCardData {
  id: string;
  title: string;
  description?: string;
  topic: string;
  topicId?: string;
  topicIcon?: string;
  type: "notes" | "practice" | "review" | "guide" | "video" | "flashcards";
  difficulty?: "easy" | "medium" | "hard";
  estimatedMinutes?: number;
  progress?: number; // 0-100
  thumbnail?: string;
  cta?: string;
}

const typeConfig = {
  notes: { icon: BookOpen, label: "Notes", color: "text-success" },
  practice: { icon: PenLine, label: "Practice", color: "text-accent" },
  review: { icon: FileText, label: "Review", color: "text-warning" },
  guide: { icon: Zap, label: "Guide", color: "text-accent" },
  video: { icon: Play, label: "Video", color: "text-danger" },
  flashcards: { icon: Zap, label: "Flashcards", color: "text-accent" },
};

const difficultyConfig = {
  easy: { label: "Easy", variant: "success" as const },
  medium: { label: "Medium", variant: "warning" as const },
  hard: { label: "Hard", variant: "danger" as const },
};

interface MaterialCardProps {
  data: MaterialCardData;
  index?: number;
  className?: string;
  onClick?: () => void;
}

export function MaterialCard({
  data,
  index = 0,
  className,
  onClick,
}: MaterialCardProps) {
  const typeInfo = typeConfig[data.type];
  const TypeIcon = typeInfo.icon;
  const ctaLabel =
    data.cta ??
    (typeof data.progress === "number" && data.progress >= 100
      ? "Review again"
      : data.progress
        ? "Continue"
        : "Start");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -2,
        boxShadow: "0 0 0 1px rgba(139, 92, 246, 0.05), 0 2px 10px -3px rgba(139, 92, 246, 0.08), 0 0 16px -6px rgba(139, 92, 246, 0.05)",
      }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "group bg-card border border-border rounded-2xl overflow-hidden",
        "hover:border-border-light hover:bg-card-hover transition-colors duration-300",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      {/* Thumbnail area */}
      {data.thumbnail ? (
        <div className="h-32 bg-surface relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.thumbnail})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      ) : (
        <div className="h-16 bg-gradient-to-br from-surface to-card relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
            <TypeIcon size={40} />
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant={typeInfo.color === "text-success" ? "success" : typeInfo.color === "text-warning" ? "warning" : "accent"}>
              {typeInfo.label}
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        <div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {data.title}
          </h3>
          {data.description && (
            <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">{data.description}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {data.topicIcon && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{data.topicIcon}</span>
              {data.topic}
            </span>
          )}
          {data.difficulty && (
            <Badge variant={difficultyConfig[data.difficulty].variant}>
              {difficultyConfig[data.difficulty].label}
            </Badge>
          )}
          {data.estimatedMinutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={10} />
              {data.estimatedMinutes}m
            </span>
          )}
        </div>

        {/* Progress */}
        {typeof data.progress === "number" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted font-medium">{data.progress}%</span>
            </div>
            <ProgressBar value={data.progress} size="sm" />
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-1 text-xs text-accent font-medium pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {ctaLabel}
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.div>
  );
}
