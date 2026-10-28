# Stem Studios — TMUA & ESAT revision

A working, key-free revision platform foundation. Built with Next.js App Router, strict TypeScript, Tailwind CSS, shadcn-style Radix primitives, Lucide, Motion, Recharts, KaTeX and Zod. PostgreSQL models use Drizzle.

## Run locally

Deployment target: Netlify. Exact settings and authentication setup are in [NETLIFY.md](./NETLIFY.md).

Requires Node 24+ and pnpm 11 (Node 24 enables the optional TypeScript seed script). Supabase session refresh uses the public connection settings in ignored `.env.local`; `.env.example` documents the required variables. Study features still use local demo data.

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

Playwright journey specifications are in `tests/e2e/`. On a development machine with Playwright Chromium installed, run `pnpm test:e2e`. UI QA in the initial build was performed through the Codex browser; see `VALIDATION.md` for the checks actually run.

## What works

- Landing page, all requested navigation routes and responsive workspace shell.
- Local demo access: no password is collected and no real authentication is implied.
- Three-step onboarding: exam, ESAT modules, self-reported score or unknown, target, exam date, availability, confidence and preparation experience.
- Sixteen original mathematics/science questions with provenance, version, reviewed status, five options, progressive hints and worked solutions.
- Search/filter by exam, topic, difficulty, unanswered, incorrect, bookmark and verified status.
- Adaptive question ordering; answer validation and scoring; per-question results; optional elapsed timer; local reports and bookmarks.
- Session recovery, navigation and ten-minute timed rehearsal with automatic expiry submission. Hints and solutions are hidden while a rehearsal is active. It is a demo format, not an official exam configuration.
- A deterministic revision planner with weekly time budgeting, per-session completion, rescheduling and future-plan regeneration using recent practice. It preserves completed sessions when refreshed.
- Analytics from local attempts, conservative topic estimates and explicit low-evidence labels. Illustrative history is separately labelled.
- Original topic guides, resource search, personal external resources, progress export and local reset.
- Authored tutor examples. No generative AI is called.

Study XP, six progression ranks, daily quests and question milestones work from saved local attempts. A new question earns 10 XP for an attempt plus 20 XP on its first correct answer; repeats cannot farm XP. The leaderboard uses explicitly labelled illustrative students alongside your actual local XP. There are no live opponents, secure competitive ratings, score calibration, cloud storage, subscription system or question-generation service. Dashboard readiness and historical statistics remain labelled samples, never predictions of a real score. Momentum cards show actual activity, including honest zero states.

## Architecture & extension points

| Location                  | Responsibility                                                 |
| ------------------------- | -------------------------------------------------------------- |
| `src/app/`                | App Router, metadata, exported routes and global design tokens |
| `src/components/`         | Workspace shell, shared components, browser state provider     |
| `src/components/ui/`      | Editable shadcn-style primitive components                     |
| `src/features/`           | Isolated learning, planning, resource and account screens      |
| `src/domain/types.ts`     | Domain types and Zod validation                                |
| `src/domain/learning.ts`  | Pure scoring, scheduling, mastery, timer and adaptive logic    |
| `src/data/questions.ts`   | Original reviewed question fixtures; add content here          |
| `src/data/exam-config.ts` | Versioned rehearsal format; add sourced formats here           |
| `src/services/storage.ts` | Validated local persistence with corrupt-data recovery         |
| `src/services/tutor.ts`   | Provider interface and explicitly scripted adapter             |
| `src/db/schema.ts`        | Inactive PostgreSQL/Drizzle relational model                   |
| `migrations/`             | Optional future Supabase schema and RLS policies               |
| `scripts/seed.mjs`        | Generates optional SQL from the original question fixtures     |

The warm visual identity and shared component styling live in `src/app/redesign.css`, loaded after the base layouts in `globals.css`. The `Brand` component is in `src/components/shell.tsx`. XP rules and ranks live in the pure `src/domain/progression.ts` module; their shared UI lives in `src/components/progression.tsx`. Questions and resources remain separate from layout components. Adding questions automatically expands the available XP pool.

The current static route set is enumerated in `src/app/[...path]/page.tsx`. `/practice/demo`, `/mock-exams/demo` and `/results/demo` render the active local session; the actual session UUID lives in persisted state. To support arbitrary shareable session URLs, replace the static route adapter with real dynamic App Router routes and an authenticated repository. Historical local attempts remain available to analytics, but the results route shows the most recent session only.

### Backend integration later

1. Server mode and the Supabase session proxy are configured. Add a repository adapter behind the provider rather than coupling UI components to Supabase.
2. Configure server-only Supabase credentials. Provision users from authenticated identity. Run the reviewed migration, never from client startup.
3. Move question solutions and scoring behind a trusted API. The optional schema keeps solutions separate and provides no browser read policy for them; students can read only their own attempt records. Session and scoring writes are intentionally restricted to trusted services.
4. Apply input validation, ownership checks, transactional submission and replay/expiry protection on that API before competition. The browser demo is intentionally inspectable and provides no anti-cheat guarantees.
5. Replace `demoTutor` with a server endpoint implementing `TutorProvider`. Keep provider secrets in server environment variables. Add provider timeouts, usage limits and domain evaluation before publishing live AI guidance.
6. For question generation, introduce draft jobs and moderation records. Generated content must remain pending until independently checked; do not include it in ranked sets or calibrated mocks by default.

The optional migration uses Supabase `auth.users` and `auth.uid()`; it is not a standalone generic PostgreSQL migration. It has not been applied to a live database. Review and integration-test RLS and privileges before enabling multi-user access. The demo never transmits attempts or profile details to a database.

### Seed export

```sh
node scripts/seed.mjs
```

This writes `migrations/seed.sql` and opens no database connection. The application itself uses the TypeScript fixtures directly. These are original educational examples; no official papers have been scraped or reproduced. Official specifications and exam formats must be sourced and verified before being added.

### Planning and uncertainty

The engine distributes weekly minutes across four sessions, prorating partial final weeks and limiting initial plans to 52 weeks. A 12-week plan at 8 hours/week contains 96 hours. Exam day is excluded. Weakness ordering is based on a Beta(2,2) prior over submitted answers, with fewer than five topic attempts explicitly marked insufficient. Regeneration is a deliberate user action, so it does not silently overwrite custom session dates. Targets and self-reported scores are never treated as measured ability or promises of attainment.

Local data uses `axiom-demo-v1`. It remains scoped to the browser origin and is not a secure account boundary, cloud backup or sync service. Export data from Settings before changing origins or clearing browser storage.
