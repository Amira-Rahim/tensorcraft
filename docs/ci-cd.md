# Tensorcraft CI/CD

This doc covers continuous integration checks and the branch-protection
settings GitHub requires for them to block bad merges.

For the runtime deployment pipeline (Vercel web, Fly.io API, Supabase
migrations, release rollouts), see [`deployment-guide.md`](./deployment-guide.md).

---

## CI pipeline overview

Defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

| Job | What it does | Blocking? |
| --- | ------------ | --------- |
| `ci` | Install, `pnpm lint`, `pnpm typecheck`, `pnpm turbo build:content`, `pnpm build`, `pnpm test`, exercise validator, `pnpm test:e2e` (Playwright). | Yes |
| `links` | Runs `lychee` over every markdown file in the repo using [`.lychee.toml`](../.lychee.toml). Internal dead links fail; external 4xx/5xx are tolerated per the `accept` list. | Yes |

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

The first CI run surfaced ~210 legacy exercises with pre-existing content
issues (TF APIs the sandbox mock doesn't implement, TS signatures the coarse
strip can't handle, solution bugs, etc.). These slugs live in
[`scripts/validate-exercises.allowlist.json`](../scripts/validate-exercises.allowlist.json)
and are reported as `WARN` rather than `FAIL` so CI is unblocked while the
content team triages them.

Remove a slug from the allowlist once its exercise is fixed. Running with
`--strict` (`node scripts/validate-exercises.mjs --strict`) treats every
allowlisted slug as a hard failure — useful for the cleanup pass.

### Broken-link checking

The `links` job runs [`lychee`](https://github.com/lycheeverse/lychee-action)
as a GitHub Action, so no devDependency or local installation is needed.

Local check (requires the `lychee` binary):

```bash
lychee --config .lychee.toml './**/*.md'
```

---

## Branch protection rules (GitHub settings — set manually)

**This must be applied through the GitHub UI.** Branch protection cannot be
configured from repo code and requires admin on the repository.

Navigate: `Settings` → `Branches` → `Branch protection rules` → `Add rule`.

### Rule: `main`

Target branch: `main`.

Enable the following:

- [x] **Require a pull request before merging**
  - Required approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (uses
    [`.github/CODEOWNERS`](../.github/CODEOWNERS))
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required status checks (add each one after it has run once on a PR, so
    GitHub knows the check name):
    - `Lint, Typecheck & Build` (from the `ci` job)
    - `Broken-link check (docs + markdown)` (from the `links` job)
- [x] **Require conversation resolution before merging**
- [x] **Do not allow bypassing the above settings**
- [ ] Allow force pushes — **leave off**
- [ ] Allow deletions — **leave off**
- [x] **Restrict who can push to matching branches** — only the repo owner and
  the GitHub Actions bot (for release tagging, if used).

> Direct pushes to `main` are blocked by the combination of "Require a pull
> request before merging" + "Do not allow bypassing the above settings".

### One-time setup checklist

1. Open a throwaway PR against `main` so CI runs once and both job names
   appear in the status-checks picker.
2. Apply the rule above with both jobs added as required checks.
3. Verify by opening a second PR and confirming merge is blocked until both
   checks pass and a review is left.

### CODEOWNERS

The [`.github/CODEOWNERS`](../.github/CODEOWNERS) file assigns default repo
ownership to the repo owner and scopes CI/infra and content directories for
extra review. Update it when additional collaborators come aboard.

---

## Useful commands

```bash
pnpm lint                 # workspace-wide lint
pnpm typecheck            # workspace-wide typecheck
pnpm test                 # unit + integration (vitest)
pnpm test:e2e             # Playwright end-to-end
pnpm test:exercises       # validate all exercise starter/solution pairs
node scripts/validate-exercises.mjs <slug>  # validate a single exercise
```
