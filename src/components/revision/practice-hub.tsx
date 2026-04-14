"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FilePenLine,
  Layers3,
  MessageSquare,
  Search,
  Target,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui";
import { revisionTopicsListHref } from "@/lib/revision-routes";
import { cn } from "@/lib/utils";

interface PracticeHubProps {
  onOpenDiagnostic?: () => void;
  compact?: boolean;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function PracticeHub({ compact = false }: PracticeHubProps) {
  return (
    <div className={cn("mx-auto w-full", compact ? "max-w-4xl" : "max-w-6xl")}>
      <motion.header
        className="mb-10 text-center sm:mb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/90">
          Revision
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Simple revision, exam questions, or ESP
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Pick fast recall, a timed paper-style run, or the project workflow for planning, code evidence, and reflection.
        </p>
      </motion.header>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={revisionTopicsListHref({ exam: false, fromHub: true })}
            className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-accent/25 bg-gradient-to-br from-accent/12 via-card to-background/80 p-6 shadow-[0_24px_64px_-28px_rgba(139,92,246,0.3)] transition-all duration-300",
                "hover:-translate-y-1 hover:border-accent/35 hover:shadow-[0_28px_64px_-24px_rgba(139,92,246,0.38)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              compact ? "p-5" : "sm:p-8"
            )}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/25 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/15"
              aria-hidden
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/30 to-accent/5 shadow-inner">
                  <Search size={22} className="text-accent" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      Simple revision
                    </h2>
                    <Badge variant="accent" className="font-medium">
                      Fast Q/A
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Run recall, then quick checks while you are still learning the topic.
                  </p>
                </div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={18} strokeWidth={2} />
              </span>
            </div>

            <ul className="relative mt-6 grid gap-2 sm:mt-8">
              {[
                { icon: Zap, label: "Recall", hint: "Terms and points from memory" },
                { icon: MessageSquare, label: "Quick Q/A", hint: "Fast checks before long answers" },
              ].map(({ icon: Icon, label, hint }) => (
                <li
                  key={label}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:border-accent/15 group-hover:bg-background"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={revisionTopicsListHref({ exam: true, fromHub: true })}
            className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-warning/30 bg-gradient-to-br from-warning/14 via-card to-background/80 p-6 shadow-[0_24px_64px_-28px_rgba(245,158,11,0.26)] transition-all duration-300",
              "hover:-translate-y-1 hover:border-warning/40 hover:shadow-[0_28px_64px_-24px_rgba(245,158,11,0.32)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              compact ? "p-5" : "sm:p-8"
            )}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-10 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/15"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-orange-400/10 blur-3xl"
              aria-hidden
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-warning/25 bg-gradient-to-br from-warning/35 to-warning/5 shadow-inner">
                  <Target size={22} className="text-warning" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      Exam questions
                    </h2>
                    <Badge variant="warning" className="font-medium">
                      Timed session
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    One topic, full screen, timer on. Work through mapped questions like a paper; AI marking runs once at the end.
                  </p>
                </div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={18} strokeWidth={2} />
              </span>
            </div>

            <ul className="relative mt-6 grid gap-2 sm:mt-8">
              {[
                { icon: ClipboardList, label: "Paper-style flow", hint: "One question on screen at a time, exam-style layout" },
                { icon: FilePenLine, label: "Marking at the finish", hint: "Complete the paper (or time runs out), then run the checker" },
              ].map(({ icon: Icon, label, hint }) => (
                <li
                  key={label}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:border-warning/20 group-hover:bg-background"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            role="note"
            aria-label="ESP project route — coming soon"
            className={cn(
              "relative flex h-full flex-col overflow-hidden rounded-lg border border-success/25 bg-gradient-to-br from-success/10 via-card to-background/80 p-6 shadow-[0_24px_64px_-28px_rgba(21,128,61,0.24)]",
              compact ? "p-5" : "sm:p-8"
            )}
          >
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-success/25 bg-success/12 shadow-inner">
                  <Layers3 size={22} className="text-success" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                      ESP
                    </h2>
                    <Badge variant="success" className="font-medium">
                      Project route
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Learn the task order, practise deliverables, and rehearse the evidence you need for each part.
                  </p>
                </div>
              </div>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 text-muted-foreground"
                aria-hidden
              >
                <ArrowRight size={18} strokeWidth={2} />
              </span>
            </div>

            <ul className="relative mt-6 grid gap-2 sm:mt-8">
              {[
                { icon: ClipboardList, label: "Plan, fix, design", hint: "What to produce before coding" },
                { icon: FilePenLine, label: "Build and evaluate", hint: "Evidence, testing, reflection" },
              ].map(({ icon: Icon, label, hint }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/75 px-4 py-3 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/12 text-success">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Slight tinted glass over the whole card — low blur + light fill so “ESP” stays readable */}
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-lg border border-white/15 bg-gradient-to-b from-background/[0.14] via-success/[0.05] to-background/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[2px] backdrop-saturate-105 dark:border-white/[0.08] dark:from-background/[0.12] dark:via-success/[0.06] dark:to-background/[0.18] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4" aria-hidden>
              <div className="max-w-[min(100%,17rem)] rounded-2xl border border-border/55 bg-background/92 px-5 py-4 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] ring-1 ring-foreground/[0.05] dark:bg-card/92 dark:ring-white/[0.06]">
                <p className="text-balance text-base font-bold uppercase tracking-[0.22em] text-foreground sm:text-lg">
                  Coming soon
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-snug text-muted-foreground">
                  Employer Set Project route opens here next
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
