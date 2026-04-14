"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function SiteAccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/site-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not unlock");
        return;
      }
      const data = (await res.json()) as { disabled?: boolean };
      if (data.disabled) {
        router.replace("/");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Site access</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This preview uses an access password set by the host. Enter it to continue.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-accent/30 focus:ring-2"
            required
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Checking…" : "Continue"}
        </Button>
      </form>
      <p className="mt-8 text-[11px] leading-relaxed text-muted-foreground/80">
        If you are the site owner and expected no gate, remove{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">SITE_GATE_PASSWORD</code> from the server
        environment.
      </p>
    </div>
  );
}
