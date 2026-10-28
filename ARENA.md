# Accounts and Arena — release checklist

**Live rollout checkpoint — 28 October 2026:** the owner ran `arena-remaining-functions.sql` successfully. All Arena RPCs, account-progress RPC, RLS and match Realtime publication have been checked. An additive `arena_readiness` migration now reports available question modes without exposing questions or answers. See [SUPABASE-ROLLOUT.md](./SUPABASE-ROLLOUT.md) for installed versions. No source changes have been pushed or deployed.

## Current verification and limits

The approved database setup is installed in project `zyhemkntpqqymfpuulid`. The existing Auth user and profile are preserved, with zero progress/match records at the import checkpoint. The private Arena bank now has **ten TMUA Intermediate questions** and matching private approval receipts under `ayaan`. The authenticated catalogue reports that mode ready at 10/10. Other modes remain unpopulated and disabled. No opponents or completed matches were fabricated.

**Next content/test workflow:** the owner confirmed all sixty private questions checked with no corrections, reviewer `ayaan`. That exact human confirmation is saved with question hashes; no reviewer derivations were invented. Only the first ten are imported while the owner tests a private race manually in two browsers. Follow [QUESTION-REVIEW.md](./QUESTION-REVIEW.md) for receipts and steps. Do not copy the exposed practice bank into Arena or invent reviewer attestations.

The reviewed migrations keep privileged implementations in the non-exposed `private` schema, with explicit authenticated-only execution and public SECURITY INVOKER RPC wrappers. Private tables also have RLS and no browser table grants. Do not add `private` to the exposed Data API schemas.

Local PGlite tests run real PostgreSQL functions/policies using isolated fixture users. They cover profile isolation, cloud-progress RLS and optimistic revision conflicts, inaccessible answer keys, private-room join/ready/countdown, identical shared question payloads, duplicate answer suppression, authoritative scoring, winner settlement and non-repeatable rating changes. These are not hosted Supabase Auth, Realtime, multi-process concurrency or two-device end-to-end tests. All of those must pass in staging before release.

## Setup for another environment

1. Inspect the live schema using Supabase SQL Editor with read-only queries such as:

   ```sql
   select table_schema, table_name from information_schema.tables
   where table_schema in ('public','private') order by 1,2;
   select schemaname, tablename, policyname, roles, cmd, qual, with_check
   from pg_policies where schemaname in ('public','private');
   select table_name,column_name,data_type from information_schema.columns
   where table_schema='public' order by table_name,ordinal_position;
   ```

   Compare against `migrations/0001_foundation.sql`. Do not reapply that file if its tables already exist. If names/types/policies differ, reconcile an additive migration first; do not drop or recreate existing tables. Take a database backup.

2. For a **new staging project**, apply missing baseline `0001`, then `0002_accounts_progress.sql`, then `0003_arena.sql`, then `supabase/migrations/20261028125425_arena_readiness.sql`, once each with migration tracking. The current live project already has these definitions: do not reapply the baseline or recovery files there. `0002` adds usernames/profile provisioning and versioned private progress, preserving existing profile rows. Existing users without handles can select one in Settings. `0003` adds the separate Arena schema, functions, ratings and Realtime publication. Do not expose the `private` schema in the Data API. No service-role key is needed by the web app. The historical baseline files are outside `supabase/migrations`; do not blindly run `supabase db push` against the current project without reconciling its tracked history first.
3. Author and independently verify **at least ten fresh, non-public questions for each enabled exam/difficulty** in `private.arena_bank`. Allowed exam values: `TMUA`, `ESAT`; difficulty: `Foundation`, `Intermediate`, `Challenge`. `content` holds `text`, `topic`, five string `options`, and optional `math`. `correct_index` (zero-based) and `solution` are separate columns. Set `verified=true` only after review. Do not import the demo questions from `src/data/questions.ts`: their answers were publicly bundled and cannot support fair ranked play. Missing content deliberately prevents queue/private-match creation rather than filling with fake questions.
4. Configure Supabase email/password Auth, email verification and SMTP. Set production/staging Site URLs and allow `/auth/callback/` and `/auth/callback/?recovery=1` for the actual origins, plus local callback URLs. With the default PKCE confirmation link, the browser that starts the flow must retain its verifier cookie. Confirmation links use Supabase's Auth endpoint and redirect back with a code; do not substitute a token-hash email template without adding its corresponding confirm handler. Password recovery redirects to the protected `/update-password/` screen after the code exchange. Test verification and recovery with your actual SMTP/templates.
5. Configure Netlify using `NETLIFY.md`: Node 24, `pnpm build`, `.next`, current automatic OpenNext adapter, and both public Supabase variables at build/runtime. `.env.local` stays ignored. No static export, custom socket server, service-role client or long-lived in-memory match coordinator is used.

## Identity, persistence and privacy

Login/signup now use Supabase Auth, with recovery and logout. The proxy verifies sessions and protects workspace routes. API progress routes independently verify the authenticated user. Cloud state is scoped by `auth.uid()`, not a browser-submitted owner. The shared domain state preserves profiles, attempts, mocks, plans, resources and achievements. Client revision data remains self-reported learning data, not trusted competitive ratings.

Cloud state loads before study tools become usable. Saves are serialized, and a version mismatch stops saving rather than overwriting another device. Account identity is checked again on each write to prevent another browser session's state being saved after an account switch. On conflict, export the current workspace in Settings before reloading; automatic merging is not implemented. Browser close prompts when changes remain unsaved. Do not sign out until the saving indicator clears.

The old `axiom-demo-v1` browser data is not deleted or automatically imported. Export it from the old preview before switching domains. Migration/import of old demo progress is a separate explicit action. The new provider does not treat localStorage as the source of truth for authenticated progress.

Profiles and progress are private under RLS. The leaderboard function returns only usernames and competitive statistics. Avatar URLs and user UUIDs are editable/visible only in the owner's settings, not exposed by the leaderboard. Arena match rows (including progress) are readable only by their two participants. Private schema tables contain correct answers and individual answer records; browsers cannot access those tables. Clients cannot write scores, results, match rows or ratings directly.

## Game rules

`private.arena_config` configures default question count (10), race seconds (300) and Elo K (24). Both players share the same immutable question/answer-key snapshot. The server begins the race five seconds after both ready flags, timestamps answers and deadlines, and locks the match row for every mutation. The client never submits points, correctness, completion times or winners. Scoring is 100 per correct answer plus at most five points of coarse server-time speed bonus. No correct-option or solution payload is sent to players.

Result ordering: correct answers, then points, then valid server completion time; completion times within two seconds draw. This limits fine latency effects but is not a latency-normalised tournament system. Forfeits override score. Elo and aggregate statistics update once, under rating/match locks. Unranked matches update records but not Elo. Repeated `(match,user,question_index)` submissions cannot earn points again. Sequential question checks and a 750 ms answer interval apply. Successful Arena RPCs are limited to 120 per user per minute; rejected SQL transactions roll back their counter updates, so this is not a comprehensive abuse gateway. Configure platform/WAF throttling before an unrestricted public release.

Queue entries require a fresh heartbeat (20 seconds) and expire after two minutes. Queue claims, active-match checks and room joins use a transaction advisory lock; a player cannot match themselves. Room codes are eight random hex characters. Ready/heartbeat updates drive Realtime; five-second polling provides recovery. A 90-second opponent disconnect can forfeit only when the requesting player was recently connected too. If both disappear, timeout settlement occurs on the next participant request, not an always-running background worker. No external scheduler has been created. Abandoned lobby rows remain as retained history; old active entries age out of matchmaking checks. Rematches currently use a fresh private room/code shared by both players rather than an automatic rematch handshake.

## Two-account staging acceptance test

Use two independent browser profiles/devices and two dedicated, real staging accounts. Do not use or reset the existing student's account for these checks.

1. Register both accounts with different usernames, verify their email and sign in. Set different profile preferences; answer different practice questions. Reload on another device as the same user and verify cloud state. Verify A cannot select/update B's `profiles` or `user_progress` with the authenticated API. Confirm simultaneous device edits produce a conflict, not silent loss.
2. Test recovery link and password update; sign out and confirm dashboard/Arena routes redirect to login. Check expired-session refresh writes new cookies and private/no-store headers.
3. A creates a private room with a fully populated question mode; B joins its code. Confirm names and ready status update on both devices. Compare displayed questions at each position. Ready both; verify the countdown and server deadline.
4. Submit correct and incorrect answers. Confirm opponent progress/scores update without reload, and no answer keys appear in network payloads. Replay one request; verify points do not change. Try modifying another player, jumping an index, changing a score or answering after deadline; these must be denied/ignored.
5. Complete both races. Confirm the same winner/draw and scores on both screens, exactly one ratings update, match history, and real leaderboard records. Refresh results and replay final requests to ensure ratings do not update twice.
6. Repeat for Quick Match, cancellation races, a queue timeout, ranked/unranked selection and insufficient question content. Never accept a fake opponent or substitute question mode.
7. Drop B's connection for less than 90 seconds, reconnect and recover the same match. Repeat beyond the grace period with A online; verify forfeit. Disconnect both and confirm timeout settles consistently when a participant returns.
8. Test 390px/mobile, tablet, keyboard navigation, reduced motion and sound toggle. Run a real Netlify adapter staging build. The local Next.js build alone does not prove hosted Realtime connectivity.

## Pending acceptance work

`tests/e2e/arena.spec.ts` supplies an opt-in two-browser staging journey. It has not been run here. It requires `ARENA_STAGING_E2E=1`, `ARENA_A_EMAIL`, `ARENA_A_PASSWORD`, `ARENA_B_EMAIL`, `ARENA_B_PASSWORD`, two distinct verified staging accounts, and at least ten reviewed TMUA/Intermediate questions. Keep these credentials in an ignored `.env.e2e` file, never in chat or committed files. `.env.e2e` is not automatically loaded by Playwright; run:

```sh
node --env-file=.env.e2e node_modules/@playwright/test/cli.js test tests/e2e/arena.spec.ts
```

The Playwright config targets the local app on port 3000. Point `.env.local` at the intended staging project, stop any older app running on that port, and install the Playwright Chromium browser if prompted (`pnpm exec playwright install chromium`). The Arena test creates retained match records for these test users. The other revision journey specs also require staging opt-in and write practice progress. No existing student records should be used as disposable fixtures.

Match snapshots now stay entirely in the private schema. Realtime-visible rows contain only player/status/score metadata and a question count. A participant can fetch only their current question via `arena_question`, after the server start and before the deadline; no lobby question content or future question payload is broadcast.

Installed RPC signatures/grants, application RLS, private answer-key denial, Realtime publication and authenticated read-only catalogue/clock/leaderboard calls are verified. Thirty-one local tests pass, including real PostgreSQL fixture tests, human-confirmation/immutable-import gates and progress API/account-isolation checks. The local Netlify adapter build completes with server and session-proxy edge functions. These checks do not establish live two-account readiness. SMTP/verification/recovery, invalid-request throttling, real browser/account/device tests and broader PostgreSQL multi-connection race/load testing remain unverified. Do not describe the Arena as production-verified until the checklist passes. No friends leaderboard or automatic rematch handshake is implemented.
