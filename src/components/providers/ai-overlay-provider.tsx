"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  ChevronDown,
  Crosshair,
  GripHorizontal,
  Maximize2,
  Minimize2,
  ScanSearch,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { RevisionPredictionBand } from "@/lib/intelligence/revision-prediction";
import { cn } from "@/lib/utils";

type OverlayPhase =
  | "idle"
  | "ready"
  | "checking"
  | "fail"
  | "merit"
  | "distinction"
  | "error";

type DockMode = "float" | "snap";
type RevisionModeGroup = "Exam conditions" | "Simple revision";

interface RevisionSurfaceRegistration {
  surfaceId: string;
  topicId: string;
  topicLabel: string;
  prompt: string;
  modeGroup?: RevisionModeGroup;
  modeLabel?: string;
  anchorRef: RefObject<HTMLElement | null>;
  scanRef?: RefObject<HTMLElement | null>;
  onUndoLastEdit?: () => void;
  onClearInsertedCues?: () => void;
}

interface RevisionSurfaceUpdate {
  surfaceId: string;
  prompt?: string;
  answer: string;
  canUndoEdits?: boolean;
  canClearInsertedCues?: boolean;
}

interface RevisionCheckCompleteInput {
  surfaceId: string;
  scorePercent: number;
  score: number;
  maxScore: number;
  feedback?: string;
}

interface RevisionCheckErrorInput {
  surfaceId: string;
  message: string;
}

interface RevisionImproveCompleteInput {
  surfaceId: string;
  outputMode: "commentator" | "diff";
  highlightedCount: number;
  changeCount: number;
}

interface RevisionPredictionInput {
  surfaceId: string;
  band: RevisionPredictionBand;
  scorePercent: number;
  score: number;
  maxScore: number;
  source: "revision-evaluate" | "revision-improve";
}

interface RevisionProgressInput {
  surfaceId: string;
  statusLine?: string;
  note?: string;
}

interface OverlayRecommendedAction {
  label: string;
  href: string;
  kind: "route" | "external";
}

interface GuidedSessionStartInput {
  surfaceId: string;
  statusLine: string;
  note?: string;
}

interface GuidedSessionCompleteInput {
  surfaceId: string;
  phase?: OverlayPhase;
  statusLine: string;
  note?: string;
  scoreLabel?: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

interface GuidedSessionErrorInput {
  surfaceId: string;
  message: string;
  note?: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

interface SurfaceRecommendationsInput {
  surfaceId: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

interface OverlaySessionState {
  topicId?: string;
  topicLabel: string;
  modeGroup?: RevisionModeGroup;
  modeLabel?: string;
  prompt: string;
  answerPreview: string;
  wordCount: number;
  phase: OverlayPhase;
  statusLine: string;
  scoreLabel?: string;
  note?: string;
  primaryAction?: OverlayRecommendedAction | null;
  secondaryAction?: OverlayRecommendedAction | null;
}

interface OverlaySurfaceMeta {
  surfaceId: string;
  topicId: string;
  topicLabel: string;
  modeGroup: RevisionModeGroup;
  modeLabel: string;
  prompt: string;
  answerPreview: string;
  wordCount: number;
  canUndoEdits: boolean;
  canClearInsertedCues: boolean;
}

interface AiOverlayContextValue {
  registerRevisionSurface: (surface: RevisionSurfaceRegistration) => void;
  unregisterRevisionSurface: (surfaceId: string) => void;
  syncRevisionSurface: (input: RevisionSurfaceUpdate) => void;
  startRevisionCheck: (surfaceId: string) => void;
  setRevisionPrediction: (input: RevisionPredictionInput) => void;
  streamRevisionProgress: (input: RevisionProgressInput) => void;
  completeRevisionCheck: (input: RevisionCheckCompleteInput) => void;
  failRevisionCheck: (input: RevisionCheckErrorInput) => void;
  startRevisionImprove: (surfaceId: string) => void;
  completeRevisionImprove: (input: RevisionImproveCompleteInput) => void;
  failRevisionImprove: (input: RevisionCheckErrorInput) => void;
  startGuidedSession: (input: GuidedSessionStartInput) => void;
  completeGuidedSession: (input: GuidedSessionCompleteInput) => void;
  failGuidedSession: (input: GuidedSessionErrorInput) => void;
  setSurfaceRecommendations: (input: SurfaceRecommendationsInput) => void;
  undoLastEdit: (surfaceId: string) => void;
  clearInsertedCues: (surfaceId: string) => void;
  setOverlaySuppressed: (suppressed: boolean) => void;
}

const AiOverlayContext = createContext<AiOverlayContextValue | null>(null);

const STORAGE_KEY = "wf-revision-ai-overlay-position";
const FLOATING_WIDTH = 296;
const SNAPPED_WIDTH = 340;
const FLOATING_HEIGHT = 200;
const SNAPPED_HEIGHT = 252;
const VIEWPORT_PADDING = 16;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function shorten(value: string, maxLength = 124) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getDefaultFloatingPosition() {
  if (typeof window === "undefined") {
    return { x: 16, y: 16 };
  }

  return {
    x: Math.max(VIEWPORT_PADDING, window.innerWidth - FLOATING_WIDTH - 28),
    y: Math.max(96, window.innerHeight - FLOATING_HEIGHT - 28),
  };
}

function readStoredPosition() {
  if (typeof window === "undefined") {
    return getDefaultFloatingPosition();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultFloatingPosition();
    }

    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return getDefaultFloatingPosition();
    }

    return {
      x: clamp(parsed.x, VIEWPORT_PADDING, window.innerWidth - FLOATING_WIDTH - VIEWPORT_PADDING),
      y: clamp(parsed.y, 72, window.innerHeight - FLOATING_HEIGHT - VIEWPORT_PADDING),
    };
  } catch {
    return getDefaultFloatingPosition();
  }
}

function getPhaseFromScore(scorePercent: number): OverlayPhase {
  if (scorePercent >= 70) {
    return "distinction";
  }

  if (scorePercent >= 40) {
    return "merit";
  }

  return "fail";
}

function getPhaseFromPredictionBand(band: RevisionPredictionBand): OverlayPhase {
  if (band === "distinction") {
    return "distinction";
  }

  if (band === "merit") {
    return "merit";
  }

  return "fail";
}

function getToneMeta(phase: OverlayPhase) {
  switch (phase) {
    case "distinction":
      return {
        label: "Distinction",
        border: "rgba(250, 204, 21, 0.45)",
        glow: "rgba(250, 204, 21, 0.28)",
        surface: "linear-gradient(160deg, rgba(250,204,21,0.20), rgba(20,16,7,0.96) 46%, rgba(10,10,12,0.98))",
        text: "#fde68a",
        className: "ai-overlay-glow",
      };
    case "merit":
      return {
        label: "Merit",
        border: "rgba(56, 189, 248, 0.38)",
        glow: "rgba(56, 189, 248, 0.24)",
        surface: "linear-gradient(160deg, rgba(56,189,248,0.18), rgba(7,17,23,0.96) 46%, rgba(10,10,12,0.98))",
        text: "#7dd3fc",
        className: "ai-overlay-breathe",
      };
    case "fail":
    case "error":
      return {
        label: phase === "error" ? "Error" : "Fail",
        border: "rgba(239, 68, 68, 0.38)",
        glow: "rgba(239, 68, 68, 0.2)",
        surface: "linear-gradient(160deg, rgba(239,68,68,0.18), rgba(23,9,11,0.97) 46%, rgba(10,10,12,0.98))",
        text: "#fca5a5",
        className: "ai-overlay-shake",
      };
    case "checking":
      return {
        label: "Scanning",
        border: "rgba(139, 92, 246, 0.34)",
        glow: "rgba(139, 92, 246, 0.18)",
        surface: "linear-gradient(160deg, rgba(139,92,246,0.16), rgba(14,10,24,0.96) 46%, rgba(10,10,12,0.98))",
        text: "#c4b5fd",
        className: "",
      };
    case "ready":
      return {
        label: "Ready",
        border: "rgba(148, 163, 184, 0.28)",
        glow: "rgba(148, 163, 184, 0.14)",
        surface: "linear-gradient(160deg, rgba(148,163,184,0.10), rgba(16,17,20,0.96) 46%, rgba(10,10,12,0.98))",
        text: "#cbd5e1",
        className: "",
      };
    case "idle":
    default:
      return {
        label: "Idle",
        border: "rgba(255, 255, 255, 0.12)",
        glow: "rgba(139, 92, 246, 0.12)",
        surface: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(16,16,20,0.96) 46%, rgba(10,10,12,0.98))",
        text: "#e4e4e7",
        className: "",
      };
  }
}

function getCheckingStatusLine(meta?: OverlaySurfaceMeta | null) {
  if (!meta) {
    return "Scanning the response against the mark scheme...";
  }

  if (meta.modeGroup === "Exam conditions") {
    return `Scanning ${meta.topicLabel} against the exam-conditions rubric...`;
  }

  return `Scanning ${meta.topicLabel} inside the current simple-revision task...`;
}

function buildScoreLabel(score: number, maxScore: number, scorePercent: number) {
  return `${score}/${maxScore} marks • ${scorePercent}%`;
}

function getPredictionStatusLine(
  band: RevisionPredictionBand,
  source: "revision-evaluate" | "revision-improve"
) {
  const prefix =
    source === "revision-improve" ? "Early improvement signal" : "Early score signal";

  if (band === "distinction") {
    return `${prefix}: distinction-level coverage is already showing.`;
  }

  if (band === "merit") {
    return `${prefix}: the draft is landing around merit, with a few marks still exposed.`;
  }

  return `${prefix}: the draft still has major coverage or precision gaps.`;
}

function getRectFromRef(ref?: RefObject<HTMLElement | null>) {
  const element = ref?.current;
  if (!element) {
    return null;
  }

  return element.getBoundingClientRect();
}

function getDefaultModeLabel(modeGroup: RevisionModeGroup) {
  return modeGroup === "Exam conditions" ? "Written response" : "Revision task";
}

function getReadyStatusLine(surface: OverlaySurfaceMeta) {
  switch (surface.modeLabel) {
    case "Final written answer":
      return `Exam conditions are live for ${surface.topicLabel}. Write the full answer, then run the checker.`;
    case "Planned exam response":
      return `Exam conditions are live for ${surface.topicLabel}. Plan the answer first, then reveal the checklist.`;
    case "Quick written check":
      return `Simple revision is live for ${surface.topicLabel}. This is a fast written check, not the full exam-conditions marker.`;
    case "Fast Q/A":
      return `Simple revision is live for ${surface.topicLabel}. Use this route for quick correction and retrieval.`;
    case "Ask coach":
      return `Simple revision is live for ${surface.topicLabel}. Ask for hints, short explanations, or the next question.`;
    case "Recall card":
      return `Simple revision is live for ${surface.topicLabel}. Try to retrieve the answer before you reveal it.`;
    default:
      return `${surface.modeGroup} is live for ${surface.topicLabel}.`;
  }
}

function getReadyNote(surface: OverlaySurfaceMeta) {
  if (surface.modeGroup === "Exam conditions") {
    return "This mode is for structured exam work: planning first, then a fuller written response and AI checking.";
  }

  if (surface.modeLabel === "Quick written check") {
    return "Simple revision stays fast here. If you want full rubric-style AI feedback, switch to Exam conditions.";
  }

  return "The overlay stays global and follows whichever revision mode is currently active.";
}

function getBlankResponseHint(surface: OverlaySurfaceMeta) {
  switch (surface.modeLabel) {
    case "Final written answer":
      return "Start writing a full exam-style answer and the overlay will track it live.";
    case "Planned exam response":
      return "Add a short plan or note structure here. This mode is for planning, not full marking.";
    case "Quick written check":
      return "Type a short response for a fast cue-based check.";
    case "Fast Q/A":
      return "Pick or type a quick answer and the overlay will stay with this revision route.";
    case "Ask coach":
      return "Submit one focused prompt and the overlay will track the streamed answer.";
    case "Recall card":
      return "Use the prompt first, then reveal the answer when you are ready.";
    default:
      return "Start working and the overlay will track this revision task live.";
  }
}

function getSnapPosition(
  anchorRect: DOMRect | null,
  viewportWidth: number,
  viewportHeight: number
) {
  const width = SNAPPED_WIDTH;
  const height = SNAPPED_HEIGHT;

  if (!anchorRect || viewportWidth < 900) {
    return {
      x: clamp(viewportWidth - width - 18, VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING),
      y: clamp(viewportHeight - height - 18, 84, viewportHeight - height - VIEWPORT_PADDING),
    };
  }

  const preferredRight = anchorRect.right + 18;
  const canFitRight = preferredRight + width + VIEWPORT_PADDING <= viewportWidth;
  const x = canFitRight
    ? preferredRight
    : clamp(anchorRect.left - width - 18, VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING);
  const y = clamp(anchorRect.top + 8, 84, viewportHeight - height - VIEWPORT_PADDING);

  return { x, y };
}

function getInitialSessionState(): OverlaySessionState {
  return {
    topicLabel: "Revision AI",
    modeLabel: "Waiting for a task",
    prompt: "Open any revision task to wake the overlay.",
    answerPreview: "",
    wordCount: 0,
    phase: "idle",
    statusLine: "Hovering until you open a DSD simple-revision or exam-conditions task.",
    note: "The overlay follows the active mode and only turns into full writing AI on exam-conditions tasks.",
    primaryAction: null,
    secondaryAction: null,
  };
}

function AiRevisionOverlay({
  dockMode,
  setDockMode,
  floatingPosition,
  setFloatingPosition,
  activeSurface,
  activeSurfaceRef,
  session,
  onUndoLastEdit,
  onClearInsertedCues,
}: {
  dockMode: DockMode;
  setDockMode: (mode: DockMode) => void;
  floatingPosition: { x: number; y: number };
  setFloatingPosition: (position: { x: number; y: number }) => void;
  activeSurface: OverlaySurfaceMeta | null;
  activeSurfaceRef: MutableRefObject<RevisionSurfaceRegistration | null>;
  session: OverlaySessionState;
  onUndoLastEdit: () => void;
  onClearInsertedCues: () => void;
}) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [scanRect, setScanRect] = useState<DOMRect | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-expand on active phases, auto-collapse on idle/ready
  useEffect(() => {
    if (session.phase === "checking" || session.phase === "fail" || session.phase === "merit" || session.phase === "distinction" || session.phase === "error") {
      setIsCollapsed(false);
    } else if (session.phase === "idle" || session.phase === "ready") {
      setIsCollapsed(true);
    }
  }, [session.phase]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!activeSurface && session.phase !== "checking") {
      setAnchorRect(null);
      setScanRect(null);
      return;
    }

    let frameId = 0;
    const updateRects = () => {
      const runtime = activeSurfaceRef.current;
      setAnchorRect(getRectFromRef(runtime?.anchorRef));
      setScanRect(getRectFromRef(runtime?.scanRef ?? runtime?.anchorRef));
    };
    const schedule = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateRects);
    };

    updateRects();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [activeSurface, activeSurfaceRef, session.phase]);

  // Only show the floating overlay when a revision surface is active or a session is in progress.
  // Listing pages (/revision, /revision/topics, etc.) stay clean until the learner opens a task that registers the overlay.
  const shouldRender = Boolean(activeSurface) || session.phase !== "idle";

  const tone = getToneMeta(session.phase);
  const snappedPosition = useMemo(
    () => getSnapPosition(anchorRect, viewport.width || 1280, viewport.height || 820),
    [anchorRect, viewport.height, viewport.width]
  );
  const currentPosition = dockMode === "snap" ? snappedPosition : floatingPosition;
  const isSnapped = dockMode === "snap" && Boolean(activeSurface);
  const panelWidth = isSnapped ? SNAPPED_WIDTH : FLOATING_WIDTH;
  const showScanline = session.phase === "checking" && Boolean(scanRect);

  const renderRouteAction = (
    action: OverlayRecommendedAction,
    className: string
  ) => {
    if (action.kind === "external") {
      return (
        <a href={action.href} target="_blank" rel="noreferrer" className={className}>
          {action.label}
        </a>
      );
    }

    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showScanline && scanRect ? (
          <motion.div
            key="scanline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-[58] overflow-hidden rounded-[26px] border border-accent/15"
            style={{
              left: Math.max(8, scanRect.left - 6),
              top: Math.max(8, scanRect.top - 6),
              width: Math.max(120, scanRect.width + 12),
              height: Math.max(120, scanRect.height + 12),
              boxShadow: "0 0 0 1px rgba(139,92,246,0.08), 0 0 48px -22px rgba(139,92,246,0.35)",
              background:
                "linear-gradient(180deg, rgba(139,92,246,0.05), rgba(0,0,0,0.02))",
            }}
          >
            <div className="ai-overlay-scan-grid absolute inset-0" />
            <motion.div
              className="ai-overlay-scanline absolute left-0 right-0 h-12"
              animate={{ y: [-32, Math.max(36, scanRect.height + 22)] }}
              transition={{ duration: 1.45, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Collapsed: small icon pill */}
      <AnimatePresence>
        {isCollapsed ? (
          <motion.div
            key="collapsed-pill"
            drag
            dragMomentum={false}
            onDragEnd={(_event, info) => {
              if (typeof window === "undefined") return;
              setFloatingPosition({
                x: clamp(floatingPosition.x + info.offset.x, VIEWPORT_PADDING, window.innerWidth - 64 - VIEWPORT_PADDING),
                y: clamp(floatingPosition.y + info.offset.y, 72, window.innerHeight - 64 - VIEWPORT_PADDING),
              });
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x: floatingPosition.x, y: floatingPosition.y }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.8 }}
            className="pointer-events-auto fixed left-0 top-0 z-[60]"
          >
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-110",
                tone.className
              )}
              style={{
                borderColor: tone.border,
                background: tone.surface,
                boxShadow: `0 8px 24px -8px rgba(0,0,0,0.5), 0 0 0 1px ${tone.border}, 0 0 18px -8px ${tone.glow}`,
                color: tone.text,
              }}
              title={session.statusLine}
            >
              {session.phase === "checking" ? (
                <ScanSearch size={20} />
              ) : session.phase === "distinction" ? (
                <Trophy size={20} />
              ) : session.phase === "fail" || session.phase === "error" ? (
                <AlertCircle size={20} />
              ) : (
                <Bot size={20} />
              )}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Expanded: full panel */}
      <AnimatePresence>
        {!isCollapsed ? (
      <motion.div
        key="expanded-panel"
        drag={dockMode === "float"}
        dragMomentum={false}
        onDragEnd={(_event, info) => {
          if (dockMode !== "float" || typeof window === "undefined") {
            return;
          }

          setFloatingPosition({
            x: clamp(
              floatingPosition.x + info.offset.x,
              VIEWPORT_PADDING,
              window.innerWidth - FLOATING_WIDTH - VIEWPORT_PADDING
            ),
            y: clamp(
              floatingPosition.y + info.offset.y,
              72,
              window.innerHeight - FLOATING_HEIGHT - VIEWPORT_PADDING
            ),
          });
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          type: "spring",
          stiffness: dockMode === "snap" ? 280 : 320,
          damping: 26,
          mass: 0.8,
        }}
        animate={{
          opacity: 1,
          x: currentPosition.x,
          y: currentPosition.y,
          width: panelWidth,
          scale: session.phase === "checking" ? 1.01 : 1,
        }}
        className="pointer-events-auto fixed left-0 top-0 z-[60]"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[28px] border p-4 backdrop-blur-xl transition-shadow duration-300",
            tone.className
          )}
          style={{
            borderColor: tone.border,
            background: tone.surface,
            boxShadow: `0 26px 60px -34px rgba(0,0,0,0.92), 0 0 0 1px ${tone.border}, 0 0 34px -18px ${tone.glow}`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at top right, var(--overlay-specular), transparent 36%)",
            }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: tone.border,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: tone.text,
                  }}
                >
                  {session.phase === "checking" ? (
                    <ScanSearch size={18} />
                  ) : session.phase === "distinction" ? (
                    <Trophy size={18} />
                  ) : session.phase === "fail" || session.phase === "error" ? (
                    <AlertCircle size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {activeSurface?.topicLabel ?? session.topicLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white/80 cursor-pointer"
                title="Minimize"
              >
                <ChevronDown size={14} />
              </button>
              <div className="cursor-grab rounded-full border border-white/10 bg-white/5 p-2 text-white/55 active:cursor-grabbing">
                <GripHorizontal size={14} />
              </div>
            </div>
          </div>

          <div className="relative mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="default"
                className="border-white/10 bg-white/6"
              >
                {tone.label}
              </Badge>
              {session.scoreLabel ? (
                <Badge variant="default" className="border-white/10 bg-white/6">
                  {session.scoreLabel}
                </Badge>
              ) : null}
              {activeSurface ? (
                <Badge variant="default" className="border-white/10 bg-white/6">
                  {session.wordCount} words
                </Badge>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-white/8 bg-black/18 px-4 py-3">
              <p className="text-sm leading-relaxed text-foreground/90">{session.statusLine}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/48">
                <Crosshair size={12} />
                Current target
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {shorten(activeSurface?.prompt ?? session.prompt, isSnapped ? 110 : 88)}
                </p>
                {session.answerPreview ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {shorten(session.answerPreview, isSnapped ? 132 : 98)}
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {activeSurface ? getBlankResponseHint(activeSurface) : "Open a revision task and the overlay will attach to it."}
                  </p>
                )}
              </div>
            </div>

            {session.note ? (
              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                {session.note}
              </div>
            ) : null}

            {session.primaryAction || session.secondaryAction ? (
              <div className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/48">
                  <Sparkles size={12} />
                  Next step
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {session.primaryAction
                    ? renderRouteAction(
                        session.primaryAction,
                        "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-soft"
                      )
                    : null}
                  {session.secondaryAction
                    ? renderRouteAction(
                        session.secondaryAction,
                        "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/8"
                      )
                    : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {activeSurface ? (
                <Button
                  type="button"
                  size="sm"
                  variant={isSnapped ? "secondary" : "primary"}
                  onClick={() => setDockMode(isSnapped ? "float" : "snap")}
                >
                  {isSnapped ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {isSnapped ? "Float" : "Snap to editor"}
                </Button>
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDockMode("float")}
              >
                <Sparkles size={14} />
                Hover
              </Button>
              {activeSurface?.canUndoEdits ? (
                <Button type="button" size="sm" variant="ghost" onClick={onUndoLastEdit}>
                  Undo last edit
                </Button>
              ) : null}
              {activeSurface?.canClearInsertedCues ? (
                <Button type="button" size="sm" variant="ghost" onClick={onClearInsertedCues}>
                  Clear cues
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function AiOverlayProvider({ children }: { children: React.ReactNode }) {
  const activeSurfaceRef = useRef<RevisionSurfaceRegistration | null>(null);
  const [activeSurface, setActiveSurface] = useState<OverlaySurfaceMeta | null>(null);
  const [session, setSession] = useState<OverlaySessionState>(getInitialSessionState);
  const [dockMode, setDockMode] = useState<DockMode>("float");
  const [floatingPosition, setFloatingPositionState] = useState(getDefaultFloatingPosition);
  const [overlaySuppressed, setOverlaySuppressed] = useState(false);

  useEffect(() => {
    setFloatingPositionState(readStoredPosition());
  }, []);

  const setFloatingPosition = useCallback((position: { x: number; y: number }) => {
    setFloatingPositionState(position);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, []);

  const syncSessionFromSurface = useCallback((surface: OverlaySurfaceMeta) => {
    setSession((current) => ({
      ...current,
      topicId: surface.topicId,
      topicLabel: surface.topicLabel,
      modeGroup: surface.modeGroup,
      modeLabel: surface.modeLabel,
      prompt: surface.prompt,
      answerPreview: surface.answerPreview,
      wordCount: surface.wordCount,
      phase: current.phase === "idle" ? "ready" : current.phase === "checking" ? current.phase : "ready",
      statusLine:
        current.phase === "checking"
          ? current.statusLine
          : getReadyStatusLine(surface),
      note:
        current.phase === "checking"
          ? current.note
          : getReadyNote(surface),
      primaryAction: current.primaryAction ?? null,
      secondaryAction: current.secondaryAction ?? null,
    }));
  }, []);

  const registerRevisionSurface = useCallback(
    (surface: RevisionSurfaceRegistration) => {
      activeSurfaceRef.current = surface;
      const nextMeta: OverlaySurfaceMeta = {
        surfaceId: surface.surfaceId,
        topicId: surface.topicId,
        topicLabel: surface.topicLabel,
        modeGroup: surface.modeGroup ?? "Simple revision",
        modeLabel: surface.modeLabel ?? getDefaultModeLabel(surface.modeGroup ?? "Simple revision"),
        prompt: surface.prompt,
        answerPreview: "",
        wordCount: 0,
        canUndoEdits: false,
        canClearInsertedCues: false,
      };

      setActiveSurface(nextMeta);
      setSession((current) => ({
        ...current,
        topicId: nextMeta.topicId,
        topicLabel: nextMeta.topicLabel,
        modeGroup: nextMeta.modeGroup,
        modeLabel: nextMeta.modeLabel,
        prompt: nextMeta.prompt,
        answerPreview: "",
        wordCount: 0,
        phase: current.phase === "checking" ? "checking" : "ready",
        statusLine:
          current.phase === "checking"
            ? current.statusLine
            : getReadyStatusLine(nextMeta),
        note:
          current.phase === "checking"
            ? current.note
            : getReadyNote(nextMeta),
        scoreLabel: current.phase === "checking" ? current.scoreLabel : undefined,
        primaryAction: null,
        secondaryAction: null,
      }));
    },
    []
  );

  const unregisterRevisionSurface = useCallback((surfaceId: string) => {
    if (activeSurfaceRef.current?.surfaceId !== surfaceId) {
      return;
    }

    activeSurfaceRef.current = null;
    setActiveSurface(null);
    setDockMode("float");
    setSession((current) => ({
      ...current,
      statusLine:
        current.phase === "checking"
          ? current.statusLine
          : "Detached from the current task. Open any simple-revision or exam-conditions route to snap back in.",
      note:
        current.phase === "checking"
          ? current.note
          : "The overlay is global, but it only becomes active when a revision surface registers itself.",
      primaryAction: null,
      secondaryAction: null,
    }));
  }, []);

  const syncRevisionSurface = useCallback(
    (input: RevisionSurfaceUpdate) => {
      setActiveSurface((current) => {
        if (!current || current.surfaceId !== input.surfaceId) {
          return current;
        }

        const nextMeta = {
          ...current,
          prompt: input.prompt ?? current.prompt,
          answerPreview: input.answer.trim(),
          wordCount: countWords(input.answer),
          canUndoEdits: input.canUndoEdits ?? current.canUndoEdits,
          canClearInsertedCues:
            input.canClearInsertedCues ?? current.canClearInsertedCues,
        };
        syncSessionFromSurface(nextMeta);
        return nextMeta;
      });
    },
    [syncSessionFromSurface]
  );

  const startRevisionCheck = useCallback((surfaceId: string) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "checking",
        statusLine: getCheckingStatusLine(current),
        scoreLabel: undefined,
        note: "Scanline is locked to the current response while the checker runs.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const setRevisionPrediction = useCallback((input: RevisionPredictionInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: getPhaseFromPredictionBand(input.band),
        statusLine: getPredictionStatusLine(input.band, input.source),
        scoreLabel: buildScoreLabel(input.score, input.maxScore, input.scorePercent),
        note:
          input.source === "revision-improve"
            ? "The improve pass is using the underlying deterministic score band before the final upgrade list lands."
            : "The colour changed from the deterministic score band, not from a hidden model token.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const streamRevisionProgress = useCallback((input: RevisionProgressInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        statusLine: input.statusLine ?? previous.statusLine,
        note: input.note ? shorten(input.note, 170) : previous.note,
      }));

      return current;
    });
  }, []);

  const completeRevisionCheck = useCallback((input: RevisionCheckCompleteInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      const phase = getPhaseFromScore(input.scorePercent);
      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase,
        statusLine:
          phase === "distinction"
            ? "Distinction signal. The answer is landing with strong coverage and clear development."
            : phase === "merit"
              ? "Merit signal. The core ideas are there, but a few marks are still sitting on the table."
              : "Fail signal. The checker found major coverage gaps or weak precision.",
        scoreLabel: buildScoreLabel(input.score, input.maxScore, input.scorePercent),
        note: input.feedback ? shorten(input.feedback, 150) : undefined,
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const failRevisionCheck = useCallback((input: RevisionCheckErrorInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "error",
        statusLine: input.message,
        note: "The overlay stayed attached so you can retry without losing context.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const startRevisionImprove = useCallback((surfaceId: string) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "checking",
        statusLine: "Finding upgrade spots and weak phrases in the current answer...",
        note: "Improvement mode stays in commentator/diff territory and does not rewrite the whole answer.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const completeRevisionImprove = useCallback((input: RevisionImproveCompleteInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase:
          previous.phase === "fail" ||
          previous.phase === "merit" ||
          previous.phase === "distinction"
            ? previous.phase
            : "ready",
        statusLine:
          input.outputMode === "diff"
            ? `Built ${input.changeCount} diff-style upgrade hints and marked ${input.highlightedCount} weak phrases.`
            : `Built ${input.changeCount} commentator suggestions and marked ${input.highlightedCount} weak phrases.`,
        note: "The original answer stays intact. Only upgrade spots and additions are suggested.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const failRevisionImprove = useCallback((input: RevisionCheckErrorInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: previous.phase === "fail" || previous.phase === "distinction" || previous.phase === "merit"
          ? previous.phase
          : "error",
        statusLine: input.message,
        note: "Improvement scan failed, but the answer and previous score state were kept in place.",
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const startGuidedSession = useCallback((input: GuidedSessionStartInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "checking",
        statusLine: input.statusLine,
        note: input.note,
        scoreLabel: undefined,
        primaryAction: null,
        secondaryAction: null,
      }));

      return current;
    });
  }, []);

  const completeGuidedSession = useCallback((input: GuidedSessionCompleteInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: input.phase ?? "ready",
        statusLine: input.statusLine,
        note: input.note,
        scoreLabel: input.scoreLabel,
        primaryAction: input.primaryAction ?? null,
        secondaryAction: input.secondaryAction ?? null,
      }));

      return current;
    });
  }, []);

  const failGuidedSession = useCallback((input: GuidedSessionErrorInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setDockMode("snap");
      setSession((previous) => ({
        ...previous,
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        prompt: current.prompt,
        answerPreview: current.answerPreview,
        wordCount: current.wordCount,
        phase: "error",
        statusLine: input.message,
        note: input.note ?? previous.note,
        primaryAction: input.primaryAction ?? null,
        secondaryAction: input.secondaryAction ?? null,
      }));

      return current;
    });
  }, []);

  const setSurfaceRecommendations = useCallback((input: SurfaceRecommendationsInput) => {
    setActiveSurface((current) => {
      if (!current || current.surfaceId !== input.surfaceId) {
        return current;
      }

      setSession((previous) => ({
        ...previous,
        primaryAction: input.primaryAction ?? null,
        secondaryAction: input.secondaryAction ?? null,
      }));

      return current;
    });
  }, []);

  const undoLastEdit = useCallback((surfaceId: string) => {
    if (activeSurfaceRef.current?.surfaceId !== surfaceId) {
      return;
    }

    activeSurfaceRef.current.onUndoLastEdit?.();
  }, []);

  const clearInsertedCues = useCallback((surfaceId: string) => {
    if (activeSurfaceRef.current?.surfaceId !== surfaceId) {
      return;
    }

    activeSurfaceRef.current.onClearInsertedCues?.();
  }, []);

  const value = useMemo<AiOverlayContextValue>(
    () => ({
      registerRevisionSurface,
      unregisterRevisionSurface,
      syncRevisionSurface,
      startRevisionCheck,
      setRevisionPrediction,
      streamRevisionProgress,
      completeRevisionCheck,
      failRevisionCheck,
      startRevisionImprove,
      completeRevisionImprove,
      failRevisionImprove,
      startGuidedSession,
      completeGuidedSession,
      failGuidedSession,
      setSurfaceRecommendations,
      undoLastEdit,
      clearInsertedCues,
      setOverlaySuppressed,
    }),
    [
      completeGuidedSession,
      completeRevisionCheck,
      completeRevisionImprove,
      clearInsertedCues,
      failGuidedSession,
      failRevisionCheck,
      failRevisionImprove,
      registerRevisionSurface,
      setOverlaySuppressed,
      setRevisionPrediction,
      setSurfaceRecommendations,
      startGuidedSession,
      startRevisionCheck,
      startRevisionImprove,
      streamRevisionProgress,
      syncRevisionSurface,
      undoLastEdit,
      unregisterRevisionSurface,
    ]
  );

  return (
    <AiOverlayContext.Provider value={value}>
      {children}
      {!overlaySuppressed ? (
        <AiRevisionOverlay
          dockMode={dockMode}
          setDockMode={setDockMode}
          floatingPosition={floatingPosition}
          setFloatingPosition={setFloatingPosition}
          activeSurface={activeSurface}
          activeSurfaceRef={activeSurfaceRef}
          session={session}
          onUndoLastEdit={() => {
            if (activeSurface) {
              undoLastEdit(activeSurface.surfaceId);
            }
          }}
          onClearInsertedCues={() => {
            if (activeSurface) {
              clearInsertedCues(activeSurface.surfaceId);
            }
          }}
        />
      ) : null}
    </AiOverlayContext.Provider>
  );
}

export function useAiOverlay() {
  const context = useContext(AiOverlayContext);

  if (!context) {
    throw new Error("useAiOverlay must be used within AiOverlayProvider.");
  }

  return context;
}
