"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Map,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { BrandMark } from "@/components/ui/brand-mark";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "#about", label: "About" },
  { href: "#journey", label: "Journey" },
  { href: "#knowledge-map", label: "Knowledge Map" },
  { href: "#modes", label: "Modes" },
];

const ABOUT_PANELS = [
  {
    title: "Core Paper 1",
    detail: "Programming, problem solving, and computational thinking with a guided route into active revision.",
    icon: BrainCircuit,
    tone: "blue",
  },
  {
    title: "Core Paper 2",
    detail: "Data, legislation, security, and practical digital systems through exam-first revision priorities.",
    icon: ShieldCheck,
    tone: "orange",
  },
  {
    title: "ESP + Occupational Specialism",
    detail: "Scenario work, planning, implementation, and evidence tracking in one connected revision space.",
    icon: BookOpenText,
    tone: "mixed",
  },
] as const;

const FLOW_STEPS = [
  {
    index: "01",
    title: "Start from About",
    detail: "Open the platform, understand the route, and begin from a clean Start Revision action instead of landing inside a crowded dashboard.",
  },
  {
    index: "02",
    title: "Sign in and set your route",
    detail: "Use the login or sign up overlay, then choose the papers and weak areas you want the system to track.",
  },
  {
    index: "03",
    title: "Run the mini topic check",
    detail: "Answer short questions across your selected topics so the platform can map strengths, weak areas, and first priorities.",
  },
];

const KNOWLEDGE_POINTS = [
  "Study path and topic coverage by paper",
  "Weak areas from both self-selection and mini test evidence",
  "First upcoming exam, countdown, and what to revise before it",
];

function AboutPanel({
  title,
  detail,
  tone,
  icon: Icon,
}: {
  title: string;
  detail: string;
  tone: "blue" | "orange" | "mixed";
  icon: typeof BrainCircuit;
}) {
  const toneClass =
    tone === "orange"
      ? "bg-[#fff0e4] text-[#c1651b]"
      : tone === "mixed"
        ? "bg-[#eef2fb] text-[#385e8f]"
        : "bg-[#edf4fd] text-[#2f69b5]";

  return (
    <div className="rounded-[1.5rem] border border-[#e3d8cc] bg-white/74 p-5 shadow-[0_20px_36px_-30px_rgba(15,35,72,0.38)]">
      <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl", toneClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

export function HomeView() {
  const auth = useAuth();
  const router = useRouter();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");

  const primaryActionLabel = useMemo(() => {
    if (!auth.currentUser) return "Start Revision";
    return auth.currentUser.profile.onboardingCompleted ? "Continue Revision" : "Continue Setup";
  }, [auth.currentUser]);

  function openStartRevision() {
    if (!auth.hydrated) return;

    if (!auth.currentUser) {
      setOverlayOpen(true);
      return;
    }

    router.push(auth.currentUser.profile.onboardingCompleted ? "/revision" : "/setup");
  }

  async function handleAuthSubmit(mode: "login" | "signup") {
    if (!username.trim() || !password.trim()) {
      setAuthError("Enter both a username and a password.");
      return;
    }

    setAuthPending(true);
    setAuthError("");
    const result = mode === "login" ? await auth.login(username, password) : await auth.signUp(username, password);
    setAuthPending(false);

    if (!result.ok) {
      setAuthError(result.error ?? "That action could not be completed.");
      return;
    }

    setUsername("");
    setPassword("");
    setOverlayOpen(false);
    router.push("/setup");
  }

  return (
    <>
      <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-24">
        <header className="rounded-[2rem] border border-[#ddd5ca] bg-[#f7f3ed]/96 px-5 py-4 shadow-[0_28px_60px_-42px_rgba(15,35,72,0.5)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <BrandMark />

            <nav className="flex flex-wrap items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-[#ddd5ca] bg-white/72 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button type="button" onClick={openStartRevision} className="app-button-orange !rounded-full !px-5 !py-3">
              {primaryActionLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section id="about" className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <Card className="bg-[#f7f3ed]/95 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f69b5]">About the platform</p>
            <h1 className="mt-4 max-w-3xl text-[3.4rem] font-semibold leading-[1.02] tracking-tight text-slate-900">
              Revision that feels focused before the first question even starts.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              This is a T Level Digital Software Development revision environment. You begin on an about screen, open
              a clean login or sign up overlay, complete a short setup and mini test, and then move into a Revision
              workspace that already knows what needs attention first.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openStartRevision} className="app-button-blue">
                Start Revision
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="#journey" className="app-button-muted">
                See the setup flow
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {ABOUT_PANELS.map((panel) => (
                <AboutPanel key={panel.title} {...panel} />
              ))}
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(24,69,126,0.98),rgba(17,53,98,0.98))] p-8 text-white shadow-[0_32px_64px_-42px_rgba(7,29,64,0.75)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Exam-first approach</p>
            <h2 className="mt-4 text-[2.3rem] font-semibold tracking-tight">A calmer way to prepare for each assessment.</h2>
            <p className="mt-4 text-base leading-7 text-blue-50">
              The system does not dump everything onto one page. It stages the experience properly: learn what the
              platform does, start revision, answer a short survey, complete a mini topic check, then open the guided
              dashboard with your first focus areas already mapped.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "ESP Task 1 - 11 May",
                "ESP Task 2 - 13 May",
                "ESP Task 3 (Design) - 15 May",
                "Paper 1 - 22 May",
                "Paper 2 - 2 June",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-[1.2rem] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/16 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm text-blue-50">{item}</span>
                  </div>
                  <CalendarDays className="h-4 w-4 text-blue-100" />
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section id="journey" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-[#f7f3ed]/95 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f69b5]">Journey</p>
            <h2 className="mt-3 text-[2.3rem] font-semibold tracking-tight text-slate-900">The site now opens in the right order.</h2>
            <div className="mt-7 space-y-4">
              {FLOW_STEPS.map((step) => (
                <div key={step.index} className="rounded-[1.4rem] border border-[#e3d8cc] bg-white/74 p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#edf4fd] text-sm font-semibold text-[#2f69b5]">
                      {step.index}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card id="knowledge-map" className="bg-[#f7f3ed]/95 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f69b5]">Knowledge map</p>
            <h2 className="mt-3 text-[2.3rem] font-semibold tracking-tight text-slate-900">
              Survey first, mini test second, live study map after that.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              After login, the setup page asks what you want to study, which topics feel weak, and then runs a compact
              topic test. That data becomes a knowledge map with strengths, weak areas, priority topics, and the next
              assessment that needs your attention.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#6e9bdd,#2f69b5)] p-5 text-white shadow-[0_28px_48px_-34px_rgba(47,105,181,0.8)]">
                <p className="text-sm font-semibold text-blue-50">What the map tells you</p>
                <div className="mt-4 space-y-3">
                  {KNOWLEDGE_POINTS.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1rem] bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f6d19f]" />
                      <span className="text-sm text-blue-50">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#e3d8cc] bg-white/78 p-5">
                <p className="text-sm font-semibold text-slate-900">What happens next</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Revision", detail: "Active study, next steps, quick practice, progress, and urgent exam focus.", icon: Sparkles },
                    { label: "Library", detail: "Past papers, mark schemes, notes, PDFs, and course materials in a calmer browse mode.", icon: Map },
                    { label: "Knowledge-led", detail: "Both modes stay tied to your setup, mini test results, and saved progress.", icon: BrainCircuit },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3 rounded-[1.1rem] border border-[#e9dfd3] bg-[#fcfaf7] px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4fd] text-[#2f69b5]">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section id="modes" className="grid gap-6 xl:grid-cols-2">
          <Card className="bg-[#f7f3ed]/95 p-0">
            <div className="border-b border-[#e4dbd0] px-6 py-4">
              <BrandMark className="[&>span]:text-[1.9rem]" />
              <div className="mt-3 h-1.5 w-28 rounded-full bg-[#2f69b5]" />
            </div>

            <div className="px-6 py-6">
              <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Revision mode</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Active guided study with current priorities, weak topics, quick practice, progress, and countdown
                pressure built around the next assessment.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Welcome back and current focus",
                  "Knowledge map strengths and weak areas",
                  "Recommended next action and exam urgency",
                ].map((item) => (
                  <div key={item} className="app-list-row">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf4fd] text-[#2f69b5]">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{item}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-[#f7f3ed]/95 p-0">
            <div className="border-b border-[#e4dbd0] px-6 py-4">
              <BrandMark label="Library" className="[&>span]:text-[1.9rem]" />
              <div className="mt-3 h-1.5 w-24 rounded-full bg-[#2f69b5]" />
            </div>

            <div className="px-6 py-6">
              <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Library mode</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                A quieter browse area for papers, schemes, notes, PDFs, and teacher resources. It supports revision
                without feeling like the active question flow.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Past Papers",
                  "Mark Schemes",
                  "Revision Notes",
                  "PDF Resources",
                  "Teacher Resources",
                ].map((item) => (
                  <div key={item} className="app-list-row">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0e4] text-[#c1651b]">
                        <BookOpenText className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{item}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </div>

      {overlayOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#081f43]/50 px-4 py-8 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOverlayOpen(false)} />
          <div className="relative z-10 w-full max-w-[30rem] rounded-[2rem] border border-[#d9cfc2] bg-[#f7f3ed] p-5 shadow-[0_36px_80px_-34px_rgba(8,31,67,0.55)]">
            <div className="rounded-[1.65rem] border border-[#ddd5ca] bg-[#f8f4ee] p-5 shadow-[0_22px_44px_-36px_rgba(15,35,72,0.45)]">
              <h2 className="text-[2.1rem] font-semibold tracking-tight text-slate-900">Welcome!</h2>
              <p className="mt-3 max-w-xs text-base leading-7 text-slate-600">
                Log in or create an account to save your progress.
              </p>

              <div className="mt-6 flex gap-2 rounded-full bg-[#ece4d9] p-1">
                {(["login", "signup"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAuthMode(mode)}
                    className={cn(
                      "flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition",
                      authMode === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500",
                    )}
                  >
                    {mode === "login" ? "Log In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  className="app-input"
                />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  className="app-input"
                />
              </div>

              {authError ? <p className="mt-3 text-sm text-[#b45847]">{authError}</p> : null}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => handleAuthSubmit("login")} disabled={authPending} className="app-button-blue">
                  Log In
                </button>
                <button type="button" onClick={() => handleAuthSubmit("signup")} disabled={authPending} className="app-button-orange">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
