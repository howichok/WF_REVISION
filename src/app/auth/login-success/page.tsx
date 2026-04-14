"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

function LoginSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const next = useMemo(() => {
    if (!nextRaw || !nextRaw.startsWith("/") || nextRaw.startsWith("//")) {
      return "/revision";
    }
    return nextRaw;
  }, [nextRaw]);

  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    const redirect = window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 3000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirect);
    };
  }, [next, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
        <CheckCircle2 className="h-9 w-9" aria-hidden />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">Login successful</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        You are signed in. We will send you to the app in {seconds} second{seconds === 1 ? "" : "s"}, or continue now.
      </p>
      <Button className="mt-8" onClick={() => router.replace(next)}>
        Continue
      </Button>
      <p className="mt-10 text-xs text-muted-foreground">
        Wrong place?{" "}
        <Link href="/" className="text-accent underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
        </div>
      }
    >
      <LoginSuccessInner />
    </Suspense>
  );
}
