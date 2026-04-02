import assert from "node:assert/strict";
import test from "node:test";
import {
  getTopicCoachingMemoryStorageKey,
  mergeTopicCoachingMemoryMaps,
  normalizeTopicCoachingMemoryMap,
} from "./coaching-memory";

test("normalizes partial topic coaching snapshots from persisted storage", () => {
  const memory = normalizeTopicCoachingMemoryMap({
    security: {
      topicId: "security",
      updatedAt: "2026-04-02T09:00:00.000Z",
      failStreak: 2,
      misconceptionCounts: {
        phishing: 2,
        "access control": 1,
      },
      repeatedMisconceptions: ["phishing"],
    },
  });

  assert.equal(memory.security.topicId, "security");
  assert.equal(memory.security.failStreak, 2);
  assert.equal(memory.security.distinctionStreak, 0);
  assert.equal(memory.security.misconceptionCounts.phishing, 2);
  assert.deepEqual(memory.security.repeatedMisconceptions, ["phishing"]);
});

test("prefers the freshest topic coaching entry when merging sources", () => {
  const remote = normalizeTopicCoachingMemoryMap({
    security: {
      topicId: "security",
      updatedAt: "2026-04-02T08:00:00.000Z",
      lastRecommendedAction: "Open official source",
    },
  });
  const local = normalizeTopicCoachingMemoryMap({
    security: {
      topicId: "security",
      updatedAt: "2026-04-02T10:00:00.000Z",
      lastRecommendedAction: "Retry same concept",
    },
    data: {
      topicId: "data",
      updatedAt: "2026-04-02T09:30:00.000Z",
      lastRecommendedAction: "Try a question",
    },
  });

  const merged = mergeTopicCoachingMemoryMaps(remote, local);

  assert.equal(merged.security.lastRecommendedAction, "Retry same concept");
  assert.equal(merged.data.lastRecommendedAction, "Try a question");
});

test("builds a per-user local storage key when a user id is available", () => {
  assert.equal(
    getTopicCoachingMemoryStorageKey("user-123"),
    "wf-revision-topic-coaching-memory:user-123"
  );
  assert.equal(
    getTopicCoachingMemoryStorageKey(),
    "wf-revision-topic-coaching-memory"
  );
});
