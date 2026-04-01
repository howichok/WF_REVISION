"use client";

import { Link2, Share2, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SharePanelProps {
  summary: string;
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

export function SharePanel({ summary }: SharePanelProps) {
  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ text: summary, url });
        toast.success("Share opened");
      } catch {
        toast.message("Share cancelled");
      }
      return;
    }

    await copyText(summary, "Summary");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => copyText(summary, "Summary")}>
        <ClipboardCopy className="size-4" />
        Copy summary
      </Button>
      <Button variant="outline" size="sm" onClick={() => copyText(url, "Link")}>
        <Link2 className="size-4" />
        Copy link
      </Button>
      <Button size="sm" onClick={handleNativeShare}>
        <Share2 className="size-4" />
        Share
      </Button>
    </div>
  );
}
