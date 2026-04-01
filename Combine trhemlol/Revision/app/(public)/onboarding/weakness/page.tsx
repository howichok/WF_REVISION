"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleGauge, Sparkles } from "lucide-react";
import { OnboardingGuard } from "@/components/guards/onboarding-guard";
import { useAppState } from "@/components/app-state-provider";
import { getQuizByTopic, papersById, syllabusTreeByPaper, type TopicTreeNode, topicById } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function WeaknessRow({
  node,
  weakMap,
  masteryMap,
  onToggleWeak,
  onDiagnostic,
}: {
  node: TopicTreeNode;
  weakMap: Record<string, boolean>;
  masteryMap: Record<string, number>;
  onToggleWeak: (topicId: string, next: boolean) => void;
  onDiagnostic: (topicId: string) => void;
}) {
  const mastery = masteryMap[node.id] ?? 50;
  const isWeak = weakMap[node.id] ?? false;

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border border-border/70 bg-background/85 p-3"
        style={{ marginLeft: `${node.depth * 14}px` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{node.title}</p>
            <p className="text-xs text-muted-foreground">{node.outcomes.length} outcomes</p>
          </div>
          <Badge variant="outline">Mastery {mastery}%</Badge>
        </div>
        <Progress value={mastery} className="my-2" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-md border border-border/70 px-2 py-1 text-xs">
            <Checkbox checked={isWeak} onCheckedChange={(checked) => onToggleWeak(node.id, Boolean(checked))} />
            Mark weak
          </label>
          <Button size="sm" variant="outline" onClick={() => onDiagnostic(node.id)}>
            <CircleGauge className="size-4" />
            Run mini-test
          </Button>
          {mastery >= 70 ? (
            <p className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="size-3.5" />
              Stable
            </p>
          ) : null}
        </div>
      </div>

      {node.children.map((child) => (
        <WeaknessRow
          key={`${child.paperId}-${child.id}`}
          node={child}
          weakMap={weakMap}
          masteryMap={masteryMap}
          onToggleWeak={onToggleWeak}
          onDiagnostic={onDiagnostic}
        />
      ))}
    </div>
  );
}

export default function OnboardingWeaknessPage() {
  const router = useRouter();
  const { state, setManualWeak, setTopicMastery, completeOnboarding } = useAppState();

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const activeQuestions = useMemo(() => {
    if (!activeTopicId) {
      return [];
    }

    return getQuizByTopic(activeTopicId, true).slice(0, 6);
  }, [activeTopicId]);

  const activeTopic = activeTopicId ? topicById[activeTopicId] : null;
  const weakMap = Object.fromEntries(
    Object.entries(state.topicProgress).map(([topicId, value]) => [topicId, value.weakManual])
  );
  const masteryMap = Object.fromEntries(
    Object.entries(state.topicProgress).map(([topicId, value]) => [topicId, value.mastery])
  );

  const startDiagnostic = (topicId: string) => {
    setActiveTopicId(topicId);
    setAnswers({});
  };

  const submitDiagnostic = () => {
    if (!activeTopicId || activeQuestions.length === 0) {
      return;
    }

    const correct = activeQuestions.filter(
      (question) => answers[question.id] === question.correctIndex
    ).length;

    const mastery = Math.round((correct / activeQuestions.length) * 100);
    setTopicMastery(activeTopicId, mastery);
    setActiveTopicId(null);
    setAnswers({});
  };

  return (
    <OnboardingGuard step="weakness">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-2xl">Weakness setup</CardTitle>
            <CardDescription>
              Checklist and diagnostics are generated from <code>content/syllabus.json</code>.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {(["paper1", "paper2"] as const).map((paperId) => (
            <Card key={paperId} className="border-border/70">
              <CardHeader>
                <CardTitle>{papersById[paperId].title}</CardTitle>
                <CardDescription>{papersById[paperId].examTitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {syllabusTreeByPaper[paperId].map((node) => (
                  <WeaknessRow
                    key={`${node.paperId}-${node.id}`}
                    node={node}
                    weakMap={weakMap}
                    masteryMap={masteryMap}
                    onToggleWeak={setManualWeak}
                    onDiagnostic={startDiagnostic}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-secondary/35">
          <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Setup ready</p>
              <p className="text-lg font-semibold">Generate my plan and open dashboard</p>
            </div>
            <Button size="lg" onClick={() => { completeOnboarding(); router.push("/app"); }}>
              <Sparkles className="size-4" />
              Finish onboarding
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(activeTopicId)} onOpenChange={(open) => !open && setActiveTopicId(null)}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{activeTopic?.title ?? "Topic diagnostic"}</DialogTitle>
            <DialogDescription>
              Mini-test generated from syllabus node {activeTopicId ?? ""} and its extracted outcomes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {activeQuestions.map((question, questionIndex) => (
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
                        checked={answers[question.id] === optionIndex}
                        onChange={() =>
                          setAnswers((previous) => ({
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
              disabled={activeQuestions.length === 0 || Object.keys(answers).length < activeQuestions.length}
            >
              Save diagnostic mastery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OnboardingGuard>
  );
}
