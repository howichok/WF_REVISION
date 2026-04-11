"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  FileQuestion,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { TopicNextSteps } from "@/components/revision/topic-next-steps";
import { Badge, Button, Card, SearchComposer } from "@/components/ui";
import { consumeSseStream } from "@/lib/intelligence/client-sse";
import { getAskNextStepRecommendations } from "@/lib/topic-progression";
import type {
  TopicIntelligenceIntent,
  TopicIntelligenceResponse,
} from "@/lib/intelligence/types";

interface TopicIntelligenceAssistantProps {
  topicId: string;
  topicLabel: string;
  surface?: "page" | "panel";
  showGoogleFallback?: boolean;
  initialQuery?: string;
  initialIntent?: string;
  autoRun?: boolean;
}

const QUICK_ACTIONS: Array<{
  intent: TopicIntelligenceIntent;
  label: string;
  description: string;
}> = [
  {
    intent: "local-answer",
    label: "Ask",
    description: "Get a direct exam-safe explanation first.",
  },
  {
    intent: "hint",
    label: "Need a hint",
    description: "Get a scaffold without a full answer.",
  },
  {
    intent: "answer-check",
    label: "Check my answer",
    description: "Route into timed exam-question style help.",
  },
  {
    intent: "resource-pick",
    label: "Find official source",
    description: "Open the best official DSD source first.",
  },
  {
    intent: "practice-question",
    label: "Give me a question",
    description: "Pick the best next prompt for this topic.",
  },
];

function buildFocusedGoogleQuery(topicLabel: string, rawQuery: string) {
  const focus = rawQuery.trim() || `${topicLabel} explanation`;

  return [
    `"T Level"`,
    `"Digital Software Development"`,
    `"${topicLabel}"`,
    focus,
    `(site:qualifications.pearson.com OR site:tlevels.gov.uk OR site:support.tlevels.gov.uk)`,
    `-site:studocu.com -site:coursehero.com -site:brainly.com -site:quora.com -site:reddit.com`,
  ].join(" ");
}

function openFocusedGoogleSearch(query: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.open(
    `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function getFallbackPrompt(intent: TopicIntelligenceIntent, topicLabel: string) {
  switch (intent) {
    case "hint":
      return `How do I answer a ${topicLabel} question?`;
    case "answer-check":
      return `Check my ${topicLabel} answer`;
    case "practice-question":
      return `Give me a practice question for ${topicLabel}`;
    case "resource-pick":
      return `Official source for ${topicLabel}`;
    case "grounded-answer":
      return `Official explanation for ${topicLabel}`;
    case "misconception-fix":
      return `Difference between key ideas in ${topicLabel}`;
    case "local-answer":
    default:
      return topicLabel;
  }
}

function getIntentLabel(intent: TopicIntelligenceIntent) {
  switch (intent) {
    case "hint":
      return "Hint ladder";
    case "local-answer":
      return "Local answer";
    case "grounded-answer":
      return "Grounded answer";
    case "answer-check":
      return "Exam questions route";
    case "practice-question":
      return "Practice question";
    case "resource-pick":
      return "Official source";
    case "misconception-fix":
      return "Misconception fix";
    default:
      return "Assistant";
  }
}

function isTopicIntent(value: string | undefined): value is TopicIntelligenceIntent {
  return QUICK_ACTIONS.some((action) => action.intent === value);
}

function getStatusTone(
  value: TopicIntelligenceResponse["officialConfirmationStatus"]
): "accent" | "success" | "warning" | "default" {
  switch (value) {
    case "confirmed":
      return "success";
    case "not-found":
    case "unavailable":
      return "warning";
    case "not-needed":
    default:
      return "default";
  }
}

function uniqueCueItems(items: Array<string | null | undefined>, limit = 3) {
  return Array.from(
    new Set(
      items
        .map((item) => item?.replace(/\s+/g, " ").trim())
        .filter((item): item is string => Boolean(item))
    )
  ).slice(0, limit);
}

function buildTopicPrecisionCueItems(result: TopicIntelligenceResponse) {
  const keywordMatches = result.examSafeFocus.filter((item) =>
    /(replace|precision|precise|vague|use |name |state |clarify|distinguish|define|specific|trade-off|instead)/i.test(
      item
    )
  );

  return uniqueCueItems(
    keywordMatches.length > 0 ? keywordMatches : result.examSafeFocus.slice(0, 2),
    2
  );
}

export function TopicIntelligenceAssistant({
  topicId,
  topicLabel,
  surface = "page",
  showGoogleFallback = true,
  initialQuery,
  initialIntent,
  autoRun = false,
}: TopicIntelligenceAssistantProps) {
  const { recordAskCoaching, revisionProgress, topicCoachingMemory } = useAppData();
  const autoRunRef = useRef(false);
  const [query, setQuery] = useState(initialQuery?.trim() ?? "");
  const [overrideIntent, setOverrideIntent] = useState<TopicIntelligenceIntent>(
    isTopicIntent(initialIntent) ? initialIntent : "local-answer"
  );
  const [draftAnswer, setDraftAnswer] = useState("");
  const [result, setResult] = useState<TopicIntelligenceResponse | null>(null);
  const [precisionCues, setPrecisionCues] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");

  const selectedAction = useMemo(
    () => QUICK_ACTIONS.find((action) => action.intent === overrideIntent) ?? QUICK_ACTIONS[0],
    [overrideIntent]
  );
  const nextSteps = useMemo(
    () =>
      result
          ? getAskNextStepRecommendations({
            topicId,
            result,
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          })
        : { primary: null, secondary: null },
    [result, revisionProgress, topicCoachingMemory, topicId]
  );
  const focusedGoogleQuery = useMemo(
    () => buildFocusedGoogleQuery(topicLabel, query || selectedAction.label),
    [query, selectedAction.label, topicLabel]
  );
  const visiblePrecisionCues = useMemo(
    () => (
      precisionCues.length > 0
        ? precisionCues
        : result
          ? buildTopicPrecisionCueItems(result)
          : []
    ),
    [precisionCues, result]
  );
  const autoRunPrompt = useMemo(
    () => query.trim() || getFallbackPrompt(overrideIntent, topicLabel),
    [overrideIntent, query, topicLabel]
  );

  useEffect(() => {
    if (!autoRun || autoRunRef.current || !autoRunPrompt.trim()) {
      return;
    }

    autoRunRef.current = true;
    void handleSubmit();
  }, [autoRun, autoRunPrompt]);

  async function handleSubmit() {
    const resolvedQuery = query.trim() || getFallbackPrompt(overrideIntent, topicLabel);

    setIsLoading(true);
    setError("");
    setStreamStatus("Opening live response...");
    setResult(null);
    setPrecisionCues([]);

    try {
      const response = await fetch("/api/intelligence/topic-assistant/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId,
          query: resolvedQuery,
          overrideIntent,
          draftAnswer: overrideIntent === "answer-check" ? draftAnswer : undefined,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Unable to run the topic assistant right now.");
        }

        throw new Error("Unable to open the live assistant stream.");
      }

      if (!response.body) {
        throw new Error("Live response stream is not available in this browser.");
      }

      let streamedAnswer = "";

      function handleSseEvent(eventName: string, payloadText: string) {
        const payload = JSON.parse(payloadText) as
          | TopicIntelligenceResponse
          | { stage?: string; message?: string; text?: string }
          | {
              section?: "examSafeFocus" | "precisionCues" | "misconceptions" | "next-step";
              items?: string[];
              action?: TopicIntelligenceResponse["suggestedNextAction"];
            };

        if (eventName === "status") {
          setStreamStatus((payload as { message?: string }).message ?? "Thinking...");
          return;
        }

        if (eventName === "meta") {
          setResult(payload as TopicIntelligenceResponse);
          return;
        }

        if (eventName === "section") {
          const sectionPayload = payload as {
            section?: "examSafeFocus" | "precisionCues" | "misconceptions" | "next-step";
            items?: string[];
            action?: TopicIntelligenceResponse["suggestedNextAction"];
          };

          if (sectionPayload.section === "precisionCues") {
            const nextItems = uniqueCueItems(sectionPayload.items ?? [], 3);
            setPrecisionCues(nextItems);
            return;
          }

          setResult((current) => {
            if (!current || !sectionPayload.section) {
              return current;
            }

            if (sectionPayload.section === "examSafeFocus") {
              return {
                ...current,
                examSafeFocus: sectionPayload.items ?? current.examSafeFocus,
              };
            }

            if (sectionPayload.section === "misconceptions") {
              return {
                ...current,
                misconceptions: sectionPayload.items ?? current.misconceptions,
              };
            }

            return {
              ...current,
              suggestedNextAction: sectionPayload.action ?? current.suggestedNextAction,
            };
          });
          return;
        }

        if (eventName === "chunk") {
          const text = (payload as { text?: string }).text ?? "";
          streamedAnswer = `${streamedAnswer}${text}`;
          setResult((current) =>
            current
              ? {
                  ...current,
                  answer: `${current.answer}${text}`,
                }
              : current
          );
          return;
        }

        if (eventName === "final") {
          const finalResult = payload as TopicIntelligenceResponse;
          const recommendations = getAskNextStepRecommendations({
            topicId,
            result: finalResult,
            revisionProgress,
            coachingMemory: topicCoachingMemory,
          });

          setResult(finalResult);
          setPrecisionCues((current) =>
            current.length > 0 ? current : buildTopicPrecisionCueItems(finalResult)
          );
          setStreamStatus("");
          recordAskCoaching({
            topicId,
            intent: finalResult.intent,
            recommendedAction: recommendations.primary?.reasonCode ?? finalResult.suggestedNextAction?.label,
            recommendedHref: recommendations.primary?.href ?? finalResult.suggestedNextAction?.href,
          });
          return;
        }

        if (eventName === "error") {
          throw new Error((payload as { message?: string }).message ?? "Streaming failed.");
        }
      }

      await consumeSseStream(response, handleSseEvent);
    } catch (submitError) {
      setResult(null);
      setStreamStatus("");
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to run the topic assistant right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const compact = surface === "panel";

  return (
    <div className="space-y-4">
      <Card variant={compact ? "support" : "accent"} className={compact ? "p-4" : "p-5 sm:p-6"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Simple revision coach
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use this when you need a fast hint, short explanation, official source, or the next best question before you switch into Exam questions.
            </p>
          </div>
          <Badge variant="accent">Official-first</Badge>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.intent}
              type="button"
              onClick={() => setOverrideIntent(action.intent)}
              className={
                action.intent === overrideIntent
                  ? "rounded-2xl border border-accent/35 bg-accent/10 px-3 py-3 text-left"
                  : "rounded-2xl border border-border bg-card/30 px-3 py-3 text-left transition-colors hover:border-accent/20 hover:bg-card/50"
              }
            >
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {action.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <SearchComposer
            value={query}
            onChange={setQuery}
            placeholder={`Ask about ${topicLabel}, or leave it blank and use the selected mode...`}
          />

          {overrideIntent === "answer-check" ? (
            <textarea
              value={draftAnswer}
              onChange={(event) => setDraftAnswer(event.target.value)}
              rows={compact ? 5 : 7}
              placeholder="Paste a short draft answer here if you want the assistant to detect gaps or misconceptions before opening the full checker."
              className="min-h-[140px] w-full rounded-3xl border border-border bg-surface/40 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSubmit()} isLoading={isLoading}>
              <Sparkles size={14} />
              {selectedAction.label}
            </Button>
            {showGoogleFallback ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => openFocusedGoogleSearch(focusedGoogleQuery)}
              >
                <Search size={14} />
                Open focused Google search
              </Button>
            ) : null}
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-danger/20 bg-danger/10 px-3 py-3 text-sm text-danger">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              This mode stays local-first and exam-safe. It only treats web grounding as authoritative when the answer is backed by Pearson or T Levels allowlisted sources.
            </p>
          )}
        </div>
      </Card>

      {isLoading && !result ? (
        <Card variant="task" className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Live response
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {streamStatus || "Composing your answer..."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
                Live
              </div>
              <div className="hidden h-7 w-px bg-border sm:block" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent" />
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent/80"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent/60"
                style={{ animationDelay: "240ms" }}
              />
            </div>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-full border border-white/8 bg-black/15">
            <div className="h-1 w-2/5 animate-pulse rounded-full bg-gradient-to-r from-accent/35 via-accent to-accent/25" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-accent/15" />
            <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/8" />
          </div>
        </Card>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className={compact ? "grid gap-3" : "grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]"}>
            <Card variant="task" className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{getIntentLabel(result.intent)}</Badge>
                <Badge variant={result.confidence === "high" ? "success" : result.confidence === "medium" ? "warning" : "default"}>
                  {result.confidence} confidence
                </Badge>
                {isLoading ? (
                  <Badge variant="accent">Live</Badge>
                ) : null}
                {result.provider ? (
                  <Badge variant="default">{result.provider.replace(/-/g, " ")}</Badge>
                ) : null}
                {result.model ? <Badge variant="default">{result.model}</Badge> : null}
                <Badge variant={getStatusTone(result.officialConfirmationStatus)}>
                  {result.officialConfirmationStatus.replace("-", " ")}
                </Badge>
                {result.localOnly ? <Badge variant="default">Local-first</Badge> : null}
              </div>

              <div className="mt-4 space-y-4">
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Direct response
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {result.answer}
                    {isLoading ? (
                      <span className="ml-1 inline-flex items-center gap-1 align-middle">
                        <span className="inline-block h-4 w-1.5 animate-pulse rounded-full bg-accent" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent/70" />
                      </span>
                    ) : null}
                  </p>
                  {streamStatus ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-xs text-muted-foreground">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                      </span>
                      {streamStatus}
                    </div>
                  ) : null}
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Exam-safe focus
                  </p>
                  <div className="mt-3 space-y-2">
                    {result.examSafeFocus.map((item) => (
                      <div
                        key={`${result.intent}-${item}`}
                        className="rounded-2xl border border-border bg-card/40 px-3 py-3 text-sm text-foreground/90"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </section>

                {visiblePrecisionCues.length > 0 ? (
                  <section>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                      <Lightbulb size={12} />
                      Precision cues
                    </div>
                    <div className="mt-3 grid gap-2">
                      {visiblePrecisionCues.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-accent/20 bg-accent/8 px-3 py-3 text-sm text-foreground/90"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {result.misconceptions.length > 0 ? (
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Common confusion
                    </p>
                    <div className="mt-3 space-y-2">
                      {result.misconceptions.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-warning/20 bg-warning/5 px-3 py-3 text-sm text-foreground/90"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {result.suggestedNextAction ? (
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Router next step
                    </p>
                    <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-4">
                      {result.suggestedNextAction.kind === "external" ? (
                        <a
                          href={result.suggestedNextAction.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-foreground hover:text-accent"
                        >
                          {result.suggestedNextAction.label}
                        </a>
                      ) : (
                        <Link
                          href={result.suggestedNextAction.href}
                          className="text-sm font-medium text-foreground hover:text-accent"
                        >
                          {result.suggestedNextAction.label}
                        </Link>
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            </Card>

            <div className="space-y-3">
              <TopicNextSteps
                primary={nextSteps.primary}
                secondary={nextSteps.secondary}
                title="Same-topic next step"
              />

              <Card variant="support" className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Router notes
                </p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Confidence score: {result.confidenceScore}</p>
                  <p>Topic: {topicLabel}</p>
                  <p>Mode: Exam-safe coach</p>
                </div>
              </Card>
            </div>
          </div>

          <div className={compact ? "grid gap-3" : "grid gap-3 lg:grid-cols-3"}>
            <Card variant="support" className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <ShieldCheck size={12} className="text-accent" />
                Sources
              </div>
              <div className="mt-3 space-y-2">
                {result.sources.length > 0 ? (
                  result.sources.map((source) =>
                    source.href ? (
                      <a
                        key={source.id}
                        href={source.href}
                        target={source.href.startsWith("http") ? "_blank" : undefined}
                        rel={source.href.startsWith("http") ? "noreferrer" : undefined}
                        className="block rounded-2xl border border-border bg-card/40 px-3 py-3 transition-colors hover:border-accent/20 hover:bg-card"
                      >
                        <p className="text-sm font-medium text-foreground">{source.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {source.host ?? source.type}
                        </p>
                        {source.note ? (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {source.note}
                          </p>
                        ) : null}
                      </a>
                    ) : (
                      <div
                        key={source.id}
                        className="rounded-2xl border border-border bg-card/40 px-3 py-3"
                      >
                        <p className="text-sm font-medium text-foreground">{source.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{source.type}</p>
                        {source.note ? (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {source.note}
                          </p>
                        ) : null}
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">No mapped evidence yet.</p>
                )}
              </div>
            </Card>

            <Card variant="support" className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <FileQuestion size={12} className="text-accent" />
                Related questions
              </div>
              <div className="mt-3 space-y-2">
                {result.relatedQuestions.length > 0 ? (
                  result.relatedQuestions.map((question) => (
                    <Link
                      key={question.id}
                      href={question.href}
                      className="block rounded-2xl border border-border bg-card/40 px-3 py-3 transition-colors hover:border-accent/20 hover:bg-card"
                    >
                      <p className="text-sm font-medium text-foreground">{question.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{question.sourceLabel}</p>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/90">
                        {question.prompt}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No linked questions yet.</p>
                )}
              </div>
            </Card>

            <Card variant="support" className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Lightbulb size={12} className="text-accent" />
                Related resources
              </div>
              <div className="mt-3 space-y-2">
                {result.relatedResources.length > 0 ? (
                  result.relatedResources.map((resource) =>
                    resource.href ? (
                      <a
                        key={resource.id}
                        href={resource.href}
                        target={resource.isExternal ? "_blank" : undefined}
                        rel={resource.isExternal ? "noreferrer" : undefined}
                        className="block rounded-2xl border border-border bg-card/40 px-3 py-3 transition-colors hover:border-accent/20 hover:bg-card"
                      >
                        <p className="text-sm font-medium text-foreground">{resource.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {resource.summary}
                        </p>
                      </a>
                    ) : (
                      <div
                        key={resource.id}
                        className="rounded-2xl border border-border bg-card/40 px-3 py-3"
                      >
                        <p className="text-sm font-medium text-foreground">{resource.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {resource.summary}
                        </p>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">No linked resources yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
