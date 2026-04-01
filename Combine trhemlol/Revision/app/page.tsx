"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, UserRound } from "lucide-react";
import { useAppState } from "@/components/app-state-provider";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/lib/constants";

export default function WelcomePage() {
  const router = useRouter();
  const { state, isLoaded, createProfile } = useAppState();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !state.profile) {
      return;
    }

    if (state.settings.onboardingComplete) {
      router.replace("/app");
      return;
    }

    router.replace("/onboarding/time");
  }, [isLoaded, state.profile, state.settings.onboardingComplete, router]);

  if (!isLoaded) {
    return <LoadingScreen label="Preparing welcome..." />;
  }

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nickname.trim()) {
      setError("Nickname is required.");
      return;
    }

    setError(null);
    createProfile(nickname, email);
    router.push("/onboarding/time");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,_hsl(167_80%_85%/.35),transparent_45%),radial-gradient(circle_at_85%_20%,_hsl(45_95%_85%/.45),transparent_40%)]" />
      <Card className="relative w-full max-w-2xl border-border/70 bg-card/90 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">T Level Digital Software Development (Core)</p>
          <CardTitle className="text-3xl md:text-4xl">{APP_TITLE}</CardTitle>
          <CardDescription className="max-w-xl text-base">
            One profile. Fast setup. Focused daily tasks to Paper 1 on <strong>2 June 2026</strong> and Paper 2 on <strong>9 June 2026</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname *</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="e.g. Bri"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button size="lg" type="submit" className="w-full sm:w-auto">
              Create profile
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
