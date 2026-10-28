# Stem Studios — TMUA & ESAT revision

Accounts and Arena source are implemented. The approved Supabase setup is installed and TMUA Intermediate now has ten questions and private review receipts under `ayaan`. Real two-account acceptance testing is pending; other modes stay disabled. Start with [ARENA.md](./ARENA.md), [SUPABASE-ROLLOUT.md](./SUPABASE-ROLLOUT.md) and [NETLIFY.md](./NETLIFY.md). No implementation changes have been pushed or deployed.

All sixty private questions have owner-confirmed review records. The first ten are imported while the owner tests a private TMUA Intermediate race manually in two browsers. See [QUESTION-REVIEW.md](./QUESTION-REVIEW.md). The local Netlify adapter build passes; see [NETLIFY-DIAGNOSIS.md](./NETLIFY-DIAGNOSIS.md).

A revision platform built with Next.js App Router, strict TypeScript, Tailwind CSS, Radix primitives, Lucide, Motion, Recharts, KaTeX and Zod. Accounts use Supabase Auth and private cloud progress; PostgreSQL functions own competitive scoring.

## Run locally

Deployment target: Netlify. Exact settings and authentication setup are in [NETLIFY.md](./NETLIFY.md).

Requires Node 24 and pnpm 11. Supabase uses the public connection settings in ignored `.env.local`; `.env.example` documents the required variables. Practice uses the existing question fixtures. Student progress is saved per account in the cloud; legacy browser data is retained without automatic import.

```sh
cd /Users/p2g/Documents/axiom-revision
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000/dashboard/ for the workspace or http://127.0.0.1:3000/ for the landing page. `pnpm dev` starts Next.js on loopback. The app now builds for a Next.js server so Supabase session refresh can run. Use `pnpm build` and `pnpm start` for production locally. See `SUPABASE.md` for hosting requirements; the older published Sites preview remains static.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Playwright journey specifications are in `tests/e2e/` and require explicit staging opt-in, two verified test accounts and reviewed private questions. Follow the exact environment/loading instructions in `ARENA.md`; listing the tests does not mean a real two-account test has passed. `VALIDATION.md` describes historical initial-build checks.

## What works

- Landing page, all requested navigation routes and responsive workspace shell.
- Supabase email/password account forms, recovery, logout and protected workspace routes.
- Three-step onboarding: exam, ESAT modules, self-reported score or unknown, target, exam date, availability, confidence and preparation experience.
- Sixteen original practice fixtures with question metadata, five options, progressive hints and worked solutions. These publicly bundled examples are not an independently verified private Arena pool.
- Search/filter by exam, topic, difficulty, unanswered, incorrect, bookmark and verified status.
- Adaptive question ordering; answer validation and scoring; per-question results; optional elapsed timer; local reports and bookmarks.
- Session recovery, navigation and ten-minute timed rehearsal with automatic expiry submission. Hints and solutions are hidden while a rehearsal is active. It is a demo format, not an official exam configuration.
- A deterministic revision planner with weekly time budgeting, per-session completion, rescheduling and future-plan regeneration using recent practice. It preserves completed sessions when refreshed.
- Analytics from the student's cloud-saved attempts, conservative topic estimates and explicit low-evidence labels.
- Original topic guides, resource search, personal external resources, progress export and local reset.
- Authored tutor examples. No generative AI is called.

Study XP, progression ranks and milestones derive from the student's cloud-saved attempts. Arena rankings derive only from database-settled matches; no sample opponents are rendered there. Practice progress is self-reported learning evidence, not a trusted competitive score. Arena answer validation, scores and Elo live in PostgreSQL functions. See ARENA.md for setup requirements, tested boundaries and remaining real-account/device acceptance work.

## Architecture & extension points

| Location                  | Responsibility                                                   |
| ------------------------- | ---------------------------------------------------------------- |
| `src/app/`                | App Router, protected pages, API routes and global design tokens |
| `src/components/`         | Workspace shell, shared components, browser state provider       |
| `src/components/ui/`      | Editable shadcn-style primitive components                       |
| `src/features/`           | Isolated learning, planning, resource and account screens        |
| `src/domain/types.ts`     | Domain types and Zod validation                                  |
| `src/domain/learning.ts`  | Pure scoring, scheduling, mastery, timer and adaptive logic      |
| `src/data/questions.ts`   | Public practice fixtures; independent review pending             |
| `src/data/exam-config.ts` | Versioned rehearsal format; add sourced formats here             |
| `src/services/storage.ts` | Persisted-state validation and retained legacy backup utilities  |
| `src/services/tutor.ts`   | Provider interface and explicitly scripted adapter               |
| `src/db/schema.ts`        | Inactive PostgreSQL/Drizzle relational model                     |
| `migrations/`             | Baseline account/Arena schema and RLS policies                   |
| `supabase/migrations/`    | Additive migrations after the baseline rollout                   |
| `scripts/seed.mjs`        | Generates optional SQL from the original question fixtures       |

The warm visual identity and shared component styling live in `src/app/redesign.css`, loaded after the base layouts in `globals.css`. The `Brand` component is in `src/components/shell.tsx`. XP rules and ranks live in the pure `src/domain/progression.ts` module; their shared UI lives in `src/components/progression.tsx`. Questions and resources remain separate from layout components. Adding questions automatically expands the available XP pool.

The current static route set is enumerated in `src/app/[...path]/page.tsx`. `/practice/demo`, `/mock-exams/demo` and `/results/demo` render the active local session; the actual session UUID lives in persisted state. To support arbitrary shareable session URLs, replace the static route adapter with real dynamic App Router routes and an authenticated repository. Historical local attempts remain available to analytics, but the results route shows the most recent session only.

### Further integration

1. Server mode, the Supabase session proxy, cloud progress and Arena RPCs are configured. No service-role credential is required by the web app.
2. Reconcile and track migrations when preparing another environment; never run baseline SQL from client startup. See `SUPABASE-ROLLOUT.md` before using migration commands on the existing project.
3. Keep Arena solutions and question snapshots private. Competitive scoring, ownership checks, deadlines and duplicate submission handling run in the database. The public practice bank remains inspectable and does not feed ranked matches.
4. Supply independently reviewed private questions and complete live Auth/Realtime/two-account testing before competition. Invalid-request throttling and broader concurrency acceptance remain pending.
5. Replace `demoTutor` with a server endpoint implementing `TutorProvider`. Keep provider secrets in server environment variables. Add provider timeouts, usage limits and domain evaluation before publishing live AI guidance.
6. For question generation, introduce draft jobs and moderation records. Generated content must remain pending until independently checked; do not include it in ranked sets or calibrated mocks by default.

The migrations use Supabase `auth.users` and `auth.uid()`. Local PostgreSQL fixture tests validate RLS and game transactions; they do not replace live Supabase Auth, Realtime or multiple-device tests. Authenticated study state is transmitted only to the owner-scoped cloud progress API.

### Seed export

```sh
node scripts/seed.mjs
```

This writes `migrations/seed.sql` and opens no database connection. The application itself uses the TypeScript fixtures directly. These are original educational examples; no official papers have been scraped or reproduced. Official specifications and exam formats must be sourced and verified before being added.

### Planning and uncertainty

The engine distributes weekly minutes across four sessions, prorating partial final weeks and limiting initial plans to 52 weeks. A 12-week plan at 8 hours/week contains 96 hours. Exam day is excluded. Weakness ordering is based on a Beta(2,2) prior over submitted answers, with fewer than five topic attempts explicitly marked insufficient. Regeneration is a deliberate user action, so it does not silently overwrite custom session dates. Targets and self-reported scores are never treated as measured ability or promises of attainment.

Legacy browser data uses `axiom-demo-v1` and remains intact at its original origin. The account provider uses private cloud progress instead. Export older progress before changing origins or clearing browser storage; automatic migration/import has not been implemented.
