# Backend, shared packages, database and tooling audit

Audit date: November 6, 2026. Read-only repository audit. No production access or external writes. Existing changes remain intact.

## File coverage and verification

The initial scope contained 421 files. A new in-progress `packages/shared/src/evaluation-result.test.ts` appeared during the audit, bringing the final scope to 422 files. Every scoped file received a full-byte read, SHA-256 hash, UTF-8 inspection, stale-feature/TODO scan and repository reference inventory. The coverage JSON records the method per file. This establishes complete inventory coverage, not a claim that a person independently reviewed every line or executed every branch.

The audit included all files in `apps/api`, `packages/shared`, `packages/supabase`, `packages/config`, `packages/bridges-public` and `scripts`. It inspected route mounting, app call sites, exports, package metadata, test assertions, old product names and current product contracts. It read CLAUDE.md, launch scope, infrastructure, writing rubric and relevant backlog sections.

Executed checks:

- `node scripts/test-rls.mjs` passed against a disposable local PostgreSQL cluster. It applied the forward migration chain, excluding the explicitly retired migrations 027 and 028, and passed actual RLS and learning-activity assertions.
- An audit-only copy of that isolated harness replayed all 25 down migrations in reverse order against a clean schema. All passed. Migration 066 correctly refused a rollback while version-2 practice records existed in a separate run. That refusal is a preservation safeguard.
- `pnpm --filter @tensorcraft/api exec tsc --noEmit --noUnusedLocals --noUnusedParameters` passed. Exported, test-only and mounted-but-unused features require reference analysis because those compiler flags do not detect them.
- Every scoped `.mjs` passed `node --check`. JSON and Python files parsed successfully. TypeScript AST parsing covered source and test files.
- All 96 exercise cheating fixtures map to existing Deep Orbit exercises. All 65 exercises have at least one cheating fixture. No orphan cheat fixtures found.
- Building the public bridges package into `/tmp` produced only `index.js`, declaration files and maps. It produced no `.mjs` entry.

Logs: `/tmp/tensorcraft-backend-rls.log`, `/tmp/tensorcraft-backend-rollback-clean.log`, `/tmp/tensorcraft-backend-unused-tsc.log`. Coverage: `file-coverage.csv`.

## Findings

### B01. Old browser audit harnesses require the retired six-step lesson flow

Priority P2. Confirmed current mismatch.

`scripts/audit-ui-ux-lessons.mjs:12` declares Briefing, Concept, Code, Challenge, Takeaways and Consequence. Its loop at line 51 runs six steps, and line 58 requires `Step N of 6`. It also seeds the old storage keys at lines 44-48. `scripts/audit-ui-ux-fixtures.mjs:347` and lines 397-415 repeat the old keys and six-step accessible names. The current contract in `apps/web/lib/lesson-phases.ts:12` has five steps, with v2 keys at lines 73-74. Challenge is now index 2.

These scripts cannot verify the current app as written. Old historical audit documents still list runnable commands for them. The newer `scripts/verify-deep-orbit-visuals.mjs:174` already uses five phases and v2 keys. Consolidate the current entrypoint and mark the retired commands historical, or update their assertions and shared fixtures. Related scripts `audit-ui-ux-interactions.mjs:66` and `check-learning-assets.mjs:35` still write old keys. Their selected Concept index can migrate correctly, so their old keys alone do not prove an incorrect screenshot.

### B02. The learner README backfill still treats encrypted credentials as plaintext tokens

Priority P2. Confirmed dormant-tool mismatch.

`scripts/one-off/backfill-learner-readmes.mjs:56` fetches the stored `github_token`, and lines 113-124 pass it directly to `getReadme`. Line 48 uses that value as the GitHub bearer credential. Current writes use the `v1:` encrypted envelope in `apps/api/src/lib/token-crypto.ts:55`. The rotating credential format in `github-credentials.ts:42` adds encrypted access-token and refresh-token JSON.

The script therefore sends ciphertext as a bearer token for current connected accounts and reports the resulting rejection as an expired token. Its dry-run mode has the same credential error. Archive the completed one-off with an explicit obsolete marker, or adapt its read path to the current credential contract before retaining it as an operational tool. Do not run it against learner repositories as part of cleanup.

### B03. The public bridges package advertises entries its build cannot produce

Priority P2. Confirmed, partially recorded existing debt.

`packages/bridges-public/package.json:7` names `dist/index.mjs` as the module entry and the import export. `tsconfig.json:4` uses ESNext compilation and `build` only runs `tsc`. A build redirected into `/tmp/tensorcraft-bridges-audit-dist` emitted `index.js`, `index.d.ts` and maps, with no `.mjs` file. The declared require entry also points at the ESNext output without a CJS bundling step.

The output re-exports from `@tensorcraft/shared`; it contains no bridge registry. The runtime dependency at package.json line 43 is `workspace:*`, while shared is private version 0.0.0. The existing ROADMAP.md:1643 and post-launch backlog already record the private dependency blocker. The missing import entry is an additional independently confirmed package contract failure. Bundle the registry into explicit ESM/CJS outputs and validate an actual packed artifact before calling the package publishable. Do not remove the package merely because the application does not import it: it remains an explicit roadmap deliverable and licensing exception.

### B04. Public bridge documentation claims frameworks the types reject

Priority P3. Confirmed documentation drift.

`packages/bridges-public/README.md:100` says the package renders per-framework variants for React, Vue, Angular, Svelte and vanilla JavaScript. `packages/shared/src/bridges.ts:11` declares `Framework = "react"`. The registry currently supplies React variants. The binding project history explicitly removed the additional framework surface.

Correct the README to describe the currently exported contract. Keep broader framework support in the future-work record. The `mlCode` documentation in `bridges.ts:34-36` also names the deleted `/bridges` page as its rendering surface, while active code uses embedded lesson callouts and the landing preview.

### B05. The daily digest's payment reconciliation compares different populations

Priority P2. Confirmed operational-information mismatch.

`scripts/daily-digest.mjs:66-78` requests one Stripe checkout page with `limit=100`, filters paid sessions and ignores `has_more`. Lines 96-97 count all newly created database purchase rows without status or session filtering. Lines 106-115 then assert payment drift from equality of those two totals.

Pending, failed, complimentary fixture, refunded or otherwise non-equivalent purchase rows can make the database count differ without a missing entitlement. More than 100 checkout sessions can truncate the Stripe population. This conflicts with the header's claim that the script reconciles paid sessions with recorded purchases. Errors in the Stripe check become text in an otherwise successful digest at lines 116-118, despite the header saying the job exits nonzero when it cannot do its job.

Use matching paid-session identities and explicit entitlement status rules, paginate Stripe, and distinguish a failed reconciliation from a completed check. Add meaningful fixtures for pending/failed rows, pagination and query failure. No real payment or external query was executed during this audit.

### B06. Mounted legacy endpoints have no current in-repository consumers

Priority P3. Confirmed unused app surface, external consumers unverified.

`apps/api/src/routes/github.ts:972-1088` retains `/api/github/push`, writes the old shared `tensorcraft-exercises` repository and claims compatibility with the existing frontend. Repository-wide app/script/e2e search finds no caller. Current `apps/web/lib/github-commit.ts:23` calls `/api/github/commit`, which uses per-world repositories.

All four endpoints in `apps/api/src/routes/progress.ts` are mounted in `index.ts:105`, but repository-wide searches find callers only in route tests. Its comments explicitly retain the GET, POST and summary routes for future mobile/external clients. The activity route also has no app caller. These routes remain publicly reachable and incur validation, auth and test maintenance even though the shipped app reads progress directly from Supabase.

Retire `/push` after confirming no deployed old-client or external usage. Make an explicit retain-or-remove decision for the progress API. Do not call these safe deletions solely from static references. `/api/github/token` remains active in `apps/web/lib/supabase/session-listener.tsx:23` and must stay.

### B07. Several production exports only serve tests or have no consumer

Priority P3. Confirmed reference facts, removal decisions depend on intended package API.

Repository-wide symbol references, including imports, MDX, YAML and scripts, found:

| Export | Declaration | Current consumers |
| --- | --- | --- |
| `getUserRole` | `packages/supabase/src/admin.ts:27` | Barrel export only |
| `getSubscriber` | `apps/api/src/lib/kit.ts:209` | Kit unit tests only |
| `isSentryInitialized` | `apps/api/src/lib/sentry.ts:53` | None |
| `rateLimitMiddleware` | `apps/api/src/middleware/rate-limit.ts:73` | Rate-limit tests only. Production mounts `globalRateLimitMiddleware`. |
| `getPaidLessonCount` | `packages/shared/src/constants.ts:208` | Constants tests and barrel only |
| `getArrivesFrom` | `packages/shared/src/journey.ts:66` | Journey tests and barrel only |
| `recommendedNextWorld` | `packages/shared/src/journey.ts:151` | Journey tests and barrel only |

These are better cleanup candidates than deleting all of their containing modules. For example, `getLeadsTo` and the journey spine resolver still have app consumers. For retained future helpers, label their scope and avoid treating their tests as proof of shipped recommendation behavior. Move the default limiter tests to the actual mounted middleware before removing its unused wrapper.

`shutdownPostHog` at `apps/api/src/lib/posthog.ts:111` also has no call site. Its own comment tells callers to flush before exit, while `index.ts:138-157` shuts down the HTTP server and exits without using it. Wire the intended lifecycle hook or remove the unused promise of flushing.

### B08. One-release rebrand compatibility shims survived multiple later releases

Priority P3. Confirmed existing cleanup debt.

`apps/api/src/routes/onboarding.ts:76-87` maps `fe_background` and `fe_experience_years` onto the current names. `apps/api/src/routes/skill-events.ts:64-69` and 137-140 translate `fe_integration` into `js_integration`. Both explicitly say to remove them at the next scheduled API deploy. Their tests still preserve the old contract in `routes/__tests__/onboarding.test.ts:184` and related skill-event coverage.

ROADMAP.md:1551 already records a safe-removal date around August 27 and says to remove these blocks and tests together. November source still carries them. Remove after checking deployed-client usage, or replace the one-release comments with a supported compatibility policy. Never modify migration 059 to remove runtime compatibility.

### B09. Current code comments describe behavior the code no longer has

Priority P3. Confirmed informational drift.

- `apps/api/src/routes/waitlist.ts:3-6` says all five worlds launch simultaneously and world waitlists are unnecessary. Current launch scope and coming-soon pages depend on those waitlists.
- `apps/api/src/routes/webhooks.ts:24-27` says the Kit webhook does not mutate profiles. Lines 135-139 explicitly disable `weekly_digest` and `email_alerts` on matching profile rows.
- `apps/api/src/lib/token-crypto.ts:13-16` describes the GitHub credential column as plaintext. Current writes encrypt it. The compatibility reader still permits historical plaintext, which should be explained separately.
- `apps/api/.env.example:97-99` says a missing encryption key produces a warning on every boot. `encryptToken` emits a process-once warning only when that function writes a token. Rotating credentials can fail closed before reaching that fallback in `github-credentials.ts:47`.

Update comments in place. Keep historical explanations in dated records when they explain an unusual compatibility constraint.

### B10. The newsletter send wrapper defaults to an old API port

Priority P3. Confirmed local command mismatch.

`scripts/news/send-newsletter.mjs:10` and line 26 default to `http://localhost:8787`. The current API defaults to port 3001 in `apps/api/src/index.ts:126`, and `.env.example:20` sets that port. Running the documented local wrapper without an API_URL override therefore targets a service the current app does not start.

Use the shared/current local API origin or require an explicit API_URL for this sending tool. Dry-run still sends a POST to the configured admin API, so this audit did not run it.

### B11. Art reference metadata labels JPEG bytes as PNG

Priority P3. Confirmed content-type mismatch, provider outcome untested.

`scripts/art/generate.mjs:144` always builds reference uploads with MIME `image/png`, and line 191 always emits `data:image/png;base64`. The root asset audit found 22 approved reference files under `docs/art-refs/deep-orbit` whose filenames end in `.png` but whose signatures are JPEG. The generator also writes downloaded buffers to `.png` at lines 249-254 without conversion or format detection.

Detect the real input type or normalize the file before creating the upload MIME/data URL. Preserve a consistent output extension and lineage format. There is no evidence from this audit that either provider definitely rejects these inputs. No paid generation was attempted.

### B12. Certificate secret documentation claims a verification behavior that does not exist

Priority P3. Confirmed documentation mismatch and existing backlog item.

`apps/api/src/routes/certificates.ts:22-26` says the share page can verify authenticity using cert_hash and that rotating the secret invalidates old hashes. `apps/api/.env.example:80-81` repeats the invalidation claim. The public GET at certificates.ts:235-259 returns the stored row and stored hash. The actual share page at `apps/web/app/certificates/[id]/page.tsx:21-24` correctly says the hash is visual identification and has no verification path. Existing certificates continue to load after secret rotation because no read path recomputes the hash.

Align the backend and environment comments with the actual identifier behavior. The post-launch backlog already notes the lack of a verification endpoint around line 1255. Keep that separate from the future decision to add a cryptographic verification feature.

## Retained material that should not be removed from a dead-code search alone

- Historical, append-only migrations, including removed features. They explain production history and remain relevant to export/erasure and schema replay.
- `dispatch_messages`, `counterfactual_choices` and `arena_submissions` export/erasure handling. The current product may hide these features while the database still stores learner data.
- `@tensorcraft/bridges` licensing metadata. LICENSING.md explicitly grants that public package MIT terms, independently of the repository's general MPL license.
- Frozen runtime-lab fixture versions. The separately packaged lab pins its own runtime versions for reproducibility. A difference from the app's current dependency versions does not establish obsolescence.
- Cheating fixtures. All 96 map to the 65 active exercises and serve validation.
- In-progress evaluation modules and tests. They were already modified/untracked before or during the audit and belong to active result-inspection work. Their current absence from a final UI is not dead-code evidence.
- Build/config source files used through package exports, SQL conventions, dynamic CLI execution and package scripts. Filename-reference absence is insufficient for deletion.
