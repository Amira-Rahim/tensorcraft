# Tensorcraft CI/CD

Solo-developer workflow. No branch protection, no required-check gating.
Local git hooks + advisory CI + Vercel previews give all the safety a solo
author needs without the PR-review ceremony overhead.

For the runtime deployment pipeline (Vercel web, Fly.io API, Supabase
migrations, release rollouts), see [`deployment-guide.md`](./deployment-guide.md).

---

## Solo workflow summary

```text
git commit  →  pre-commit hook (husky + lint-staged)   ← fast, per-file
git push    →  pre-push hook   (husky: typecheck+test) ← ~30s guardrail
            →  Vercel preview  (per branch)            ← visual verify
            →  CI (advisory)                           ← email on fail
            →  main merge      (direct push OK)        ← no PR needed
```

Failure recovery: `git revert HEAD` + `git push` OR Vercel dashboard "Promote
to production" on a prior deploy.

---

## CI pipeline overview

Defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
**Advisory only** — runs post-push, emails on fail. Not wired to branch
protection, so nothing blocks merge.

| Job | What it does | Blocking? |
| --- | ------------ | --------- |
| `ci` | Install, `pnpm lint`, `pnpm typecheck`, `pnpm turbo build:content`, `pnpm build`, `pnpm test`, exercise validator, `pnpm test:e2e` (Playwright). | Advisory |
| `links` | Runs `lychee` over every markdown file in the repo using [`.lychee.toml`](../.lychee.toml). Internal dead links fail; external 4xx/5xx are tolerated per the `accept` list. | Advisory |

### Exercise validator

Script: [`scripts/validate-exercises.mjs`](../scripts/validate-exercises.mjs).
Invoked by CI **and** available locally via `pnpm test:exercises`.

For each exercise in `packages/content/.velite/exercises.json`:

1. **Starter compile check** — the starter code is syntax-checked through
   Node's VM after a coarse TypeScript-annotation strip.
2. **Solution runs green** — the solution code is executed against the
   exercise's `testCode` inside a sandboxed VM with the same TF.js mock and
   Jest-style harness used by `packages/ui/src/mdx/exercise.tsx`. A **10-second
   timeout** matches the in-browser limit so no exercise can ship with a
   solution that realistically times out the student.

Failures are printed with `slug`, phase (`starter-syntax` / `solution-run` /
`solution-tests`), and the failing assertion message.

#### Allowlist and strict mode

**The allowlist is EMPTY and the gate runs fully strict** (verified
2026-07-25). Historical note: the first CI run surfaced ~210 legacy
exercises with pre-existing content issues; all were fixed across the
2026-04→07 content sprints and drained from
[`scripts/validate-exercises.allowlist.json`](../scripts/validate-exercises.allowlist.json).
If a slug ever needs to go back on the list, it is reported as `WARN`
rather than `FAIL`; `--strict` treats allowlisted slugs as hard failures.

### Broken-link checking

The `links` job runs [`lychee`](https://github.com/lycheeverse/lychee-action)
as a GitHub Action, so no devDependency or local installation is needed.

Local check (requires the `lychee` binary):

```bash
lychee --config .lychee.toml './**/*.md'
```

---

## Local git hooks (primary guardrail)

Managed by [husky](https://typicode.github.io/husky). Auto-installed via
`package.json` `prepare` script on `pnpm install`.

### Pre-commit — [`.husky/pre-commit`](../.husky/pre-commit)

Runs `pnpm exec lint-staged` on staged files only. Fast (<2s typical):

- `*.{ts,tsx,mts}` → `prettier --write` (see `package.json` `lint-staged` block
  for the full glob set).

Catches 90% of formatting/obvious-typo mistakes before the commit lands.

### Pre-push — [`.husky/pre-push`](../.husky/pre-push)

Runs workspace-wide checks before `git push`:

- `pnpm turbo typecheck --continue=never`
- `pnpm turbo test --continue=never`

~30s cold, incremental-cached ~5s. Blocks push on failure.

**Skip in emergencies** — `git push --no-verify`. Use sparingly; the hook is
the only pre-production gate in the solo flow.

---

## Branch protection: intentionally OFF

A single-maintainer repo gains nothing from branch-protection's PR-review +
required-check model. It would force self-approved PRs (pure ceremony) or
outright block merges (pure friction). The pre-push hook + CI advisory + Vercel
preview is strictly more useful for one author.

If a second maintainer joins later, revisit this section and re-enable
protection — `.github/CODEOWNERS` is already in place as a no-op scaffold.

### Vercel preview workflow for risky work

For anything touching shared routes, payments, or data shape:

1. `git checkout -b feature/<short-name>`
2. `git push -u origin feature/<short-name>` → Vercel auto-deploys preview.
3. Verify in browser at `https://<project>-git-<branch>.vercel.app` (URL shows
   in Vercel dashboard + GitHub branch check).
4. `git checkout main && git merge --ff-only feature/<short-name> && git push`.
5. Production deploy kicks off.

No PR required. Preview URL is the "visual review" step.

### Rollback paths

- **Bad commit**: `git revert HEAD && git push` (re-triggers Vercel production).
- **Bad deploy**: Vercel dashboard → Deployments → prior green deploy →
  "Promote to Production" (zero-downtime, bypasses CI).
- **Bad migration**: hand-written rollback SQL via Supabase dashboard. Keep
  migrations small so rollback is bounded.

### CODEOWNERS

The [`.github/CODEOWNERS`](../.github/CODEOWNERS) file is a placeholder for
future multi-maintainer use. Does nothing without branch protection. Leave it
in place.

---

## Useful commands

```bash
pnpm lint                 # workspace-wide lint
pnpm typecheck            # workspace-wide typecheck
pnpm test                 # unit + integration (vitest)
pnpm test:e2e             # Playwright end-to-end
pnpm test:exercises       # validate all exercise starter/solution pairs
node scripts/validate-exercises.mjs <slug>  # validate a single exercise

# Hook bypass (emergencies only)
git commit --no-verify    # skip pre-commit (lint-staged)
git push --no-verify      # skip pre-push (typecheck + test)
```
