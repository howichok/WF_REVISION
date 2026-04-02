"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FilePenLine,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui";
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
    <div className={cn("mx-auto w-full", compact ? "max-w-4xl" : "max-w-5xl")}>
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
          Choose your route
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Quick retrieval and coaching first, then full exam-style writing when you are ready.
        </p>
      </motion.header>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/revision/topics?mode=exam-conditions"
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-accent/25 bg-gradient-to-br from-accent/15 via-accent/8 to-transparent p-6 shadow-[0_24px_64px_-28px_rgba(139,92,246,0.45)] transition-all duration-300",
              "hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_32px_72px_-24px_rgba(139,92,246,0.5)]",
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
                    Ask for hints, run recall, and do quick checks while you are still learning the topic.
                  </p>
                </div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={18} strokeWidth={2} />
              </span>
            </div>

            <ul className="relative mt-6 grid gap-2 sm:mt-8">
              {[
                { icon: Sparkles, label: "Ask coach", hint: "Hints and short explanations" },
                { icon: Zap, label: "Recall", hint: "Terms and points from memory" },
                { icon: MessageSquare, label: "Quick Q/A", hint: "Fast checks before long answers" },
              ].map(({ icon: Icon, label, hint }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/[0.12] px-4 py-3 backdrop-blur-sm transition-colors duration-200 group-hover:border-accent/15 group-hover:bg-black/[0.16] dark:bg-white/[0.04] dark:group-hover:bg-white/[0.06]"
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
            href="/revision/topics"
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-warning/30 bg-gradient-to-br from-warning/18 via-amber-500/8 to-transparent p-6 shadow-[0_24px_64px_-28px_rgba(245,158,11,0.38)] transition-all duration-300",
              "hover:-translate-y-1 hover:border-warning/45 hover:shadow-[0_32px_72px_-24px_rgba(245,158,11,0.42)]",
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
                      Exam conditions
                    </h2>
                    <Badge variant="warning" className="font-medium">
                      Plan + write
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Jump straight into the separate timed exam feature for one topic, with full-screen focus and end-of-session checking.
                  </p>
                </div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={18} strokeWidth={2} />
              </span>
            </div>

            <ul className="relative mt-6 grid gap-2 sm:mt-8">
              {[
                { icon: ClipboardList, label: "Separate exam mode", hint: "Dedicated full-screen session with timer" },
                { icon: FilePenLine, label: "Final marking at the end", hint: "Write first, then run the checker once" },
              ].map(({ icon: Icon, label, hint }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/[0.12] px-4 py-3 backdrop-blur-sm transition-colors duration-200 group-hover:border-warning/20 group-hover:bg-black/[0.16] dark:bg-white/[0.04] dark:group-hover:bg-white/[0.06]"
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
      </div>
    </div>
  );
}
