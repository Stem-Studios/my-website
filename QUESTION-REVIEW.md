# Private Arena content and first live test

## Current position — 28 October 2026

The owner confirmed all **60 AI-assisted questions** were checked, no corrections required, and requested reviewer name **ayaan**. The exact human confirmation is saved in `arena-content/ayaan-all-60-reviews.json`, bound to each question's content hash. No reviewer derivations were supplied or invented. Timestamps record when approval was saved, not an observed solving time. This is owner-attested review, not external certification or psychometric calibration.

The first **ten TMUA Intermediate questions and ten private approval receipts are installed in Supabase**. The authenticated catalogue confirms 10/10 ready. The other fifty approvals remain local while the first race is tested. Existing account/profile and progress/match records are preserved. The owner chose manual testing in two browsers; no automated live journey, source push or website deployment has run.

The author checked topics against the current [official TMUA specification](https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165619/TMUA_Content_Specification.pdf) and [official ESAT specification](https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf), reached through [UAT-UK's preparation page](https://esat-tmua.ac.uk/prepare/). The original questions are not reproductions of those documents. A reviewer must still check syllabus fit and difficulty. Five options is this Arena's format, not a claim about every official question's option count. Ten questions in five minutes is a game format, not an official timed mock.

| Draft mode                                      |  Count | Content                                                                                                                                              |
| ----------------------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| TMUA Foundation                                 |     10 | Algebra, sequences, surds, exponentials, normals, binomial expansion, logic, circles, inequalities                                                   |
| **TMUA Intermediate — first release candidate** | **10** | Quadratic roots, series, tangents, logarithms, circles, trigonometry, area, counting, quantifiers, absolute-value equations                          |
| TMUA Challenge                                  |     10 | Root conditions, geometric series, cubic graphs, divisibility, functional equations, enclosed area, logarithms, tangency                             |
| ESAT Foundation                                 |     10 | Percentages, probability, similarity, electricity, energy, waves, moles, microscopy, DNA                                                             |
| ESAT Intermediate                               |     10 | Rates, calculus, circuits, collisions, springs, reacting quantities, titration, inheritance, sampling                                                |
| ESAT Challenge                                  |     10 | Combined rates, stationary values, signed area, circuits, buoyancy, thermal efficiency, limiting reagents, formula determination, genetics, dilution |

ESAT drafts identify Mathematics 1/2, Physics, Chemistry or Biology individually. The present Arena matches only by exam/difficulty, so ESAT would be a mixed-module game. Keep it disabled until module suitability is agreed or module-specific matching is added. Prioritise one TMUA Intermediate private race.

## Existing public question audit

The 16 existing practice fixtures retain their IDs, wording, answers and student-history references. Their source is the original demo collection. Their previous blanket `verified: true` flag had no independent review receipts, so it is now false. Existing database/student rows were not changed.

| Existing mode     | IDs                                              | Review/import decision                                                                          |
| ----------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| TMUA Foundation   | tmua-002, tmua-006                               | Can be independently reviewed for practice; publicly exposed keys exclude private ranked import |
| TMUA Intermediate | tmua-001, tmua-003, tmua-005, tmua-008           | Same                                                                                            |
| TMUA Challenge    | tmua-004, tmua-007                               | Same                                                                                            |
| ESAT Foundation   | esat-001, esat-003, esat-005, esat-006, esat-007 | Same                                                                                            |
| ESAT Intermediate | esat-002, esat-004, esat-008                     | Same                                                                                            |
| ESAT Challenge    | None                                             | No candidates                                                                                   |

Changing numbers in an exposed question does not itself provide independence or content review. The new drafts have fresh stems and their exact stems are checked against the public bank. Automated duplicate detection is not a plagiarism or semantic-equivalence guarantee.

## Manual question review — do this first

1. Back up `arena-content/` securely. It is deliberately Git-ignored and excluded from browser imports. Do not place it in `public/`, attach the key to a public issue, or commit it even to a repository that may become public. Losing this directory loses the local drafts and review work; Git cannot recover ignored files.
2. Have a competent **human who did not author these questions** review the ten TMUA Intermediate drafts first. The site owner can do this if competent and genuinely solving independently. Another AI response, a passing script or a checkbox by the author does not count. The workflow records human attestations; it cannot authenticate the person or establish their qualifications.
3. Give the reviewer only `arena-content/tmua-intermediate-blind.md` initially. They should solve every problem from scratch, record their working, and evaluate **all five options**, including equivalent expressions, boundary cases, domains, units and unstated assumptions. Check there is exactly one valid answer. Review wording, distractors, syllabus section and provisional difficulty without a calculator where appropriate.
4. After that independent solution, compare against `arena-content/tmua-intermediate-key.md`. This is an **unverified draft key**, not an authority. Resolve any discrepancy mathematically. Record the reviewer's own derivation in `arena-content/tmua-intermediate-reviews.json`; do not copy the draft solution as evidence of independent work.
5. For each approved record, fill `reviewer.name`, set `kind` to `human` and `independent` to `true` only if accurate; enter `reviewedAt` as an ISO UTC timestamp; set `answerIndex` using **A=0, B=1, C=2, D=3, E=4**; write meaningful `independentWorking`; set the six checks true only after doing them; and change `status` from `pending` to `approved`. Leave failing questions pending. Never bulk-fill approvals just to unlock a mode.
6. The receipt's SHA-256 `contentHash` binds the exact wording, options, answer, solution, metadata and version. If anything changes, regenerate a separate packet/template and have the changed version reviewed again. Do not change the hash on an old approval to bypass this. New review outputs are exclusive-create: completed files are never overwritten.

For this pack, the owner explicitly confirmed the review in chat and named ayaan. The workflow also accepts a structured `attestation` containing that exact human statement, scope, correction decision and recording time instead of fabricated `independentWorking`. A named independent human, matching answer, complete checks and unchanged content hash are still required. Original pending templates are retained as history; use the named approval file. An AI-generated attestation is not a human confirmation.

Commands, from the project directory with Node 24 and pnpm 11:

```sh
pnpm arena:check
# The first TMUA Intermediate packet already exists. For a revised packet use a fresh prefix:
pnpm arena:review --out arena-content/tmua-intermediate-review2
# For another mode later:
pnpm arena:review --exam ESAT --difficulty Foundation
```

`arena:check` validates all 60 records and performs 60 draft-answer sanity checks. Some are numeric calculations and some are logical-answer regressions; they do not prove uniqueness, educational quality or independent review. The check file was prepared by the same AI-assisted author. The structural validator rejects invalid metadata, missing solutions, out-of-range/non-integer answer indexes, duplicate IDs/stems and repeated option strings. It does not understand arbitrary mathematical equivalence between differently written options.

## Safe approved import — manual operator action

The importer never contacts Supabase or needs a secret key. It generates an SQL file **only if all ten selected records have valid matching human approval receipts**. Blank templates, differing reviewer answers, edits after approval and incomplete checklists block generation. This does not replace a trusted operator reviewing the actual attestations.

1. In the intended staging project's SQL Editor, confirm the project identity and take an appropriate backup. The current project is `zyhemkntpqqymfpuulid`; use a separate staging project if available. Do not reset it or reapply the installed baseline/recovery SQL.
2. The additive `supabase/migrations/20261028224827_arena_content_review_ledger.sql` is **already installed in the current project**. It adds a private audit table and denies browser access under RLS. Apply it once only in a new environment. All earlier account/Arena/readiness definitions are installed. Keep migration history reconciled; do not blindly push the incomplete baseline CLI history.
3. After independent approval, generate just the first mode:

   ```sh
   pnpm arena:import --reviews arena-content/ayaan-all-60-reviews.json --project zyhemkntpqqymfpuulid --out arena-content/tmua-intermediate-approved.sql
   ```

4. The first mode's private SQL already exists and was applied successfully. Do not regenerate over it: the generator refuses existing outputs. For future batches, inspect the generated SQL and verify the project open in SQL Editor; the header does not enforce that identity. It inserts questions and private receipts transactionally, never updates or deletes existing rows, and repeating identical SQL is a no-op. A differing ID/content/receipt collision aborts the whole batch. It does not touch accounts, study progress, ratings or matches.
5. Run the inspected SQL in that project's SQL Editor. Check:

   ```sql
   select exam, difficulty, count(*) filter (where verified) as verified_count
   from private.arena_bank group by exam, difficulty order by exam, difficulty;
   select count(*) as review_receipts from private.arena_content_reviews;
   ```

   TMUA Intermediate must have at least ten approved rows and matching receipts. Signed-in `arena_catalogue()` should then report that mode as ready. Reopen the Arena page to refresh availability. Do not seed drafts as verified.

6. Retain the approved pack, receipts and import SQL securely. If a question is later revised after import, use a new UUID, slug/version and independent receipt; existing question rows and match snapshots are immutable through this importer. Retiring a flawed existing version needs a separate audited administrative action, not a destructive re-import.

## Two real accounts — exact test steps

1. Use two dedicated test accounts, A and B, with distinct emails and usernames. Keep the existing student's account intact. Sign up normally and verify each email. Configure SMTP/delivery and allow the correct local `/auth/callback/` and recovery URLs in Supabase Auth as described in `NETLIFY.md`. The existing preview is on port 3101; the development/automated test uses 3000. Allow the exact port being used. If both verification links open in the wrong browser profile, reopen the flow in the profile that started it so its PKCE cookie is present.
2. Start the local app with `pnpm dev` and open `http://127.0.0.1:3000/`. Use two separate browser profiles or two different browsers, not two ordinary tabs sharing cookies. Sign A into one and B into the other. For two devices on a trusted local network, start with `pnpm exec next dev --hostname 0.0.0.0 --port 3000 --webpack`, use `http://<your-Mac-LAN-IP>:3000/` on both devices, and allow that actual origin's callback URLs in Supabase. Do not expose the development server publicly. The existing port-3101 preview listens only on this Mac.
3. On each account, answer a different practice question, wait for saving to finish, reload and confirm their progress is separate. Sign out/back in and check the same state. These actions create retained test progress, not disposable data in an existing student's account.
4. A opens Arena, selects **TMUA / Intermediate**, leaves Ranked unchecked and creates a private room. B enters the displayed eight-character code. Both should see the two real usernames and ready status. Press Ready on both; verify the shared five-second countdown and ten-question race.
5. Compare each current question and its five options. Answer at least some differently. Observe scores and opponent progress without reloading. Neither browser's responses should include `correct_index`, solutions or future questions. Complete both races within the server deadline and verify complementary winner/loser messages, identical final score totals and history after reload. Unranked games must leave Elo unchanged.
6. Repeat with a brief disconnection (<90 seconds), then with a longer disconnect while the other player remains connected. Check recovery and forfeit behaviour. Then test matchmaking and a ranked race with these test users, ensuring results/rating changes happen once. Do this only after the private unranked race passes.

### Optional automated two-browser journey

Create an ignored `.env.e2e` locally, without sharing passwords in chat:

```dotenv
ARENA_STAGING_E2E=1
ARENA_A_EMAIL=your-first-test-email
ARENA_A_PASSWORD=your-first-test-password
ARENA_B_EMAIL=your-second-test-email
ARENA_B_PASSWORD=your-second-test-password
```

Point `.env.local` at the approved test project with installed RPCs and reviewed questions. Stop older servers on port 3000 so Playwright cannot reuse a stale app. Then:

```sh
pnpm exec playwright install chromium
node --env-file=.env.e2e node_modules/@playwright/test/cli.js test tests/e2e/arena.spec.ts
```

The journey signs in twice using isolated browser contexts, compares ten shared question/option payloads, submits answers, checks compatible results and reloads history. It deliberately does not read private answer keys. It creates retained unranked match records. It does not cover SMTP, two physical devices, every reconnect race, every difficulty, load testing or invalid-request abuse. **It has not been run live here. TMUA Intermediate content is ready; the owner chose manual testing in two browsers instead of supplying automated-test credentials.**

No source changes or private content have been pushed; no website deployment has run. The approved first-mode database import is complete. The owner will run the manual two-browser test; do not describe it as passed until the actual result is reported.
