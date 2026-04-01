"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Check,
  Plus,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { FocusTopicOrigin } from "@/lib/focus-draft";
import {
  getSuggestedSearchTerms,
  searchTopicMetadata,
  type TopicSearchResult,
  type TopicSearchSuggestion,
} from "@/lib/topic-search";
import type { TopicTree } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SmartInputPanelProps {
  activeTree: TopicTree | null;
  topicLabel: string;
  topicIcon: string;
  selectedSubtopics: string[];
  onSubtopicToggle: (subtopicId: string) => void;
  noteText: string;
  onNoteChange: (text: string) => void;
  weakAreas?: string[];
  topicOrigins?: Record<string, FocusTopicOrigin>;
  onAutoTopicAdd?: (topicId: string) => void;
  onGlobalMatchSelect?: (topicId: string, subtopicId: string) => void;
}

const MATCH_BADGE_VARIANTS = {
  "Strong match": "success",
  "Partial match": "accent",
  Related: "default",
} as const;

const TOPIC_ORIGIN_BADGES: Record<FocusTopicOrigin, { label: string; className: string }> = {
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

function MatchCard({
  result,
  isActive,
  topicOrigin,
  onSelect,
}: {
  result: TopicSearchResult;
  isActive: boolean;
  topicOrigin?: FocusTopicOrigin;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border text-left transition-all duration-200 p-4",
        isActive
          ? "border-accent/35 bg-accent/6 shadow-[0_0_24px_-12px_rgba(139,92,246,0.28)]"
          : "border-border/60 bg-surface/35 hover:border-border-light hover:bg-surface/55"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base shrink-0">{result.topicIcon}</span>
            <p className="text-sm font-semibold text-foreground truncate">
              {result.subtopicTitle}
            </p>
            <Badge
              variant={MATCH_BADGE_VARIANTS[result.matchLabel]}
              className="text-[10px]"
            >
              {result.matchLabel}
            </Badge>
            {topicOrigin && (
              <span
                className={cn(
                  "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium",
                  TOPIC_ORIGIN_BADGES[topicOrigin].className
                )}
              >
                {TOPIC_ORIGIN_BADGES[topicOrigin].label}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {result.topicTitle} / {result.section}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-foreground">{result.score}</p>
          <p className="text-[10px] text-muted-foreground">match</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        {result.shortDescription}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {result.matchedTerms.slice(0, 4).map((term) => (
          <span
            key={term}
            className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] text-foreground/80"
          >
            {term}
          </span>
        ))}
      </div>

      {result.reasons[0] && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {result.reasons[0]}
        </p>
      )}
    </button>
  );
}

function SuggestionCard({
  suggestion,
  topicOrigin,
  onAdd,
}: {
  suggestion: TopicSearchSuggestion;
  topicOrigin?: FocusTopicOrigin;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{suggestion.topicIcon}</span>
            <p className="text-sm font-semibold text-foreground">{suggestion.topicTitle}</p>
            <Badge
              variant={MATCH_BADGE_VARIANTS[suggestion.matchLabel]}
              className="text-[10px]"
            >
              {suggestion.matchLabel}
            </Badge>
            {topicOrigin && (
              <span
                className={cn(
                  "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium",
                  TOPIC_ORIGIN_BADGES[topicOrigin].className
                )}
              >
                {TOPIC_ORIGIN_BADGES[topicOrigin].label}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{suggestion.section}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus size={12} />
          Add topic
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        {suggestion.shortDescription}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestion.matchedTerms.slice(0, 4).map((term) => (
          <span
            key={term}
            className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] text-foreground/80"
          >
            {term}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SmartInputPanel({
  activeTree,
  topicLabel,
  topicIcon,
  selectedSubtopics,
  onSubtopicToggle,
  noteText,
  onNoteChange,
  weakAreas = [],
  topicOrigins = {},
  onAutoTopicAdd,
  onGlobalMatchSelect,
}: SmartInputPanelProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isGlobalMode = !activeTree;
  const suggestedTerms = useMemo(() => {
    return getSuggestedSearchTerms(activeTree?.topicId ?? null);
  }, [activeTree?.topicId]);

  const searchResults = useMemo(() => {
    return searchTopicMetadata(lastQuery, {
      activeTopicId: activeTree?.topicId ?? null,
    });
  }, [activeTree?.topicId, lastQuery]);

  const visibleResults = useMemo(() => {
    return [...searchResults.directMatches, ...searchResults.relatedMatches];
  }, [searchResults.directMatches, searchResults.relatedMatches]);

  const activeResult =
    visibleResults.find((result) => result.id === activeResultId) ??
    searchResults.topMatch;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [searchResults.directMatches, searchResults.relatedMatches, searchResults.suggestedTopics]);

  function handleSearch() {
    if (!queryText.trim() || isSearching) {
      return;
    }

    setIsSearching(true);
    const nextQuery = queryText.trim();

    window.setTimeout(() => {
      setLastQuery(nextQuery);
      const previewResults = searchTopicMetadata(nextQuery, {
        activeTopicId: activeTree?.topicId ?? null,
      });

      if (
        previewResults.topMatch &&
        previewResults.topMatch.score >= 70 &&
        !weakAreas.includes(previewResults.topMatch.topicId)
      ) {
        onAutoTopicAdd?.(previewResults.topMatch.topicId);
      }

      setIsSearching(false);
    }, 220);
  }

  function handleResultAction(result: TopicSearchResult) {
    if (activeTree && result.topicId === activeTree.topicId) {
      onSubtopicToggle(result.subtopicId);
      return;
    }

    onGlobalMatchSelect?.(result.topicId, result.subtopicId);
  }

  const placeholderText = isGlobalMode
    ? "Search by keyword, concept, or confusion..."
    : `Search inside ${topicLabel.toLowerCase()} or describe the weak spot...`;
  const hasSearchResults = Boolean(lastQuery && visibleResults.length > 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTree?.topicId ?? "global"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
        className="flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm"
      >
        <div className="border-b border-border/40 px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                activeTree
                  ? "border border-border bg-surface"
                  : "border border-accent/20 bg-accent/10"
              )}
            >
              {activeTree ? <span className="text-sm">{topicIcon}</span> : <Search size={14} className="text-accent" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {activeTree ? topicLabel : "Smart Topic Search"}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeTree
                  ? "Exact, fuzzy, alias, and curriculum-term matching inside the current flow."
                  : "Search across all topics with structured topic metadata."}
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {!lastQuery && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/15 bg-accent/8">
                  <Sparkles size={20} className="text-accent/70" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {activeTree ? "Search this topic with plain keywords" : "Search any topic with plain keywords"}
                </p>
                <p className="mx-auto mt-2 max-w-[320px] text-[11px] leading-relaxed text-muted-foreground">
                  Try direct words like <span className="text-foreground/80">abstraction</span>,
                  <span className="text-foreground/80"> string</span>,
                  <span className="text-foreground/80"> read</span>,
                  <span className="text-foreground/80"> GDPR</span>, or describe what feels confusing.
                </p>
              </div>

              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                  Quick suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTerms.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQueryText(term)}
                      className="rounded-full border border-border/60 bg-surface px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-foreground"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {lastQuery && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/60 bg-surface/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Search Query
                    </p>
                    <p className="mt-2 text-sm text-foreground">{lastQuery}</p>
                  </div>
                  {searchResults.noDirectMatch ? (
                    <Badge variant="warning">No exact hit</Badge>
                  ) : (
                    <Badge variant="success">Direct results found</Badge>
                  )}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {searchResults.querySummary}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                    Direct Matches
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {searchResults.directMatches.length}
                  </span>
                </div>
                {searchResults.directMatches.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.directMatches.map((result) => (
                      <MatchCard
                        key={result.id}
                        result={result}
                        isActive={activeResult?.id === result.id}
                        topicOrigin={topicOrigins[result.topicId]}
                        onSelect={() => setActiveResultId(result.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-surface/25 px-4 py-3 text-xs text-muted-foreground">
                    Nothing landed as a strong direct hit for this query yet.
                  </div>
                )}
              </div>

              {searchResults.relatedMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      Related Matches
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {searchResults.relatedMatches.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {searchResults.relatedMatches.map((result) => (
                      <MatchCard
                        key={result.id}
                        result={result}
                        isActive={activeResult?.id === result.id}
                        topicOrigin={topicOrigins[result.topicId]}
                        onSelect={() => setActiveResultId(result.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {searchResults.suggestedTopics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      Suggested Topics
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {searchResults.suggestedTopics.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {searchResults.suggestedTopics.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.topicId}
                        suggestion={suggestion}
                        topicOrigin={topicOrigins[suggestion.topicId]}
                        onAdd={() => onAutoTopicAdd?.(suggestion.topicId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeResult && (
                <div className="rounded-2xl border border-accent/18 bg-accent/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{activeResult.topicIcon}</span>
                        <h4 className="text-sm font-semibold text-foreground">
                          {activeResult.subtopicTitle}
                        </h4>
                        <Badge
                          variant={MATCH_BADGE_VARIANTS[activeResult.matchLabel]}
                          className="text-[10px]"
                        >
                          {activeResult.matchLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {activeResult.topicTitle} / {activeResult.section}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{activeResult.score}</p>
                      <p className="text-[10px] text-muted-foreground">relevance</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                    {activeResult.longDescription}
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        Why it was found
                      </p>
                      <div className="space-y-2">
                        {activeResult.reasons.map((reason) => (
                          <div
                            key={reason}
                            className="rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-[11px] text-muted-foreground"
                          >
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        What to revise next
                      </p>
                      <div className="space-y-2">
                        {activeResult.revisionPriorities.map((priority) => (
                          <div
                            key={priority}
                            className="rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-[11px] text-muted-foreground"
                          >
                            {priority}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        Exam terms
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResult.examVocabulary.slice(0, 8).map((term) => (
                          <span
                            key={term}
                            className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] text-foreground/80"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        Related topics
                      </p>
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {activeResult.relatedTopics.map((topic) => (
                          <span
                            key={topic.id}
                            className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] text-foreground/80"
                          >
                            {topic.icon} {topic.title}
                          </span>
                        ))}
                      </div>

                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        Related subtopics
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResult.relatedSubtopics.map((subtopic) => (
                          <button
                            key={subtopic.id}
                            type="button"
                            onClick={() => {
                              const relatedResult = visibleResults.find(
                                (result) => result.subtopicId === subtopic.id && result.topicId === activeResult.topicId
                              );
                              if (relatedResult) {
                                setActiveResultId(relatedResult.id);
                              }
                            }}
                            className="rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-[10px] text-foreground/80 transition-colors hover:border-accent/30 hover:text-foreground"
                          >
                            {subtopic.id} / {subtopic.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {activeResult.weakSpots.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-warning/15 bg-warning/5 p-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-warning/80">
                        Common weak spots
                      </p>
                      <ul className="space-y-2">
                        {activeResult.weakSpots.map((weakSpot) => (
                          <li key={weakSpot} className="text-[11px] text-muted-foreground">
                            {weakSpot}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleResultAction(activeResult)}
                    >
                      {activeTree && activeResult.topicId === activeTree.topicId ? (
                        selectedSubtopics.includes(activeResult.subtopicId) ? (
                          <>
                            <Check size={14} />
                            Remove from focus
                          </>
                        ) : (
                          <>
                            <Target size={14} />
                            Add subtopic to focus
                          </>
                        )
                      ) : (
                        <>
                          <Plus size={14} />
                          Add topic and focus subtopic
                        </>
                      )}
                    </Button>
                    {activeResult.officialPointCodes.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Official points: {activeResult.officialPointCodes.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!hasSearchResults && searchResults.suggestedTopics.length === 0 && (
                <div className="rounded-2xl border border-border/50 bg-surface/25 px-4 py-3 text-xs text-muted-foreground">
                  No meaningful matches yet. Try a broader keyword or one of the suggested terms above.
                </div>
              )}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-border/60 bg-surface/30 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
              {activeTree ? `Notes for ${topicLabel}` : "General focus note"}
            </p>
            <textarea
              value={noteText}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={4}
              placeholder={
                activeTree
                  ? "Write what feels weak here so it is saved with this topic..."
                  : "Add a general note about what you want to focus on..."
              }
              className="min-h-[110px] w-full resize-none rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="border-t border-border/40 p-4">
          <motion.div
            animate={{
              borderColor: isFocused
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(255, 255, 255, 0.06)",
              boxShadow: isFocused
                ? "0 0 0 1px rgba(139, 92, 246, 0.08), 0 4px 16px -6px rgba(139, 92, 246, 0.1)"
                : "none",
            }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-xl border bg-surface/60"
          >
            <motion.div
              className="pointer-events-none absolute top-0 left-[10%] right-[10%] h-px"
              animate={{
                opacity: isFocused ? 1 : 0,
                scaleX: isFocused ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
              }}
            />

            <div className="flex items-end gap-2 p-3">
              <div className="flex-1 min-w-0">
                <textarea
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder={placeholderText}
                  maxLength={140}
                  rows={1}
                  className="min-h-[36px] w-full resize-none break-words bg-transparent px-1 py-1.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  style={{
                    height: "auto",
                    maxHeight: "100px",
                    overflow: "hidden",
                  }}
                  onInput={(event) => {
                    const target = event.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                  }}
                />
              </div>

              <motion.button
                type="button"
                onClick={handleSearch}
                disabled={!queryText.trim() || isSearching}
                animate={{
                  scale: queryText.trim() ? 1 : 0.92,
                  opacity: queryText.trim() ? 1 : 0.35,
                  backgroundColor: queryText.trim()
                    ? "rgb(139, 92, 246)"
                    : "rgba(139, 92, 246, 0.1)",
                }}
                whileHover={queryText.trim() ? { scale: 1.06 } : {}}
                whileTap={queryText.trim() ? { scale: 0.94 } : {}}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={14} className="text-white" />
                  </motion.div>
                ) : (
                  <ArrowUp
                    size={15}
                    className={queryText.trim() ? "text-white" : "text-accent/30"}
                    strokeWidth={2.5}
                  />
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
