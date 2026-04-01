# T-Level Digital Sprint (Core Revision)

Fast, low-friction revision web app for **T Level Digital Software Development (Core)**.

- Fixed exam dates:
  - **Paper 1:** Tuesday, 2 June 2026 (2h 15m)
  - **Paper 2:** Tuesday, 9 June 2026 (2h 15m)
- Stack: **Next.js App Router + TypeScript + Tailwind + shadcn/ui + lucide-react**
- Storage: **IndexedDB** (with localStorage fallback), all storage usage is in client code
- Content: local JSON files in repo for easy extension
- No ESP features included

## Syllabus Source Of Truth

- Topic tree source is **only**: `content/syllabus.json`
- This file is copied verbatim from `source/syllabus.core-dsd.json`
- IDs and hierarchy are preserved exactly as provided
- Library tree, weakness checklist, diagnostics selection, plan topic weighting, and glossary topic links read this tree

## Features (MVP + Delight)

- One-profile onboarding (nickname required, email optional)
- Study time setup (minutes/day or hours/week + days/week)
- Weakness setup:
  - manual weak-topic marking
  - per-topic mini diagnostics (5-8 questions)
- Auto-planning engine:
  - before Paper 1: Paper 1 focus (70%) / Paper 2 support (30%)
  - between papers: Paper 2 focus (85%) / Paper 1 maintenance (15%)
  - topic weighting: `(100 - mastery) + weak_bonus`
- Dashboard cockpit split into **Action** and **Analytics**
- Library mode: 2-panel tree + details (desktop), sheet + selector (mobile)
- Global command search overlay (`Ctrl+K`) with grouped results:
  - Topic / Subtopic / Outcome / Glossary term
  - debounced query + normalized matching + fuzzy fallback
  - optional `Include outcomes` toggle for deeper search
- Revision mode (Today flow):
  - Leitner flashcards due today
  - mini-quiz on weak topics
  - one exam-style question
- Quiz mode with review/explanations and weak-topic stats updates
- Exam mode with 2:15 timer + pacer milestones toasts
- Open-ended answer checking (no AI/LLM):
  - rubric criteria with weighted key ideas
  - fuzzy keyword matching with configurable threshold (default 0.80)
  - found/missing/suspicious rubric feedback
- Spellcheck support:
  - local dictionary-based unknown-word detection
  - underlined problem words + suggested corrections
- Coding-question checking:
  - local JS function runner with configured unit tests
  - pass/fail per test with expected vs actual output
- Answer check history:
  - stores user response and full check report locally
- Glossary search with links back to topics
- Share features:
  - Copy summary
  - Copy link
  - Share button (native share fallback to copy)
- Optional "Suggest a card / Report error" dialog (Google Form placeholder)
- Light/Dark mode, sticky top nav, desktop sidebar, mobile bottom nav

## Routes

- `/` - welcome / create profile
- `/onboarding/time`
- `/onboarding/weakness`
- `/app` - dashboard cockpit
- `/library`
- `/library/[paper]/[topic]`
- `/revision`
- `/quiz`
- `/exam`
- `/stats`
- `/glossary`

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production:

```bash
npm run build
```

4. Lint:

```bash
npm run lint
```

## Netlify Deploy (Git-based)

Already configured:

- Dev dependency installed:
  - `@netlify/plugin-nextjs`
- Root `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Deploy steps:

1. Push repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site -> Import from Git**.
3. Select this repo.
4. Netlify reads `netlify.toml` and uses the plugin automatically.
5. Deploy.

## Content Model and How to Extend

All editable content is in `/data`:

- `data/glossary.json`
  - term + short definition + topic links
- `data/quizQuestions.json`
  - quiz and diagnostic questions
- `data/flashcards.json`
  - Leitner cards
- `data/examQuestions.json`
  - exam-style prompts with answer type (`open-ended` or `coding`)
  - open-ended rubric criteria/weights/keywords/synonyms
  - coding task starter code + test cases
- `content/syllabus.json`
  - exact syllabus hierarchy (papers/content areas/sections/outcomes)

### Add a new topic

1. Use an existing syllabus node ID from `content/syllabus.json` (no custom topic IDs).
2. Add matching quiz items in `data/quizQuestions.json` with that `topicId`.
3. Add flashcards in `data/flashcards.json` with that `topicId`.
4. Add glossary terms linked to that topic in `data/glossary.json`.
5. (Optional) Add exam-style question in `data/examQuestions.json` with `topicIds` from syllabus.

### Add open-ended rubric scoring

For `answerType: "open-ended"` in `data/examQuestions.json`:

1. Add `rubric.title`.
2. Add `rubric.criteria[]` entries with:
   - `id`
   - `label`
   - `weight`
   - `keywords`
   - optional `synonyms`
3. Keep criteria focused on markable key ideas.

### Add coding question checks

For `answerType: "coding"` in `data/examQuestions.json`:

1. Add `codingTask.functionName`.
2. Add `codingTask.starterCode`.
3. Add `codingTask.tests[]` with:
   - `description`
   - `args` (array passed to function)
   - `expected`

### Add diagnostics for onboarding

Diagnostic mini-tests use questions where `diagnostic: true` in `data/quizQuestions.json`.
Use at least 5 questions per topic for reliable onboarding scoring.
If a syllabus node has no local quiz entries, the app generates diagnostics from extracted PDF outcomes while preserving syllabus IDs/structure.

## Data + State Notes

- Profile and progress are per-device, single-profile.
- Persisted fields include mastery, weak flags, sessions, streak, daily minutes, flashcard box state, and answer-check history reports.
- Leitner scheduling uses box intervals configured in `lib/constants.ts`.
- Exam pacer milestones are configurable in `lib/constants.ts`:
  - `EXAM_PACER_MILESTONES_MINUTES`
  - `EXAM_PACER_LAST_MINUTES_WARNING`
- Rubric/spellcheck matching controls are configurable in `lib/constants.ts`:
  - `RUBRIC_FUZZY_THRESHOLD`
  - `SHORT_WORD_STRICT_THRESHOLD`
  - `SPELLCHECK_MIN_WORD_LENGTH`
  - `SPELLCHECK_SUGGESTION_THRESHOLD`

## Library + Search UX

- Library now uses a **tree + details** pattern:
  - left panel: collapsible syllabus tree (Paper -> Topic -> Subtopic)
  - right panel: selected node details, outcomes (collapsed by default), actions
- Node actions are centralized in one place:
  - mark weak / unmark
  - start mini-test
  - start quiz from this node
- `Ctrl+K` (or click Search in header) opens command palette:
  - grouped result types
  - specRef + breadcrumb path in each result
  - direct open into the selected library node

## Rubric Checker Limitations

- Open-ended scoring is rubric-based matching, not semantic understanding.
- High score means key rubric phrases/ideas were detected, not full human-mark quality.
- Spellcheck uses a local project dictionary and may miss uncommon valid words.

## UX / Design Decisions (short)

- Built for speed and low cognitive load:
  - no calendar-heavy UI
  - clear "Today" execution flow
  - compact analytics
- Dashboard prioritizes action first, then metrics.
- Consistent component system via shadcn/ui primitives.
- Strong keyboard/tap targets, contrast-safe colors, responsive nav patterns.
