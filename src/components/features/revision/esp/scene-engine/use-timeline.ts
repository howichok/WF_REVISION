"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackStatus, SceneBeat } from "./types";

export const DEFAULT_BEAT_MS = 1200;

/** Resolve the absolute time (ms from scene start) of each beat. */
export function resolveBeatTimings(beats: SceneBeat[]): number[] {
  const out: number[] = [];
  let cursor = 0;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i]!;
    if (typeof b.at === "number") {
      cursor = b.at;
    } else if (i === 0) {
      cursor = 0;
    } else {
      cursor += b.after ?? DEFAULT_BEAT_MS;
    }
    out.push(cursor);
  }
  return out;
}

export interface TimelineControls {
  index: number;
  total: number;
  status: PlaybackStatus;
  durationMs: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  replay: () => void;
  /** Jump to an arbitrary beat index (clamped). Pauses playback. */
  seek: (i: number) => void;
}

export interface UseTimelineOptions {
  autoplay?: boolean;
  loop?: boolean;
  reducedMotion?: boolean;
  /** Key that, when changed, restarts the timeline from 0 (e.g. replay button). */
  resetKey?: number | string;
}

/**
 * Drives a beat index over time. When `reducedMotion` is true, the timeline
 * jumps immediately to the last beat so primitives render their final state.
 */
export function useTimeline(beats: SceneBeat[], options: UseTimelineOptions = {}): TimelineControls {
  const { autoplay = true, loop = false, reducedMotion = false, resetKey } = options;

  const timings = useRef<number[]>(resolveBeatTimings(beats));
  timings.current = resolveBeatTimings(beats);
  const total = beats.length;
  const durationMs = timings.current[total - 1] ?? 0;

  const [index, setIndex] = useState(() => (reducedMotion ? Math.max(0, total - 1) : 0));
  const [status, setStatus] = useState<PlaybackStatus>(() => {
    if (reducedMotion || total === 0) return "ended";
    return autoplay ? "playing" : "idle";
  });

  const pausedAtRef = useRef<number>(0);
  const playStartWallRef = useRef<number | null>(null);

  const clear = useRef<number | null>(null);
  useEffect(() => () => {
    if (clear.current) cancelAnimationFrame(clear.current);
  }, []);

  const tick = useCallback(() => {
    if (playStartWallRef.current == null) return;
    const elapsed = performance.now() - playStartWallRef.current + pausedAtRef.current;
    let nextIdx = 0;
    for (let i = 0; i < timings.current.length; i++) {
      if (elapsed >= timings.current[i]!) nextIdx = i;
      else break;
    }
    setIndex((prev) => (prev !== nextIdx ? nextIdx : prev));
    if (elapsed >= durationMs) {
      if (loop) {
        pausedAtRef.current = 0;
        playStartWallRef.current = performance.now();
        setIndex(0);
        clear.current = requestAnimationFrame(tick);
        return;
      }
      setStatus("ended");
      playStartWallRef.current = null;
      return;
    }
    clear.current = requestAnimationFrame(tick);
  }, [durationMs, loop]);

  // React to reset
  useEffect(() => {
    if (reducedMotion) {
      setIndex(Math.max(0, total - 1));
      setStatus("ended");
      playStartWallRef.current = null;
      pausedAtRef.current = 0;
      return;
    }
    setIndex(0);
    pausedAtRef.current = 0;
    if (autoplay) {
      playStartWallRef.current = performance.now();
      setStatus("playing");
      if (clear.current) cancelAnimationFrame(clear.current);
      clear.current = requestAnimationFrame(tick);
    } else {
      playStartWallRef.current = null;
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, reducedMotion]);

  const play = useCallback(() => {
    if (reducedMotion) return;
    if (status === "ended") {
      pausedAtRef.current = 0;
      setIndex(0);
    }
    playStartWallRef.current = performance.now();
    setStatus("playing");
    if (clear.current) cancelAnimationFrame(clear.current);
    clear.current = requestAnimationFrame(tick);
  }, [reducedMotion, status, tick]);

  const pause = useCallback(() => {
    if (reducedMotion) return;
    if (playStartWallRef.current != null) {
      pausedAtRef.current = pausedAtRef.current + (performance.now() - playStartWallRef.current);
    }
    playStartWallRef.current = null;
    setStatus("paused");
    if (clear.current) cancelAnimationFrame(clear.current);
  }, [reducedMotion]);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else play();
  }, [status, pause, play]);

  const seek = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(total - 1, i));
      setIndex(clamped);
      pausedAtRef.current = timings.current[clamped] ?? 0;
      playStartWallRef.current = null;
      setStatus(clamped >= total - 1 ? "ended" : "paused");
      if (clear.current) cancelAnimationFrame(clear.current);
    },
    [total]
  );

  const next = useCallback(() => seek(index + 1), [index, seek]);
  const prev = useCallback(() => seek(index - 1), [index, seek]);

  const replay = useCallback(() => {
    pausedAtRef.current = 0;
    setIndex(0);
    if (reducedMotion) {
      setIndex(Math.max(0, total - 1));
      setStatus("ended");
      return;
    }
    playStartWallRef.current = performance.now();
    setStatus("playing");
    if (clear.current) cancelAnimationFrame(clear.current);
    clear.current = requestAnimationFrame(tick);
  }, [reducedMotion, tick, total]);

  return {
    index,
    total,
    status,
    durationMs,
    play,
    pause,
    toggle,
    next,
    prev,
    replay,
    seek,
  };
}
