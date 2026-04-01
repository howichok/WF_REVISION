"use client";

import Link from "next/link";
import { ArrowLeft, Table2 } from "lucide-react";
import { ResourceCard } from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";
import { getLibraryResources, getResourceHref, isResourceExternal } from "@/lib/content";
import { TOPICS } from "@/lib/types";
import { useMemo } from "react";

export default function LibraryDatasetsPage() {
  const datasets = useMemo(
    () => getLibraryResources().filter((r) => r.tags.includes("dataset")),
    []
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link
            href="/library"
            className="mt-1 inline-flex rounded-xl border border-border bg-card/70 p-2 text-muted-foreground hover:text-foreground hover:border-border-light transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-muted text-sm mb-2">
              <Table2 size={16} className="text-accent" />
              Teaching pack
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CSV datasets</h1>
            <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
              Files served from <code className="text-xs">/sources/</code> — use for formats, wrangling, and
              visualisation practice. Pair with the wrangling checklist and worksheet resources in the main library.
            </p>
          </div>
        </div>

        <div className="library-resource-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((resource, i) => {
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
                actionLabel="Download CSV"
              />
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
