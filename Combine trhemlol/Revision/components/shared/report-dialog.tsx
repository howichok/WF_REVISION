"use client";

import { ExternalLink, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { REPORT_FORM_URL } from "@/lib/constants";

export function ReportDialog({ contextLabel }: { contextLabel: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="size-4" />
          Suggest a card / Report error
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content issue</DialogTitle>
          <DialogDescription>
            Share fixes or suggest new cards for: <span className="font-medium">{contextLabel}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <a href={REPORT_FORM_URL} target="_blank" rel="noreferrer">
              Open form
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
