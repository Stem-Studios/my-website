# Rollout checkpoint — 28 October 2026

Target: `https://magical-gumption-4ab4b2.netlify.app` with Supabase project `zyhemkntpqqymfpuulid`.

## Applied with owner approval

| Migration history version | Name                          | State                                |
| ------------------------- | ----------------------------- | ------------------------------------ |
| 20261028115600            | revision_foundation           | Applied                              |
| 20261028115608            | student_accounts_progress     | Applied                              |
| 20261028120742            | arena_tables                  | Applied                              |
| SQL Editor recovery batch | arena-remaining-functions.sql | Owner executed; definitions verified |
| 20261028125425            | arena_readiness               | Applied                              |
| 20261028224827            | arena_content_review_ledger   | Applied                              |

The original Auth user is preserved. Latest read-only counts: one Auth user, one application profile, zero progress rows, zero matches, ten TMUA Intermediate questions and ten private review receipts under `ayaan`. All application/private tables have RLS enabled. No opponents or match results were fabricated.

## Recovery completed

The full Arena migration and a smaller matchmaking-functions request returned `Invalid or expired requestState`. Read-only checks after each confirmed the matchmaking RPC was absent and the failed function migration was not recorded. Do not retry the original `0003_arena.sql` verbatim: its tables now exist.

`arena-remaining-functions.sql` contains only the remaining function/wrapper/grant/publication definitions, in one transaction, for this checkpoint. It does not recreate existing tables or reset accounts. It defines transient queue cleanup inside functions; those function bodies execute only when matchmaking is called.

The owner has now executed this batch successfully. All six public Arena RPCs exist, plus `save_user_progress(bigint,jsonb)`. Each public wrapper is SECURITY INVOKER, executable by `authenticated` and denied to `anon`. Privileged implementations remain private. `private.arena_question_keys` is not readable by authenticated browser clients. `public.multiplayer_matches` is present in the `supabase_realtime` publication. Authenticated read-only catalogue/clock/leaderboard calls were checked inside a rolled-back transaction; this was an SQL permission check, not a real login or multiplayer browser test.

The additional `arena_catalogue()` RPC initially reported zero questions for each of the six modes, with ten required. After the approved import, TMUA Intermediate reports 10/10 and the others 0/10. Its migration only adds functions/grants; it changes no student data. The SQL Editor recovery is not a separate tracked migration in Supabase history: keep this checkpoint, and reconcile that history before adopting CLI push workflows. Do not rerun the combined `0003` or recovery batch on this database.

The owner confirmed all sixty questions checked with no corrections, reviewer `ayaan`. Hash-bound records of that exact human confirmation are saved locally for all sixty. The first ten TMUA Intermediate questions and ten private receipts are imported; the authenticated catalogue reports 10/10 for that mode. Other modes remain 0/10. No public practice fixtures were imported. Email verification, recovery and a real two-account race still need browser testing.

Migration `20261028224827_arena_content_review_ledger.sql` is installed and its local filename matches the remote history. It accepts genuine human confirmations without inventing mathematical working and denies browser reads. The other fifty approvals remain local. The owner chose manual testing in two browsers; the agent has not executed a live multiplayer test. See [QUESTION-REVIEW.md](./QUESTION-REVIEW.md).

## Security advisor interpretation

The advisor reports RLS-with-no-policy information notices for answer-key/private tables and `question_solutions`. This is intentional deny-by-default browser access, not a reason to add public policies. [Advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Leaked password protection is disabled in Auth; it was not changed. [Supabase password-security guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Publishing

No source commit/push or Netlify deployment has been performed during this rollout. The production site responded HTTP 200 before publication. Keep the existing site serving its current version until database/function setup and content are ready; pushing main may trigger a Netlify deployment.
