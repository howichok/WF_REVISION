"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { SceneBeat } from "./types";
import { useTimeline } from "./use-timeline";
import { CursorGhost } from "./cursor-ghost";
import { cn } from "@/lib/utils";

interface SceneStageContextValue {
  beatIndex: number;
  total: number;
  reducedMotion: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  setCursorTarget: (el: HTMLElement | null, opts?: { offsetX?: number; offsetY?: number }) => void;
}

const SceneStageContext = createContext<SceneStageContextValue | null>(null);

export function useSceneBeat(): { beatIndex: number; total: number; reducedMotion: boolean } {
  const ctx = useContext(SceneStageContext);
  if (!ctx) throw new Error("useSceneBeat must be used inside <SceneStage>");
  return { beatIndex: ctx.beatIndex, total: ctx.total, reducedMotion: ctx.reducedMotion };
}

export function useSceneStageRef(): RefObject<HTMLDivElement | null> {
  const ctx = useContext(SceneStageContext);
  if (!ctx) throw new Error("useSceneStageRef must be used inside <SceneStage>");
  return ctx.stageRef;
}

/**
 * Hook for a scene to point the ghost cursor at a specific element.
 * Pass `null` to hide the cursor.
 */
export function useSceneCursor(target: HTMLElement | null | undefined, opts?: { offsetX?: number; offsetY?: number }): void {
  const ctx = useContext(SceneStageContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setCursorTarget(target ?? null, opts);
  }, [ctx, target, opts?.offsetX, opts?.offsetY]); // eslint-disable-line react-hooks/exhaustive-deps
}

interface SceneStageProps {
  /** Short intro label shown in the toolbar ("Animated walkthrough"). */
  label?: string;
  /** Beats with captions and timing. */
  beats: SceneBeat[];
  /** External trigger to reset the timeline (e.g. "Replay" outside). */
  resetKey?: number | string;
  /** Called when the top-level replay button is pressed. */
  onReplay?: () => void;
  /** Optional secondary action shown in the toolbar. */
  headerActions?: ReactNode;
  /** Scene component rendered inside the stage area. */
  children: ReactNode;
  /** Fixed min height so the scene does not jump as objects appear. */
  minStageHeightClass?: string;
}

export function SceneStage({
  label = "Animated walkthrough",
  beats,
  resetKey,
  onReplay,
  headerActions,
  children,
  minStageHeightClass = "min-h-[360px]",
}: SceneStageProps) {
  const systemReducedMotion = false;
  const timeline = useTimeline(beats, { autoplay: true, reducedMotion: systemReducedMotion, resetKey });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [cursorTarget, setCursorTargetEl] = useState<HTMLElement | null>(null);
  const [cursorOffset, setCursorOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const setCursorTarget = useCallback(
    (el: HTMLElement | null, opts?: { offsetX?: number; offsetY?: number }) => {
      setCursorTargetEl(el);
      setCursorOffset({ x: opts?.offsetX ?? 0, y: opts?.offsetY ?? 0 });
    },
    []
  );

  const ctxValue = useMemo<SceneStageContextValue>(
    () => ({
      beatIndex: timeline.index,
      total: timeline.total,
      reducedMotion: systemReducedMotion,
      stageRef,
      setCursorTarget,
    }),
    [timeline.index, timeline.total, systemReducedMotion, setCursorTarget]
  );

  // Keyboard controls when stage has focus
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        timeline.toggle();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        timeline.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        timeline.prev();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        timeline.replay();
        onReplay?.();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [timeline, onReplay]);

  const currentBeat = beats[timeline.index];
  const progress = timeline.total > 0 ? (timeline.index + 1) / timeline.total : 0;

  return (
    <SceneStageContext.Provider value={ctxValue}>
      <div
        ref={rootRef}
        tabIndex={0}
        role="region"
        aria-label={`${label} — ${timeline.total} beats`}
        className="group/scene relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-background/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <StageButton
              ariaLabel="Previous beat"
              onClick={timeline.prev}
              disabled={timeline.index === 0}
            >
              <ChevronLeft className="size-3.5" />
            </StageButton>
            <StageButton
              ariaLabel={timeline.status === "playing" ? "Pause" : "Play"}
              onClick={timeline.toggle}
            >
              {timeline.status === "playing" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </StageButton>
            <StageButton
              ariaLabel="Next beat"
              onClick={timeline.next}
              disabled={timeline.index >= timeline.total - 1}
            >
              <ChevronRight className="size-3.5" />
            </StageButton>
            <StageButton
              ariaLabel="Replay"
              onClick={() => {
                timeline.replay();
                onReplay?.();
              }}
            >
              <RotateCcw className="size-3.5" />
            </StageButton>
            {headerActions}
          </div>
        </div>

        {/* Stage area */}
        <div ref={stageRef} className={cn("relative p-4 sm:p-5", minStageHeightClass)}>
          {children}
          <CursorGhost
            stageRef={stageRef}
            target={cursorTarget}
            offsetX={cursorOffset.x}
            offsetY={cursorOffset.y}
            hidden={systemReducedMotion}
          />
        </div>

        {/* Caption strip */}
        <div
          className="relative border-t border-border/50 bg-muted/20 px-4 py-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="min-h-[44px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={timeline.index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="text-sm font-medium leading-relaxed text-foreground"
              >
                <span className="mr-2 inline-flex min-w-6 items-center justify-center rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {timeline.index + 1}/{timeline.total}
                </span>
                {currentBeat?.caption ?? ""}
              </motion.p>
            </AnimatePresence>
          </div>
          {/* Progress rail */}
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/40">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent/80 to-[#2dd4bf]"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </SceneStageContext.Provider>
  );
}

function StageButton({
  children,
  ariaLabel,
  onClick,
  disabled,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-7 items-center justify-center rounded-md border border-border/50 bg-card text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-40 disabled:hover:border-border/50 disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}

/**
 * Convenience hook: each beat declares which scene element the cursor should
 * be hovering over. Scenes pass a function `(beatIndex) => HTMLElement | null`.
 */
export function useCursorChoreography(
  pick: (beatIndex: number) => HTMLElement | null,
  opts?: { offsetX?: number; offsetY?: number }
): void {
  const { beatIndex } = useSceneBeat();
  const ctx = useContext(SceneStageContext);
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.setCursorTarget(pick(beatIndex), opts);
  }, [beatIndex]); // eslint-disable-line react-hooks/exhaustive-deps
}
