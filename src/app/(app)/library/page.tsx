"use client";

import Link from "next/link";
import type { ContentResource } from "@/data/curriculum";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  BookOpen,
  Video,
  PenLine,
  Filter,
  SlidersHorizontal,
  Presentation,
  Search,
  Table2,
} from "lucide-react";
import {
  SearchComposer,
  ResourceCard,
} from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import { PageContainer } from "@/components/layout/page-container";
import {
  getOfficialGuidanceResources,
  getQualificationOverview,
  getResourceHref,
  isResourceExternal,
  getLibraryResources,
  searchLibraryResources,
  searchStructuredContent,
} from "@/lib/content";
import { searchTopicMetadata } from "@/lib/topic-search";
import { TOPICS } from "@/lib/types";

const typeFilters = [
  { id: "all", label: "All", icon: SlidersHorizontal },
  { id: "past-paper", label: "Past Papers", icon: FileText },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "worksheet", label: "Worksheets", icon: PenLine },
  { id: "slides", label: "Slides", icon: Presentation },
  { id: "video", label: "Videos", icon: Video },
  { id: "dataset", label: "Datasets", icon: Table2 },
];

function matchesResourceType(resource: ContentResource, activeType: string) {
  if (activeType === "all") return true;
  if (activeType === "dataset") return resource.tags.includes("dataset");
  return resource.displayType === activeType;
}

export default function LibraryPage() {
  const { sharedCurriculum } = useAppData();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeTopic, setActiveTopic] = useState("all");
  const allResources = useMemo(() => getLibraryResources(sharedCurriculum), [sharedCurriculum]);
  const qualificationOverview = useMemo(() => getQualificationOverview(), []);
  const officialResources = useMemo(
    () => getOfficialGuidanceResources(4, sharedCurriculum),
    [sharedCurriculum]
  );
  const topicSearch = useMemo(
    () =>
      searchTopicMetadata(search, {
        activeTopicId: activeTopic !== "all" ? activeTopic : undefined,
      }),
    [search, activeTopic]
  );
  const searchMatches = useMemo(
    () =>
      searchStructuredContent(search, {
        legacyTopicId: activeTopic !== "all" ? activeTopic : undefined,
      }, sharedCurriculum),
    [search, activeTopic, sharedCurriculum]
  );
  const matchedTopicIds = useMemo(() => {
    return Array.from(
      new Set([
        ...topicSearch.directMatches.map((match) => match.topicId),
        ...topicSearch.relatedMatches.map((match) => match.topicId),
        ...topicSearch.suggestedTopics.map((topic) => topic.topicId),
      ])
    );
  }, [topicSearch.directMatches, topicSearch.relatedMatches, topicSearch.suggestedTopics]);

  const rankedResources = useMemo(
    () =>
      searchLibraryResources(search, {
        legacyTopicId: activeTopic !== "all" ? activeTopic : undefined,
        matchedTopicIds,
      }, sharedCurriculum),
    [activeTopic, matchedTopicIds, search, sharedCurriculum]
  );

  const filtered = (search ? rankedResources : allResources).filter((r) => {
    const matchesType = matchesResourceType(r, activeType);
    const matchesTopic = activeTopic === "all" || r.legacyTopicIds.includes(activeTopic as typeof TOPICS[number]["id"]);
    return matchesType && matchesTopic;
  });

  const datasetCount = allResources.filter((r) => r.tags.includes("dataset")).length;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="perf-fade-up" style={{ animationDelay: "0ms" }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Library</h1>
          <p className="text-muted text-sm">
            Past papers, notes, worksheets — everything organised by topic.{" "}
            <Link href="/library/datasets" className="text-accent hover:underline">
              CSV datasets
            </Link>{" "}
            for data-handling practice live under{" "}
            <code className="text-xs text-muted-foreground">/sources/</code>.
          </p>
        </div>

        {/* Search composer — matches the smart input style */}
        <div className="perf-fade-up" style={{ animationDelay: "70ms" }}>
          <SearchComposer
            value={search}
            onChange={setSearch}
            placeholder="Search for resources, topics, or keywords..."
          />
        </div>

        <div
          className="perf-fade-up grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"
          style={{ animationDelay: "140ms" }}
        >
          <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.08] via-card to-card p-5 shadow-sm dark:border-accent/20 dark:from-accent/[0.14] dark:via-[#14141a] dark:to-[#0e0e12] dark:shadow-none">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Official T Level DSD map
              </p>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              Start from the live qualification structure, not random notes.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The current Pearson route is a {qualificationOverview.level.toLowerCase()} {qualificationOverview.duration.toLowerCase()}
              with a {qualificationOverview.industryPlacement.toLowerCase()}. Use the official overview first, then drop into topic practice, paper routes, and mapped resources.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {qualificationOverview.assessmentComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex min-h-0 min-w-0 flex-col rounded-xl border border-border bg-surface/70 px-4 py-4 dark:border-white/10 dark:bg-black/25"
                >
                  <p className="text-xs font-semibold leading-snug text-foreground break-words">
                    {component.title}
                  </p>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground break-words">
                    {component.focus}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Official web sources
            </p>
            <div className="mt-3 space-y-2">
              {officialResources.slice(0, 3).map((resource) => (
                <a
                  key={resource.id}
                  href={getResourceHref(resource)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/40 px-3 py-3 transition-colors hover:border-accent/20 hover:bg-card"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{resource.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{resource.summary}</p>
                  </div>
                  <ArrowRight size={14} className="mt-0.5 shrink-0 text-accent" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="perf-fade-up grid gap-3 lg:grid-cols-3" style={{ animationDelay: "210ms" }}>
          {[
            {
              href: "/revision/quick-quiz",
              title: "Quick Quiz",
              description: "Use fast retrieval if you want to test yourself instead of browsing.",
            },
            {
              href: "/revision/paper-1",
              title: "Paper 1 practice",
              description: "Go straight into theory-heavy checks and faster recall.",
            },
            {
              href: "/revision/paper-2",
              title: "Paper 2 practice",
              description: "Jump into applied exam-style questions and longer responses.",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-border bg-card/70 px-4 py-4 transition-colors hover:border-accent/20 hover:bg-card"
            >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Practice route
                </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
                Open route
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="perf-fade-up space-y-4" style={{ animationDelay: "280ms" }}>
          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {typeFilters.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveType(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeType === id
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "bg-card border border-border text-muted hover:text-foreground hover:border-border-light"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Topic filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTopic("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTopic === "all"
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-muted"
              }`}
            >
              All Topics
            </button>
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTopic === topic.id
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-muted"
                }`}
              >
                {topic.icon} {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category summary cards */}
        <div
          className="perf-fade-up grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[88px]"
          style={{ animationDelay: "350ms" }}
        >
          {[
            { label: "Past Papers", count: allResources.filter(r => r.displayType === "past-paper").length, icon: FileText, color: "text-accent" },
            { label: "Notes", count: allResources.filter(r => r.displayType === "notes").length, icon: BookOpen, color: "text-success" },
            { label: "Worksheets", count: allResources.filter(r => r.displayType === "worksheet").length, icon: PenLine, color: "text-warning" },
            { label: "Slides", count: allResources.filter(r => r.displayType === "slides").length, icon: Presentation, color: "text-accent" },
            { label: "Datasets", count: datasetCount, icon: Table2, color: "text-warning" },
            { label: "Topics", count: TOPICS.length, icon: SlidersHorizontal, color: "text-muted-foreground" },
          ].map((cat) => (
            <div key={cat.label} className="bg-card border border-border rounded-xl p-4 hover:border-border-light transition-colors card-interactive">
              <cat.icon size={18} className={`${cat.color} mb-2`} />
              <p className="text-lg font-semibold">{cat.count}</p>
              <p className="text-xs text-muted">{cat.label}</p>
            </div>
          ))}
        </div>

        {/* Resource grid */}
        <div className="perf-fade-up space-y-4" style={{ animationDelay: "420ms" }}>
          {search && (
            <div className="grid gap-4 xl:grid-cols-4 min-h-[200px]">
              <div className="rounded-2xl border border-border bg-card/70 p-4 min-h-[180px]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Topic Matches
                  </p>
                  {topicSearch.noDirectMatch ? (
                    <span className="text-[10px] text-warning">closest results</span>
                  ) : (
                    <span className="text-[10px] text-success">ranked</span>
                  )}
                </div>
                <div className="space-y-2">
                  {topicSearch.directMatches.length > 0 ? (
                    topicSearch.directMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {match.topicIcon} {match.subtopicTitle}
                          </p>
                          <span className="text-[11px] text-accent">{match.score}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {match.topicTitle} / {match.section}
                        </p>
                        <p className="mt-2 text-xs text-muted line-clamp-2">{match.shortDescription}</p>
                      </div>
                    ))
                  ) : topicSearch.relatedMatches.length > 0 ? (
                    topicSearch.relatedMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {match.topicIcon} {match.subtopicTitle}
                          </p>
                          <span className="text-[11px] text-muted-foreground">{match.score}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {match.topicTitle} / {match.section}
                        </p>
                        <p className="mt-2 text-xs text-muted line-clamp-2">{match.reasons[0] ?? match.shortDescription}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No topic matches yet for this search.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Curriculum Matches
                </p>
                <div className="space-y-2">
                  {searchMatches.curriculumPoints.length > 0 ? (
                    searchMatches.curriculumPoints.slice(0, 3).map((point) => (
                      <div key={point.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <p className="text-xs text-accent font-medium">{point.code}</p>
                        <p className="text-sm font-medium text-foreground mt-1">{point.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{point.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No numbered curriculum points matched this search yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Question Matches
                </p>
                <div className="space-y-2">
                  {searchMatches.questions.length > 0 ? (
                    searchMatches.questions.slice(0, 3).map((question) => (
                      <div key={question.id} className="rounded-xl border border-border bg-surface/40 px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{question.title}</p>
                          {question.marks && (
                            <span className="text-[11px] text-accent">{question.marks} marks</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{question.sourceLabel}</p>
                        <p className="text-xs text-muted mt-2 line-clamp-2">{question.expectation}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No linked question metadata matched this search.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Key Terms
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchMatches.glossaryTerms.length > 0 ? (
                    searchMatches.glossaryTerms.slice(0, 8).map((term) => (
                      <span
                        key={term.id}
                        className="rounded-lg border border-border bg-surface/40 px-2.5 py-1.5 text-xs text-foreground"
                      >
                        {term.term}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No glossary terms matched this search.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
              {search ? " ranked by relevance" : ""}
            </h2>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-muted transition-colors cursor-pointer">
              <Filter size={12} />
              Sort by recent
            </button>
          </div>

          {filtered.length === 0 ? (
              <div
                key="empty"
                className="text-center py-16 min-h-[240px] flex flex-col items-center justify-center"
              >
                <Search size={32} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted text-sm">Nothing matches your filters.</p>
                <p className="text-muted-foreground text-xs mt-1">Try a different topic or resource type.</p>
              </div>
            ) : (
              <div
                key="grid"
                className="library-resource-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filtered.map((resource, i) => {
                  const topicData = resource.legacyTopicIds
                    .map((topicId) => TOPICS.find((topic) => topic.id === topicId))
                    .find(Boolean);
                  return (
                    <ResourceCard
                      key={resource.id}
                      title={resource.title}
                      description={resource.summary}
                      type={resource.displayType}
                      topic={topicData?.label}
                      topicIcon={topicData?.icon}
                      year={resource.year}
                      index={i}
                      href={getResourceHref(resource)}
                      external={isResourceExternal(resource)}
                      actionLabel={
                        isResourceExternal(resource)
                          ? "Open official source"
                          : resource.filePath.startsWith("/sources/")
                            ? "Download CSV"
                            : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </PageContainer>
  );
}
