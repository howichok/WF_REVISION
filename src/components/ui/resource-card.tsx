"use client";

import { FileText, BookOpen, Video, PenLine, Presentation, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface ResourceCardProps {
  title: string;
  description?: string;
  type: "past-paper" | "notes" | "video" | "worksheet" | "slides";
  topic?: string;
  topicIcon?: string;
  year?: number;
  thumbnail?: string;
  index?: number;
  className?: string;
  href?: string;
  external?: boolean;
  actionLabel?: string;
}

const typeIcons = {
  "past-paper": FileText,
  notes: BookOpen,
  video: Video,
  worksheet: PenLine,
  slides: Presentation,
};

const typeLabels = {
  "past-paper": "Past Paper",
  notes: "Notes",
  video: "Video",
  worksheet: "Worksheet",
  slides: "Slides",
};

const typeBadge: Record<string, "accent" | "success" | "warning" | "default"> = {
  "past-paper": "accent",
  notes: "success",
  video: "warning",
  worksheet: "default",
  slides: "default",
};

export function ResourceCard({
  title,
  description,
  type,
  topic,
  topicIcon,
  year,
  thumbnail,
  index = 0,
  className,
  href,
  external = false,
  actionLabel,
}: ResourceCardProps) {
  const Icon = typeIcons[type];

  const content = (
    <>
      {thumbnail ? (
        <div className="h-36 bg-surface relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${thumbnail})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <Badge variant={typeBadge[type]}>{typeLabels[type]}</Badge>
            {year && <Badge>{year}</Badge>}
          </div>
        </div>
      ) : (
        <div className="h-14 bg-gradient-to-br from-surface to-card/50 relative overflow-hidden flex items-center px-4 gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-accent group-hover:border-accent/20 transition-all">
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Badge variant={typeBadge[type]}>{typeLabels[type]}</Badge>
            {year && <Badge>{year}</Badge>}
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-4">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted line-clamp-2 mt-1.5 leading-relaxed">{description}</p>
        )}

        {(topic || href) && (
          <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {topicIcon && <span>{topicIcon}</span>}
              {topic ?? (external ? "Official web source" : "Resource")}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {href ? (
                <>
                  <span>{actionLabel ?? (external ? "Open source" : "Open resource")}</span>
                  {external ? <ExternalLink size={12} /> : <Download size={12} />}
                </>
              ) : (
                <>
                  <Download size={12} />
                  <ExternalLink size={12} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className={cn(
        "resource-card-enter group bg-card border border-border rounded-2xl overflow-hidden",
        "hover:border-border-light hover:bg-card-hover hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.05),0_2px_10px_-3px_rgba(139,92,246,0.08)] transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="block"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
