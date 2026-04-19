"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  GraduationCap,
  Layers,
  ListOrdered,
  MonitorPlay,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/features/revision/revision-subnav";
import { ESP_SCENARIOS } from "@/data/esp/scenarios";
import { ESP_TASK_STEPS, getEspScenarioTaskHref } from "@/components/features/revision/esp/esp-task-meta";
import { EspRoulette } from "@/components/features/revision/esp/esp-roulette";
import { EspOfficialSources } from "@/components/features/revision/esp/esp-official-sources";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS = [
  {
    title: "Choose a scenario",
    body: "Each card is a practice client brief. The six ESP stages match the real exam.",
    icon: ListOrdered,
  },
  {
    title: "Follow the lesson, then work offline",
    body: "Animations explain what to do. You complete Word / Excel / code on your device.",
    icon: MonitorPlay,
  },
  {
    title: "Use the templates",
    body: "Download the right file for each stage and fill it as you would under exam conditions.",
    icon: BookOpen,
  },
  {
    title: "Upload for feedback",
    body: "Submit your files for structure checks and AI-style comments where configured.",
    icon: CircleHelp,
  },
];

function reveal(index: number, reduceMotion: boolean) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.01 : 0.4, delay: reduceMotion ? 0 : index * 0.06 },
  };
}

export function EspHubPage() {
  const reduceMotion = false;

  return (
    <div className="relative min-h-[60vh]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(480px,70vh)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(103,92,241,0.18),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(45,212,191,0.12),transparent_50%)]"
      />
      <PageContainer size="xl" className="relative py-8 sm:py-10">
        <div className="space-y-12">
          <RevisionSubnav activeRoute="esp" />

          {/* Hero — lighter, layered */}
          <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-[0_20px_60px_-30px_rgba(17,24,39,0.25)] sm:p-8 lg:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <motion.div {...reveal(0, reduceMotion)} className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <GraduationCap className="size-3.5" />
                  T Level Digital · Employer Set Project
                </motion.div>
                <motion.h1
                  {...reveal(1, reduceMotion)}
                  className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]"
                >
                  One clear path through the ESP — lessons, templates, uploads
                </motion.h1>
                <motion.p {...reveal(2, reduceMotion)} className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Work through <strong className="font-semibold text-foreground/90">pre-release → Task 1 → 4b</strong> with
                  guided steps. Official board PDFs are listed below; practice scenarios help you rehearse the same skills.
                </motion.p>
                <motion.div {...reveal(3, reduceMotion)} className="mt-7 flex flex-wrap items-center gap-3">
                  {ESP_SCENARIOS[0] ? (
                    <Link
                      href={getEspScenarioTaskHref(ESP_SCENARIOS[0].id, "pre_release")}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-[0_12px_40px_-16px_rgba(103,92,241,0.55)] transition-transform hover:-translate-y-0.5"
                    >
                      Start a scenario
                      <ArrowRight size={16} />
                    </Link>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <Layers className="size-3.5 text-accent" />
                    {ESP_SCENARIOS.length} practice briefs
                  </span>
                </motion.div>
              </div>

              <motion.div
                {...reveal(2, reduceMotion)}
                className="rounded-2xl border border-border/60 bg-gradient-to-b from-background/90 to-muted/20 p-5 shadow-inner sm:p-6"
              >
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="size-3.5 text-accent" />
                  How it works
                </p>
                <ul className="mt-5 space-y-4">
                  {HOW_IT_WORKS.map((item, i) => (
                    <li key={item.title} className="flex gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/20">
                        <item.icon className="size-[18px]" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {i + 1}. {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </section>

          {/* Stages */}
          <section className="rounded-3xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-sm sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">The six stages</p>
                <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">What each part of the ESP expects</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  In the exam you move in this order. Inside a scenario you can jump ahead for revision — the stage wizard
                  on the left (desktop) keeps you oriented.
                </p>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border/40 bg-background/50">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Focus</th>
                    <th className="px-4 py-3">Hand in</th>
                    <th className="px-4 py-3">Avoid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {ESP_TASK_STEPS.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        <span className="font-semibold text-foreground">{row.label}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{row.time}</span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 align-top text-foreground/90">{row.action}</td>
                      <td className="px-4 py-3 align-top text-foreground/85">{row.deliverable}</td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{row.avoid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <EspOfficialSources />

          <div className="rounded-3xl border border-border/50 bg-card/40 p-1 shadow-sm">
            <EspRoulette />
          </div>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Practice</p>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">Scenario briefs</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Synthetic contexts aligned to ESP skills — use them to rehearse uploads and feedback. Pair with the official
              downloads above for authentic task wording.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ESP_SCENARIOS.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.35 }}
                >
                  <Link
                    href={getEspScenarioTaskHref(s.id, "pre_release")}
                    className={cn(
                      "group flex h-full flex-col rounded-2xl border border-border/50 bg-gradient-to-b from-card to-card/80 p-5 shadow-sm transition-all",
                      "hover:-translate-y-1 hover:border-accent/35 hover:shadow-[0_16px_40px_-24px_rgba(103,92,241,0.35)]"
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scenario</span>
                    <p className="mt-1 text-lg font-semibold text-foreground group-hover:text-accent">{s.title}</p>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{s.vocationalContext}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      Open — brief read first
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap items-start gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
            <Check className="mt-0.5 size-5 shrink-0 text-[#15803d]" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Exam tip:</strong> In the live ESP you’ll have the full paper and annexes.
              Download the official PDFs/ZIPs above so your practice matches the layout you’ll see on the day.
            </p>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}
