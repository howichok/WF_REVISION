"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnswerCheckHistoryItem } from "@/lib/types";

interface AnswerCheckHistoryProps {
  items: AnswerCheckHistoryItem[];
  limit?: number;
}

export function AnswerCheckHistory({ items, limit = 6 }: AnswerCheckHistoryProps) {
  const rows = items.slice(0, limit);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Answer check history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.length ? (
          rows.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.questionTitle}</p>
                <Badge variant="outline">{item.percentage}%</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                {item.answerType} | {new Date(item.checkedAt).toLocaleString("en-GB")}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No checked answers saved yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
