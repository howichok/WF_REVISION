"use client";

import { AlertTriangle, CheckCircle2, CircleX } from "lucide-react";
import { buildSpellSegments } from "@/lib/evaluation";
import type { AnswerCheckReport } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnswerCheckReportProps {
  report: AnswerCheckReport;
}

function RubricDetails({
  title,
  count,
  children,
  emptyLabel,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  emptyLabel: string;
}) {
  return (
    <details className="rounded-lg border border-border/70 [&_summary]:cursor-pointer [&_summary]:select-none [&_summary]:px-3 [&_summary]:py-2.5 [&_summary]:text-sm [&_summary]:font-medium">
      <summary className="flex items-center justify-between gap-2 pr-1">
        <span>{title}</span>
        <span className="tabular-nums text-muted-foreground">{count}</span>
      </summary>
      <div className="space-y-2 border-t border-border/60 p-3 pt-3 text-sm">{count ? children : <p className="text-muted-foreground">{emptyLabel}</p>}</div>
    </details>
  );
}

export function AnswerCheckReportView({ report }: AnswerCheckReportProps) {
  const isOpenEnded = report.answerType === "open-ended";
  const spellIssues = report.spellIssues ?? [];
  const segments = buildSpellSegments(report.response, spellIssues);

  const found = report.rubricReport?.found.length ?? 0;
  const missing = report.rubricReport?.missing.length ?? 0;
  const suspicious = report.rubricReport?.suspicious.length ?? 0;

  return (
    <div className="space-y-3">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Check result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{report.percentage}%</span>
            <span aria-hidden="true"> · </span>
            {report.score} / {report.maxScore}
            <span aria-hidden="true"> · </span>
            <span className="capitalize">{report.answerType}</span>
          </p>

          {isOpenEnded ? (
            <p className="rounded-md border border-amber-300/50 bg-amber-100/40 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
              Rubric-based scoring: keyword and fuzzy matching only. This is not semantic understanding.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {report.rubricReport ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Rubric checks</CardTitle>
            <p className="text-xs text-muted-foreground">
              Expand each section for detail. Summary: {found} found, {missing} missing, {suspicious} suspicious.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <RubricDetails title="Found points" count={found} emptyLabel="No confirmed rubric points found.">
              {report.rubricReport.found.map((point) => (
                <div key={point.criterionId} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2">
                  <p className="inline-flex items-center gap-1 font-medium">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    {point.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    matched: &quot;{point.matchedFragment}&quot; via &quot;{point.matchedTerm}&quot; ({Math.round(point.similarity * 100)}%)
                  </p>
                </div>
              ))}
            </RubricDetails>

            <RubricDetails title="Missing points" count={missing} emptyLabel="No missing rubric points.">
              {report.rubricReport.missing.map((point) => (
                <div key={point.criterionId} className="rounded-lg border border-destructive/30 bg-destructive/10 p-2">
                  <p className="inline-flex items-center gap-1 font-medium">
                    <CircleX className="size-4 text-destructive" />
                    {point.label}
                  </p>
                  <p className="text-xs text-muted-foreground">Expected ideas: {point.expectedTerms.slice(0, 6).join(", ")}</p>
                </div>
              ))}
            </RubricDetails>

            <RubricDetails title="Suspicious matches" count={suspicious} emptyLabel="No suspicious matches.">
              {report.rubricReport.suspicious.map((point) => (
                <div key={point.criterionId} className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-2">
                  <p className="inline-flex items-center gap-1 font-medium">
                    <AlertTriangle className="size-4 text-amber-600" />
                    {point.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    possible match: &quot;{point.matchedFragment}&quot; ({Math.round(point.similarity * 100)}%)
                  </p>
                </div>
              ))}
            </RubricDetails>
          </CardContent>
        </Card>
      ) : null}

      {report.codingReport ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Coding tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {report.codingReport.compileError ? (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                Compile error: {report.codingReport.compileError}
              </p>
            ) : null}

            {report.codingReport.tests.map((test) => (
              <div key={test.id} className="rounded-md border border-border/70 p-2">
                <p className="font-medium">
                  {test.passed ? "PASS" : "FAIL"} - {test.description}
                </p>
                <p className="text-xs text-muted-foreground">expected: {test.expected}</p>
                <p className="text-xs text-muted-foreground">actual: {test.actual}</p>
                {test.error ? <p className="text-xs text-destructive">error: {test.error}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {isOpenEnded ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Spellcheck view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border/70 bg-background/80 p-3 leading-relaxed">
              {segments.map((segment, index) => (
                <span
                  key={`${segment.text}-${index}`}
                  className={segment.issue ? "underline decoration-wavy decoration-destructive underline-offset-4 text-destructive" : ""}
                  title={segment.issue ? `Suggestions: ${segment.issue.suggestions.join(", ") || "None"}` : undefined}
                >
                  {segment.text}
                </span>
              ))}
            </div>
            <details className="rounded-lg border border-border/70 [&_summary]:cursor-pointer [&_summary]:select-none [&_summary]:px-3 [&_summary]:py-2.5 [&_summary]:text-sm [&_summary]:font-medium">
              <summary className="flex items-center justify-between gap-2 pr-1">
                <span>Problem words</span>
                <span className="tabular-nums text-muted-foreground">{spellIssues.length}</span>
              </summary>
              <div className="space-y-2 border-t border-border/60 p-3 pt-3">
                {spellIssues.length ? (
                  spellIssues.map((issue) => (
                    <div key={`${issue.start}-${issue.end}`} className="rounded-md border border-border/70 p-2">
                      <p className="font-medium text-destructive">{issue.word}</p>
                      <p className="text-xs text-muted-foreground">
                        Suggestions: {issue.suggestions.length ? issue.suggestions.join(", ") : "No strong suggestion"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No spelling issues detected by the local dictionary.</p>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
