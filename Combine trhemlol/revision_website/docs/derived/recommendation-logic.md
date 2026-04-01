# Recommendation logic

Inputs:
- Accuracy by topic and subtopic
- Recency of practice
- Repeated mistakes against mark-scheme points
- Time spent relative to expected time
- User confidence
- Upcoming exam focus (Paper 1, Paper 2, ESP, OS)

Weak-topic signal heuristic:
- Start from inverse accuracy.
- Add weight for recent incorrect attempts.
- Add weight when confidence is high but score is low.
- Add weight when the same subtopic fails multiple times in a short window.
- Reduce weight when recent attempts show improvement.

Recommendation priority:
1. High-signal weak subtopics with low recent practice.
2. Near-exam papers with below-threshold readiness.
3. Mixed revision sets that combine a weak area with a previously strong area.
4. Short five-minute drills when the learner has little time available.

Readiness model:
- Topic mastery rolls into paper readiness.
- Paper readiness rolls into component readiness.
- ESP and OS readiness use coverage of framework areas plus scenario performance rather than raw recall alone.
