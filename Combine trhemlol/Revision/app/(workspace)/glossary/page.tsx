"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { glossaryTerms, papersById, topicById } from "@/lib/content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function GlossaryPage() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return glossaryTerms;
    }

    return glossaryTerms.filter(
      (term) =>
        term.term.toLowerCase().includes(normalized) ||
        term.definition.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl">Glossary</CardTitle>
          <CardDescription>Search key terms and jump straight to linked topics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search terms..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((term) => {
          const paper = papersById[term.paperId];
          const topic = topicById[term.topicId];

          return (
            <Card key={term.id} className="border-border/70">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{term.term}</CardTitle>
                  <Badge variant="outline">{paper.title}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{term.definition}</p>
                <Link
                  href={`/library?paper=${paper.id}&node=${encodeURIComponent(term.topicSlug)}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open topic: {topic?.title ?? term.topicId}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No term matches this query.</p>
      ) : null}
    </div>
  );
}
