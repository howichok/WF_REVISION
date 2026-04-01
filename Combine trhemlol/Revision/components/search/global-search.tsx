"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  FileSearch,
  Hash,
  Search,
  Shapes,
  Sparkle,
} from "lucide-react";
import { groupSearchResults, searchKnowledgeIndex, type SearchResultType } from "@/lib/search-index";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SEARCH_DEBOUNCE_MS = 250;
const TYPE_ORDER: SearchResultType[] = ["topic", "subtopic", "outcome", "term"];
const TYPE_LABEL: Record<SearchResultType, string> = {
  topic: "Topic",
  subtopic: "Subtopic",
  outcome: "Outcome",
  term: "Glossary term",
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

function typeIcon(type: SearchResultType) {
  if (type === "topic") {
    return <BookOpen className="size-4 text-muted-foreground" />;
  }
  if (type === "subtopic") {
    return <Shapes className="size-4 text-muted-foreground" />;
  }
  if (type === "outcome") {
    return <FileSearch className="size-4 text-muted-foreground" />;
  }
  return <Sparkle className="size-4 text-muted-foreground" />;
}

function highlightText(text: string, query: string): ReactNode {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return text;
  }

  const lower = text.toLowerCase();
  const start = lower.indexOf(normalizedQuery);
  if (start < 0) {
    return text;
  }

  const end = start + normalizedQuery.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [includeOutcomes, setIncludeOutcomes] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    return searchKnowledgeIndex(debouncedQuery, {
      includeOutcomes,
      limit: 36,
    });
  }, [debouncedQuery, includeOutcomes]);

  const grouped = useMemo(() => groupSearchResults(results), [results]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-between text-muted-foreground md:max-w-md"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Search className="size-4" />
          Search topics, terms, outcomes
        </span>
        <kbd className="rounded border border-border/70 bg-secondary/40 px-1.5 py-0.5 text-[10px] tracking-wide">
          Ctrl+K
        </kbd>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border/70 p-4 pb-3">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Find syllabus nodes, outcomes and glossary terms quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: abstraction, 1.1.13, least privilege..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/20 px-3 py-2">
              <Label htmlFor="outcomes-toggle" className="text-xs text-muted-foreground">
                Include outcomes (deeper but heavier search)
              </Label>
              <Switch
                id="outcomes-toggle"
                checked={includeOutcomes}
                onCheckedChange={setIncludeOutcomes}
              />
            </div>
          </div>

          <div className="max-h-[56vh] space-y-4 overflow-auto border-t border-border/70 p-4">
            {debouncedQuery.trim().length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start typing to search by title, specRef, glossary terms, and path.
              </p>
            ) : null}

            {debouncedQuery.trim().length > 0 && results.length === 0 ? (
              <div className="space-y-2 rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                <p>No results found.</p>
                <p>Try a different spelling, shorter phrase, or enable outcomes search.</p>
              </div>
            ) : null}

            {TYPE_ORDER.map((type) => {
              const rows = grouped[type];
              if (rows.length === 0) {
                return null;
              }

              return (
                <section key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {typeIcon(type)}
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABEL[type]}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {rows.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg border border-border/60 px-3 py-2 hover:bg-accent"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {highlightText(item.title, debouncedQuery)}
                          </p>
                          <Badge variant="outline" className="inline-flex items-center gap-1">
                            <Hash className="size-3" />
                            {item.specRef}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {highlightText(item.path, debouncedQuery)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
