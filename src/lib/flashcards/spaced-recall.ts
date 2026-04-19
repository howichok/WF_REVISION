/**
 * SM2-lite style scheduling for short study sessions (minutes-scale intervals).
 */
export interface FlashCardSchedule {
  due: number;
  easeFactor: number;
  reps: number;
}

export type RecallRating = 0 | 1 | 2 | 3;

/** Labels: Again, Hard, Good, Easy */
export function nextSchedule(rating: RecallRating, prev?: FlashCardSchedule): FlashCardSchedule {
  const now = Date.now();
  const ef = prev?.easeFactor ?? 2.5;
  const reps = prev?.reps ?? 0;

  switch (rating) {
    case 0:
      return { due: now + 60_000, easeFactor: Math.max(1.3, ef - 0.2), reps: 0 };
    case 1:
      return { due: now + 5 * 60_000, easeFactor: Math.max(1.3, ef - 0.15), reps: reps + 1 };
    case 2:
      return { due: now + 10 * 60_000, easeFactor: ef, reps: reps + 1 };
    case 3:
      return { due: now + 24 * 60 * 60_000, easeFactor: Math.min(3.0, ef + 0.1), reps: reps + 1 };
    default:
      return { due: now + 60_000, easeFactor: ef, reps };
  }
}

export function isDue(s: FlashCardSchedule | undefined, now = Date.now()): boolean {
  if (!s) return true;
  return s.due <= now;
}

export function isMastered(s: FlashCardSchedule | undefined): boolean {
  if (!s) return false;
  return s.reps >= 3 && s.easeFactor >= 2.2;
}
