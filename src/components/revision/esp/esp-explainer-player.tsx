"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Table2,
  X,
} from "lucide-react";
import type { QuestionMetadata } from "@/data/curriculum";
import type {
  EspExplainerArtefact,
  EspExplainerScene,
  EspExplainerStep,
} from "@/data/esp/esp-task-lessons";
import { cn } from "@/lib/utils";

interface EspPracticeState {
  question?: QuestionMetadata;
  questionCount: number;
  context: string;
  checklist: string[];
  checkedPoints: Set<number>;
  draft: string;
  onTogglePoint: (index: number) => void;
  onDraftChange: (value: string) => void;
  onLoadNext: () => void;
}

interface EspExplainerPlayerProps {
  scenes: EspExplainerScene[];
  taskLabel: string;
  taskAction: string;
  practice: EspPracticeState;
}

const stageEase = [0.22, 1, 0.36, 1] as const;

function sceneVariants(reduceMotion: boolean) {
  return {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.99 },
    transition: { duration: reduceMotion ? 0.01 : 0.45, ease: stageEase },
  };
}

function revealProps(index = 0, reduceMotion = false) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.01 : 0.38, delay: reduceMotion ? 0 : index * 0.09, ease: stageEase },
  };
}

export function EspExplainerPlayer({ scenes, taskLabel, taskAction, practice }: EspExplainerPlayerProps) {
  const reduceMotionSetting = useReducedMotion();
  const reduceMotion = Boolean(reduceMotionSetting);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRef = useRef(progress);
  const scene = scenes[sceneIndex] ?? scenes[0]!;
  const duration = scene.durationMs || 7000;
  const isActuallyPlaying = isPlaying && !reduceMotion;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const goToScene = useCallback(
    (index: number, keepPlaying = isPlaying) => {
      const next = Math.max(0, Math.min(scenes.length - 1, index));
      setSceneIndex(next);
      setProgress(0);
      setIsPlaying(keepPlaying);
    },
    [isPlaying, scenes.length]
  );

  const goNext = useCallback(() => {
    if (sceneIndex >= scenes.length - 1) {
      setIsPlaying(false);
      setProgress(1);
      return;
    }
    goToScene(sceneIndex + 1);
  }, [goToScene, sceneIndex, scenes.length]);

  const goBack = useCallback(() => {
    goToScene(sceneIndex - 1, false);
  }, [goToScene, sceneIndex]);

  const replay = useCallback(() => {
    setProgress(0);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isActuallyPlaying) return;

    const startedAt = Date.now() - progressRef.current * duration;
    const id = window.setInterval(() => {
      const nextProgress = (Date.now() - startedAt) / duration;
      if (nextProgress >= 1) {
        setProgress(1);
        if (sceneIndex < scenes.length - 1) {
          setSceneIndex((current) => Math.min(scenes.length - 1, current + 1));
          setProgress(0);
        } else {
          setIsPlaying(false);
        }
        return;
      }
      setProgress(nextProgress);
    }, 80);

    return () => window.clearInterval(id);
  }, [duration, isActuallyPlaying, sceneIndex, scenes.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goBack();
      if (event.key === " ") {
        event.preventDefault();
        setIsPlaying((current) => (reduceMotion ? false : !current));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext, reduceMotion]);

  return (
    <section className="relative isolate overflow-hidden rounded-lg bg-[#101010] text-[#f7f7f2] shadow-[0_30px_90px_-46px_rgba(0,0,0,0.8)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#2dd4bf]" style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }} />

      <div className="relative flex flex-col gap-3 border-b border-white/10 bg-black/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs text-white/60">ESP explainer video</p>
          <h2 className="text-base font-semibold text-white">
            {taskLabel}: {taskAction}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/65">
          <span>
            Scene {sceneIndex + 1} of {scenes.length}
          </span>
          <span className="hidden sm:inline">Keyboard: arrows and space</span>
        </div>
      </div>

      <div className="relative min-h-[680px] px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            {...sceneVariants(reduceMotion)}
            className="grid min-h-[620px] content-center gap-6"
          >
            <SceneRenderer scene={scene} practice={practice} reduceMotion={reduceMotion} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative border-t border-white/10 bg-black/45 px-4 py-4 sm:px-6">
        <div className="mb-4 grid grid-cols-7 gap-1" aria-label="Scene scrubber">
          {scenes.map((item, index) => {
            const isCurrent = index === sceneIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToScene(index, false)}
                className={cn(
                  "h-2 rounded-sm border border-white/10 transition-colors",
                  isCurrent ? "bg-[#2dd4bf]" : index < sceneIndex ? "bg-[#22c55e]/70" : "bg-white/15"
                )}
                aria-label={`Go to scene ${index + 1}: ${item.title}`}
              />
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{scene.title}</p>
            <p className="truncate text-xs text-white/60">{scene.focus}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ControlButton onClick={goBack} disabled={sceneIndex === 0}>
              <ArrowLeft size={15} />
              Back
            </ControlButton>
            <ControlButton onClick={() => setIsPlaying((current) => !current)} disabled={reduceMotion}>
              {isActuallyPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isActuallyPlaying ? "Pause" : "Play"}
            </ControlButton>
            <ControlButton onClick={replay}>
              <RotateCcw size={15} />
              Replay
            </ControlButton>
            <ControlButton onClick={goNext} disabled={sceneIndex === scenes.length - 1 && progress >= 1}>
              Next
              <ArrowRight size={15} />
            </ControlButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-3 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SceneRenderer({
  scene,
  practice,
  reduceMotion,
}: {
  scene: EspExplainerScene;
  practice: EspPracticeState;
  reduceMotion: boolean;
}) {
  if (scene.kind === "practicePrompt") {
    return <PracticePromptScene scene={scene} practice={practice} reduceMotion={reduceMotion} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
      <SceneCopy scene={scene} reduceMotion={reduceMotion} />
      {scene.kind === "intro" ? <IntroScene scene={scene} reduceMotion={reduceMotion} /> : null}
      {scene.kind === "processMap" ? <ProcessMapScene scene={scene} reduceMotion={reduceMotion} /> : null}
      {scene.kind === "guidedWalkthrough" ? <GuidedWalkthroughScene scene={scene} reduceMotion={reduceMotion} /> : null}
      {scene.kind === "artefact" ? <ArtefactScene scene={scene} reduceMotion={reduceMotion} /> : null}
      {scene.kind === "mistakeCompare" ? <MistakeCompareScene scene={scene} reduceMotion={reduceMotion} /> : null}
      {scene.kind === "recap" ? <RecapScene scene={scene} reduceMotion={reduceMotion} /> : null}
    </div>
  );
}

function SceneCopy({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  return (
    <div className="max-w-xl">
      <motion.p {...revealProps(0, reduceMotion)} className="mb-3 text-sm font-semibold text-[#2dd4bf]">
        {scene.kicker}
      </motion.p>
      <motion.h3 {...revealProps(1, reduceMotion)} className="text-balance text-3xl font-bold leading-tight text-white sm:text-4xl">
        {scene.title}
      </motion.h3>
      <motion.p {...revealProps(2, reduceMotion)} className="mt-5 text-base leading-relaxed text-white/72">
        {scene.narration}
      </motion.p>
      <motion.div {...revealProps(3, reduceMotion)} className="mt-6 border-l-4 border-[#f59e0b] bg-[#f59e0b]/10 px-4 py-3 text-sm font-medium text-[#fde68a]">
        {scene.focus}
      </motion.div>
    </div>
  );
}

function IntroScene({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(scene.steps ?? []).map((step, index) => (
        <motion.div
          key={step.title}
          {...revealProps(index + 2, reduceMotion)}
          className="min-h-52 rounded-lg border border-white/12 bg-white/[0.06] p-5"
        >
          <p className="text-sm font-semibold text-[#f59e0b]">{step.title}</p>
          <p className="mt-4 text-2xl font-semibold text-white">{step.artefact}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/68">{step.detail}</p>
          <motion.div
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.7, delay: 0.35 + index * 0.15, ease: stageEase }}
            className="mt-6 h-1 origin-left rounded-sm bg-[#2dd4bf]"
          />
        </motion.div>
      ))}
    </div>
  );
}

function ProcessMapScene({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  const steps = scene.steps ?? [];

  return (
    <div className="rounded-lg border border-white/12 bg-black/30 p-4 sm:p-5">
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <motion.div key={step.title} {...revealProps(index, reduceMotion)} className="relative grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex size-11 items-center justify-center rounded-md bg-[#2dd4bf] text-sm font-bold text-black">
              {index + 1}
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.05] p-4">
              <p className="font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-sm text-white/65">{step.detail}</p>
            </div>
            {index < steps.length - 1 ? (
              <motion.div
                initial={reduceMotion ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.42, delay: 0.2 + index * 0.12 }}
                className="ms-5 hidden h-7 w-px origin-top bg-[#2dd4bf]/55 sm:block"
              />
            ) : null}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GuidedWalkthroughScene({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  const steps = scene.steps ?? [];

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            {...revealProps(index, reduceMotion)}
            className="rounded-lg border border-white/12 bg-white/[0.055] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#22c55e] text-xs font-bold text-black">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/66">{step.detail}</p>
                {step.artefact ? <p className="mt-2 rounded-md bg-black/35 px-3 py-2 font-mono text-xs text-[#fde68a]">{step.artefact}</p> : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {scene.artefact ? <ArtefactRenderer artefact={scene.artefact} reduceMotion={reduceMotion} /> : <FocusLens steps={steps} reduceMotion={reduceMotion} />}
    </div>
  );
}

function FocusLens({ steps, reduceMotion }: { steps: EspExplainerStep[]; reduceMotion: boolean }) {
  return (
    <div className="rounded-lg border border-[#2dd4bf]/35 bg-[#2dd4bf]/10 p-5">
      <p className="text-sm font-semibold text-[#99f6e4]">Focus transition</p>
      <div className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <motion.div key={step.title} {...revealProps(index, reduceMotion)} className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2dd4bf]/45" />
            <div className="rounded-md border border-[#2dd4bf]/35 bg-black/30 px-3 py-2 text-sm text-white">{step.artefact ?? step.title}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ArtefactScene({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  return scene.artefact ? <ArtefactRenderer artefact={scene.artefact} reduceMotion={reduceMotion} /> : null;
}

function ArtefactRenderer({ artefact, reduceMotion }: { artefact: EspExplainerArtefact; reduceMotion: boolean }) {
  return (
    <div className="rounded-lg border border-white/12 bg-[#161616] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <p className="font-semibold text-white">{artefact.title}</p>
        <span className="rounded-sm bg-[#2dd4bf]/20 px-2 py-1 text-xs text-[#99f6e4]">{artefact.kind}</span>
      </div>

      {artefact.kind === "brief" ? <BriefArtefact artefact={artefact} reduceMotion={reduceMotion} /> : null}
      {artefact.kind === "plan" ? <PlanArtefact artefact={artefact} reduceMotion={reduceMotion} /> : null}
      {artefact.kind === "code" ? <CodeArtefact artefact={artefact} reduceMotion={reduceMotion} /> : null}
      {artefact.kind === "flow" ? <FlowArtefact artefact={artefact} reduceMotion={reduceMotion} /> : null}
      {artefact.kind === "build" ? <BuildArtefact artefact={artefact} reduceMotion={reduceMotion} /> : null}
      {artefact.kind === "evaluation" ? <EvaluationArtefact artefact={artefact} reduceMotion={reduceMotion} /> : null}
      {artefact.kind === "table" ? <TableArtefact artefact={artefact} /> : null}

      <Callouts callouts={artefact.callouts} reduceMotion={reduceMotion} />
    </div>
  );
}

function BriefArtefact({
  artefact,
  reduceMotion,
}: {
  artefact: Extract<EspExplainerArtefact, { kind: "brief" }>;
  reduceMotion: boolean;
}) {
  return (
    <div className="space-y-3">
      {artefact.facts.map((fact, index) => (
        <motion.div key={fact} {...revealProps(index, reduceMotion)} className="rounded-md border border-white/10 bg-black/28 px-4 py-3">
          <p className="text-sm text-white/82">{fact}</p>
          <motion.div
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.2 + index * 0.1, duration: reduceMotion ? 0.01 : 0.5 }}
            className="mt-2 h-1 origin-left rounded-sm bg-[#f59e0b]"
          />
        </motion.div>
      ))}
    </div>
  );
}

function PlanArtefact({
  artefact,
  reduceMotion,
}: {
  artefact: Extract<EspExplainerArtefact, { kind: "plan" }>;
  reduceMotion: boolean;
}) {
  return (
    <div className="space-y-3">
      {artefact.bars.map((bar, index) => (
        <motion.div key={bar.label} {...revealProps(index, reduceMotion)} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
          <div className="rounded-md border border-[#2dd4bf]/25 bg-[#2dd4bf]/10 px-3 py-2">
            <motion.div
              initial={reduceMotion ? false : { width: "34%" }}
              animate={{ width: `${Math.min(96, 58 + index * 8)}%` }}
              transition={{ duration: reduceMotion ? 0.01 : 0.55, delay: reduceMotion ? 0 : index * 0.12 }}
              className="rounded-sm bg-[#2dd4bf] px-3 py-2 text-sm font-semibold text-black"
            >
              {bar.label}
            </motion.div>
            <p className="mt-2 text-xs text-white/62">{bar.note}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/75">{bar.owner}</div>
        </motion.div>
      ))}
    </div>
  );
}

function CodeArtefact({
  artefact,
  reduceMotion,
}: {
  artefact: Extract<EspExplainerArtefact, { kind: "code" }>;
  reduceMotion: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <CodePane label="Before" tone="danger" lines={artefact.beforeLines} reduceMotion={reduceMotion} />
      <CodePane label="After" tone="success" lines={artefact.afterLines} reduceMotion={reduceMotion} />
    </div>
  );
}

function CodePane({
  label,
  tone,
  lines,
  reduceMotion,
}: {
  label: string;
  tone: "danger" | "success";
  lines: string[];
  reduceMotion: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/12 bg-black/55">
      <div className={cn("px-3 py-2 text-xs font-semibold", tone === "danger" ? "bg-[#ef4444]/18 text-[#fecaca]" : "bg-[#22c55e]/18 text-[#bbf7d0]")}>{label}</div>
      <pre className="overflow-auto p-3 text-xs leading-relaxed text-white/86">
        {lines.map((line, index) => (
          <motion.code key={`${line}-${index}`} {...revealProps(index, reduceMotion)} className="block font-mono">
            <span className="mr-3 select-none text-white/32">{String(index + 1).padStart(2, "0")}</span>
            {line}
          </motion.code>
        ))}
      </pre>
    </div>
  );
}

function FlowArtefact({
  artefact,
  reduceMotion,
}: {
  artefact: Extract<EspExplainerArtefact, { kind: "flow" }>;
  reduceMotion: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {artefact.nodes.map((node, index) => (
          <motion.div key={node} {...revealProps(index, reduceMotion)} className="flex items-center gap-2">
            {index > 0 ? <ArrowRight className="size-4 text-[#2dd4bf]" aria-hidden /> : null}
            <span className="rounded-md border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-2 text-sm text-white">{node}</span>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {artefact.branches.map((branch, index) => (
          <motion.div key={branch} {...revealProps(index + 2, reduceMotion)} className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3 text-sm text-[#fde68a]">
            {branch}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BuildArtefact({
  artefact,
  reduceMotion,
}: {
  artefact: Extract<EspExplainerArtefact, { kind: "build" }>;
  reduceMotion: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-2">
        {artefact.layers.map((layer, index) => (
          <motion.div key={layer.label} {...revealProps(index, reduceMotion)} className="rounded-md border border-white/10 bg-white/[0.055] px-4 py-3">
            <p className="font-semibold text-white">{layer.label}</p>
            <p className="mt-1 text-sm text-white/62">{layer.detail}</p>
          </motion.div>
        ))}
      </div>
      <div className="rounded-lg border border-[#22c55e]/30 bg-black/55 p-3 font-mono text-xs text-[#bbf7d0]">
        {artefact.output.map((line, index) => (
          <motion.p key={line} {...revealProps(index, reduceMotion)}>
            {">"} {line}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

function EvaluationArtefact({
  artefact,
  reduceMotion,
}: {
  artefact: Extract<EspExplainerArtefact, { kind: "evaluation" }>;
  reduceMotion: boolean;
}) {
  return (
    <div className="space-y-3">
      {artefact.sections.map((section, index) => (
        <motion.div key={section.label} {...revealProps(index, reduceMotion)} className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.055] p-3 sm:grid-cols-[8rem_1fr_1fr]">
          <p className="font-semibold text-[#f59e0b]">{section.label}</p>
          <p className="text-sm text-white/68">{section.evidence}</p>
          <p className="text-sm font-medium text-white">{section.judgement}</p>
        </motion.div>
      ))}
    </div>
  );
}

function TableArtefact({ artefact }: { artefact: Extract<EspExplainerArtefact, { kind: "table" }> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead className="bg-white/[0.08] text-white">
          <tr>{artefact.headers.map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {artefact.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-white/10">
              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 text-white/70">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callouts({ callouts, reduceMotion }: { callouts: string[]; reduceMotion: boolean }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {callouts.map((callout, index) => (
        <motion.div key={callout} {...revealProps(index + 3, reduceMotion)} className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2 text-xs font-medium text-[#fde68a]">
          {callout}
        </motion.div>
      ))}
    </div>
  );
}

function MistakeCompareScene({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  if (!scene.compare) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ComparePane title={scene.compare.weakTitle} items={scene.compare.weak} tone="weak" reduceMotion={reduceMotion} />
      <ComparePane title={scene.compare.strongTitle} items={scene.compare.strong} tone="strong" reduceMotion={reduceMotion} />
      <motion.div {...revealProps(4, reduceMotion)} className="rounded-lg border border-[#f59e0b]/35 bg-[#f59e0b]/12 p-4 text-sm font-medium text-[#fde68a] xl:col-span-2">
        {scene.compare.takeaway}
      </motion.div>
    </div>
  );
}

function ComparePane({
  title,
  items,
  tone,
  reduceMotion,
}: {
  title: string;
  items: string[];
  tone: "weak" | "strong";
  reduceMotion: boolean;
}) {
  const isStrong = tone === "strong";
  return (
    <div className={cn("rounded-lg border p-4", isStrong ? "border-[#22c55e]/35 bg-[#22c55e]/10" : "border-[#ef4444]/35 bg-[#ef4444]/10")}>
      <p className={cn("font-semibold", isStrong ? "text-[#bbf7d0]" : "text-[#fecaca]")}>{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <motion.li key={item} {...revealProps(index, reduceMotion)} className="flex gap-3 text-sm text-white/78">
            <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm", isStrong ? "bg-[#22c55e] text-black" : "bg-[#ef4444] text-white")}>
              {isStrong ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
            </span>
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function RecapScene({ scene, reduceMotion }: { scene: EspExplainerScene; reduceMotion: boolean }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.055] p-5">
      <div className="grid gap-3">
        {(scene.checklist ?? []).map((item, index) => (
          <motion.div key={item} {...revealProps(index, reduceMotion)} className="flex items-start gap-3 border-b border-white/10 py-3 last:border-b-0">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#22c55e] text-black">
              <Check size={16} strokeWidth={3} />
            </span>
            <p className="text-base font-medium text-white">{item}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PracticePromptScene({
  scene,
  practice,
  reduceMotion,
}: {
  scene: EspExplainerScene;
  practice: EspPracticeState;
  reduceMotion: boolean;
}) {
  const question = practice.question;

  return (
    <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
      <SceneCopy scene={scene} reduceMotion={reduceMotion} />
      <div className="max-h-[590px] overflow-y-auto rounded-lg border border-white/12 bg-[#151515] p-4 sm:p-5">
        {!question ? (
          <p className="text-sm text-white/70">No practice prompt is mapped for this task yet.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-[#2dd4bf]">Practice prompt {practice.questionCount > 1 ? `from ${practice.questionCount} options` : ""}</p>
                <h4 className="mt-2 text-2xl font-bold text-white">{question.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/66">{practice.context}</p>
              </div>
              <button
                type="button"
                onClick={practice.onLoadNext}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-3 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/[0.1]"
              >
                <RefreshCw size={14} />
                Load another
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <PromptPanel icon={<FileText size={16} />} title="Brief">
                {question.examMetadata?.stimulus ?? question.summary}
              </PromptPanel>
              <PromptPanel icon={<Table2 size={16} />} title="Student task">
                <span className="whitespace-pre-line">{question.practicePrompt}</span>
              </PromptPanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <label className="block">
                <span className="text-sm font-semibold text-white">Your evidence plan</span>
                <textarea
                  value={practice.draft}
                  onChange={(event) => practice.onDraftChange(event.target.value)}
                  rows={8}
                  className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-black/45 px-3 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#2dd4bf]"
                  placeholder="Write what you would submit: plan sections, code evidence, test rows, design steps, or reflection points."
                />
              </label>

              <div>
                <p className="text-sm font-semibold text-white">Evidence checklist</p>
                <div className="mt-2 space-y-2">
                  {practice.checklist.map((point, index) => {
                    const checked = practice.checkedPoints.has(index);
                    return (
                      <button
                        key={point}
                        type="button"
                        onClick={() => practice.onTogglePoint(index)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          checked
                            ? "border-[#22c55e]/50 bg-[#22c55e]/12 text-white"
                            : "border-white/12 bg-white/[0.04] text-white/65 hover:border-white/28 hover:text-white"
                        )}
                      >
                        <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border", checked ? "border-[#22c55e] bg-[#22c55e] text-black" : "border-white/30")}>
                          {checked ? <Check size={12} strokeWidth={3} /> : null}
                        </span>
                        {point}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-4 text-sm leading-relaxed text-[#fde68a]">
              {question.expectation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-black/28 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#2dd4bf]">
        {icon}
        {title}
      </p>
      <div className="mt-3 text-sm leading-relaxed text-white/72">{children}</div>
    </div>
  );
}
