"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";

function LoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 pb-24">
      <Card className="p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-[#2f69b5]">Revision OS</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{detail}</p>
      </Card>
    </div>
  );
}

export function SessionGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const hasUser = Boolean(auth.currentUser);
  const onboardingCompleted = Boolean(auth.currentUser?.profile.onboardingCompleted);

  useEffect(() => {
    if (!auth.hydrated) return;

    if (!hasUser) {
      if (pathname !== "/") {
        router.replace("/");
      }
      return;
    }

    if (!onboardingCompleted) {
      if (pathname !== "/setup") {
        router.replace("/setup");
      }
      return;
    }

    if (pathname === "/" || pathname === "/setup") {
      router.replace("/revision");
    }
  }, [auth.hydrated, hasUser, onboardingCompleted, pathname, router]);

  if (!auth.hydrated) {
    return (
      <LoadingCard
        title="Loading your revision workspace"
        detail="Reconnecting local progress, account state, and personalised revision profile."
      />
    );
  }

  if (!hasUser && pathname !== "/") {
    return (
      <LoadingCard
        title="Returning to About"
        detail="Start from the About page, then open the login or sign up overlay before entering setup, revision, or library."
      />
    );
  }

  if (hasUser && !onboardingCompleted && pathname !== "/setup") {
    return (
      <LoadingCard
        title="Opening Setup"
        detail="Your account is ready. Finish the personalisation and assess-skills flow before entering Revision."
      />
    );
  }

  if (hasUser && onboardingCompleted && (pathname === "/" || pathname === "/setup")) {
    return (
      <LoadingCard
        title="Opening Revision"
        detail="Your setup is complete, so the app is moving you into the personalised Revision workspace."
      />
    );
  }

  return <>{children}</>;
}
