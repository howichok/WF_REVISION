import type { LearningRailItem, LearningRailState } from "./types";

interface IndexedRailItemInput {
  label: string;
  description?: string;
  meta?: string;
  href?: string;
  locked?: boolean;
}

interface LinearRailItemInput {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  href?: string;
  locked?: boolean;
}

function toCompletedSet<T>(items?: Iterable<T>) {
  return new Set(items ?? []);
}

function toRailState(isLocked: boolean, state: LearningRailState): LearningRailState {
  return isLocked ? "locked" : state;
}

export function buildIndexedRailItems(
  items: IndexedRailItemInput[],
  currentIndex: number,
  completedIndexes?: Iterable<number>
): LearningRailItem[] {
  if (items.length === 0) {
    return [];
  }

  const lastIndex = items.length - 1;
  const clampedIndex = Math.min(Math.max(currentIndex, 0), lastIndex);
  const completedSet = toCompletedSet(completedIndexes);

  return items.map((item, index) => {
    const baseState: LearningRailState =
      completedSet.has(index) || index < clampedIndex
        ? "completed"
        : index === clampedIndex
          ? "current"
          : "upcoming";

    return {
      id: `step-${index + 1}`,
      label: item.label,
      description: item.description,
      meta: item.meta,
      href: item.href,
      state: toRailState(Boolean(item.locked), baseState),
    };
  });
}

export function buildLinearRailItems(
  items: LinearRailItemInput[],
  currentItemId: string,
  completedItemIds?: Iterable<string>
): LearningRailItem[] {
  if (items.length === 0) {
    return [];
  }

  const explicitCompletionModel = completedItemIds !== undefined;
  const completedSet = toCompletedSet(completedItemIds);
  const requestedCurrentIndex = items.findIndex((item) => item.id === currentItemId && !item.locked);
  const fallbackCurrentIndex =
    requestedCurrentIndex >= 0 ? requestedCurrentIndex : items.findIndex((item) => !item.locked);

  return items.map((item, index) => {
    if (item.locked) {
      return {
        id: item.id,
        label: item.label,
        description: item.description,
        meta: item.meta,
        href: item.href,
        state: "locked" as const,
      };
    }

    let state: LearningRailState = "upcoming";

    if (completedSet.has(item.id)) {
      state = "completed";
    } else if (index === fallbackCurrentIndex) {
      state = "current";
    } else if (!explicitCompletionModel && fallbackCurrentIndex >= 0 && index < fallbackCurrentIndex) {
      state = "completed";
    }

    return {
      id: item.id,
      label: item.label,
      description: item.description,
      meta: item.meta,
      href: item.href,
      state,
    };
  });
}

export type { IndexedRailItemInput, LinearRailItemInput };
