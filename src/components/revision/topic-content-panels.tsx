"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { AlertCircle, FileQuestion } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge, Button, Card, ProgressBar, SearchComposer } from "@/components/ui";
import {
  getMarkSchemeConceptsForQuestion,
  getResourceHref,
  getTopicContentBundle,
  isResourceExternal,
} from "@/lib/content";
import { getPracticeSetId } from "@/lib/practice";
import { getPracticeSetProgress, getSubtopicProgressForTopic } from "@/lib/progress";
import type { GroundedResearchResponse } from "@/lib/research/types";
import { getTopicById, getTopicTree } from "@/lib/types";

function getScoreVariant(pct: number): "success" | "warning" | "danger" {
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}

function matchesQuestionQuery(
  question: ReturnType<typeof getTopicContentBundle>["questions"][number],
  query: string
) {
  if (!query) {
    return true;
  }

  const haystack = [
    question.title,
    question.sourceLabel,
    question.summary,
    question.expectation,
    question.practicePrompt,
    question.paper,
    question.questionType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

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

export function TopicOverviewPanel({ topicId }: { topicId: string }) {
  const { diagnostic, onboarding, revisionProgress } = useAppData();
  const topicInfo = getTopicById(topicId);
  const tree = getTopicTree(topicId);
  const topicContent = getTopicContentBundle(topicId);
  const topicScore = diagnostic?.topicScores.find((score) => score.category === topicId);
  const topicProgress = getSubtopicProgressForTopic(revisionProgress, topicId);
  const focusedSubtopics =
    onboarding?.focusBreakdown?.selectedSubtopics[topicId]?.length
      ? tree?.subtopics.filter((subtopic) =>
          onboarding.focusBreakdown?.selectedSubtopics[topicId]?.includes(subtopic.id)
        ) ?? []
      : [];
  const allKeywords = Array.from(
    new Set([
      ...(tree?.subtopics.flatMap((subtopic) => subtopic.keywords) ?? []),
      ...topicContent.terms.map((term) => term.term),
    ])
  );
  const mappedPapers = Array.from(
    new Set(
      topicContent.questions
        .map((question) => question.paper)
        .filter((paper): paper is "Paper 1" | "Paper 2" => Boolean(paper))
    )
  );
  const scorePercent = topicScore
    ? Math.round((topicScore.score / topicScore.maxScore) * 100)
    : null;

  if (!topicInfo || !tree) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card variant="task" className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{tree.description}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Link
            href={`/revision/${topicId}/practice`}
            className="rounded-xl border border-accent/20 bg-accent/10 p-4 text-left transition-colors hover:border-accent/35 hover:bg-accent/15"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Start here
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Open the topic practice hub
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Choose recall, guided exam practice, answer checking, quick quiz, or resources.
            </p>
          </Link>

          <Link
            href={`/revision/${topicId}/exam-questions`}
            className="rounded-xl border border-border bg-surface/30 p-4 text-left transition-colors hover:border-accent/20 hover:bg-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Exam-style practice
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Review mapped paper prompts
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Compare this topic against past-paper wording and answer focus.
            </p>
          </Link>

          <Link
            href={`/revision/${topicId}/resources`}
            className="rounded-xl border border-border bg-surface/30 p-4 text-left transition-colors hover:border-accent/20 hover:bg-card"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Support material
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Open topic resources
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Use topic-specific notes, papers, and mark schemes after you identify a gap.
            </p>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="support" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Diagnostic score
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-3xl font-bold text-foreground">
              {scorePercent ?? "-"}{scorePercent !== null ? "%" : ""}
            </p>
            {scorePercent !== null && <Badge variant={getScoreVariant(scorePercent)}>{scorePercent}%</Badge>}
          </div>
        </Card>

        <Card variant="support" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Reviewed subtopics
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {topicProgress.completed}/{topicProgress.totalSubtopics}
          </p>
          <ProgressBar value={topicProgress.progressPercent} className="mt-3" size="sm" />
        </Card>

        <Card variant="support" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Paper mapping
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mappedPapers.length > 0 ? (
              mappedPapers.map((paper) => (
                <Badge key={paper} variant="accent">
                  {paper}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Mixed topic coverage</span>
            )}
          </div>
        </Card>
      </div>

      {topicContent.mapping && (
        <Card variant="support" className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Official DSD 2025 Coverage
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {topicContent.mapping.note}
          </p>
          <div className="mt-4 space-y-3">
            {topicContent.officialPoints.map((point) => (
              <div
                key={point.id}
                className="rounded-xl border border-white/8 bg-black/20 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-accent">{point.code}</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{point.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {point.summary}
                    </p>
                  </div>
                  <Badge variant="accent">Official</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card variant="task" className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Topic structure
          </p>
          <div className="mt-4 space-y-3">
            {tree.subtopics.map((subtopic) => (
              <div
                key={subtopic.id}
                className="rounded-xl border border-white/8 bg-black/20 px-4 py-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-accent">{subtopic.id}</span>
                  <p className="text-sm font-medium text-foreground">{subtopic.label}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {subtopic.keywords.slice(0, 8).map((keyword) => (
                    <span
                      key={`${subtopic.id}-${keyword}`}
                      className="rounded-lg border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card variant="support" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Focused subtopics
            </p>
            <div className="mt-4 space-y-2">
              {focusedSubtopics.length > 0 ? (
                focusedSubtopics.map((subtopic) => (
                  <div
                    key={subtopic.id}
                    className="rounded-xl border border-border bg-surface/30 px-3 py-3 text-sm text-foreground"
                  >
                    <span className="font-mono text-xs text-accent">{subtopic.id}</span>{" "}
                    {subtopic.label}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No focused subtopics have been pinned for this topic yet.
                </p>
              )}
            </div>
          </Card>

          <Card variant="support" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Key terms and exam language
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {allKeywords.slice(0, 18).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-lg border border-border bg-surface/30 px-2.5 py-1.5 text-xs text-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TopicExamQuestionsPanel({ topicId }: { topicId: string }) {
  const topicContent = getTopicContentBundle(topicId);
  const topicInfo = getTopicById(topicId);
  const [query, setQuery] = useState("");
  const [researchQuery, setResearchQuery] = useState("");
  const [groundedResult, setGroundedResult] = useState<GroundedResearchResponse | null>(null);
  const [researchError, setResearchError] = useState("");
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const focusedGoogleQuery = buildFocusedGoogleQuery(
    topicInfo?.label ?? topicId,
    researchQuery
  );

  async function handleRunGroundedResearch() {
    const trimmedQuery = researchQuery.trim();
    if (trimmedQuery.length < 4) {
      setResearchError("Write a slightly more specific research query first.");
      return;
    }

    setIsResearchLoading(true);
    setResearchError("");

    try {
      const response = await fetch("/api/research/grounded-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId,
          query: trimmedQuery,
        }),
      });

      const payload = (await response.json()) as GroundedResearchResponse | { error?: string };
      if (!response.ok || ("error" in payload && payload.error)) {
        throw new Error(("error" in payload && payload.error) || "Unable to run grounded research.");
      }

      setGroundedResult(payload as GroundedResearchResponse);
    } catch (error) {
      setGroundedResult(null);
      setResearchError(
        error instanceof Error
          ? error.message
          : "Unable to run grounded research right now."
      );
    } finally {
      setIsResearchLoading(false);
    }
  }

  if (topicContent.questions.length === 0) {
    return (
      <Card variant="support" className="p-8 text-center">
        <FileQuestion size={40} className="mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground mb-2">Past exam-style questions</p>
        <p className="text-xs text-muted-foreground/70">
          No mapped question metadata for this topic yet.
        </p>
      </Card>
    );
  }

  const filteredQuestions = topicContent.questions.filter((question) =>
    matchesQuestionQuery(question, deferredQuery)
  );
  const groupedQuestions = filteredQuestions.reduce<
    Array<{
      sourceLabel: string;
      questions: typeof filteredQuestions;
    }>
  >((groups, question) => {
    const existingGroup = groups.find((group) => group.sourceLabel === question.sourceLabel);

    if (existingGroup) {
      existingGroup.questions.push(question);
      return groups;
    }

    groups.push({
      sourceLabel: question.sourceLabel,
      questions: [question],
    });

    return groups;
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card variant="support" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Ask official sources
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Run a controlled, AI Overview-like answer for this DSD topic. The site uses Gemini with Google Search grounding plus the local curriculum pack, then shows the answer with source trails.
          </p>
          <div className="mt-4 space-y-3">
            <SearchComposer
              value={researchQuery}
              onChange={setResearchQuery}
              placeholder={`Search ${topicInfo?.label ?? "this topic"} in official DSD sources...`}
            />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button
                type="button"
                className="w-full"
                onClick={() => void handleRunGroundedResearch()}
                isLoading={isResearchLoading}
              >
                Ask grounded AI
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => openFocusedGoogleSearch(focusedGoogleQuery)}
              >
                Open focused Google search
              </Button>
            </div>
            {researchError ? (
              <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-3 text-sm text-danger">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{researchError}</span>
              </div>
            ) : null}
            {groundedResult ? (
              <div className="space-y-3 rounded-3xl border border-accent/15 bg-surface/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                    Grounded answer
                  </p>
                  <Badge variant="accent">{groundedResult.model}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {groundedResult.answer}
                </p>

                {groundedResult.searchQueries.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Query trail
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {groundedResult.searchQueries.slice(0, 4).map((item) => (
                        <span
                          key={item}
                          className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {groundedResult.evidenceTrail.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Evidence trail
                    </p>
                    {groundedResult.evidenceTrail.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-border bg-card/40 px-3 py-3"
                      >
                        <p className="text-xs leading-relaxed text-foreground/90">
                          {item.snippet}
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Sources: {item.sourceIndices.map((index) => `[${index}]`).join(" ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {groundedResult.sources.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Sources
                    </p>
                    {groundedResult.sources.slice(0, 6).map((source) => (
                      <a
                        key={`${source.index}-${source.uri}`}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-border bg-card/40 px-3 py-3 transition-colors hover:border-accent/25 hover:bg-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              [{source.index}] {source.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {source.host}
                            </p>
                          </div>
                          <Badge variant="default">Open</Badge>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {groundedResult.sourceStrategy}
                </p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Use this for a tightly scoped explanation of a DSD idea. If `GEMINI_API_KEY` is not configured, the panel will tell you that instead of failing silently.
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <SearchComposer
            value={query}
            onChange={setQuery}
            placeholder="Filter by source, prompt, keyword, or paper..."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Card variant="support" className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Matched prompts
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {filteredQuestions.length}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {topicContent.questions.length}
                </span>
              </p>
            </Card>
            <Card variant="support" className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sources
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {groupedQuestions.length}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card variant="support" className="p-6">
          <p className="text-sm font-medium text-foreground">No prompts matched that filter.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a broader keyword such as `security`, `JSON`, `wrangling`, `access`, or `Paper 2`.
          </p>
        </Card>
      ) : (
        groupedQuestions.map((group) => (
          <section key={group.sourceLabel} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/20 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{group.sourceLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Question-bearing prompts mapped from this source.
                </p>
              </div>
              <Badge variant="accent">{group.questions.length} prompts</Badge>
            </div>

            {group.questions.map((question) => {
              const conceptTargets = getMarkSchemeConceptsForQuestion(question.id);

              return (
                <Card key={question.id} variant="warning" className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{question.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {question.sourceLabel}
                        {question.year ? ` - ${question.year}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {question.paper && <Badge variant="default">{question.paper}</Badge>}
                      {question.marks && <Badge variant="accent">{question.marks} marks</Badge>}
                      <Badge variant="default">{question.questionType.replace("-", " ")}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">{question.summary}</p>
                  <div className="mt-3 rounded-lg border border-white/8 bg-black/20 px-3 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Prompt
                    </p>
                    <p className="text-xs leading-relaxed text-foreground/90">
                      {question.practicePrompt}
                    </p>
                  </div>
                  <div className="mt-3 rounded-lg border border-white/8 bg-black/20 px-3 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Answer focus
                    </p>
                    <p className="text-xs leading-relaxed text-foreground/90">
                      {question.expectation}
                    </p>
                  </div>
                  {conceptTargets.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {conceptTargets[0].conceptTargets.slice(0, 4).map((target) => (
                        <span
                          key={`${question.id}-${target}`}
                          className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground"
                        >
                          {target}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}

export function TopicResourcesPanel({ topicId }: { topicId: string }) {
  const topicContent = getTopicContentBundle(topicId);

  if (topicContent.resources.length === 0) {
    return (
      <Card variant="support" className="p-5">
        <p className="text-sm text-muted-foreground">
          No structured resources are mapped to this topic yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {topicContent.resources.map((resource) => (
        <Card key={resource.id} variant="support" className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{resource.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {resource.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  resource.kind === "past-paper"
                    ? "accent"
                    : resource.kind === "mark-scheme"
                      ? "warning"
                      : "default"
                }
              >
                {resource.kind.replace("-", " ")}
              </Badge>
              {resource.estimatedMinutes && (
                <Badge variant="default">{resource.estimatedMinutes} min</Badge>
              )}
            </div>
          </div>
          {getResourceHref(resource) && (
            <div className="mt-4">
              <a
                href={getResourceHref(resource)}
                target={isResourceExternal(resource) ? "_blank" : undefined}
                rel={isResourceExternal(resource) ? "noreferrer" : undefined}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent"
              >
                {isResourceExternal(resource) ? "Open official source" : "Open resource"}
              </a>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function TopicProgressPanel({ topicId }: { topicId: string }) {
  const { revisionProgress, toggleSubtopicReview } = useAppData();
  const tree = getTopicTree(topicId);
  const topicInfo = getTopicById(topicId);
  const [pendingSubtopicId, setPendingSubtopicId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const reviewedIds = new Set(
    revisionProgress
      .filter(
        (entry) =>
          entry.topicId === topicId &&
          entry.entityType === "subtopic" &&
          entry.status === "completed"
      )
      .map((entry) => entry.entityId)
  );
  const topicProgress = getSubtopicProgressForTopic(revisionProgress, topicId);
  const practiceSetProgress = [
    {
      label: "Recall cycle",
      entry: getPracticeSetProgress(
        revisionProgress,
        topicId,
        getPracticeSetId(topicId, "recall")
      ),
    },
    {
      label: "Exam drill",
      entry: getPracticeSetProgress(
        revisionProgress,
        topicId,
        getPracticeSetId(topicId, "exam-drill")
      ),
    },
    {
      label: "Quick quiz",
      entry: getPracticeSetProgress(
        revisionProgress,
        topicId,
        getPracticeSetId(topicId, "quiz")
      ),
    },
  ];

  if (!tree || !topicInfo) {
    return null;
  }

  async function handleToggleReview(subtopicId: string, subtopicLabel: string) {
    const completed = !reviewedIds.has(subtopicId);
    setPendingSubtopicId(subtopicId);

    try {
      setError("");
      await toggleSubtopicReview({
        topicId,
        subtopicId,
        subtopicLabel,
        completed,
      });
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update revision progress."
      );
    } finally {
      setPendingSubtopicId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <Card variant="support" className="p-5">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-foreground">
            {topicProgress.progressPercent}%
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">
              Reviewed subtopics for {topicInfo.label}
            </p>
            <ProgressBar value={topicProgress.progressPercent} className="w-full" />
          </div>
        </div>
      </Card>

      <Card variant="support" className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Subtopic review state
        </p>
        <div className="mt-4 space-y-2">
          {tree.subtopics.map((subtopic) => (
            <div
              key={subtopic.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface/30 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-accent">{subtopic.id}</span>
                <span className="text-sm text-foreground">{subtopic.label}</span>
              </div>
              <Button
                size="sm"
                variant={reviewedIds.has(subtopic.id) ? "secondary" : "outline"}
                isLoading={pendingSubtopicId === subtopic.id}
                onClick={() => void handleToggleReview(subtopic.id, subtopic.label)}
              >
                {reviewedIds.has(subtopic.id) ? "Reviewed" : "Mark reviewed"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="support" className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Practice sets
        </p>
        <div className="mt-4 space-y-2">
          {practiceSetProgress.map((set) => (
            <div
              key={set.label}
              className="flex items-center justify-between rounded-xl border border-border bg-surface/30 p-3"
            >
              <div>
                <p className="text-sm text-foreground">{set.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {set.entry ? `Saved progress ${set.entry.progressPercent}%` : "Not started yet"}
                </p>
              </div>
              <Badge
                variant={
                  (set.entry?.progressPercent ?? 0) >= 70
                    ? "success"
                    : (set.entry?.progressPercent ?? 0) >= 40
                      ? "warning"
                      : "default"
                }
              >
                {set.entry?.progressPercent ?? 0}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
