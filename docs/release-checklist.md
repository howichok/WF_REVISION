# Revision Platform Release Checklist

## Environment
- `NEXT_PUBLIC_SUPABASE_URL` set or intentionally omitted for local-only mode.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set or intentionally omitted for local-only mode.
- `NEXT_PUBLIC_APP_URL` points at the current preview or production origin.
- `GEMINI_API_KEY` set for coach / improve-polish / grounded-official modes.
- `GEMINI_COACH_MODEL` and `GEMINI_GROUNDED_MODEL` explicitly set if overriding defaults.

## Smoke Paths
- `/revision/security/ask`
- `/revision/security/exam-drill`
- `/revision/security/answer-check`
- `/revision/security/recall`
- `/revision/security/quiz`
- `/api/intelligence/topic-assistant/stream`
- `/api/intelligence/evaluate/stream`
- `/api/intelligence/revision-improve/stream`
- `/api/health/revision`

## Expected Fallbacks
- Without `GEMINI_API_KEY`, topic assistant still answers in local-first mode.
- Without `GEMINI_API_KEY`, improve mode still returns deterministic weak spans and changes.
- Grounded research should fail clearly with a configuration message instead of hanging.
- Overlay should still work as a status shell if any AI route fails.

## Verification
- `npm run test:coverage-graph`
- `npm run test:topic-progression`
- `npm run test:revision-improve`
- `npm run test:topic-intelligence`
- `npm run test:revision-overlay`
- `npm run build`
