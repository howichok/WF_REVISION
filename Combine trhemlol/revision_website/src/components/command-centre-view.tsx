"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarDays, CheckCircle2, ChevronRight, Clock3, FolderOpen, Sparkles } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useProgress } from "@/components/providers/progress-provider";
import { BrandMark } from "@/components/ui/brand-mark";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { buildActionDirectives, buildPaperReadiness } from "@/lib/domain/analytics";
import { buildLearnerPersonalisation, getPaperLabel, groupResourcesByCategory } from "@/lib/domain/personalisation";
import type { LibraryResource, Question, Topic } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const LIBRARY_PREVIEW = [
  { key: "Past Papers", label: "Past Papers", icon: BookOpenText },
  { key: "Mark Schemes", label: "Mark Schemes", icon: FolderOpen },
  { key: "Revision Notes", label: "Revision Notes", icon: BookOpenText },
  { key: "PDFs", label: "PDF Resources", icon: FolderOpen },
  { key: "Teacher Resources", label: "Teacher Resources", icon: FolderOpen },
] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryTile({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ label: string; detail: string; href?: string }>;
  tone: "blue" | "orange" | "green";
}) {
  const tones = {
    blue: "bg-[#edf4fd] text-[#2f69b5]",
    orange: "bg-[#fff0e4] text-[#c1651b]",
    green: "bg-[#edf7ef] text-[#4b8f60]",
  };

  return (
    <div className="rounded-[1.45rem] border border-[#ddd5ca] bg-white/72 p-4 shadow-[0_18px_30px_-28px_rgba(15,35,72,0.45)]">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const content = (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6ddd2] bg-white/75 px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", tones[tone])}>
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="truncate text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          );

          return item.href ? (
            <Link key={`${title}-${item.label}`} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={`${title}-${item.label}`}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

export function CommandCentreView({
  topics,
  questions,
  resources,
}: {
  topics: Topic[];
  questions: Question[];
  resources: LibraryResource[];
}) {
  const auth = useAuth();
  const progress = useProgress();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  const personalisation = buildLearnerPersonalisation(topics, questions, progress, currentUser.profile);
  const directives = buildActionDirectives(topics, questions, progress);
  const groupedResources = groupResourcesByCategory(resources);
  const readiness = buildPaperReadiness(topics, questions, progress.attempts);
  const focusRoute = personalisation.recommendedTopic?.route ?? "/question-bank";
  const progressPercent = readiness.length
    ? Math.round(readiness.reduce((sum, item) => sum + item.readinessPercent, 0) / readiness.length)
    : 0;
  const recommendedResources = resources.filter((resource) =>
    resource.tags.some((tag) =>
      currentUser.profile.selectedPapers.map((paper) => getPaperLabel(paper)).includes(tag),
    ),
  );

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-24">
      <section className="rounded-[2rem] border border-[#ddd5ca] bg-[#f7f3ed] p-6 shadow-[0_30px_70px_-44px_rgba(15,35,72,0.5)]">
        <div className="flex flex-col gap-4 border-b border-[#e4dbd0] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <BrandMark />
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#edf4fd] px-4 py-2 text-sm font-semibold text-[#2f69b5]">Revision</span>
              <Link href="/library" className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                Library
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4fd] text-base font-semibold text-[#2f69b5]">
              {currentUser.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{currentUser.username}</p>
              <p className="text-xs text-slate-500">{progress.attempts.length} saved attempts</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h1 className="text-[2.2rem] font-semibold tracking-tight text-slate-900">Your Study Profile</h1>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.72fr]">
            <div className="space-y-5">
              <div className="rounded-[1.55rem] bg-[linear-gradient(135deg,#6e9bdd,#2f69b5)] px-5 py-6 text-white shadow-[0_28px_48px_-34px_rgba(47,105,181,0.8)]">
                <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-tight">Welcome back!</h2>
                    <p className="mt-3 text-base text-blue-50">
                      {personalisation.upcomingExam
                        ? `Your first ${personalisation.upcomingExam.kind} is ${personalisation.upcomingExam.title} on ${formatDate(personalisation.upcomingExam.examDate)}.`
                        : "Your revision room is live and ready for guided study."}
                    </p>
                    <p className="mt-2 text-sm text-blue-100">
                      {personalisation.upcomingExam
                        ? `${personalisation.upcomingExam.daysUntil} days to go · ${personalisation.upcomingExam.topicsToCover} topics still need attention before then.`
                        : "Use your next steps to build your first strong revision streak."}
                    </p>
                  </div>

                  <div className="rounded-[1.4rem] bg-white/10 p-4 backdrop-blur-sm">
                    <div className="flex h-28 items-end gap-2">
                      {[18, 28, 34, 46, 60, 74].map((height, index) => (
                        <span
                          key={height}
                          className={cn("flex-1 rounded-t-full", index === 4 ? "bg-[#f2a65d]" : "bg-white/70")}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SummaryTile
                  title="Your Strengths"
                  tone="blue"
                  items={personalisation.strengths.slice(0, 2).map((signal) => ({
                    label: signal.title,
                    detail: `${getPaperLabel(signal.paper)} · ${Math.round(signal.score)}%`,
                    href: signal.route,
                  }))}
                />
                <SummaryTile
                  title="Your Weaknesses"
                  tone="orange"
                  items={personalisation.weakAreas.slice(0, 2).map((signal) => ({
                    label: signal.title,
                    detail: signal.drivers[0],
                    href: signal.route,
                  }))}
                />
                <SummaryTile
                  title="Focus Areas"
                  tone="green"
                  items={personalisation.priorities.slice(0, 2).map((signal) => ({
                    label: signal.title,
                    detail: signal.drivers[0],
                    href: signal.route,
                  }))}
                />
              </div>
            </div>

            <Card className="bg-white/72 p-5">
              <h2 className="text-[1.6rem] font-semibold tracking-tight text-slate-900">Next Steps</h2>
              <div className="mt-4 space-y-3">
                {directives.map((directive, index) => (
                  <Link key={directive.id} href={directive.route} className="app-list-row">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf4fd] text-xs font-bold text-[#2f69b5]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{directive.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{directive.reason}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-[#e4dbd0] bg-white/80 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
                  <CalendarDays className="h-4 w-4" />
                  Exam countdown
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {personalisation.upcomingExam
                    ? `${personalisation.upcomingExam.shortTitle} is in ${personalisation.upcomingExam.daysUntil} days. Focus first on ${personalisation.upcomingExam.focusLabel.toLowerCase()}.`
                    : "Choose a study path to generate your first countdown card."}
                </p>
              </div>

              <Link href={focusRoute} className="app-button-orange mt-5 w-full">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="bg-[#f7f3ed] p-0">
          <div className="border-b border-[#e4dbd0] px-6 py-4">
            <BrandMark className="[&>span]:text-[1.9rem]" />
            <div className="mt-3 h-1.5 w-28 rounded-full bg-[#2f69b5]" />
          </div>

          <div className="px-6 py-6">
            <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Personalised Revision</h2>
            <p className="mt-2 text-sm text-slate-600">Recommended for you</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {personalisation.priorities.slice(0, 3).map((signal, index) => (
                <Link key={signal.topicId} href={signal.route} className="rounded-[1.2rem] border border-[#ddd5ca] bg-white/80 p-3">
                  <div
                    className={cn(
                      "flex h-24 items-center justify-center rounded-[1rem] text-white",
                      index === 0
                        ? "bg-[linear-gradient(135deg,#3f7ecc,#2f69b5)]"
                        : index === 1
                          ? "bg-[linear-gradient(135deg,#2c6a88,#18485e)]"
                          : "bg-[linear-gradient(135deg,#8d6b4b,#6d5038)]",
                    )}
                  >
                    <BookOpenText className="h-8 w-8" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">{signal.title}</p>
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-[1.2rem] border border-[#ddd5ca] bg-white/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf7ef] text-[#4b8f60]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-800">Quick Practice</p>
                    <p className="text-sm text-slate-500">Start a short quiz built from your current signals</p>
                  </div>
                </div>
                <Link href="/question-bank" className="app-button-orange !px-6 !py-3">
                  Start Quiz
                </Link>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Progress</span>
                <Link href="/progress" className="inline-flex items-center gap-1 text-[#2f69b5]">
                  View details <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <ProgressBar percent={progressPercent} className="mt-3" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#f7f3ed] p-0">
          <div className="border-b border-[#e4dbd0] px-6 py-4">
            <BrandMark label="Library" className="[&>span]:text-[1.9rem]" />
            <div className="mt-3 h-1.5 w-24 rounded-full bg-[#2f69b5]" />
          </div>

          <div className="px-6 py-6">
            <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Resource Library</h2>
            <div className="mt-5 space-y-3">
              {LIBRARY_PREVIEW.map((category) => {
                const Icon = category.icon;

                return (
                  <Link key={category.key} href="/library" className="app-list-row">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4fd] text-[#2f69b5]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{category.label}</p>
                        <p className="text-xs text-slate-500">{groupedResources[category.key].length} resources ready</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.2rem] border border-[#ddd5ca] bg-white/80 p-4">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-[#d97b2f]" />
                <div>
                  <p className="text-base font-semibold text-slate-800">Recommended resource track</p>
                  <p className="text-sm text-slate-500">
                    {recommendedResources[0]?.title ?? "Open Library to browse papers, schemes, notes, and PDFs."}
                  </p>
                </div>
              </div>
              <Link href="/library" className="app-button-muted mt-4 w-full">
                Open Library
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
