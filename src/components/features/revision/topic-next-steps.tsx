"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { TopicNextStepRecommendation } from "@/lib/topic-progression";

interface TopicNextStepsProps {
  primary: TopicNextStepRecommendation | null;
  secondary: TopicNextStepRecommendation | null;
  title?: string;
}

function RecommendationLink({
  recommendation,
  primary = false,
}: {
  recommendation: TopicNextStepRecommendation;
  primary?: boolean;
}) {
  const className = primary
    ? "inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
    : "inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/20 hover:bg-card";

  if (recommendation.actionKind === "external") {
    return (
      <a
        href={recommendation.href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {recommendation.label}
        <ExternalLink size={14} />
      </a>
    );
  }

  return (
    <Link href={recommendation.href} className={className}>
      {recommendation.label}
      <ArrowRight size={14} />
    </Link>
  );
}

export function TopicNextSteps({
  primary,
  secondary,
  title = "Recommended next step",
}: TopicNextStepsProps) {
  if (!primary && !secondary) {
    return null;
  }

  return (
    <Card variant="support" className="p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Sparkles size={12} className="text-accent" />
        {title}
      </div>

      <div className="mt-3 space-y-3">
        {primary ? (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Primary</Badge>
              <Badge variant="default">{primary.difficulty}</Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{primary.why}</p>
            <div className="mt-3">
              <RecommendationLink recommendation={primary} primary />
            </div>
          </div>
        ) : null}

        {secondary ? (
          <div className="rounded-2xl border border-border bg-card/30 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Secondary</Badge>
              <Badge variant="default">{secondary.difficulty}</Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {secondary.why}
            </p>
            <div className="mt-3">
              <RecommendationLink recommendation={secondary} />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
