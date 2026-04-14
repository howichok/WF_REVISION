"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, FileText, Hammer, Wrench } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { CODEX_ESP_PRACTICE_METADATA } from "@/data/curriculum";
import { ESP_TASK_STEPS, getEspTaskHref } from "@/components/revision/esp/esp-task-meta";

const introBeats = [
  "Read the pack",
  "Plan the project",
  "Find and fix defects",
  "Design the solution",
  "Build evidence",
  "Evaluate with proof",
];

const receipt = [
  "Brief and constraints",
  "Starter code or artefacts",
  "Data, logs, plans, or outputs",
];

const production = [
  "A justified plan",
  "A fix with a test log",
  "A design another developer can follow",
  "Working evidence and evaluation",
];

function reveal(index: number, reduceMotion: boolean) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.01 : 0.45, delay: reduceMotion ? 0 : index * 0.12 },
  };
}

export function EspHubPage() {
  const reduceMotionSetting = useReducedMotion();
  const reduceMotion = Boolean(reduceMotionSetting);
  const taskSteps = ESP_TASK_STEPS.filter((step) => step.id !== "pre_release");

  return (
    <PageContainer size="xl" className="py-6 sm:py-8">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="esp" />

        <section className="relative isolate overflow-hidden rounded-lg bg-[#101010] text-[#f7f7f2] shadow-[0_30px_90px_-46px_rgba(0,0,0,0.8)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />

          <div className="relative grid min-h-[720px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:py-10">
            <div>
              <motion.p {...reveal(0, reduceMotion)} className="text-sm font-semibold text-[#2dd4bf]">
                Employer Set Project
              </motion.p>
              <motion.h1 {...reveal(1, reduceMotion)} className="mt-4 text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
                Watch the ESP unfold like a delivery story.
              </motion.h1>
              <motion.p {...reveal(2, reduceMotion)} className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
                Read the brief, plan the project, repair defects, design the solution, build evidence, then evaluate it with proof.
              </motion.p>
              <motion.div {...reveal(3, reduceMotion)} className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={getEspTaskHref("task_1")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#2dd4bf] px-5 text-sm font-semibold text-black transition-colors hover:bg-[#5eead4]"
                >
                  Start Task 1
                  <ArrowRight size={16} />
                </Link>
                <span className="text-sm text-white/55">{CODEX_ESP_PRACTICE_METADATA.length} practice prompts wait inside the lessons.</span>
              </motion.div>
            </div>

            <div className="grid gap-5">
              <motion.div {...reveal(1, reduceMotion)} className="rounded-lg border border-white/12 bg-white/[0.055] p-4 sm:p-5">
                <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#f59e0b]">
                  <FileText size={17} />
                  From evidence pack to final reflection
                </div>
                <div className="space-y-3">
                  {introBeats.map((beat, index) => (
                    <motion.div key={beat} {...reveal(index + 2, reduceMotion)} className="grid gap-3 sm:grid-cols-[2.25rem_1fr] sm:items-center">
                      <div className="flex size-9 items-center justify-center rounded-md bg-[#2dd4bf] text-sm font-bold text-black">
                        {index + 1}
                      </div>
                      <div className="relative rounded-md border border-white/10 bg-black/30 px-4 py-3">
                        <p className="font-semibold text-white">{beat}</p>
                        {index < introBeats.length - 1 ? (
                          <motion.div
                            initial={reduceMotion ? false : { scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: reduceMotion ? 0.01 : 0.38, delay: reduceMotion ? 0 : 0.35 + index * 0.12 }}
                            className="absolute -bottom-3 left-4 hidden h-3 w-px origin-top bg-[#2dd4bf]/60 sm:block"
                          />
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <div className="grid gap-4 xl:grid-cols-2">
                <motion.div {...reveal(4, reduceMotion)} className="rounded-lg border border-white/12 bg-black/30 p-4">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Wrench size={16} className="text-[#f59e0b]" />
                    What you are given
                  </p>
                  <ul className="space-y-2 text-sm text-white/68">
                    {receipt.map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#2dd4bf]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div {...reveal(5, reduceMotion)} className="rounded-lg border border-white/12 bg-black/30 p-4">
                  <p className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Hammer size={16} className="text-[#22c55e]" />
                    What you produce
                  </p>
                  <ul className="space-y-2 text-sm text-white/68">
                    {production.map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#22c55e]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <motion.div {...reveal(6, reduceMotion)} className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-4 text-sm text-[#fde68a]">
                {taskSteps.map((step) => `${step.label}: ${step.action}`).join("  |  ")}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
