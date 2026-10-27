# Validation

The following checks were run for the initial foundation:

- Strict TypeScript check (`pnpm typecheck`).
- ESLint (`pnpm lint`).
- Vitest: scoring, invalid answer rejection, independent numeric solution checks, exact 96-hour planning, partial-week budgeting, date validation, timer expiry/clamping, low-evidence mastery, corrupt storage recovery, profile validation and adaptive ordering.
- Next.js production build with static export (all 22 generated pages, including the not-found page).
- Optional seed generator exports all 16 original questions without a database connection.

Browser QA used the running Next.js application through the Codex browser:

- Dashboard rendering and labelled sample history.
- Question bank to a one-question practice session.
- KaTeX rendering, progressive hint, correct answer, worked solution.
- Reload restores the submitted answer, and results show 1/1 and 100%.
- Onboarding with unknown current score and an eight-hour weekly commitment produces 96 hours over twelve weeks.
- Completing a plan task persists after reload.
- Rescheduling a task saves its new date. A form submission avoids losing the edit when a moved task leaves the visible week.
- Mobile dashboard at 390 × 844: no horizontal body overflow, readable cards and working drawer navigation. The viewport override was reset after testing.
- Timed rehearsal shows a countdown and hides hints/solutions. Finishing with one correct answer and four unanswered produces 1/5 and 20%.

Playwright journey specifications are provided in `tests/e2e/` for future CI. They were not executed by the command-line Playwright runner in this environment; the above browser checks were interactive QA.

The optional Supabase migration and RLS policies were not applied to a live database. External AI, genuine authentication, calibrated official exam formats and competitive integrity are not active integrations. Their behaviour is not claimed as tested.
