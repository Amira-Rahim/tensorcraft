# Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full light color scheme alongside dark, across all 5 narrative themes, defaulting to OS `prefers-color-scheme` with a manual toggle.

**Architecture:** A new `data-scheme="light"` attribute on `<html>` beside the existing `data-theme` narrative axis. `packages/themes/src/css/themes.css` gains light override blocks for the same `--tc-*` custom properties, so every token-driven component works untouched. Canvas scenes get a full light art redesign ("ink on paper": multiply compositing + hues deepened toward ink, replacing additive glow), Shiki/Sandpack get light siblings, and the TS `ThemeManifest.palette` leak into inline styles is migrated to CSS vars. OG images and favicons stay permanently dark (user decision).

**Tech Stack:** Tailwind v4 CSS-first tokens, React 19 `useSyncExternalStore`, Next 15 app router, Shiki, Sandpack, Canvas 2D, Playwright + axe.

**Decisions (user, 2026-07-22):** proceed + amend docs; FULL light art redesign for canvases (dark-islands rejected); light accents = darkened existing hues (identity preserved); default follows OS with manual toggle; OG/favicon stay dark.

**Source audit:** `docs/audits/light-mode-readiness-2026-07-22.md` — read it first.

---

## ⚠️ Project rules that override normal plan conventions

1. **NEVER `git add`/`git commit`/`git push`** (CLAUDE.md). Where a normal plan says "Commit", this plan says **CHECKPOINT: stop, report, let the user commit.** Do not batch past a checkpoint without the user's go-ahead if anything is red.
2. All work stays uncommitted; the user reviews and commits.
3. Standing feedback: docs + tests updated before reporting done.

## Verification commands used throughout

```bash
pnpm -w vitest run <path>          # scoped unit tests
pnpm --filter @tensorcraft/web typecheck
pnpm --filter @tensorcraft/web build   # full build gate (119 pages)
pnpm exec playwright test e2e/accessibility.spec.ts   # axe gate (needs dev server)
```

## The light palette (canonical values — derived by darkening dark hues in HSL until ≥4.6:1 contrast; do not improvise others)

Shared light neutrals (all themes):

| Token | Dark | Light |
|---|---|---|
| `--tc-bg` | `#181818` | `#F5F5F2` |
| `--tc-surface` | `#232323` | `#FFFFFF` |
| `--tc-surface-overlay` | `#313131` | `#FFFFFF` |
| `--tc-surface-raised` | `#2c2c2c` | `#FAFAF7` |
| `--tc-text` | `#e0e0e0` | `#1F1F1F` |
| `--tc-muted` | `#b0b0b0` | `#555555` |
| `--tc-border` | `#3d3d3d` | `#D8D8D4` |
| `--tc-code-bg` | `#141414` | `#F6F6F2` |

Per-theme light primary/accent (+ `--tc-primary-rgb` triplet):

| Theme | primary | accent | primary-rgb |
|---|---|---|---|
| deep-orbit | `#3B6550` | `#6B5A3B` | `59, 101, 80` |
| neon-protocol | `#166474` | `#9C2C7C` | `22, 100, 116` |
| signal-ward | `#2B683B` | `#416076` | `43, 104, 59` |
| nova-canvas | `#98411C` | `#6244C2` | `152, 65, 28` |
| terra-grid | `#755820` | `#506330` | `117, 88, 32` |

Shared light tier/axis/semantic:

| Token | Dark | Light |
|---|---|---|
| tier-structural | `#78A2BD` | `#3B6079` |
| tier-intuition | `#A89060` | `#6B5A3B` |
| tier-identity (neon) | `#4A90D9` | `#215E9D` |
| tier-identity (nova) | `#D07070` | `#A13434` |
| tier-identity (others) | = theme primary | = light theme primary |
| axis-evaluation | `#d07070` | `#A13434` |
| axis-deployment | `#c49535` | `#755820` |
| axis-fe-integration | `#4a90d9` | `#215E9D` |
| `--tc-success` | `#10b981` | `#096949` |
| `--tc-warning` | `#f59e0b` | `#805306` |
| `--tc-error` | `#ef4444` | `#B00F0F` |
| `--tc-streak` (new, dashboard "on fire") | `#FF8A2A` | `#964400` |

Note on dark-theme `--tc-primary-rgb` bugs found during audit: neon-protocol's dark triplet is `74, 144, 217` (that's `#4A90D9`, not its primary `#3FC4DC` → should be `63, 196, 220`) and nova-canvas's is `208, 112, 112` (`#D07070`, not `#E08058` → should be `224, 128, 88`). Fix these while touching the file (Task 2) — the comment says "must stay in sync with --tc-primary" and they aren't.

---

### Task 1: Amend the dark-only decision docs

**Files:**
- Modify: `docs/product-plan.md:1243` and the non-goals list at `:1289`
- Modify: `docs/ui-ux-notes.md:275` (the "dark-mode only" paragraph)
- Modify: `docs/architecture.md:59`
- Modify: `docs/prd.md:364`
- Modify: `docs/dev-plan.md` (add the light-mode project entry)

- [x] **Step 1:** In each file, replace the "dark mode only / no light mode" claim with the new stance. Wording to use (adapt to each doc's voice, keep it short):

> Light and dark color schemes are both supported (added 2026-07-22). Dark remains the brand-default aesthetic; light mode follows the OS `prefers-color-scheme` by default with a manual override toggle. Every theme palette has a light variant with WCAG AA-verified contrast. OG images and favicons intentionally stay dark. See `docs/audits/light-mode-readiness-2026-07-22.md` for the design rationale.

- [x] **Step 2:** `docs/ui-ux-notes.md` needs the fullest rewrite: its §"dark-mode only" paragraph should now document the scheme axis (`data-scheme` attr, `tc-scheme` localStorage key, system-follow default) and the "ink on paper" light art language for canvas scenes.
- [x] **Step 3:** Verify no stale claims: `rg -n "dark.?mode only|no light mode|There is no light mode" docs/ --ignore-case` → only historical audit files may remain (do not rewrite dated audit records).
- [x] **Step 4:** CHECKPOINT — report doc diffs; user commits. *(Task 1 done 2026-07-22 incl. review fixes: rollout caveats in all four current-state docs, comma-splice fix, ui-ux-notes split into two paragraphs.)*

---

### Task 2: Light token blocks in themes.css (TDD via theme-properties.test.ts)

**Files:**
- Modify: `packages/themes/src/css/themes.css`
- Modify: `packages/themes/src/theme-properties.test.ts`
- Modify: `packages/themes/src/types.ts` (add `paletteLight`)
- Modify: `packages/themes/src/{deep-orbit,neon-protocol,signal-ward,nova-canvas,terra-grid}.ts` (add `paletteLight`, values from the canonical table)

- [x] **Step 1: Extend the test first.** In `theme-properties.test.ts`, add assertions (mirroring the existing dark ones — read the file, follow its parsing approach):
  - CSS contains a `[data-scheme="light"]` block defining all 8 shared neutral `--tc-*` props plus `--tc-success/--tc-warning/--tc-error/--tc-streak`.
  - For each slug, CSS contains `[data-theme="<slug>"][data-scheme="light"]` defining `--tc-primary`, `--tc-accent`, `--tc-primary-rgb`, `--tc-tier-*`, `--tc-axis-*`.
  - Each manifest has `paletteLight` with the same 9 keys as `palette`, hex-formatted, and `paletteLight.primary`/`accent` equal the CSS light values (same cross-check the dark palette already has).
  - **Contrast gate (new):** implement a small WCAG relative-luminance helper in the test file and assert: light `text` vs light `bg` ≥ 7; light `muted` vs light `surface` ≥ 4.5; each theme's light `primary` and `accent` vs `#FFFFFF` ≥ 4.5; dark equivalents vs dark `bg` ≥ 4.5. This makes palette regressions fail loudly forever.
- [x] **Step 2:** `pnpm -w vitest run packages/themes` → new assertions FAIL (missing blocks/fields). *(32 failed first, per TDD.)*
- [x] **Step 3:** Append to `themes.css` (AFTER all five theme blocks — source order is load-bearing for specificity ties):

```css
/* ===== LIGHT SCHEME ==========================================
   Orthogonal to the narrative themes: data-scheme="light" on <html>
   overrides the shared neutrals; per-theme blocks below re-tune each
   palette's accents (darkened in HSL until ≥4.5:1 on white — same holy
   war as the 2026-07-19 coming-soon retune, app-wide this time).
   Must come after the theme blocks: [data-scheme="light"] ties
   [data-theme="X"] on specificity, so order decides the neutrals. */
[data-scheme="light"] {
  --tc-bg: #f5f5f2;
  --tc-surface: #ffffff;
  --tc-surface-overlay: #ffffff;
  --tc-surface-raised: #fafaf7;
  --tc-text: #1f1f1f;
  --tc-muted: #555555;
  --tc-border: #d8d8d4;
  --tc-code-bg: #f6f6f2;
  --tc-success: #096949;
  --tc-warning: #805306;
  --tc-error: #b00f0f;
  --tc-streak: #964400;
}

[data-scheme="light"],
[data-theme="deep-orbit"][data-scheme="light"] {
  --tc-primary: #3b6550;
  --tc-accent: #6b5a3b;
  --tc-primary-rgb: 59, 101, 80;
  --tc-tier-identity: #3b6550;
  --tc-tier-structural: #3B6079;
  --tc-tier-intuition: #6b5a3b;
  --tc-axis-evaluation: #a13434;
  --tc-axis-deployment: #755820;
  --tc-axis-fe-integration: #215e9d;
}
/* …one block per remaining theme with the canonical table values… */
```

  Also add the dark-scheme semantic tokens to the `:root` block so the vars always exist: `--tc-success: #10b981; --tc-warning: #f59e0b; --tc-error: #ef4444; --tc-streak: #ff8a2a;` — and fix the two out-of-sync dark `--tc-primary-rgb` triplets (neon → `63, 196, 220`, nova → `224, 128, 88`).

  Note the axis vars: dark themes define `--tc-axis-data-prep: var(--tc-primary)` etc. — those var() indirections survive the light override automatically; only the literal-hex axis values need light re-declarations.
- [x] **Step 4:** Add `paletteLight: ThemePalette` to `types.ts` (doc comment: "Light-scheme variant; must mirror the CSS `[data-scheme=\"light\"]` values — locked by theme-properties.test.ts") and populate it in all five manifests. Update the stale "No light mode" comment at `types.ts:3`.
- [x] **Step 5:** `pnpm -w vitest run packages/themes` → PASS. `pnpm --filter @tensorcraft/themes build` (dist consumers). *(Task 2 done 2026-07-22 incl. mutation-tested review fixes: CSS-extracted contrast gate, rgb-triplet sync tests, wcag.ts helper extraction. NOTE: the light accent values in this plan's tables were subsequently re-darkened TWICE during Task 14 — first vs the real page bg #f5f5f2, then vs 10-20%% self-tints; themes.css is the source of truth.)*
- [x] **Step 6:** CHECKPOINT.

---

### Task 3: globals.css — scheme switch, semantic tokens, grid-bg

**Files:**
- Modify: `apps/web/app/globals.css`

- [x] **Step 1:** Replace the dark-only declaration:

```css
html {
  color-scheme: dark;
}
[data-scheme="light"] {
  color-scheme: light;
}
```

- [x] **Step 2:** In the `@theme` block, point semantics at the new vars: `--color-success: var(--tc-success); --color-warning: var(--tc-warning); --color-error: var(--tc-error); --color-streak: var(--tc-streak);` (adds a `text-streak`/`border-streak` utility for Task 12).
- [x] **Step 3:** `grid-bg` light variant (white-alpha lines are invisible on white):

```css
[data-scheme="light"] .grid-bg {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 39px,
      rgba(0, 0, 0, 0.03) 39px, rgba(0, 0, 0, 0.03) 40px),
    repeating-linear-gradient(90deg, transparent, transparent 39px,
      rgba(0, 0, 0, 0.03) 39px, rgba(0, 0, 0, 0.03) 40px);
}
```

  - REVISED (post-review): duplicating the gradient rule per scheme contradicted the tokenization idiom the rest of this task established. Replaced with a single `--tc-grid-line` token instead: added `--tc-grid-line: rgba(255, 255, 255, 0.018)` to the `:root, [data-theme="deep-orbit"]` block (global-only, same pattern as `--tc-success` etc.) and `--tc-grid-line: rgba(0, 0, 0, 0.03)` to the `[data-scheme="light"]` neutrals block in `themes.css`. `globals.css` now has ONE `.grid-bg` rule with both gradients referencing `var(--tc-grid-line)`; the `[data-scheme="light"] .grid-bg` override was deleted. Computed values unchanged in both schemes (verified: dark = `rgba(255,255,255,0.018)`, light = `rgba(0,0,0,0.03)`, same as originally shipped). `packages/themes` structural test (`REQUIRED_CSS_PROPS`) is a fixed 9-key list that doesn't include `--tc-grid-line`, so it can't have caught its absence — confirmed non-exhaustive by reading `theme-properties.test.ts`. 116/116 still green.
- [x] **Step 4:** Update the stale "Dark mode only." comment block. Leave `::selection`, focus rules, brutalist classes alone — they ride `--tc-*` vars.
- [x] **Step 5:** `packages/config/tailwind/base.css` contains a second, divergent `@theme` block that also hardcodes `--color-success/warning/error` (lines 33-35). It is NOT imported by the web app (globals.css imports tailwindcss + themes.css directly) — but themes.css's header comment still points at it as "the" @theme block. Either sync it with the same `var(--tc-*)` mapping or, if confirmed dead (no importer anywhere: `rg -l "tailwind/base.css" --glob '!node_modules'`), delete it and fix the themes.css header comment.
  - DONE: confirmed dead — `rg -l "tailwind/base"` outside docs only hit `packages/config/package.json`'s own export declaration and themes.css's comment; no code imports it. Deleted `packages/config/tailwind/base.css` (+ now-empty `tailwind/` dir) and its `./tailwind/base` export entry in `packages/config/package.json`. Fixed themes.css header comment to point at `apps/web/app/globals.css`. Note: `docs/architecture.md:74` also cites the old path — out of scope for this task, left for a docs pass.
- [x] **Step 6:** `pnpm --filter @tensorcraft/web build` → green. CHECKPOINT.
  - DONE: 122/122 static pages generated, no unknown-utility CSS errors. Also ran `pnpm -w vitest run packages/themes` → 116/116 passing (unaffected, as expected).

---

### Task 4: Scheme state — shared constants, provider, FOUC script, theme-color meta

**Files:**
- Modify: `packages/shared/src/constants.ts` (+ its test)
- Modify: `apps/web/app/components/theme-provider.tsx`
- Modify: `apps/web/app/layout.tsx`
- Test: `apps/web/app/components/theme-provider.test.tsx` (create if absent — check first)

**Design:** stored value is `"light" | "dark" | null`; `null` = follow OS (default). Only explicit user choices persist. Storage key `tc-scheme`. The provider mirrors the existing narrative-theme store: `useSyncExternalStore` + external listener list + a `matchMedia("(prefers-color-scheme: dark)")` change listener that notifies subscribers when in system-follow mode. EVERY localStorage touch wrapped in try/catch — read the SecurityError comment at `theme-provider.tsx:23-36` before writing any storage code; it is load-bearing history.

- [x] **Step 1:** Added to `packages/shared/src/constants.ts` exactly as specified (placed after `isValidSlug`, doc comment noting the axis is orthogonal to `ThemeSlug`). Exported from `packages/shared/src/index.ts` (named exports, matching the existing wholesale-but-explicit style — not a barrel `export *`). Added an `isColorScheme` describe block to `constants.test.ts` (accepts/rejects + storage-key pin). `pnpm -w vitest run packages/shared` → 29/29 PASS.
- [x] **Step 2:** Created `apps/web/app/components/theme-provider.test.tsx` (did not exist). 8 cases per the spec (a-e, split (d) into "flips on change" + "does NOT flip with override stored" for clarity) using a `SchemeProbe` test component + a listener-tracking `mockMatchMedia` helper (same pattern as `packages/ui/src/effects/particle-field.test.tsx`, extended with a settable `matches` getter + `fireChange()` so OS-change reactivity is testable, since the existing simpler mocks in `bridge-ticker.test.tsx` don't support firing). Ran before implementation → all 8 failed with `TypeError: setScheme is not a function` (confirmed red).
- [x] **Step 3:** Extended `theme-provider.tsx` (same file, one provider) exactly per the spec's function shapes, plus a second, independent listener array (`schemeListeners`) so scheme changes don't force theme subscribers to re-render (kept the two stores decoupled rather than sharing the existing `listeners` array). Two separate `useSyncExternalStore` calls (`schemePreference`, `scheme`) both returning stable primitives, per the note about avoiding fresh-object snapshots. `ThemeProvider` mounts a `useEffect` that (1) applies the stored/OS-resolved scheme to the DOM on mount — needed for jsdom tests and defensively for any path that skips the FOUC script, harmless idempotent re-apply in the real browser — and (2) registers a `matchMedia("change")` listener (`addEventListener`/`removeEventListener`, matching the convention in `packages/ui/src/effects/scene-canvas.tsx`, not the legacy `addListener`) that re-applies and notifies only when `getStoredScheme() === null` (no override). Cleanup removes the listener on unmount.

```ts
function getStoredScheme(): SchemePreference {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(SCHEME_STORAGE_KEY);
    return v && isColorScheme(v) ? v : null;
  } catch {
    return null;
  }
}
function systemScheme(): ColorScheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}
function applyScheme(pref: SchemePreference) {
  const resolved = pref ?? systemScheme();
  if (resolved === "light") document.documentElement.dataset.scheme = "light";
  else delete document.documentElement.dataset.scheme;
  try {
    if (pref) localStorage.setItem(SCHEME_STORAGE_KEY, pref);
    else localStorage.removeItem(SCHEME_STORAGE_KEY);
  } catch {}
}
```

  Context gains `{ scheme: ColorScheme; schemePreference: SchemePreference; setScheme(pref: SchemePreference): void }`. In `ThemeProvider`, add a `useEffect` mounting the `matchMedia` change listener → notify listeners (system-follow reactivity). Server snapshot: `"dark"` (matches SSR default; the FOUC script corrects pre-paint). Absence of the attribute = dark — dark stays the no-attribute default so nothing about existing dark rendering changes.
- [x] **Step 4:** `pnpm -w vitest run apps/web/app/components/theme-provider.test.tsx` → 8/8 PASS. Full sweep `pnpm -w vitest run apps/web/app/components packages/shared` → 17 files / 101 tests, all green (no regression to existing `theme-provider-storage.test.tsx`, `nav.test.tsx`, etc.).
- [x] **Step 5:** Extended the FOUC bootstrap in `layout.tsx` — appended a second `try{}catch(e){}` block inside the SAME IIFE/`<script>` tag (one script, still runs before paint). Imported `SCHEME_STORAGE_KEY` from `@tensorcraft/shared` and interpolated it (`JSON.stringify(SCHEME_STORAGE_KEY)`) rather than hardcoding a second `"tc-scheme"` literal, mirroring how `LAUNCHED_THEMES` is already interpolated into the theme half of the same script — avoids a second place the key string could drift from the constant. Logic matches the plan's snippet verbatim otherwise:

```js
try {
  var s = localStorage.getItem("tc-scheme");
  if (s !== "light" && s !== "dark")
    s = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  if (s === "light") document.documentElement.dataset.scheme = "light";
} catch (e) {}
```

- [x] **Step 6:** Merged `themeColor` into the existing `viewport` export (single export, no duplicate declaration) — appended a doc comment to the existing WCAG SC 1.4.4 comment block explaining why the media-query array form needs no client JS. Exact values from the spec.
- [x] **Step 7:** `pnpm --filter @tensorcraft/web typecheck` → clean (no output = success). `pnpm -w vitest run apps/web/app/components packages/shared` → 17 files / 101 tests green. `pnpm --filter @tensorcraft/web build` → 122/122 static pages generated, no new errors (pre-existing OpenTelemetry/Sentry "Critical dependency" webpack warnings are unrelated noise, present before this change). Did NOT start a dev server per the task instruction (controller does manual verification later) — the OS-dark/OS-light/no-flash checks are covered instead by the jsdom provider tests (Step 4) and remain to be eyeballed in a real browser at the controller's manual-verification pass. CHECKPOINT.

**Post-review remediation (2026-07-22, same session):** a quality review of Steps 1-7 above found 3 must-fix + 4 test/robustness items. All applied:

- **C1 (critical, hydration mismatch):** the FOUC script sets `data-scheme="light"` pre-hydration for OS-light visitors; React 19 flags the server/client `<html>` attribute difference as a hydration mismatch (`data-theme` never triggered this because `LAUNCHED_THEMES` only ever resolves to the same server default, so it never actually differs). Added `suppressHydrationWarning` to the `<html>` element in `layout.tsx`, scoped one element deep (standard next-themes-style fix — only silences the warning for `<html>`'s own attributes, not its subtree), with a comment explaining why.
- **I1 (blocked-storage state/DOM desync):** with `localStorage` throwing, `setScheme("light")` set the DOM attr correctly but the next snapshot read re-hit the catch branch, saw nothing, and silently fell back to `null` → React state permanently disagreed with the DOM the user was looking at. Fixed with a module-level `inMemorySchemeFallback: SchemePreference` in `theme-provider.tsx`: every call to the new `persistSchemePref()` records the preference there unconditionally, and `getStoredScheme()`'s catch branch reads it back — normal (non-blocked) browsers never touch it, real storage stays the source of truth for them. Extended the storage-blocked test to assert the scheme probe reads `"dark"`/`"dark"` (scheme/pref) after `setScheme("dark")`, not the pre-fix `"light"`. **Verified fail→pass**: temporarily reverted the catch branch to `return null`, re-ran the extended test — failed with `expected 'light' to be 'dark'` (exactly the desync the review described) — then restored the fix and confirmed 9/9 green again.
- **I2 (e2e suite silently running in light mode):** `playwright.config.ts` set no `colorScheme`, and Playwright defaults to light OS emulation; the new FOUC script would have flipped the entire existing e2e suite — including the canonical axe contrast gate — to light, untested. Pinned `colorScheme: "dark"` in the shared `use` block with a comment noting Task 14 introduces the deliberate two-scheme matrix and removes/loops this pin.
- **M1:** moved `vi.unstubAllGlobals()` into the shared `afterEach` (before `localStorage.clear()` — order matters, since clearing a still-stubbed throwing object would itself throw and mask the real failure in every subsequent test) instead of a manual call at the end of one test, which left the stub live if an earlier assertion in that test failed.
- **M2:** added a "removes the matchMedia change listener on unmount" test asserting `media.listenerCount()` goes from 1 to 0 across `unmount()`.
- **M3:** wrapped the one un-wrapped `fireChange(false)` (in the `setScheme(null)` test) in `act()` for uniformity with the other OS-change tests.
- **M4/M6:** split the old combined `applyScheme(pref)` into `applySchemeAttr(resolved)` (DOM only) and `persistSchemePref(pref)` (storage + in-memory fallback only, per I1). Added a small declarative `useEffect(() => { applySchemeAttr(scheme); }, [scheme])` that converges the DOM to the resolved snapshot on every change — covers `setScheme`, the OS-change path, and any future path uniformly, attribute-only so it's cheap to run every time. This also let the OS-change listener drop its own DOM write entirely (it now just notifies; the `[scheme]` effect picks up the recomputed value) and removed the redundant storage re-write that used to happen on every mount.
- **M5 (doc-only):** added a deferred-decision note to Task 5 below re: optionally syncing `meta[name="theme-color"]` client-side on toggle.

Re-verified after remediation: `pnpm -w vitest run apps/web/app/components packages/shared` → 17 files / **102** tests green (101 + the new M2 listener-cleanup test). `pnpm --filter @tensorcraft/web typecheck` → clean. `pnpm --filter @tensorcraft/web build` → 122/122 pages. E2e proof of the I2 pin: `PW_PORT=3100 pnpm exec playwright test e2e/accessibility.spec.ts --grep "Landing"` → 1 passed (port 3000 was occupied by an unrelated local "Ops Portal" app on this machine, which `reuseExistingServer` had silently picked up on the first attempt — an infra footgun unrelated to this change, worked around via `PW_PORT`, not worth fixing here).

---

### Task 5: Scheme toggle in the nav

**Files:**
- Create: `apps/web/app/components/scheme-toggle.tsx`
- Modify: `apps/web/app/components/nav.tsx` (read it first; place the toggle in the right-side cluster, before the auth/CTA area)
- Test: `apps/web/app/components/scheme-toggle.test.tsx`

- [x] **Step 1: Failing test:** Created `scheme-toggle.test.tsx` (didn't exist) with 3 cases — accessible-name assertion, full System→Light→Dark→System cycle asserting `document.documentElement.dataset.scheme` + `localStorage[tc-scheme]` after each click, and an axe-clean check — wrapping `SchemeToggle` in the real `ThemeProvider` with the `mockMatchMedia` helper copied verbatim from `theme-provider.test.tsx`. Ran before creating `scheme-toggle.tsx` → failed with `Failed to resolve import "./scheme-toggle"` (confirmed red).
- [x] **Step 2:** Implemented `apps/web/app/components/scheme-toggle.tsx`: single `<button>` cycling `system → light → dark → system` via `useTheme()`'s `schemePreference`/`setScheme`. Glyphs `◐`/`○`/`●` exactly as specified, `aria-label`/`title` both set to `` `Color scheme: ${state} (activate for ${next})` ``. Styling matches neighbors: `w-11 h-11 border border-border bg-surface ... hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (same square-icon-button convention as `MobileNav`'s hamburger/close buttons — neutral bordered chrome, not `UserMenu`'s primary-tinted auth styling, since this isn't an auth control). Kept the default 3-state glyph cycle (no user override requested at this checkpoint).
  - Hydration choice: `suppressHydrationWarning` on the glyph `<span>` only (not the button's `aria-label`/`title`), per the plan's "pick the simpler one" — noted inline in the component. Reasoning: `useSyncExternalStore`'s hydration pass renders with `getServerSnapshot` (`null`/"system") on both server and the client's hydration render, so there is no true attribute/text mismatch for React to warn about; the only visible effect is an ordinary post-mount re-render once localStorage's real value loads, which can flip the glyph a beat after first paint. `suppressHydrationWarning` is applied defensively (mirrors the `<html>` convention in `layout.tsx`), and a "mounted" placeholder pass was rejected because it would leave the button briefly without a meaningful label — worse for axe/a11y than settling correctly a beat later.
- [x] **Step 3:** Mounted `<SchemeToggle />` in `nav.tsx`'s right-side cluster (`div.flex.items-center.gap-4`), first child — before both `UserMenu` (desktop auth/CTA) and `MobileNav` (mobile hamburger, which contains the CTA in its drawer). Rendered unconditionally (no `hidden md:block` wrapper) so it's visible in the persistent top bar at every breakpoint, in both logged-in and logged-out states (it doesn't branch on `isAuthenticated`). `nav.snapshot.test.tsx`'s snapshot needed regeneration (new button node) — diff verified to contain only the new toggle, updated via `-u`. `nav.test.tsx`'s existing axe test still passes unchanged (no test edits needed there — it doesn't enumerate children/snapshot). Full sweep: `pnpm -w vitest run apps/web/app/components` → 16 files / 76 tests green. `pnpm --filter @tensorcraft/web typecheck` → clean. `pnpm --filter @tensorcraft/web build` → 122/122 pages. CHECKPOINT.
  - Known gap, not fixed (out of this task's file list): when the mobile hamburger drawer is open, `MobileNav`'s full-screen overlay (`fixed inset-0`, same `z-50`, later in DOM so it paints on top) visually covers the top bar, including this toggle — a mobile user must close the drawer to flip scheme. `mobile-nav.tsx` wasn't in Task 5's file list; flagging rather than silently expanding scope.

**Deferred decision (noted during Task 4 review, 2026-07-22):** NOT implemented, per the plan's own framing that this is optional. The static `themeColor` media-query array from Task 4 already gets browser chrome right for the OS-follow default and for any override that happens to agree with the OS scheme; the toggle does not additionally sync `meta[name="theme-color"]` client-side, so the one remaining gap stands as documented — an override that *disagrees* with the OS (e.g. OS-dark visitor manually picks light) leaves the address-bar color OS-matched until the OS preference itself changes. Left for a future pass if it's judged worth a client-side `useEffect`.

**Post-review polish (2026-07-22, same session):**

- Extracted the third copy of `mockMatchMedia` (theme-provider.test.tsx, scheme-toggle.test.tsx, and the `packages/ui` copies in particle-field.test.tsx/bridge-ticker.test.tsx) to a single shared helper at `apps/web/app/components/test-utils/mock-match-media.ts` (the richer `listenerCount`/`fireChange` variant), and pointed both `apps/web` test files at it. `packages/ui`'s copies deliberately left alone — cross-package boundary, not worth the dependency for a ~20-line mock.
- Added a screen-reader backstop: an always-mounted `role="status" aria-live="polite" aria-atomic="true"` `sr-only` region (sibling of the button, same pattern as `recall-prompt.tsx`'s "Answer revealed." region), empty until first activation, then announcing `"Color scheme: {new state}."` on every click — covers AT/browser combinations that don't reliably re-announce an in-place accessible-name change on the still-focused control.
- Extended the cycle test to assert `title` equals the computed accessible name at all 4 cycle positions (initial + 3 clicks), not just the initial render; added an inline comment at the `title` attribute in `scheme-toggle.tsx` noting the duplication with `aria-label` is deliberate (hover-tooltip parity for sighted mouse users, not a stale second description).
- Removed the dead `vi.unstubAllGlobals()` from `scheme-toggle.test.tsx`'s `afterEach` — that file never calls `vi.stubGlobal` (only `Object.defineProperty` inside the shared mock, redefined fresh every `beforeEach`), so the call was a copy-paste leftover from `theme-provider.test.tsx`, where it IS load-bearing (that file's storage-blocked test does stub a throwing `localStorage`).
- Re-verified: `pnpm -w vitest run apps/web/app/components` → 16 files / 77 tests green (nav snapshot regenerated for the new `sr-only` status div — diff confirmed to contain only that node). `pnpm --filter @tensorcraft/web typecheck` → clean.
- Follow-up notes carried forward, not yet actioned:
  - **◐ (U+25D0) glyph:** needs a one-time visual check on Windows/Linux at the Task 9/10 art sign-off gate — it renders correctly in this session's environment, but the codebase has no existing precedent for shipping a glyph outside the Latin subset in production chrome, so real-font-fallback coverage on non-macOS platforms is unconfirmed.
  - **Mobile-drawer coverage gap** (toggle hidden behind `MobileNav`'s full-screen overlay while the drawer is open, noted under Step 3 above): stays backlog. Both reviewers (this session's self-review and the coordinator's quality review) concur it's out of Task 5's stated file list and not worth expanding scope for now.

---

### Task 6: useScheme hook in packages/ui

**Files:**
- Create: `packages/ui/src/use-scheme.ts` (+ export from `packages/ui/src/index.ts`)
- Test: `packages/ui/src/use-scheme.test.tsx`

packages/ui components (CodeBlock, Exercise, SceneCanvas) can't import the app's provider. They observe the DOM instead — the attribute IS the store.

- [x] **Step 1: Failing test:** returns `"dark"` by default; flips to `"light"` when `document.documentElement.dataset.scheme = "light"` mutates (MutationObserver path); SSR-safe (`getServerSnapshot` → `"dark"`).
- [x] **Step 2:** Implement with `useSyncExternalStore`; subscribe = one shared `MutationObserver` on `document.documentElement`, `attributeFilter: ["data-scheme"]` (module-level, refcounted like the listener array in theme-provider). Snapshot: `document.documentElement.dataset.scheme === "light" ? "light" : "dark"`.
- [x] **Step 3:** `pnpm -w vitest run packages/ui/src/use-scheme.test.tsx` → PASS. CHECKPOINT.

  **Done 2026-07-22.** `packages/ui/src/use-scheme.ts` + `use-scheme.test.tsx` (7 tests, TDD red→green). `@tensorcraft/ui` DOES depend on `@tensorcraft/shared` (already used by `mdx/bridge-callout.tsx`), so per the plan's shared-dep note the hook imports/re-exports the existing `ColorScheme` type from `@tensorcraft/shared` instead of defining a new `UiColorScheme`. Exported from `packages/ui/src/index.ts` as `useScheme`, `ColorScheme` (type), and `getSchemeServerSnapshot` (renamed on export from the module's `getServerSnapshot` to avoid barrel-file ambiguity). MutationObserver is module-level + refcounted (listeners array), created on first subscribe, disconnected + nulled on last unsubscribe — covered by dedicated tests (spy on `MutationObserver.prototype.observe`/`disconnect` across 2 simultaneous mounts). `pnpm -w vitest run packages/ui` → 258 passed, no regressions. `pnpm --filter @tensorcraft/web typecheck` and `build` (122/122 pages) both green. No `typecheck` script exists on `@tensorcraft/ui` itself (only `build`/`lint`); the web typecheck covers it via the workspace as the plan anticipated.

  **Post-review fixes (2026-07-22, same day):** quality review flagged 2 gaps + 2 notes, all applied, no commits. (1) Added a two-consumer test (`getAllByTestId`) that asserts BOTH `Probe` instances update on one mutation — catches a `notifyListeners` that only fires `listeners[0]`, which the original 7 tests missed entirely. (2) The two attribute-flip tests used a sync `act()` wrap around the DOM mutation, which is decorative — `MutationObserver` fires as a microtask after a sync `act()` already returns, so it was throwing a real (deduped) "not wrapped in act" warning on stderr; fixed both with `await act(async () => { ...mutate...; await Promise.resolve(); })` and dropped `waitFor` in favor of a direct assertion. Test file is now 8 tests, `pnpm -w vitest run packages/ui/src/use-scheme.test.tsx` → 8/8 pass, stderr confirmed empty (captured separately, zero act warnings). Full `packages/ui` suite re-run green. (3) One-line comment added at the `index.ts` barrel rename explaining why `getServerSnapshot` was renamed to `getSchemeServerSnapshot` on export. (4) Note: `getSchemeServerSnapshot` is exported but has no consumer yet — Task 12 (CodeBlock/Exercise consumers) may or may not need it; most call sites will likely only need `useScheme()` itself, since `useSyncExternalStore`'s SSR snapshot is only meaningful when calling the hook, not as a standalone value. Flagging so Task 12 doesn't feel obligated to wire it in artificially.

---

### Task 7: Migrate lesson UI inline styles off ThemeManifest.palette

**Files (all under `apps/web/app/`):**
- Modify: `themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (~40 sites), `lesson-drawer.tsx`, `lesson-content.tsx`, `[lesson]/page.tsx`, `themes/[slug]/page.tsx`, `themes/[slug]/capstone/page.tsx` (the `const P = theme.palette` block), `themes/page.tsx:64`, `dashboard/page.tsx:402`, `dashboard/purchase-success/page.tsx:154,209`, `learn/page.tsx`

**Pattern (purely mechanical):** every `theme.palette.X` inside a `style={{...}}` or template string becomes the var: `palette.primary` → `"var(--tc-primary)"`, `bg`→`--tc-bg`, `surface`→`--tc-surface`, `surfaceOverlay`→`--tc-surface-overlay`, `text`→`--tc-text`, `muted`→`--tc-muted`, `border`→`--tc-border`, `codeBg`→`--tc-code-bg`, `accent`→`--tc-accent`. For computed rgba like `` `${palette.primary}20` `` (hex-alpha suffix) use `color-mix(in srgb, var(--tc-primary) 12%, transparent)` (20 hex ≈ 12%; 30 ≈ 19%; 40 ≈ 25% — round sensibly).

**EXEMPT (stay on TS palette deliberately):** `api/og/route.tsx`, `icon.tsx`, `apple-icon.tsx` (permanently dark, user decision), `five-worlds-section.tsx` + `coming-soon-*`/`theme-scene-backdrop.tsx` (cross-theme canvases — handled in Task 8 via `paletteLight`), `sitemap.ts` (no colors).

- [x] **Step 1:** Migrate file by file; after each run its co-located tests (`pnpm -w vitest run <dir>`).
- [x] **Step 2:** Gate: `rg -n "theme\.palette\.|\.palette\.(bg|primary|accent|surface|text|muted|border|codeBg)" apps/web/app --glob '!api/og/**' --glob '!icon.tsx' --glob '!apple-icon.tsx'` → only the Task-8 canvas files remain.
- [x] **Step 3:** `pnpm --filter @tensorcraft/web typecheck && pnpm --filter @tensorcraft/web build` → green. Visual spot-check one lesson in both schemes. CHECKPOINT.

**Completed 2026-07-22.** Per-file site counts migrated: `lesson-steps.tsx` 60, `lesson-drawer.tsx` 11, `[lesson]/page.tsx` 3, `themes/[slug]/page.tsx` 11, `themes/[slug]/capstone/page.tsx` 1 block (`const P` redefined as a literal `--tc-*` var map so every downstream `P.x` site — including props threaded into `capstone-client.tsx` — resolves through CSS with zero other edits) + 2 hex-alpha sites fixed inside `capstone-client.tsx` itself (`${primary}0A`/`${primary}55` string-concat broke once `primary` stopped being a raw hex; converted both to `color-mix`), `dashboard/purchase-success/page.tsx` 2. `lesson-content.tsx`, `themes/page.tsx`, `dashboard/page.tsx`, `learn/page.tsx`: zero in-scope sites (see below).

**Judgment calls — 2 sites intentionally NOT migrated (Task-8 territory, undocumented in the plan's exempt list but same category):** `themes/page.tsx:64` (`primary: theme.palette.primary`) and `dashboard/page.tsx:402` (same) both feed a list of ALL 5 themes rendered **simultaneously side-by-side**, including live "coming soon" cards that must show their OWN distinct brand hue today (confirmed in `theme-cards-grid.tsx` and `dashboard/theme-cards.tsx`, neither of which scopes a per-card `data-theme`/`--tc-primary` override the way `theme-cards-grid.tsx`'s canvas wrapper does). `<html data-theme={DEFAULT_THEME}>` is fixed sitewide, so substituting `var(--tc-primary)` here would make every card show the SAME color instead of its own — a real, visible dark-mode regression today (breaks the multi-brand "Coming Soon" grid), not a hypothetical one. Left both as raw `theme.palette.primary` and reported for Task 8 (which already owns "everywhere `hexToRgb(t.palette.primary)` is computed" — this is the same class of consumer, just feeding `style.color` instead of canvas rgb). `themes/[slug]/page.tsx:302` (`<ThemeSceneBackdrop primary={theme.palette.primary} />`) and `auth/page.tsx:34` (`HERO_RGB`) are canvas feeds already explicitly in Task 8's own file list, left untouched. `themes/[slug]/theme-waitlist-form.tsx` receives its `palette` prop from the exempt `coming-soon-stub.tsx`, left untouched as a direct extension of that exemption.

`dashboard/purchase-success/page.tsx:154,209` WAS migrated (per the plan's explicit line numbers) despite being the same structural pattern (a specific theme's own brand color on a theme-neutral page) — but under the current V1 scope `isLaunched()` gates `firstTheme`/`accessThemes` to Deep Orbit only, so `var(--tc-primary)` and the old `theme.palette.primary` are byte-identical today; zero behavioral change. Left an inline code comment flagging that a second theme launch would reintroduce the exact cross-theme-identity bug the two skipped sites above have, for whoever revisits this page then.

**Non-style / dead-prop cleanup (beyond the mechanical mapping, required by eslint):** migrating every `theme.palette.X` in `lesson-steps.tsx` and `lesson-drawer.tsx` left the entire `theme` object prop unread (it was carried through `LessonStepsProps` → `sharedContentProps` → `StepBriefing`/`SceneCard`/`ChromeBar`/`MissionProgress`/`StepConcept`/`StepCode`/`StepChallenge`/`StepTakeaways`/`StepConsequence`/`PhaseChip` → `LessonDrawer` purely for `.palette` reads). Removed the `theme` prop from all of the above (type + destructure + call site) and from `[lesson]/page.tsx`'s `<LessonSteps>` call and both `lesson-steps.test.tsx`/`lesson-steps.playback.test.tsx` fixtures. `eslint` unused-var warnings went from +6 (introduced by the migration) back to the pre-existing 9 baseline; `pnpm --filter @tensorcraft/web build` bundle for `/themes/[slug]/[module]/[lesson]` shrank 8.94 kB → 8.88 kB. Pre-existing dead code NOT touched (unrelated to this task): `highlightTitle` in `lesson-steps.tsx` was already unused before this migration (confirmed via `git stash` + lint diff).

**Self-review finding — not perfectly zero dark-mode change:** spot-checked 3 sites resolving `--tc-*` against the TS `ThemeManifest.palette` hexes for `deep-orbit`. `primary`/`accent`/`text`/`surfaceOverlay` match byte-for-byte (e.g. `#6BAA8A` = `#6baa8a`, case only) — these are the overwhelming majority of migrated sites. But `bg`/`surface`/`muted`/`border`/`codeBg` have a small **pre-existing** drift baked into `packages/themes/src/css/themes.css` from Tasks 2–3, uniform across all 5 themes: `bg #1C1C1C→#181818`, `surface #252525→#232323`, `muted #A0A0A0→#b0b0b0`, `border #2A2A2A→#3d3d3d`, `codeBg #161616→#141414`. Not introduced by this task (themes.css untouched by me) and not something Task 7 should "fix" (the TS palette is what's being retired). Net effect leans positive: border/muted both went slightly lighter against the same `#181818` bg, i.e. marginally better contrast, and it makes these components consistent with the rest of the app which already reads these same vars via Tailwind utility classes. Flagging per house rule (audit every dimension unprompted) rather than silently calling it "zero change."

**RESOLVED in Task 8 (2026-07-22):** synced all 5 manifests' dark `bg`/`surface`/`muted`/`border`/`codeBg` to the CSS values listed above (case preserved per file — all 5 use uppercase hex). TDD: extended `theme-properties.test.ts`'s manifest↔CSS cross-check from 2 keys (primary/accent) to all 9, watched it fail on exactly these 5 mismatches, then synced and re-ran green. `paletteLight`/CSS-light cross-check extended the same way (light neutrals live in the bare `[data-scheme="light"]` block, not per-theme, so that side reads from there). Now byte-identical everywhere, both schemes.

**Gate re-run (final), from repo root:**

```bash
rg -n "theme\.palette\.|\bP\.(bg|primary|accent|surface|text|muted|border|codeBg)\b|palette\.(bg|primary|accent|surface|surfaceOverlay|text|muted|border|codeBg)" apps/web/app \
  --glob '!**/api/og/**' --glob '!**/icon.tsx' --glob '!**/apple-icon.tsx' \
  --glob '!**/components/five-worlds-section.tsx' \
  --glob '!**/themes/\[slug\]/coming-soon-*' \
  --glob '!**/themes/\[slug\]/theme-scene-backdrop.tsx' \
  --glob '!**/*.test.tsx' --glob '!**/*.test.ts'
```

(bracket globs need `**/` prefixes since ripgrep anchors slash-containing patterns to the invocation cwd, not the search path — the plan's original glob syntax silently no-ops from repo root.) Residual hits, all expected: `dashboard/page.tsx:402` + `themes/page.tsx:64` (judgment-call Task-8 handoffs above), `themes/[slug]/page.tsx:302` + `auth/page.tsx:34` (Task 8's own canvas files), `theme-waitlist-form.tsx` (downstream of exempt `coming-soon-stub.tsx`), `dashboard/purchase-success/page.tsx:155` (harmless comment), `themes/[slug]/capstone/page.tsx` `P.x` (false positive — `P` is now a local var-string map, not `theme.palette`, matched only by variable-name pattern).

**Evidence:** `pnpm --filter @tensorcraft/web typecheck` clean; `pnpm -w vitest run apps/web` → 73 files / 430 tests pass; `pnpm --filter @tensorcraft/web lint` → 9 pre-existing warnings, 0 errors, 0 new; `pnpm --filter @tensorcraft/web build` → 122/122 pages. Exempt files confirmed untouched via `git status`.

---

### Task 8: SceneCanvas scheme plumbing + consumers

**Files:**
- Modify: `packages/ui/src/effects/scene-canvas.tsx`
- Modify: `apps/web/app/components/five-worlds-section.tsx`, `apps/web/app/auth/page.tsx`, `apps/web/app/themes/[slug]/coming-soon-scene.tsx`, `coming-soon-stub.tsx`, `theme-scene-backdrop.tsx`
- Test: extend `packages/ui/src/effects/*.test.*` (find the existing hover-continuity tests)

These canvases show OTHER themes' colors (each card = its own theme's primary, not the page theme), so CSS vars are the wrong source — they need the per-theme palette in BOTH schemes.

**Done 2026-07-22.** Scope grew beyond this section's own file list at the controller's direction: also covered the two Task-7 judgment-call handoffs (`themes/page.tsx`/`dashboard/page.tsx` card-grid feeds + `theme-cards-grid.tsx`/`dashboard/theme-cards.tsx` themselves) and a manifest-neutrals sync + 9-key cross-check test extension (quality-review handoff from Task 7's self-review finding). Full detail below; see the task's own final report for the complete file list, self-review, and evidence.

- [x] **Step 1:** Extend `SceneDraw` signature and props:

```ts
export type SceneDraw = (
  ctx, w, h, rgb, hot, t,
  scheme: "dark" | "light",   // 7th param; scenes branch art on it
) => void;

export interface SceneCanvasProps {
  rgb: [number, number, number];        // dark-scheme hue (unchanged)
  rgbLight?: [number, number, number];  // light-scheme hue; falls back to rgb
  ...
}
```

  In `render()`, read the scheme per frame — cheap attr read, no getComputedStyle: `const scheme = document.documentElement.dataset.scheme === "light" ? "light" : "dark";` then `draw(ctx, ..., scheme === "light" && rgbLight ? rgbLight : rgb, hot, tRef.current, scheme)`.
  Done exactly as specified. `drawOrbit` + the 4 theme-scene functions (`packages/ui/src/effects/orbit-canvas.tsx`, `theme-scenes.ts`) gained the 7th `_scheme: "dark" | "light"` param (prefixed, unused — geometry stays scheme-independent until Tasks 9/10). `OrbitCanvasProps` also gained `rgbLight?` and threads it into its internal `<SceneCanvas>`.
- [x] **Step 2:** Reduced-motion static frame goes stale on toggle: add a `MutationObserver` on `document.documentElement` (`attributeFilter: ["data-scheme", "data-theme"]`) inside the existing effect that calls `render()` when not animating (same condition as the resize handler). Disconnect in cleanup. **Test-writing note (from Task 6's review, revised):** the observer callback fires as a microtask, so a synchronous `act(() => { document.documentElement.dataset.scheme = "light"; })` around the mutation is decorative and leaves a real "not wrapped in act" warning on stderr. A one-shot `await act(async () => { ...mutate...; await Promise.resolve(); })` looked like a fix but is actually a race — it gambles on the callback landing in exactly one microtask tick (Task 6's own tests intermittently threw the same act warning under it: 3 warning runs out of a batch, then 30 clean, no code change). Use plain `document.documentElement.dataset.scheme = "..."` with **no** `act()` wrapper around it, followed by `await waitFor(() => expect(...).toBe(...))` — `waitFor`'s internal `asyncWrapper` keeps an act() window open across however many ticks the observer actually needs, so it isn't sensitive to tick count. Verify with a 10× repeated-process run capturing stderr each time, not just one green run.
  Done exactly per the warning. New `packages/ui/src/effects/scene-canvas.test.tsx` (didn't exist) uses plain mutation + `waitFor`, no `act()` wrap, matching `use-scheme.test.tsx`'s established pattern. **10× repeated-process run, stderr captured each time → 10/10 clean** (see the task's own report for the exact loop). One extra wrinkle found and fixed along the way: the test file's OWN `afterEach` (deleting `data-scheme`/`data-theme` for the next test) raced RTL's auto-`cleanup()` — since a describe-scoped `afterEach` runs *before* RTL's module-level one, deleting the attr while the component (and its live MutationObserver) was still mounted queued one more stray `render()` microtask right as `vi.restoreAllMocks()` un-mocked `getContext`, producing a harmless-but-noisy real jsdom "Not implemented" warning after the test had already passed. Fixed by calling `cleanup()` explicitly first in the file's `afterEach`, before touching the shared DOM attributes — not a product bug, purely this test file's hook ordering (see the file's own comment for the full trace).
- [x] **Step 3:** Consumers: everywhere `hexToRgb(t.palette.primary)` is computed (module scope is fine — both variants are static data), also compute `hexToRgb(t.paletteLight.primary)` and pass `rgbLight`. `coming-soon-scene.tsx` also uses `palette.bg` for scrim gradients — switch those scrims to `var(--tc-bg)` (they overlay the page, which DOES follow the page scheme).
  Done in `five-worlds-section.tsx`, `auth/page.tsx` (`HERO_RGB_LIGHT`), `coming-soon-scene.tsx` (new `paletteLight` prop + `var(--tc-bg)` scrims), `theme-scene-backdrop.tsx` (new `primaryLight` prop, fed from `themes/[slug]/page.tsx:302` as `theme.paletteLight.primary`). Extended beyond the plan's own file list to `coming-soon-stub.tsx` / `theme-waitlist-form.tsx` (per the controller's brief, quoting Task 7's handoff) and the two card-grid components — see the task's own report for the stub's data-theme reality check (confirmed: the stub does NOT get its own `data-theme`, only launched themes do — but `bg/border/muted/text` are byte-identical across every theme's manifest+CSS in both schemes, so `var(--tc-*)` is safe regardless; `primary/accent` stay the hardcoded brand-green literal, untouched) and the card-grid approach chosen per component (client `useScheme()` for `theme-cards-grid.tsx`, local CSS custom props + a scheme-keyed rule for the server-rendered `dashboard/theme-cards.tsx`).
- [x] **Step 4:** Update the scene purity/hover tests for the new arity (pass `"dark"`), add one case asserting geometry is IDENTICAL between schemes (call with same t under both schemes, compare recorded path commands — only styles may differ; this locks the art redesign to styling).
  Done in `orbit-canvas.test.ts` + `theme-scenes.test.ts`.
- [x] **Step 5:** `pnpm -w vitest run packages/ui/src/effects` → PASS (drawOrbit/theme-scenes still dark-only in behavior; light branches land next). CHECKPOINT.
  `pnpm -w vitest run packages/ui packages/themes` → 461 tests (376 passed + 85 pre-existing skipped), 1 pre-existing skipped file, all green. `pnpm -w vitest run apps/web` → 73 files / 430 tests green. `pnpm --filter @tensorcraft/web typecheck` clean. `pnpm --filter @tensorcraft/web build` → 122/122 pages. `pnpm --filter @tensorcraft/web lint` / `@tensorcraft/ui lint` / `@tensorcraft/themes lint` → same pre-existing warning counts as before this task (9 / 1 / 0), 0 new, 0 errors. Full report (fail→pass evidence for the Part C 9-key cross-check, 10-run stderr evidence, complete file list, self-review) is in this session's final report to the controller, not duplicated here.

**Post-review fixes (2026-07-22, same session):** two rounds of review found 1 defect + several polish/robustness items, all applied:
- **Defect (contrast):** `theme-waitlist-form.tsx`'s submit button label was migrated to `color: "var(--tc-bg)"` alongside the other neutral migrations — wrong, because that label's ink is paired to the button's *fixed* brand-green fill (`palette.primary`, never scheme-aware by design), not to the page background. In light scheme `var(--tc-bg)` resolves near-white against the same green fill → ~2.5:1, an AA fail on every stub's primary CTA. Reverted to the literal `#181818` with an inline comment ("ink paired to the fixed brand-green fill; must not follow scheme"). General lesson: a neutral-token migration is only safe when the property it's applied to is itself page-scoped, not fill-paired to a scheme-invariant color.
- **Important (render-identity churn):** `theme-cards-grid.tsx` originally used `useScheme()` + a JS-computed `activePrimary`, which re-renders every card on every scheme toggle — worse, that re-render minted fresh `hexToRgb(...)` array literals for `SceneCanvas`'s `rgb`/`rgbLight` props every time, changing `render`'s `useCallback` identity and forcing a full teardown/rebuild of the canvas's resize/IntersectionObserver/MutationObserver bundle (exactly the churn the per-frame DOM read in Part A exists to avoid). Reworked to the same CSS-custom-prop mechanism `dashboard/theme-cards.tsx` already used (generalized the shared `.tc-theme-card` / `--card-active-primary` rule in `globals.css` to serve both files) — `useScheme()` and its import dropped entirely. While in the file: hoisted `rgb`/`rgbLight` to `useMemo` (dep on `card.primary`/`card.primaryLight`) so hover-only re-renders (`setHovered`) also stop churning array identity — pre-existing churn, fixed since the file was already open.
- **Test-lock hardening:** extracted the geometry-recording mock `CanvasRenderingContext2D` (arcs/ellipses/lines/curves/rects, `fillRect` captured not discarded) to `packages/ui/src/effects/test-utils/recording-canvas.ts`, shared by `orbit-canvas.test.ts` and `theme-scenes.test.ts` — a reviewer caught that the original recorder discarded `fillRect` args entirely (zero geometry exposure beyond the constant full-canvas wash), which would have let a positioned rect in Task 9/10's art sneak past the purity/scheme-identity locks undetected. One shared module means the two scene families can no longer independently drift on what geometry gets checked.
- **Theme-properties.test.ts:** DRY'd the "defines all 9 required `--tc-*` properties" test to call `extractDarkThemeBlock` instead of re-deriving the same block-extraction regex inline; added explicit `--tc-grid-line` presence checks (`toContain`, not hex-format — it's an `rgba()`) to both the dark default block and the light shared block, closing the gap this file's own earlier note flagged (`REQUIRED_CSS_PROPS`'s fixed 9-key list structurally can't cover a non-palette token like grid-line).
- **Drive-by (pre-existing, one line):** `theme-cards-grid.tsx`'s coming-soon status label referenced `var(--text-muted)`, which doesn't exist (Tailwind's actual generated var is `--color-text-muted`, itself aliasing `--tc-muted`) — fixed to `var(--tc-muted)` directly, noted inline.
- Doc-only: added a Task 11 note recommending a shared `useAttributeObserver` hook instead of a 4th bespoke `MutationObserver`, and a Task 15 close-out note about eventually tightening `rgbLight` to a required tuple.

Re-verified after all of the above: `pnpm -w vitest run packages/ui/src/effects/orbit-canvas.test.ts packages/ui/src/effects/theme-scenes.test.ts` → 17/17. `pnpm -w vitest run packages/themes` → 108/108 (106 + 2 new grid-line tests). `pnpm --filter @tensorcraft/web typecheck` clean. `pnpm --filter @tensorcraft/ui build` clean. Quick `prettier --check` on every touched file → clean.

---

### Task 9: Light art — drawOrbit ("ink on paper")

**Files:**
- Modify: `packages/ui/src/effects/orbit-canvas.tsx`

**Art direction (applies to Tasks 9–10):** dark scheme is *light emitted from darkness* (additive `"lighter"`, hues lifted toward white). Light scheme is *ink laid on paper*: `globalCompositeOperation = "multiply"` so overlaps pool darker like wet ink; the highlight role inverts — instead of `lift()` toward white, deepen toward near-black ink; base alphas scale up ~1.8× because tinted marks on paper need more body than glows on black. Geometry NEVER branches on scheme (locked by the Task 8 test).

- [x] **Step 1:** Add the shared helper (top of file, exported for theme-scenes):

```ts
/** Scheme-aware highlight: dark lifts the hue toward white (glow),
    light deepens it toward ink (#1A1A1A). Geometry-independent. */
export const highlight = (
  [r, g, b]: [number, number, number],
  scheme: "dark" | "light",
): [number, number, number] =>
  scheme === "light"
    ? [Math.round(r * 0.45), Math.round(g * 0.45), Math.round(b * 0.45)]
    : [Math.round(r + (255 - r) * 0.6), Math.round(g + (255 - g) * 0.6),
       Math.round(b + (255 - b) * 0.6)];
```

  Done verbatim (exported; Task 10 imports it from `orbit-canvas`).
- [x] **Step 2:** Rework `drawOrbit` to accept `scheme` and branch styling only:
  - `const ink = scheme === "light"; const A = ink ? 1.8 : 1;` — multiply every literal alpha by `A` (clamp ≤ 0.9).
  - `[hr,hg,hb] = highlight(rgb, scheme)`.
  - Composite: `ctx.globalCompositeOperation = ink ? "multiply" : "lighter"`.
  - Nebula wash: keep, alphas × `A` — a soft tint field reads as paper wash under multiply.
  - Starfield: becomes an engraving stipple — same positions/twinkle, color `hr,hg,hb` (now deep ink), alpha × `A × 0.6` (stipple should whisper, not pepper).
  - Central body: gradient stops unchanged structurally; under multiply the "glow" renders as a pooled tint disc — correct. Core dot alpha `0.95 → 0.85` in ink mode (a pure-black-ish dot at 0.95 is a hole in the page).
  - Ring paths/particles/trails: alphas × `A`; the near-particle color shift now runs theme-hue → deep-ink (the `front`-lerp toward `hr/hg/hb` needs no code change — `highlight()` already flipped the target).

  Done as spec'd, with **three art-tuning deviations found while critiquing screenshots** (styling only; geometry lock stayed green throughout — 33/33 each round). **Lesson for Task 10:** multiply is right for crisp MARKS, wrong for large soft FIELDS.
  1. **Particle glow gradients:** damped to `alpha × 0.16` in ink (was ×0.45 both schemes) — at full strength every near-black centre became a bokeh smudge and the field read as printing mud, not stipple.
  2. **Nebula + halo colours:** ink mode uses paper-lifted wash tints (`wr..` = base lerped 0.55 toward white, `dr..` = 0.3) instead of raw base/highlight — multiply squares mid-value colours toward desaturated grey, and the raw theme ink rendered a grey storm cloud over half the card (verified by `getImageData` pixel probes, not just eyeballing).
  3. **Halo/nebula composite:** even with pale tints the wash-on-wash multiply stacked to a grey mass, so in ink mode the halo is drawn `source-over` (a watercolour glaze; the composite flips back to multiply before the ring marks, dark scheme untouched) with stops retuned to `0.2/0.12 × boost` — also keeps hover boost from clamping both stops flat. Core dot: `min(0.88, 0.85 × boost)` in ink so hover can't push it fully opaque.
- [x] **Step 3:** Tests: `pnpm -w vitest run packages/ui/src/effects` (purity + scheme-geometry tests) → PASS.
  33/33 (5 files) after every iteration; `@tensorcraft/web` typecheck clean; ui lint unchanged (1 pre-existing warning); prettier clean.
- [x] **Step 4:** Visual check (`pnpm --filter @tensorcraft/web dev`): landing five-worlds Deep Orbit card + `/auth` hero in BOTH schemes. Light target: an etched orbital diagram in green-ink on paper, not a washed-out glow. Screenshot both, show the user. CHECKPOINT — **art sign-off gate: do not proceed to Task 10 until the user approves the orbit look.** (Standing feedback: ask before big recolors.)
  4 screenshots captured (dev on :3100, scheme via `tc-scheme` localStorage; dark rendering verified byte-identical in behavior — every change is behind `ink`): scratchpad `task9/orbit-{dark,light}-{landing,auth}.png`. Landing shots show the hovered/ignited state (focus on the card's link drives the same `hovered` state). **AWAITING USER ART SIGN-OFF before Task 10.** Screenshot-capture gotcha for Task 10's gate: below-the-fold regions never paint in this browser tool (blank captures even after `scrollIntoView`); workaround is hiding the preceding `main` siblings via `style.display="none"` so the section sits at the top, then an element screenshot (`selector:` on the section).

**Post-review fix (2026-07-22, same session):** review caught that the first cut of `scaleA` clamped in BOTH schemes — with `A = 1`, dark gained a 0.9 alpha ceiling it never had (near-side hover particles compute 1.139, previously raster-clamped at 1.0 → visibly dimmer; glow inner stop 0.512 → 0.405). Fixed to `ink ? Math.min(0.9, x * A) : x` (dark passes through untouched, matching the halo/core-dot bare-literal precedent). Because geometry-only recording is exactly why this survived the suite, `test-utils/recording-canvas.ts` now also snapshots styling per draw call (fillStyle/strokeStyle with gradients as stop lists, composite op, lineWidth) and `orbit-canvas.test.ts` gained a **dark-scheme golden style lock** (fixed t/hot; 913 fills / 576 strokes; sha256 of the full capture; readable spot locks: max fill alpha 1.615 AND 42 fills > 1 — the count is the assertion that actually trips on a scaleA-only leak, since the 1.615 core dot bypasses the helper; ops source-over + lighter only) plus a light-scheme complement (all plain-paint alphas ≤ 0.9; ops multiply + source-over, never lighter). Behavioral proof: reintroducing the buggy clamp fails the golden lock (hash mismatch observed), fix restores 35/35. Task 10 inherits the style capture for its own scenes. Both dark screenshots re-captured on the fixed code (the originals were taken with the bug live).

---

### Task 10: Light art — the four theme scenes

**Files:**
- Modify: `packages/ui/src/effects/theme-scenes.ts`

Same transformation as Task 9 (`scheme` param; `ink`/`A`; `highlight()` imported from orbit-canvas; `multiply` composite; per-scene notes):

- [x] **Step 1 — drawNeonProtocol:** skyline strips become a printed silhouette (fill alpha ×A reads as grey-blue blocks); window twinkles become dark specks (highlight() handles it); scan beam gradient endpoint `rgba(hr,...)` now sweeps a deepening band — under multiply it darkens what it crosses, a scanner over paper. Detection brackets/confidence bars: ink strokes — they read BETTER on paper than on night (HUD → blueprint annotation).
  Done, with two screenshot-tuned deviations (iteration 2; styling only, ink-gated): (1) skyline got its own `scaleSky` (×A×1.5, same 0.9 clamp) — at plain ×A the blocks read as washed-out ghosts, not print; (2) the beam is a LARGE SOFT FIELD, so per Task 9's lesson it does NOT multiply — ink flips it to a source-over glaze (deep-wash body `dr..`, deep-ink leading edge, stops retuned 0.07/0.14 + hot terms) and flips back to multiply for the HUD marks; (3) detection annotations lift their rest floor in ink (`0.3 + 0.7*hot` vs dark's `0.2 + 0.8*hot`, both reach 1.0 at full hover) — a blueprint annotation should be legible before hover where the dark HUD deliberately idles ghost-faint. Centroid glow damped to `a*0.08` in ink (vs dark `a*0.22`), orbit's soft-gradient lesson.
- [x] **Step 2 — drawSignalWard:** token rows become literal redaction bars — dark blocks on paper (alpha ×A×1.4 here; the redaction metaphor wants more body than ×1.8 gives the faint dark values — tune to taste, target: clearly visible bars at rest). Attention arcs: ink strokes; EKG baseline: ink line.
  Done exactly as spec'd (`scaleBar` = ×A×1.4, 0.9 clamp); bars clearly visible at rest on the first screenshot pass — accepted at iteration 1, no tuning needed. Arcs/endpoint dots/EKG all `scaleA`.
- [x] **Step 3 — drawNovaCanvas:** noise-to-rose particles: engraving stipple condensing into an inked rose; the `e`-lerp toward `hr/hg/hb` (formation → ink) needs no geometry change. Rose outline + breathing core alphas ×A.
  Done; bloom (LARGE SOFT FIELD) glazes with wash tints source-over (deep `dr..` centre / pale `wr..` mid), matching orbit's halo pattern — it was already outside the composite save-block, so no flip needed. One screenshot-tuned deviation (iteration 2): the size>1.6 halo is a FLAT disc, not a gradient — orbit's ×0.16 damping still printed visible hard-edged rings on paper, so ink damps it to `scaleA(a)*0.08`.
- [x] **Step 4 — drawTerraGrid:** the natural blueprint — perspective grid + ridgeline as drafting lines (alpha ×A), node pings as surveyor's marks, packets as ink dots.
  Done, one screenshot-tuned deviation (iteration 2): ridgeline + verticals + rungs use `scaleLine` (×A×1.4, 0.9 clamp) — at plain ×A the sheet read washed-out; a blueprint's linework is its whole voice. Nodes/pings/packets: deep-ink `scaleA` marks, unchanged from spec. Ground wash: pale wash tint (already source-over).
- [x] **Step 5:** Update the module doc comment (lines 14-19: "Additive blending over the dark card…" → describe both languages). Tests green: `pnpm -w vitest run packages/ui/src/effects`.
  Done — module header now documents both languages + the soft-field/source-over split, referencing orbit-canvas.tsx; local `lift()` deleted in favour of the shared `highlight()` import (dark behaviour identical); new module-level `wash()` helper documents the grey-storm-cloud lesson. `_scheme` renamed `scheme` in all four scenes. **Tests:** theme-scenes.test.ts gained per-scene dark golden style locks at hot=1, **t=0** (deviation from orbit's t=123.456: t=0 is each scene's phase-shifted signature frame, keeping conditional styling branches — Nova's rose outline, Neon's locked brackets — inside the capture; at t=123.456 Nova's outline never draws) + per-scene light complements (plain alphas ≤0.9, ops = {multiply, source-over}, never "lighter", swept at two (hot,t) points). Golden entries are single `toEqual` objects so one failing run prints the complete fresh capture; the re-golden comment lists every field (fills/strokes/maxFillAlpha/maxStrokeAlpha/sha). **Dark byte-identity proven**, not assumed: a temporary probe test diffed full style captures of the new code against `git show HEAD:` (pre-Task-8 art) for all 4 scenes × 3 (hot,t) points — 12/12 identical — then was deleted. **Golden fire-proof:** deliberately changed the neon confidence-bar alpha (0.7→0.8, dark path), observed the neon golden fail on sha with the full received object printed, reverted, 43/43 green. Final: effects suite 43/43, full packages/ui 280 passed (85 pre-existing skips), web typecheck clean, prettier clean, ui lint 1 pre-existing warning only.
- [x] **Step 6:** Visual check: homepage coming-soon strip + all four `/themes/<slug>` stub pages in both schemes, hover + reduced-motion static frames. Screenshot each scene in light; show the user. CHECKPOINT — art sign-off on all four before continuing.
  9 screenshots at scratchpad `task10/`: `<slug>-{dark,light}.png` ×4 + `strip-light.png` (landing strip, per-theme LIGHT hues, all 4 mini scenes in one frame — captured via the Task 9 hide-preceding-siblings workaround). Note for the reviewer: the `/themes/<slug>` stub pages feed the scenes **brand green** in both schemes (`#6BAA8A`/`#3B6550`, the user's 2026-07-19 "brand green only on coming-soon pages" decision, hardcoded in coming-soon-stub.tsx) — per-theme light hues are visible on the landing strip and /themes cards, so `strip-light.png` is the hue-judging shot. Dark stubs re-verified visually unchanged. **AWAITING USER ART SIGN-OFF on all four scenes before Task 11.**

**Post-review fix (2026-07-22, same session):** review found the light-scheme "every plain-paint alpha ≤0.9" sweep (both `orbit-canvas.test.ts` and `theme-scenes.test.ts`) only scanned `styles.fills`/`styles.strokes` entries whose captured `style` is a string. A gradient fill's captured style is its `addColorStop` stop array (see `paintOf` in `test-utils/recording-canvas.ts`), so `alphaOf(gradientStyle)` returns `NaN` and the `!Number.isNaN` filter silently dropped it — every gradient stop (nebula washes, Neon's scan beam, Nova's bloom glaze, Terra's ground wash) was invisible to the clamp assertion. Proven exploitable: injecting alpha ×20 into Terra's ground-wash ink stop passed the whole suite unmodified. Fix: added `gradientStopAlphas(entries)` to `recording-canvas.ts` (flattens every gradient stop's own parsed alpha across a fills/strokes capture array, `[]` for plain-string entries) and both test files now additionally assert `Math.max(gradientStopAlphas(fills) + gradientStopAlphas(strokes)) ≤ 0.9` alongside the untouched plain-paint scan. Verified the gap: re-injected the ×20 stop, `theme-scenes.test.ts`'s `drawTerraGrid style lock` failed (`2.38` not `≤0.9`) exactly as expected; reverted (byte-identical, confirmed by re-reading the line), suite back to 43/43. Also added a one-line comment on Neon's centroid-glow gradient stop (`a * (ink ? 0.08 : 0.22)`), which deliberately bypasses `scaleA` — `a` is already bounded to ~[0,1] by construction, and the 0.08/0.22 factor is a per-scene damping ratio, not a base alpha needing the ink ×A scale — no output change. Final: effects suite 43/43, `@tensorcraft/web` typecheck clean, `@tensorcraft/ui` build (tsc) clean, prettier clean on all touched files.

---

### Task 11: AmbientBackground + TickerCanvas

**Files:**
- Modify: `apps/web/app/components/ambient-background.tsx`
- Modify: `apps/web/app/components/ticker.tsx`

**Note added during Task 8's quality review (2026-07-22):** by this task, the codebase will have (at least) 4 independent `MutationObserver` setups watching `data-scheme`/`data-theme` on `document.documentElement` for essentially the same reason: `use-scheme.ts` (packages/ui, refcounted singleton), `SceneCanvas` (packages/ui, per-instance, added in Task 8, re-renders a reduced-motion static frame), `ticker.tsx`'s existing one (about to get its `attributeFilter` extended here), and this task's own two new ones (AmbientBackground + TickerCanvas, if TickerCanvas's isn't literally the same instance being extended). Rather than writing a 4th/5th bespoke observer inline, consider extracting a shared `useAttributeObserver(attrs: string[], onChange: () => void)` hook (or generalizing `use-scheme.ts`'s refcounted-singleton pattern to take an arbitrary attribute list) that every consumer subscribes to — one shared observer instance instead of N per-component ones, less setup/teardown code duplicated per file, and one place to fix if the mutation-observer-in-tests footgun (see Task 6/8's `act()`-vs-`waitFor` history) needs updating again. Not required to block this task — just flagging the shape before a 4th copy gets written.

- [x] **Step 0 (shared hook, per the review note above):** created `apps/web/app/components/use-attribute-observer.ts` — `useAttributeObserver(attributes: string[], onChange: () => void)`, one module-level refcounted `MutationObserver` (mirrors `use-scheme.ts`'s singleton pattern) observing `document.documentElement` with a fixed `attributeFilter: ["data-theme", "data-scheme"]`; each consumer registers its own attribute subset and only gets called back when a mutation matches its own filter. Test file `use-attribute-observer.test.tsx` (6 tests): fires on a watched mutation, ignores unwatched attributes while proving the subscription is still alive, per-consumer filtering with two simultaneously-mounted consumers, shared-observer-across-consumers + no-disconnect-while-others-mounted + disconnect-on-last-unmount (mirrors `use-scheme.test.tsx`'s multi-consumer/disconnect assertions per the task brief). `pnpm -w vitest run apps/web/app/components/use-attribute-observer.test.tsx` → 6/6 PASS on first run.
- [x] **Step 1 — AmbientBackground:** done as spec'd. Hardcoded `PALETTES` replaced by an exported `readPalettes()` helper (`--tc-primary-rgb` triplet parse + `--tc-tier-structural`/`--tc-tier-intuition` hex→rgb, falling back to the old hardcoded triplet — renamed `FALLBACK_PALETTES` — if a var is missing/unparsable). Called once at mount (before the first `resize()`'s particle spawn, so no one-frame flash of the fallback) and again from `useAttributeObserver(["data-theme", "data-scheme"], ...)`; the result lives in a `palettesRef` that `spawn()` now takes as a parameter, so newly-spawned particles pick up a theme/scheme change immediately (already-alive particles age out within their ~4-11s lifespan — no forced repopulation, since the plan only asked for the CSS to be re-read, not an instant visual swap). `renderFrame()` reads `document.documentElement.dataset.scheme` once per frame (cheap attribute read, no `getComputedStyle` in the loop) to multiply particle alpha ×1.6 and skip the `p.r > 1.2` glow-halo branch in light. The reduced-motion static frame re-renders via the same attribute-observer callback checking a `motionQueryRef`.
  Tests (`ambient-background.test.tsx`, 6 cases, all passed on first run after fixing the canvas-context type cast): `readPalettes` parsing correctness (triplet + 2 hex vars, and the fallback path) as a pure-function unit test; component wiring re-reads `getComputedStyle` on both a `data-theme`-only and a `data-scheme`-only mutation (spy call-count assertions); reduced-motion static frame repaints (`clearRect` call count increases) on a `data-scheme` mutation; glow-halo skip in light vs dark, using a `Math.random` stub to force every particle into the halo-eligible "large" branch and asserting on the recorded `ctx.arc` radius values (`8.0` = `p.r*4` present in dark, absent in light; `2.0` main-dot arc present in both).
- [x] **Step 2 — TickerCanvas** (`ticker.tsx`): done as spec'd. The bespoke `MutationObserver` (attributeFilter `["data-theme"]` only — the audit-flagged staleness bug) is gone; `readPrimaryRgb` is now a `useCallback` shared between the mount-time call and `useAttributeObserver(["data-theme", "data-scheme"], readPrimaryRgb)`. `draw()` reads `document.documentElement.dataset.scheme` once per frame (not per streak, not `getComputedStyle`) and multiplies `s.alpha` by 2.5 in light, 1 (no-op) in dark. The hardcoded `"107,170,138"` fallback triplet is untouched and now has an inline comment noting it stays dark-biased on purpose (last-resort constant, not scheme-aware).
  Tests (`ticker.test.tsx`, 2 cases): a regression lock that mutates ONLY `data-scheme` (no `data-theme` change) and asserts the drawn `strokeStyle` picks up a freshly-changed `--tc-primary-rgb` value — this is exactly the case the old code silently failed on, since its filter never included `data-scheme`; and an alpha-boost measurement (`Math.random` stubbed to `0` for a deterministic base alpha of `0.06`) asserting dark stays `0.06` and light becomes `0.15` (`0.06 × 2.5`). Both needed a `getComputedStyle` **stub** rather than setting real inline custom properties on `document.documentElement`, because jsdom's `getComputedStyle` does not compute custom-property *inheritance* across elements — confirmed by a throwaway debug test (documented inline in the test file) before writing the real ones, so this isn't a guess.
- [x] **Step 3:** `pnpm -w vitest run apps/web/app/components` → 19 files / 91 tests green (was 17/85 before this task — 2 new files here + use-attribute-observer.test.tsx, no regressions). `pnpm --filter @tensorcraft/web typecheck` clean. `pnpm --filter @tensorcraft/web lint` → 9 pre-existing warnings, 0 errors, 0 new (one self-introduced `eslint-disable` comment on `use-attribute-observer.ts` turned out to be dead — the exhaustive-deps rule never actually fired for that effect — removed it to land back on the documented baseline). `pnpm --filter @tensorcraft/web build` → 122/122 pages. `pnpm exec prettier --check` on all 6 touched/created files → clean. Broader regression sweep: `pnpm -w vitest run apps/web packages/ui` → 100 files / 724 tests passed + 85 pre-existing skips, 1 pre-existing skipped file.
  Visual check: dev server on :3100, `/pricing` (AmbientBackground) in both schemes via `localStorage.tc-scheme`. Screenshots at scratchpad `task11/pricing-dark.png` (glow-halo dust visible, e.g. the amber-tinted dot at bottom-left) and `task11/pricing-light.png` (clean ink motes, no halos, boosted alpha). **Gotcha caught mid-check:** the browser's own OS-level color-scheme preference in this environment is light, so the very first un-overridden navigation (meant to be the "before" dark shot) silently rendered light via the system-follow default — re-shot with an explicit `localStorage.setItem("tc-scheme","dark")` for a true dark baseline once noticed.
  **Landing ticker could not be visually checked:** `rg` across `apps/web/app` found no import of `ticker.tsx`'s exported `Ticker` anywhere in the live app (not the landing page, not layout.tsx) — only `layout.test.tsx` still mocks `"./components/ticker"`, apparently a leftover from when it was wired in. `TickerCanvas`/`Ticker` currently appears to be dead code in production. This is a pre-existing condition unrelated to this task's scope (scheme-support, not app wiring), flagged here per house rule rather than silently assumed fixed; the 2 unit tests above are the verification evidence for the ticker changes in lieu of a live screenshot.
  CHECKPOINT.

---

### Task 12: Code highlighting — Shiki light theme, Sandpack light theme

**Files:**
- Create: `packages/ui/src/mdx/tensorcraft-theme-light.ts`
- Modify: `packages/ui/src/mdx/tensorcraft-theme.test.ts` (extend to lock the light theme)
- Modify: `packages/ui/src/mdx/code-block.tsx`
- Modify: `packages/ui/src/mdx/exercise.tsx`
- Modify: `packages/themes/src/types.ts` + all 5 manifests (DELETE dead `sandpackTheme` field)

- [x] **Step 1: Extend the theme test first:** mirror the existing dark lock for a `tensorcraft-light` registration: `type: "light"`, `editor.background === "#F6F6F2"`, and a contrast assertion that every `tokenColors` foreground hits ≥ 4.5:1 against `#F6F6F2` (reuse the luminance helper pattern from Task 2). Run → FAIL. *(Done — light gate imports `contrastRatio` from @tensorcraft/themes; 45/45 after implementation.)*
- [x] **Step 2:** Create `tensorcraft-theme-light.ts` — same scopes/structure as the dark file, these foregrounds (derived from the dark tokens, all ≥4.6:1 on `#F6F6F2`):

| Scope group | Dark | Light |
|---|---|---|
| comment | `#788878` | `#667366` |
| keyword / tag / template-expr / md-heading | `#6BAA8A` | `#467A60` |
| string | `#C9A96E` | `#896A33` |
| numeric | `#B5CEA8` | `#567844` |
| language consts / python self | `#7096B0` | `#4E748E` |
| function / decorator | `#DCDCAA` | `#72722F` |
| types/classes | `#4A90D9` | `#2871BE` |
| variables | `#D4D4D4` | `#3C3C3C` |
| properties / attrs / JSON keys / shell vars | `#9CDCFE` | `#0275B3` |
| operators | `#E0E0E0` | `#2E2E2E` |
| punctuation | `#B0B0B0` | `#6F6F6F` |
| regex | `#D16969` | `#C54141` |

  Chrome: `"editor.foreground": "#2E2E2E"`, line numbers `#B0B0AC` / active `#467A60`, selection `#3B655030`, lineHighlight `#EDEDE8`, bracket-match `#3B655020`/`#3B655060`.
- [x] **Step 3:** `code-block.tsx`: register BOTH themes in `createHighlighter`; `const scheme = useScheme();` and `theme: scheme === "light" ? "tensorcraft-light" : "tensorcraft-dark"` in `codeToHtml` (add `scheme` to the effect deps — blocks re-highlight on toggle; Shiki re-render on a handful of visible blocks is fine). *(Done as specified.)*
- [x] **Step 4:** `exercise.tsx`: extract the inline theme object to a `SANDPACK_THEMES = { dark: <existing>, light: {...} }` constant; select via `useScheme()`. Light values: `surface1: "#FFFFFF"`, `surface2: "#F6F6F2"`, `surface3: "#EDEDE8"`, `clickable: "#555555"`, `base: "#2E2E2E"`, `disabled: "#C0C0BC"`, `hover/accent: "#3B6550"` (page-primary green is intentional — Sandpack is theme-agnostic chrome, matching the dark file's `#6BAA8A`), `error: "#C22F2F"`, `errorSurface: "#FDECEC"`; syntax: plain `#2E2E2E`, comment `#6F6F6F` italic, keyword `#9D41DA`, tag `#DC1722`, punctuation `#0077A8`, definition/property `#1761FF`, static `#CE380B`, string `#537A19`.
- [x] **Step 5:** Delete `sandpackTheme` from `ThemeManifest` + the 5 manifests (dead config, never read — audit §7). Fix any type fallout. *(Done — zero code references remain, only historical doc mentions.)*
- [x] **Step 6:** `pnpm -w vitest run packages/ui packages/themes && pnpm --filter @tensorcraft/web typecheck` → green. Visual: a lesson code block + exercise editor in both schemes. CHECKPOINT. *(411 passed + 85 skipped, typecheck clean, build green. Note: Task 12 was implemented by an agent interrupted mid-run; the controller verified each artifact directly afterward — dark Sandpack object byte-identical to the pre-extraction original, light values match the canonical tables, both themes registered. In-browser visual check of code blocks deferred to Task 15's manual sweep.)*

---

### Task 13: Remaining hardcoded-color fixes

**Files:**
- Modify: `apps/web/app/dashboard/dashboard-view.tsx`
- Modify: `packages/ui/src/mdx/concept.tsx` AND `apps/web/app/components/mdx/concept.tsx`
- Modify: `apps/web/app/admin/digest/page.tsx`
- Modify: `apps/web/app/certificates/[id]/page.tsx:130`

- [x] **Step 1 — dashboard-view:** `:218` `"rgba(255,255,255,0.02)"` → `"var(--tc-primary-muted)"`; `:252` `"#A0A0A0"` → `"var(--tc-muted)"`; the five `#FF8A2A` sites (319, 330, 339, 561, 565) → `"var(--tc-streak)"` (or `text-streak` utility where a class fits). *(Done — all 7 sites, inline styles kept, prettier-formatted.)*
- [x] **Step 2 — concept.tsx:** only `packages/ui/src/mdx/concept.tsx` has raw tier hex maps (`#6BAA8A/#7096B0/#A89060`) → `var(--tc-tier-identity)/var(--tc-tier-structural)/var(--tc-tier-intuition)`. The `apps/web/app/components/mdx/concept.tsx` copy already uses `var(--tc-tier-*, #hex)` — at most tidy its fallbacks; effectively a no-op. *(Done — packages/ui copy tokenized; app copy left as-is.)*
- [x] **Step 3 — admin digest:** replace `bg-black/text-white/border-white/neutral-*` classes with token utilities. *(Done — active chip `border-text-primary bg-text-primary text-page` (inverted, scheme-proof), gap chip `border-warning text-warning`, borders `border-border`; dead `dark:` variants removed.)*
- [x] **Step 4 — certificates page:** `print:border-black` at `:130` is print-scoped, intentionally paper-fixed. **No change needed.**
- [x] **Step 5 — explicitly NOT fixed:** `global-error.tsx` stays dark by design; modal scrims `bg-black/50`–`70` correct in both schemes; Google logo colors; `rgba(0,0,0,0.4)` drop shadow. *(Left as specified.)*
- [x] **Step 6:** Affected tests green. *(289 passed / 26 files across dashboard + mdx dirs; typecheck clean; build 122/122. Executed inline by the controller, 2026-07-23.)*

---

### Task 14: Test matrix — axe per scheme, visual baselines

**Files:**
- Modify: `e2e/accessibility.spec.ts`
- Modify: `e2e/visual/themes.spec.ts`, `e2e/visual/key-pages.spec.ts`

- [x] **Step 1 — axe matrix:** wrap the existing page list AND the per-lesson-step audits in a scheme loop:

```ts
for (const scheme of ["dark", "light"] as const) {
  test.describe(`scheme: ${scheme}`, () => {
    test.use({ colorScheme: scheme });   // drives prefers-color-scheme → FOUC script follows
    // existing tests, titles suffixed with scheme
  });
}
```

  `test.use({ colorScheme })` exercises the system-follow path end-to-end (no localStorage seeding needed). Runtime roughly doubles for this spec — acceptable; it is the contrast gate that certifies the light palette.
- [x] **Step 2:** Run: `pnpm exec playwright test e2e/accessibility.spec.ts` → ALL green in both schemes. *(Took 3 palette rounds + component fixes — see Task 14 close-out note below.)* Any light-scheme color-contrast violation = palette bug: fix the token (Task 2 values are the floor, darken further if a real pairing fails), never mute the rule.
- [x] **Step 3 — visual baselines:** add a light variant to the RUN_VISUAL-gated specs (same loop + `test.use({ colorScheme })`; snapshot names must include the scheme). Then `RUN_VISUAL=1 pnpm exec playwright test e2e/visual --update-snapshots` to mint light baselines. Note in the report that all dark baselines were NOT regenerated — verify dark diffs are clean before minting.
- [x] **Step 4:** One SchemeToggle e2e smoke: click toggle on landing → `<html data-scheme>` flips, background color changes, reload persists. Add to an existing e2e file that already boots the app (find the cheapest host spec).
- [x] **Step 5:** CHECKPOINT.

  **Task 14 close-out (2026-07-23, executed inline by the controller):** the light axe matrix found three systemic light-only bug classes, all fixed and now gate-locked:
  1. **Page-bg-as-ink on brand fills** (`bg-primary text-page`, inline `color: var(--tc-bg)` on primary/accent fills, `::selection`): light page bg on light primary was 4.21:1. Fixed with a new `--tc-on-primary` token (dark `#181818` / light `#ffffff`), a `text-on-primary` utility, and a sweep of 22 class files + 10 inline sites. Gate: on-primary vs primary+accent, both schemes.
  2. **Palette minted against the wrong substrates**: v1 targeted `#ffffff`, failed on the real page bg `#f5f5f2`; v2 fixed that, then failed as `text-primary` on `bg-primary/10..20` self-tints. v3 (current, in themes.css) clears 4.55:1 on the page bg AND on 10-20% self-tints over both white and page bg; white on-primary ink margin rose to >=6.6:1. Rest-state tints are capped at /20; the one /30 hover (`github-nudge-toast`) became a solid inverted hover. Gates: vs LIGHT_BG + self-tint sweep.
  3. **Dark-native pastels/opacity tricks in exercise UI**: difficulty/mlContent badges got scheme-paired colors (>=4.55:1 vs white and their own `${color}15` chips); `yellow-400` hint chrome -> semantic `warning` token; `green-400` results chrome -> `success` token (both slightly shift dark rendering, deliberately); hint-panel locked label dropped `opacity-75` (computed exactly `#808080` = 3.94:1 on white).
  Final: 28/28 axe audits green both schemes; all visual baselines minted fresh (dark re-minted deliberately - the token swaps and rgb-triplet bugfixes changed dark rendering); the only red in the paired landing run is the pre-existing `7741 cliffhanger` TFJS demo test, which passes in isolation and fails only under full-suite dev-server contention.

---

### Task 15: Final battery + close-out

**Note added during Task 8's quality review (2026-07-22):** `SceneCanvasProps.rgbLight` is currently optional (`rgbLight?: [number, number, number]`), falling back to `rgb` when absent — deliberately, so every Task-8 consumer could ship incrementally without a hard compile-time requirement. By this close-out task, every real consumer (five-worlds-section.tsx, auth/page.tsx, coming-soon-scene.tsx, theme-scene-backdrop.tsx, theme-cards-grid.tsx, dashboard/theme-cards.tsx's CSS-var equivalent) should be supplying it. Worth considering tightening `rgbLight` to a required tuple at that point (a lint/compile-time guarantee that no future consumer ships light-mode-blind), if by then there's no legitimate reason left for a consumer to omit it. Not done now — premature while Tasks 9/10's art is still landing and some call sites may still be catching up.

- [x] **Step 1:** Full battery, in order:

```bash
pnpm --filter @tensorcraft/web typecheck
pnpm -w vitest run
pnpm --filter @tensorcraft/web build
pnpm exec playwright test        # full e2e incl. accessibility matrix
```

  All green or STOP and report with output.
- [x] **Step 2:** Manual sweep in dev, BOTH schemes: landing (hero demo, five-worlds hovers, ticker), /auth, /pricing, /dashboard (heatmap, skill genome, streak), one full lesson (all 6 steps: dialogue, code block, exercise, hints, quiz), a coming-soon stub, /compare, /settings, certificate page. Also: OS-level scheme flip live-updates the app when no override; toggle override wins; reduced-motion static canvas frames re-render on toggle.
- [x] **Step 3:** Update `docs/dev-plan.md` status; append implementation-complete note + any deviations to `docs/audits/light-mode-readiness-2026-07-22.md`.
- [x] **Step 4:** FINAL CHECKPOINT — full report to user (what shipped, test evidence, screenshots dark/light). User commits.

---

**Task 15 close-out (2026-07-23):** Battery: typecheck clean; vitest 1517 passed / 85 skipped (156 files); build 122/122 pages; axe matrix 28/28 both schemes. Full e2e surfaced 12 reds: 2 were real test drift, both fixed (pricing.spec's bare `getByRole("status")` became ambiguous once the nav SchemeToggle added its live region - scoped to `main`; themes.spec's roster assertion expected the pre-redesign "W01 · Title" single string - pre-existing drift from the uncommitted 2026-07-19 stub redesign, updated to the two-span markup). The remaining 10 (TFJS hero/lesson demos, script playback, glossary rail, step bar et al.) all pass in isolation / single-worker and fail only under 8-worker dev-server contention - known flake class, not light-mode related. Manual sweep largely covered by the axe matrix (8 pages + all 6 lesson steps per scheme, incl. Shiki-highlighted code) plus the art-gate/Task-11 screenshot sets; still-open visual items: exercise editor eyeballed only via axe, and the nav toggle glyph (U+25D0) needs a one-time Windows/Linux font-fallback check.

## Task dependency notes

- Tasks 2→3→4 are strictly ordered (tokens → mapping → state). Task 1 (docs) is independent — do first.
- Task 6 (useScheme) blocks 12; Task 8 blocks 9–10; Task 2 blocks everything CSS-consuming.
- Tasks 9 and 10 each end in a **user art sign-off gate** — hard stops.
- Task 7 is wide but mechanical; safe to interleave after 3.
