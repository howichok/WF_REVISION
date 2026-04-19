/**
 * Scene engine — shared types for object-based ESP lesson walkthroughs.
 *
 * Model:
 *  - A `SceneBeat` is one narrated moment. It has a caption and a timing offset.
 *  - A scene component is a React component that reads the current beat index
 *    from `useSceneBeat()` and renders concrete UI primitives whose visual
 *    state is derived from that index (not from animated text blocks).
 */

export type SceneCategory = "aim" | "constraint" | "asset" | "risk" | "user" | "neutral";

export interface SceneBeat {
  /** Short description of what is happening visually in this beat. */
  caption: string;
  /**
   * Milliseconds after scene start. If omitted, falls back to
   * `previousBeat.at + (beat.after ?? DEFAULT_BEAT_MS)`.
   */
  at?: number;
  /** Interval after the previous beat, in ms. Ignored if `at` is set. */
  after?: number;
}

export interface SceneDescriptor {
  /** Registry key for the scene component. */
  id: string;
  /** Optional free-form data hints (e.g. variant selector). */
  data?: Record<string, unknown>;
}

export type PlaybackStatus = "idle" | "playing" | "paused" | "ended";
