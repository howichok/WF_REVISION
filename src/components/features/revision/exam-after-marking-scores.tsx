"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ImageDown,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { ExamConditionsSessionResult } from "@/lib/exam-conditions";
import { downloadPng, sharePngOrDownload } from "@/lib/export-marked-summary-image";
import { getTopicById } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXAM_TOPIC_LIST_HREF = "/revision/topics?mode=exam";

/* ── Score-ring: animated SVG arc ──────────────────────────── */
function ScoreArc({
  percent,
  size = 148,
  stroke = 7,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  const color =
    percent >= 80
      ? "#22c55e"
      : percent >= 60
        ? "#3b82f6"
        : percent >= 40
          ? "#f59e0b"
          : "#ef4444";

  const glowColor =
    percent >= 80
      ? "rgba(34,197,94,0.25)"
      : percent >= 60
        ? "rgba(59,130,246,0.2)"
        : percent >= 40
          ? "rgba(245,158,11,0.2)"
          : "rgba(239,68,68,0.18)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
          opacity={0.5}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Glow layer */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke + 6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          opacity={0.12}
          style={{ filter: "blur(6px)" }}
        />
      </svg>
    </div>
  );
}

/* ── Confetti dots (celebration for high scores) — stable presets (no Math.random in render) ─ */
const CELEBRATION_DOT_PRESETS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: (i * 17 + 13) % 100,
  delay: (i % 7) * 0.09,
  size: 3 + (i % 4),
  color: ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899"][i % 5],
  yMid: -80 - (i % 5) * 12 - (i % 3) * 8,
  yEnd: -160 - (i % 4) * 15 - (i % 5) * 10,
  xDrift: (((i * 13) % 11) - 5) * 6,
  duration: 1.6 + (i % 8) * 0.1,
}));

function CelebrationDots({ show }: { show: boolean }) {
  const dots = useMemo(() => CELEBRATION_DOT_PRESETS, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: "50%",
            backgroundColor: d.color,
          }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, d.yMid, d.yEnd],
            x: [0, d.xDrift],
            scale: [0, 1, 0.6],
          }}
          transition={{
            duration: d.duration,
            delay: 0.4 + d.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Per-question row in the score list ────────────────────── */
function QuestionScoreRow({
  index,
  prompt,
  score,
  maxScore,
  missingPoints,
}: {
  index: number;
  prompt: string;
  score: number;
  maxScore: number;
  /** What the AI says would have earned the missing marks. */
  missingPoints?: string[];
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const isFull = score === maxScore;
  const missing = maxScore - score;
  const [expanded, setExpanded] = useState(false);
  const hasMissing = !isFull && missingPoints && missingPoints.length > 0;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index + 0.6 }}
      className="group"
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        {/* Left: number badge */}
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
            isFull
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : pct >= 50
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
          )}
        >
          {index + 1}
        </span>
        {/* Prompt - truncated */}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground/90">
          {prompt}
        </span>
        {/* Score + missing-marks expand toggle */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isFull ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, delay: 0.05 * index + 0.8 }}
            >
              <Check size={13} className="text-emerald-500" />
            </motion.span>
          ) : hasMissing ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 rounded border border-amber-300/60 bg-amber-50/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
              title="See what could have earned the missing marks"
            >
              +{missing} mark{missing > 1 ? "s" : ""}
              {expanded ? <ChevronUp size={10} className="ml-0.5" /> : <ChevronDown size={10} className="ml-0.5" />}
            </button>
          ) : null}
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[12px] font-bold tabular-nums",
              isFull
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : pct >= 50
                  ? "bg-muted/40 text-foreground"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {score}/{maxScore}
          </span>
        </div>
      </div>

      {/* Missing-marks AI hint panel */}
      <AnimatePresence>
        {hasMissing && expanded ? (
          <motion.div
            key="missing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 rounded-xl border border-amber-300/50 bg-amber-50/60 px-3 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/8 sm:mx-5">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                <Sparkles size={10} />
                What could have earned the missing {missing} mark{missing > 1 ? "s" : ""}
              </p>
              <ul className="space-y-1">
                {missingPoints!.map((pt, pi) => (
                  <li key={pi} className="flex items-start gap-2 text-[12px] leading-relaxed text-amber-950 dark:text-amber-100">
                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-amber-400/60 text-[8px] font-bold text-amber-600 dark:text-amber-300">
                      {pi + 1}
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

/* ── Summary stat card ─────────────────────────────────────── */
function StatPill({
  label,
  value,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/80 px-3.5 py-2.5"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40">
        <Icon size={15} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="text-[14px] font-bold tabular-nums text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

/* ── Main component ────────────────────────────────────────── */
export function ExamAfterMarkingScores({
  results,
  topicIcon,
  topicLabel,
  onViewDetails,
  onStartAgain,
  onSavePaper,
  savePaperState = "idle",
  topicFlashcardIdsAfterSave = null,
}: {
  results: ExamConditionsSessionResult;
  topicIcon?: string;
  topicLabel: string;
  onViewDetails: () => void;
  onStartAgain: () => void;
  /** Persist this marked session on the device (local). */
  onSavePaper?: () => void;
  savePaperState?: "idle" | "saved" | "error";
  /** Distinct topic ids that received merged flashcard decks after the last save (this device). */
  topicFlashcardIdsAfterSave?: string[] | null;
}) {
  const [showAll, setShowAll] = useState(results.reviews.length <= 6);
  const [shareBusy, setShareBusy] = useState(false);
  const summaryCaptureRef = useRef<HTMLDivElement>(null);
  const visibleReviews = showAll ? results.reviews : results.reviews.slice(0, 5);
  const hiddenCount = results.reviews.length - 5;

  /* Count full-mark answers */
  const fullMarkCount = results.reviews.filter((r) => r.score === r.maxScore).length;

  /* Animated counter */
  const [displayedScore, setDisplayedScore] = useState(0);
  useEffect(() => {
    const target = results.totalScore;
    if (target === 0) return;
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedScore(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [results.totalScore]);

  const bandLabel = results.overallBand ?? (results.scorePercent >= 50 ? "Pass" : "");
  const isExcellent = results.scorePercent >= 80;
  const answeredAll =
    results.answeredCount === results.reviews.length && results.reviews.length > 0;

  const exportFilename = useMemo(() => {
    const safe = topicLabel.replace(/[^\w\-]+/g, "-").slice(0, 40);
    return `marked-${safe}-${results.totalScore}-of-${results.totalMaxScore}.png`;
  }, [topicLabel, results.totalScore, results.totalMaxScore]);

  const handleShareSummaryImage = useCallback(async () => {
    const el = summaryCaptureRef.current;
    if (!el) {
      return;
    }
    setShareBusy(true);
    try {
      await sharePngOrDownload(el, exportFilename);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Share summary image failed", e);
      }
    } finally {
      setShareBusy(false);
    }
  }, [exportFilename]);

  const handleDownloadSummaryImage = useCallback(async () => {
    const el = summaryCaptureRef.current;
    if (!el) {
      return;
    }
    setShareBusy(true);
    try {
      await downloadPng(el, exportFilename);
    } finally {
      setShareBusy(false);
    }
  }, [exportFilename]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-[100dvh] w-full flex-col bg-background text-foreground"
    >
      {/* ── Top navigation bar ─────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 px-5 py-3 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href={EXAM_TOPIC_LIST_HREF}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Topics
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/revision/marked-papers"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              Saved papers
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={shareBusy}
              onClick={() => void handleShareSummaryImage()}
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share image</span>
              <span className="sm:hidden">Share</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={shareBusy}
              onClick={() => void handleDownloadSummaryImage()}
            >
              <ImageDown size={14} />
              <span className="hidden sm:inline">Download image</span>
              <span className="sm:hidden">Image</span>
            </Button>
            {onSavePaper ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onSavePaper}
                disabled={savePaperState === "saved"}
              >
                <Bookmark size={14} />
                {savePaperState === "saved" ? "Saved" : savePaperState === "error" ? "Retry save" : "Save paper"}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={onStartAgain}>
              <RotateCcw size={14} />
              Again
            </Button>
            <Button size="sm" onClick={onViewDetails}>
              <GraduationCap size={14} />
              View details
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8">
        <p className="mb-4 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-left">
          Saved papers live under{" "}
          <Link href="/revision/marked-papers" className="font-medium text-accent underline-offset-2 hover:underline">
            Revision → Saved papers
          </Link>{" "}
          (this device). Use Share / Download for a snapshot of your score and AI summary below.
        </p>

        {savePaperState === "saved" &&
        topicFlashcardIdsAfterSave &&
        topicFlashcardIdsAfterSave.length > 0 ? (
          <div className="mb-5 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-[12px] leading-relaxed text-foreground/90 sm:px-4">
            <p className="font-medium text-foreground">Flashcards updated for the topics you answered</p>
            <p className="mt-1 text-muted-foreground">
              Open a topic deck to revise feedback from this paper.{" "}
              <Link
                href="/revision/topic-flashcards"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                All topic decks
              </Link>
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
              {topicFlashcardIdsAfterSave.map((tid) => {
                const tlabel = getTopicById(tid)?.label ?? tid;
                return (
                  <li key={tid}>
                    <Link
                      href={`/revision/topic-flashcards/${encodeURIComponent(tid)}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      {tlabel}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {/* ── Hero + closing feedback: captured for share / download image ── */}
        <div
          ref={summaryCaptureRef}
          className="space-y-5 rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
        >
        {/* ── Hero score card ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="results-hero-card relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 p-6 sm:p-8"
        >
          <CelebrationDots show={isExcellent} />

          {/* Session marker label */}
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="results-session-label text-[10px] font-bold uppercase tracking-[0.25em]"
          >
            Session marked
          </motion.p>

          {/* Topic title */}
          <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {topicIcon ? `${topicIcon} ` : ""}
            {topicLabel}
          </h1>

          {/* Summary line */}
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {results.scorePercent}% · {results.answeredCount}/{results.reviews.length} answered ·{" "}
            {results.markingProvider === "gemini" ? "AI rubric marking" : "Fast checker"}
          </p>

          {/* Score ring + stats grid */}
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Animated ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center"
            >
              <ScoreArc percent={results.scorePercent} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tabular-nums text-foreground">
                  {displayedScore}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  / {results.totalMaxScore}
                </span>
              </div>
            </motion.div>

            {/* Stats row */}
            <div className="flex flex-1 flex-col gap-2.5 sm:pt-2">
              {/* Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-1.5"
              >
                <Badge variant="accent" className="results-slot-badge">
                  {results.scorePercent}%
                </Badge>
                {bandLabel && (
                  <Badge
                    variant={isExcellent ? "success" : "accent"}
                    className="results-slot-badge"
                  >
                    {bandLabel}
                  </Badge>
                )}
                {answeredAll && (
                  <Badge variant="success" className="results-slot-badge">
                    All answered
                  </Badge>
                )}
              </motion.div>

              {/* Stat pills */}
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatPill
                  label="Score"
                  value={`${results.totalScore}/${results.totalMaxScore}`}
                  icon={Trophy}
                  delay={0.5}
                />
                <StatPill
                  label="Full marks"
                  value={`${fullMarkCount}/${results.reviews.length}`}
                  icon={Zap}
                  delay={0.55}
                />
                <StatPill
                  label="Accuracy"
                  value={`${results.scorePercent}%`}
                  icon={Target}
                  delay={0.6}
                />
              </div>

              {results.overallSummary && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground"
                >
                  {results.overallSummary}
                </motion.p>
              )}
              {results.examinerNote ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75 }}
                  className="mt-2 max-w-md text-[11.5px] leading-relaxed text-muted-foreground/90"
                >
                  <span className="font-semibold text-foreground/80">Examiner note: </span>
                  {results.examinerNote}
                </motion.p>
              ) : null}
            </div>
          </div>
        </motion.div>

        {/* ── Feedback cards ─────────────────────────────────── */}
        {results.sessionClosingFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/30 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100/80 dark:bg-emerald-500/20">
                  <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  What went well
                </p>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/90">
                {results.sessionClosingFeedback.whatWentWell}
              </p>
            </div>
            <div className="rounded-xl border border-violet-200/50 bg-violet-50/25 p-4 dark:border-violet-500/20 dark:bg-violet-500/[0.06]">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100/80 dark:bg-violet-500/20">
                  <TrendingUp size={12} className="text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                  Targets to improve
                </p>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/90">
                {results.sessionClosingFeedback.targetsToImprove}
              </p>
            </div>
          </motion.div>
        )}
        </div>

        {/* ── Rate limit / skip note ─────────────────────────── */}
        {results.examMarkingMeta?.aiSkippedNote && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-5 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/[0.06] dark:text-amber-200"
          >
            {results.examMarkingMeta.aiSkippedNote}
          </motion.p>
        )}

        {/* ── Scores by question ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scores by question
            </p>
            <p className="text-[11px] tabular-nums text-muted-foreground/60">
              {fullMarkCount}/{results.reviews.length} full marks
            </p>
          </div>

          {/* Score progress bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  results.scorePercent >= 80
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : results.scorePercent >= 60
                      ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                      : results.scorePercent >= 40
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                        : "linear-gradient(90deg, #ef4444, #f87171)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${results.scorePercent}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Question list */}
          <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/80 bg-card/60">
            <AnimatePresence>
              {visibleReviews.map((r, i) => {
                // Collect missing-marks hints from evaluation (populated by Gemini's `miss` array)
                const missingPoints = (r.evaluation.missingSlots ?? [])
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 4);
                return (
                  <QuestionScoreRow
                    key={r.question.id}
                    index={i}
                    prompt={r.question.prompt}
                    score={r.score}
                    maxScore={r.maxScore}
                    missingPoints={missingPoints.length > 0 ? missingPoints : undefined}
                  />
                );
              })}
            </AnimatePresence>

            {/* Show more / less toggle */}
            {results.reviews.length > 6 && (
              <li className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showAll ? (
                    <>
                      <ChevronUp size={13} />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} />
                      Show {hiddenCount} more
                    </>
                  )}
                </button>
              </li>
            )}
          </ul>
        </motion.div>

        {/* ── Footer CTA ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <Button onClick={onViewDetails} className="w-full max-w-xs">
            <GraduationCap size={15} />
            Open marked paper
          </Button>
          <p className="text-center text-[11px] text-muted-foreground/60">
            View details opens your answers on the same paper layout — read-only, with AI highlights
            and notes.
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
