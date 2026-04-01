"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  CircleGauge,
  Flag,
  ListChecks,
  Menu,
  PlayCircle,
} from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { ReportDialog } from "@/components/shared/report-dialog";
import {
  getOutcomeText,
  getQuizByTopic,
  getTopicById,
  papersById,
  syllabusTreeByPaper,
  type TopicTreeNode,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { PaperId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlatNode {
  id: string;
  title: string;
  paperId: PaperId;
  depth: number;
  parentId: string | null;
  outcomesCount: number;
  pathIds: string[];
}

interface ChecklistState {
  explain: boolean;
  apply: boolean;
  review: boolean;
}

const DEFAULT_CHECKLIST: ChecklistState = {
  explain: false,
  apply: false,
  review: false,
};

const OUTCOMES_PAGE_SIZE = 8;

function flattenTree(nodes: TopicTreeNode[]): FlatNode[] {
  const rows: FlatNode[] = [];

  for (const node of nodes) {
    rows.push({
      id: node.id,
      title: node.title,
      paperId: node.paperId,
      depth: node.depth,
      parentId: node.parentId,
      outcomesCount: node.outcomes.length,
      pathIds: node.pathIds,
    });

    rows.push(...flattenTree(node.children));
  }

  return rows;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.\s]/g, " ").replace(/\s+/g, " ").trim();
}

function shortText(text: string, limit = 170): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 3)}...`;
}

function TreeList({
  nodes,
  selectedNodeId,
  expandedIds,
  onToggleExpand,
  onSelectNode,
}: {
  nodes: TopicTreeNode[];
  selectedNodeId: string;
  expandedIds: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);

        return (
          <div key={`${node.paperId}-${node.id}`} className="space-y-1">
            <div
              className={cn(
                "flex items-center gap-1 rounded-md px-1 py-1",
                isSelected ? "bg-accent/70" : "hover:bg-accent/40"
              )}
              style={{ marginLeft: `${node.depth * 12}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse node" : "Expand node"}
                  onClick={() => onToggleExpand(node.id)}
                  className="inline-flex size-6 items-center justify-center rounded-md hover:bg-background"
                >
                  <ChevronRight className={cn("size-4 transition-transform", isExpanded ? "rotate-90" : "")} />
                </button>
              ) : (
                <span className="inline-block size-6" />
              )}

              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm"
              >
                <span className="truncate">{node.title}</span>
                <span className="text-xs text-muted-foreground">{node.outcomes.length || ""}</span>
              </button>
            </div>

            {hasChildren && isExpanded ? (
              <TreeList
                nodes={node.children}
                selectedNodeId={selectedNodeId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onSelectNode={onSelectNode}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setManualWeak, setTopicMastery } = useAppState();

  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [expandedTreeIds, setExpandedTreeIds] = useState<Set<string>>(new Set(["1", "2", "3", "4", "5", "6", "7", "8"]));
  const [treeQuery, setTreeQuery] = useState("");
  const [treeSheetOpen, setTreeSheetOpen] = useState(false);

  const [outcomesOpen, setOutcomesOpen] = useState(false);
  const [outcomesLimit, setOutcomesLimit] = useState(OUTCOMES_PAGE_SIZE);
  const [expandedOutcomeIds, setExpandedOutcomeIds] = useState<Set<string>>(new Set());
  const [checklistByNode, setChecklistByNode] = useState<Record<string, ChecklistState>>({});

  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, number>>({});

  const flatNodes = useMemo(
    () => [
      ...flattenTree(syllabusTreeByPaper.paper1),
      ...flattenTree(syllabusTreeByPaper.paper2),
    ],
    []
  );

  const nodeById = useMemo(
    () =>
      Object.fromEntries(flatNodes.map((node) => [node.id, node])) as Record<string, FlatNode>,
    [flatNodes]
  );

  const treeQueryNormalized = useMemo(() => normalizeText(treeQuery), [treeQuery]);
  const filteredFlatNodes = useMemo(() => {
    if (!treeQueryNormalized) {
      return flatNodes;
    }

    return flatNodes.filter((node) => {
      const searchable = normalizeText(`${node.title} ${node.id} ${node.pathIds.join(" ")}`);
      return searchable.includes(treeQueryNormalized);
    });
  }, [flatNodes, treeQueryNormalized]);

  const fallbackNodeId = flatNodes[0]?.id ?? "";
  const firstNodeByPaper = useMemo(
    () => ({
      paper1: syllabusTreeByPaper.paper1[0]?.id ?? fallbackNodeId,
      paper2: syllabusTreeByPaper.paper2[0]?.id ?? fallbackNodeId,
    }),
    [fallbackNodeId]
  );

  useEffect(() => {
    if (selectedNodeId) {
      return;
    }
    const paperParam = searchParams.get("paper");
    if (paperParam === "paper2") {
      setSelectedNodeId(firstNodeByPaper.paper2);
      return;
    }
    setSelectedNodeId(firstNodeByPaper.paper1);
  }, [selectedNodeId, firstNodeByPaper, searchParams]);

  useEffect(() => {
    const nodeParam = searchParams.get("node");
    if (!nodeParam || !nodeById[nodeParam]) {
      return;
    }

    setSelectedNodeId(nodeParam);

    const path = nodeById[nodeParam]?.pathIds ?? [];
    if (path.length > 0) {
      setExpandedTreeIds((previous) => new Set([...Array.from(previous), ...path]));
    }
  }, [searchParams, nodeById]);

  const selectedMeta = nodeById[selectedNodeId] ?? null;
  const selectedTopic = selectedMeta ? getTopicById(selectedMeta.id) : null;
  const selectedPaper = selectedMeta ? papersById[selectedMeta.paperId] : null;
  const selectedProgress = selectedMeta ? state.topicProgress[selectedMeta.id] : null;
  const selectedChecklist = checklistByNode[selectedNodeId] ?? DEFAULT_CHECKLIST;

  useEffect(() => {
    const outcomeParam = searchParams.get("outcome");
    const selectedOutcomeIds = getTopicById(selectedNodeId)?.outcomes ?? [];
    const hasFocusedOutcome = Boolean(outcomeParam && selectedOutcomeIds.includes(outcomeParam));

    if (hasFocusedOutcome && outcomeParam) {
      setOutcomesOpen(true);
      setExpandedOutcomeIds(new Set([outcomeParam]));
      setOutcomesLimit(Math.max(OUTCOMES_PAGE_SIZE, selectedOutcomeIds.indexOf(outcomeParam) + 1));
      return;
    }

    setOutcomesOpen(false);
    setOutcomesLimit(OUTCOMES_PAGE_SIZE);
    setExpandedOutcomeIds(new Set());
  }, [selectedNodeId, searchParams]);

  const outcomeIds = selectedTopic?.outcomes ?? [];
  const visibleOutcomeIds = outcomesOpen ? outcomeIds.slice(0, outcomesLimit) : [];

  const diagnosticQuestions = useMemo(() => {
    if (!selectedNodeId) {
      return [];
    }
    return getQuizByTopic(selectedNodeId, true).slice(0, 6);
  }, [selectedNodeId]);

  const openNode = (nodeId: string) => {
    const meta = nodeById[nodeId];
    if (!meta) {
      return;
    }

    setSelectedNodeId(nodeId);
    setExpandedTreeIds((previous) => new Set([...Array.from(previous), ...(meta.pathIds ?? [])]));

    const params = new URLSearchParams(searchParams.toString());
    params.set("paper", meta.paperId);
    params.set("node", nodeId);
    params.delete("outcome");
    router.replace(`/library?${params.toString()}`, { scroll: false });
  };

  const toggleTreeExpansion = (nodeId: string) => {
    setExpandedTreeIds((previous) => {
      const next = new Set(previous);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleChecklistItem = (key: keyof ChecklistState, value: boolean) => {
    if (!selectedNodeId) {
      return;
    }

    setChecklistByNode((previous) => ({
      ...previous,
      [selectedNodeId]: {
        ...(previous[selectedNodeId] ?? DEFAULT_CHECKLIST),
        [key]: value,
      },
    }));
  };

  const openDiagnostic = () => {
    setDiagnosticAnswers({});
    setDiagnosticOpen(true);
  };

  const submitDiagnostic = () => {
    if (!selectedTopic || diagnosticQuestions.length === 0) {
      setDiagnosticOpen(false);
      return;
    }

    const correct = diagnosticQuestions.filter(
      (question) => diagnosticAnswers[question.id] === question.correctIndex
    ).length;
    const mastery = Math.round((correct / diagnosticQuestions.length) * 100);
    setTopicMastery(selectedTopic.id, mastery);
    setDiagnosticOpen(false);
    setDiagnosticAnswers({});
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl">Library</CardTitle>
          <CardDescription>
            Pick a node from the tree, then review details and launch actions from one place.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3 md:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={treeSheetOpen} onOpenChange={setTreeSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Menu className="size-4" />
                Browse tree
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90vw] max-w-sm overflow-auto">
              <SheetHeader>
                <SheetTitle>Syllabus tree</SheetTitle>
                <SheetDescription>Paper -&gt; Topic -&gt; Subtopic.</SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-4">
                <Input
                  value={treeQuery}
                  onChange={(event) => setTreeQuery(event.target.value)}
                  placeholder="Filter nodes..."
                />
                {treeQueryNormalized ? (
                  <div className="space-y-1">
                    {filteredFlatNodes.slice(0, 40).map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          openNode(node.id);
                          setTreeSheetOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md border border-border/60 px-2 py-2 text-left text-sm hover:bg-accent"
                      >
                        <span className="truncate">{node.title}</span>
                        <span className="text-xs text-muted-foreground">{node.id}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <TreeList
                      nodes={syllabusTreeByPaper.paper1}
                      selectedNodeId={selectedNodeId}
                      expandedIds={expandedTreeIds}
                      onToggleExpand={toggleTreeExpansion}
                      onSelectNode={(nodeId) => {
                        openNode(nodeId);
                        setTreeSheetOpen(false);
                      }}
                    />
                    <TreeList
                      nodes={syllabusTreeByPaper.paper2}
                      selectedNodeId={selectedNodeId}
                      expandedIds={expandedTreeIds}
                      onToggleExpand={toggleTreeExpansion}
                      onSelectNode={(nodeId) => {
                        openNode(nodeId);
                        setTreeSheetOpen(false);
                      }}
                    />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Select value={selectedNodeId} onValueChange={openNode}>
            <SelectTrigger className="min-w-0">
              <SelectValue placeholder="Select node" />
            </SelectTrigger>
            <SelectContent>
              {filteredFlatNodes.slice(0, 160).map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          value={treeQuery}
          onChange={(event) => setTreeQuery(event.target.value)}
          placeholder="Search node name or specRef"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="hidden border-border/70 md:block">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Syllabus tree</CardTitle>
            <Input
              value={treeQuery}
              onChange={(event) => setTreeQuery(event.target.value)}
              placeholder="Filter node name or specRef"
            />
          </CardHeader>
          <CardContent className="max-h-[72vh] overflow-auto">
            {treeQueryNormalized ? (
              <div className="space-y-1">
                {filteredFlatNodes.slice(0, 60).map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => openNode(node.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border border-border/60 px-2 py-2 text-left text-sm hover:bg-accent",
                      node.id === selectedNodeId ? "bg-accent" : ""
                    )}
                  >
                    <span className="truncate">{node.title}</span>
                    <span className="text-xs text-muted-foreground">{node.id}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <TreeList
                  nodes={syllabusTreeByPaper.paper1}
                  selectedNodeId={selectedNodeId}
                  expandedIds={expandedTreeIds}
                  onToggleExpand={toggleTreeExpansion}
                  onSelectNode={openNode}
                />
                <TreeList
                  nodes={syllabusTreeByPaper.paper2}
                  selectedNodeId={selectedNodeId}
                  expandedIds={expandedTreeIds}
                  onToggleExpand={toggleTreeExpansion}
                  onSelectNode={openNode}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardDescription>{selectedPaper?.title ?? "Library node"}</CardDescription>
                  <CardTitle className="text-2xl">{selectedTopic?.title ?? "Select a node"}</CardTitle>
                </div>
                {selectedTopic ? (
                  <Badge variant="outline">Mastery {selectedProgress?.mastery ?? 50}%</Badge>
                ) : null}
              </div>
              {selectedTopic && selectedMeta ? (
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <ListChecks className="size-4" />
                  {[
                    papersById[selectedMeta.paperId]?.title ?? selectedMeta.paperId,
                    ...(selectedTopic.pathIds ?? [selectedTopic.id]).map((pathId) => getTopicById(pathId)?.title ?? pathId),
                  ].join(" > ")}
                </p>
              ) : null}
              {selectedTopic ? <p className="text-sm text-muted-foreground">{selectedTopic.summary}</p> : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTopic ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedProgress?.weakManual ? "default" : "outline"}
                      onClick={() => setManualWeak(selectedTopic.id, !(selectedProgress?.weakManual ?? false))}
                    >
                      <Flag className="size-4" />
                      {selectedProgress?.weakManual ? "Unmark weak" : "Mark weak"}
                    </Button>

                    <Button size="sm" variant="outline" onClick={openDiagnostic}>
                      <CircleGauge className="size-4" />
                      Start mini-test
                    </Button>

                    <Button asChild size="sm" variant="outline">
                      <Link href={`/quiz?paper=${selectedMeta?.paperId ?? "paper1"}&topic=${encodeURIComponent(selectedTopic.id)}&autostart=1`}>
                        <PlayCircle className="size-4" />
                        Start quiz from this node
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/70 p-4">
                    <button
                      type="button"
                      onClick={() => setOutcomesOpen((previous) => !previous)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="font-medium">Outcomes ({outcomeIds.length})</span>
                      <ChevronRight className={cn("size-4 transition-transform", outcomesOpen ? "rotate-90" : "")} />
                    </button>

                    {outcomesOpen ? (
                      <div className="space-y-2">
                        {visibleOutcomeIds.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No direct outcomes on this node. Use child sections in the tree.
                          </p>
                        ) : null}

                        {visibleOutcomeIds.map((outcomeId) => {
                          const text = getOutcomeText(outcomeId);
                          const expanded = expandedOutcomeIds.has(outcomeId);

                          return (
                            <div key={outcomeId} className="rounded-md border border-border/60 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">{outcomeId}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    setExpandedOutcomeIds((previous) => {
                                      const next = new Set(previous);
                                      if (next.has(outcomeId)) {
                                        next.delete(outcomeId);
                                      } else {
                                        next.add(outcomeId);
                                      }
                                      return next;
                                    })
                                  }
                                >
                                  {expanded ? "Collapse" : "Expand"}
                                </Button>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {expanded ? text : shortText(text)}
                              </p>
                            </div>
                          );
                        })}

                        {outcomesLimit < outcomeIds.length ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOutcomesLimit((previous) => previous + OUTCOMES_PAGE_SIZE)}
                          >
                            Show more outcomes
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/70 p-4">
                    <div>
                      <p className="font-medium">Revision checklist</p>
                      <p className="text-xs text-muted-foreground">
                        Quick confidence checks (without repeating long outcome text).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedChecklist.explain}
                          onCheckedChange={(checked) => toggleChecklistItem("explain", Boolean(checked))}
                        />
                        I can explain this node in my own words.
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedChecklist.apply}
                          onCheckedChange={(checked) => toggleChecklistItem("apply", Boolean(checked))}
                        />
                        I can apply this node in one worked example.
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedChecklist.review}
                          onCheckedChange={(checked) => toggleChecklistItem("review", Boolean(checked))}
                        />
                        I reviewed one weak area and corrected mistakes.
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Quick mastery set</p>
                      <div className="flex flex-wrap gap-2">
                        {[40, 60, 80, 100].map((value) => (
                          <Button
                            key={value}
                            size="sm"
                            variant="outline"
                            onClick={() => setTopicMastery(selectedTopic.id, value)}
                          >
                            {value}%
                          </Button>
                        ))}
                      </div>
                      <Progress value={selectedProgress?.mastery ?? 50} />
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Prompt 1: define key terms and one non-example.</p>
                      <p>Prompt 2: answer one timed question and map to specRef IDs.</p>
                      <p>Prompt 3: note one mistake pattern and one fix.</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a node from the tree to open details.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <ReportDialog contextLabel={`Library / ${selectedTopic?.title ?? "Node"}`} />
          </div>
        </div>
      </div>

      <Dialog open={diagnosticOpen} onOpenChange={setDiagnosticOpen}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedTopic?.title ?? "Mini-test"}</DialogTitle>
            <DialogDescription>Targeted diagnostic for this node.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {diagnosticQuestions.map((question, questionIndex) => (
              <div key={question.id} className="space-y-2 rounded-lg border border-border/70 p-3">
                <p className="text-sm font-medium">
                  {questionIndex + 1}. {question.prompt}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <Label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/70 p-2 text-sm hover:bg-accent"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={diagnosticAnswers[question.id] === optionIndex}
                        onChange={() =>
                          setDiagnosticAnswers((previous) => ({
                            ...previous,
                            [question.id]: optionIndex,
                          }))
                        }
                      />
                      <span>{option}</span>
                    </Label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              onClick={submitDiagnostic}
              disabled={
                diagnosticQuestions.length === 0 ||
                Object.keys(diagnosticAnswers).length < diagnosticQuestions.length
              }
            >
              Save mini-test mastery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
