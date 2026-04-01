# Data contracts

Core entities:
- Component: `id`, `title`, `weighting_qualification_percent`
- Paper: `id`, `title`, `duration_minutes`, `marks`, `content_areas`
- Topic: `id`, `title`, `summary`, `subtopics`
- Subtopic: `id`, `title`, `outcomes`
- Question: `id`, `paper`, `topic_id`, `subtopic_id`, `command_word`, `marks`, `difficulty`, `answer_type`, `prompt`
- MarkSchemePoint: ordered bullet attached to a question
- Attempt: `questionId`, `startedAt`, `submittedAt`, `score`, `maxScore`, `confidence`, `timeSpentSeconds`, `selfAssessment`
- UserTopicMastery: `topicId`, `masteryPercent`, `attemptCount`, `recentTrend`, `weakSignal`
- WeakTopicSignal: `topicId`, `strength`, `drivers`, `lastObservedAt`
- Recommendation: `id`, `reason`, `targetType`, `targetId`, `estimatedMinutes`
- RevisionPlan: `id`, `date`, `slots`, `targets`
- MockExam: `id`, `paperScope`, `questionIds`, `timeLimitMinutes`

Content loading direction:
- `curriculum-map.json` is the authoritative topic/paper tree.
- `question-bank.json` is the authoritative practice source for the current app slice.
- `feedback-rules.json` and `mark-scheme-rules.md` define reusable examiner-style feedback patterns.
- Runtime progress data should stay user-specific and separate from source content.
