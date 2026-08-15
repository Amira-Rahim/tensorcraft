# Art Expansion Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved art-expansion spine: wire the three orphaned location plates, annotate dialogue expressions, put the learner's avatar on the certificate, composite plates into OG cards, add eleven mission-patch emblems, and crown the certificate with a world seal.

**Architecture:** Every surface follows the shipped art contract — app-side resolvers mint asset paths (`location-art.ts` pattern), `packages/ui` components take srcs and render nothing on failure, budgets are enforced by `scripts/art/ingest.mjs`. New raster goes through the existing generate → stage → ingest pipeline with FLUX.2 [pro] on fal.ai.

**Tech Stack:** Next.js app router, `@tensorcraft/ui` client components, satori/`next/og` edge route, sharp at ingest, vitest, fal.ai generation scripts.

**Repo rules that override the usual plan grammar:** No commit steps — CLAUDE.md forbids committing on the user's behalf; the whole spine ships uncommitted like every session before it. Wave boundaries below are the checkpoint boundaries (spec reviewer's instruction): finish and verify a wave before starting the next.

Spec: `docs/superpowers/specs/2026-08-15-art-expansion-spine-design.md`

---

## Wave 1a — the three orphaned plates

### Task 1: `surfacePlateSrc` resolver

**Files:**
- Modify: `apps/web/lib/location-art.ts`
- Test: `apps/web/lib/location-art.test.ts`

- [ ] **Step 1: Write the failing tests** (append to the existing describe file)

```ts
describe("surfacePlateSrc", () => {
  it("resolves the three deep-orbit surfaces", () => {
    expect(surfacePlateSrc("deep-orbit", "dashboard")).toBe(
      "/locations/deep-orbit/dashboard-station.webp",
    );
    expect(surfacePlateSrc("deep-orbit", "auth")).toBe(
      "/locations/deep-orbit/lab.webp",
    );
    expect(surfacePlateSrc("deep-orbit", "purchase-success")).toBe(
      "/locations/deep-orbit/engineering.webp",
    );
  });

  it("resolves nothing for worlds without art or unknown surfaces", () => {
    expect(surfacePlateSrc("neon-protocol", "dashboard")).toBeUndefined();
    expect(
      surfacePlateSrc("deep-orbit", "landing" as PlateSurface),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run** `pnpm --filter web test location-art` — expect FAIL (no export).
- [ ] **Step 3: Implement** in `location-art.ts`:

```ts
export type PlateSurface = "dashboard" | "auth" | "purchase-success";

/** Which location stands for each app surface. Same typo defence as
 *  HERO_PLATE: unknown world or surface resolves to undefined and the
 *  surface falls back to its art-less render. */
const SURFACE_PLATE: Record<string, Partial<Record<PlateSurface, string>>> = {
  "deep-orbit": {
    dashboard: "dashboard-station",
    auth: "lab",
    "purchase-success": "engineering",
  },
};

export function surfacePlateSrc(
  worldSlug: string,
  surface: PlateSurface,
): string | undefined {
  const location = SURFACE_PLATE[worldSlug]?.[surface];
  return location ? `/locations/${worldSlug}/${location}.webp` : undefined;
}
```

- [ ] **Step 4: Run the test again** — expect PASS.

### Task 2: /auth left pane takes the lab plate

**Files:**
- Modify: `apps/web/app/auth/page.tsx`

- [ ] **Step 1:** Import `ArtPlate` (`@tensorcraft/ui/art-plate`) and `surfacePlateSrc`; compute `const AUTH_PLATE_SRC = surfacePlateSrc(HERO_SLUG, "auth");` beside the existing `HERO_RGB` constants.
- [ ] **Step 2:** In the `<aside>` pane, render the Five Worlds composite: plate as ground, canvas as reflection:

```tsx
{AUTH_PLATE_SRC && (
  <ArtPlate src={AUTH_PLATE_SRC} bleed className="absolute inset-0 z-0" />
)}
<OrbitCanvas
  rgb={HERO_RGB}
  rgbLight={AUTH_PLATE_SRC ? HERO_RGB : HERO_RGB_LIGHT}
  className={`absolute inset-0 z-0 pointer-events-none${AUTH_PLATE_SRC ? " opacity-50" : ""}`}
/>
```

Keep the copy block `z-10`. The `rgbLight` switch copies `WorldSceneBackdrop`: over dark art the light-scheme hue vanishes, so the canvas keeps its dark hue.
- [ ] **Step 3:** Add a scrim between plate and copy if the headline loses contrast against the plate (check in the browser during Wave-1 verification; the Five Worlds band precedent uses one). Implementation: `<div className="absolute inset-0 z-0" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--tc-bg) 78%, transparent), transparent 70%)" }} aria-hidden />`.
- [ ] **Step 4: Run** `pnpm --filter web test auth` — existing auth tests still pass.

### Task 3: /dashboard sidebar station feed

**Files:**
- Modify: `apps/web/app/dashboard/dashboard-view.tsx` (props + sidebar panel)
- Modify: `apps/web/app/dashboard/page.tsx` (pass `plateSrc`)
- Test: `apps/web/app/dashboard/dashboard-view.test.tsx` (create if absent; check for an existing test file first and extend it if present)

- [ ] **Step 1: Failing test** — render `DashboardView` with `plateSrc="/locations/deep-orbit/dashboard-station.webp"` plus minimal required props; assert an `img[data-testid="art-plate"]` with that src exists inside the module sidebar; render again without `plateSrc` and assert no `art-plate` testid.
- [ ] **Step 2:** Add `plateSrc?: string` to `DashboardProps`. In the `<aside>` module sidebar, above the `MODULE MAP` header row:

```tsx
{plateSrc && (
  <div
    style={{ padding: 16, borderBottom: `1px solid ${BORDER_VAR}` }}
    aria-hidden="true"
  >
    <ArtPlate src={plateSrc} />
  </div>
)}
```

Import `ArtPlate` from `@tensorcraft/ui/art-plate`.
- [ ] **Step 3:** In `dashboard/page.tsx`, pass `plateSrc={surfacePlateSrc(worldSlug, "dashboard")}` where `<DashboardView>` is instantiated (line ~401; use the same world slug variable the page already resolves).
- [ ] **Step 4: Run** dashboard tests — PASS.

### Task 4: /dashboard/purchase-success engineering plate

**Files:**
- Modify: `apps/web/app/dashboard/purchase-success/page.tsx`

- [ ] **Step 1:** Read the rest of the page (the confirmed-purchase render branch). Insert a framed, non-bleed `ArtPlate` between the confirmation hero and the next-steps cards, **only** in the confirmed state (not pending "Almost There", not failed):

```tsx
{plateSrc && (
  <div className="mb-10" aria-hidden="true">
    <ArtPlate src={plateSrc} />
  </div>
)}
```

with `const plateSrc = surfacePlateSrc(worldSlug ?? DEFAULT_WORLD, "purchase-success");` — the page already resolves the purchased world; fall back to `DEFAULT_WORLD` if it has none in scope.
- [ ] **Step 2: Run** `pnpm --filter web test purchase-success` — existing tests pass.

### Wave 1a checkpoint

- [ ] `pnpm --filter web test` green; `pnpm typecheck` green.

---

## Wave 1b — expression annotation pass

### Task 5: extend the gate

**Files:**
- Modify: `packages/content/src/expressions.test.ts`

- [ ] **Step 1:** Add to the describe block (this fails until the pass lands — the corpus has zero annotations):

```ts
it("the annotation pass is present in the corpus", () => {
  expect(deepOrbitTags.some((t) => t.expression !== undefined)).toBe(true);
});
```

- [ ] **Step 2: Run** `pnpm --filter @tensorcraft/content test expressions` — expect exactly this new assertion to FAIL.

### Task 6: annotate the corpus (subagent fan-out, one per module)

**Files:**
- Modify: `packages/content/content/deep-orbit/<module>/*.mdx` (11 modules, 176 `<Dialogue>` tags total)

Expression vocabulary (from `packages/worlds/src/deep-orbit.ts`, the only legal values per speaker):

| Speaker (name / aliases) | slug | expressions |
|---|---|---|
| Commander Mirza | commander-mirza | resolved, concerned, approving |
| Dr. Farah | dr-farah | delighted, absorbed, shaken |
| Chief Nazari | chief-nazari | skeptical, grudging-respect, haunted |
| Ensign Demir | ensign-demir | overwhelmed, breakthrough, focused |
| ARIA | aria | emphasis, deadpan, alarm |

- [ ] **Step 1:** Dispatch one subagent per module (11 total, parallel) with these exact editorial rules:
  - Add `expression="<id>"` to a `<Dialogue>` opening tag ONLY when the line's written emotion clearly matches one of that speaker's canonical expressions. The `direction="..."` attribute, when present, is the primary signal and the chosen expression must agree with it.
  - Attribute-only edits. Do not touch prose, direction text, speaker names, spacing, or anything else. Do not add `expression="neutral"`.
  - Sparse beats saturated: ceiling of roughly one annotated tag in three per lesson; zero annotations in a lesson is a valid outcome. When torn between two expressions or between annotating and not, do not annotate.
  - Only speakers in the table above can carry the attribute (the gate rejects everyone else).
- [ ] **Step 2:** Run the gate: `pnpm --filter @tensorcraft/content test expressions` — PASS (valid ids, at least one annotation).
- [ ] **Step 3:** Spot-review one annotated lesson per act (early/mid/late module) myself for editorial fit; strip any annotation that fights its stage direction.
- [ ] **Step 4:** Run the full content battery: `pnpm --filter @tensorcraft/content test` — PASS (slop-lexicon and structure gates see no prose change).

---

## Wave 1c — certificate avatar

### Task 7: render the learner's avatar

**Files:**
- Modify: `apps/web/app/certificates/[id]/page.tsx`
- Test: `apps/web/app/certificates/[id]/page.test.tsx` (create; mock `fetch` the way the API tests do — check `apps/web/app/**/page.test.tsx` files for the established async-RSC test pattern before writing)

- [ ] **Step 1: Failing test** — mock a certificate payload with `user_avatar_url`; render the page; assert the avatar `img` with that src renders beside the learner name. Second case: `user_avatar_url: null` renders the monogram tile (CharacterAvatar's initials fallback), not a broken img.
- [ ] **Step 2:** In the card, replace the name block:

```tsx
<p className="text-sm text-text-muted mb-1">Awarded to</p>
<div className="flex items-center gap-3 mb-8">
  <CharacterAvatar
    name={learner}
    src={cert.user_avatar_url ?? undefined}
    size={44}
  />
  <p className="text-2xl font-mono font-semibold">{learner}</p>
</div>
```

Import from `@tensorcraft/ui/character-avatar`. CharacterAvatar owns the failure path: a dead URL settles to the initials monogram.
- [ ] **Step 3: Run** the new test — PASS.

---

## Wave 1d — plates on the OG cards

### Task 8: `og` ingest mode

**Files:**
- Modify: `scripts/art/ingest.mjs`

- [ ] **Step 1:** Add an `og` mode. It reads **shipped** assets (shipped = approved), not `art-src`:

```js
const OG_PLATE = { width: 1200, height: 630, quality: 70, budget: 150 * 1024 };
const OG_SEAL = { size: 256, budget: 60 * 1024 };

/** OG derivatives from shipped assets: plates as centre cover-cropped JPEG
 *  (satori decodes JPEG dependably; WebP it does not), the seal as PNG. */
async function og() {
  const locDir = path.join(ROOT, "apps/web/public/locations", WORLD);
  for (const location of LOCATIONS) {
    const src = path.join(locDir, `${location}.webp`);
    if (!fs.existsSync(src)) {
      results.missing.push(`${location}.webp (shipped plate)`);
      continue;
    }
    const buf = await sharp(src)
      .resize(OG_PLATE.width, OG_PLATE.height, { fit: "cover" })
      .jpeg({ quality: OG_PLATE.quality })
      .toBuffer();
    const destRel = `apps/web/public/og/${WORLD}/${location}.jpg`;
    if (buf.length > OG_PLATE.budget) {
      results.overBudget.push(`${destRel} is ${(buf.length / 1024).toFixed(1)} KB, cap 150 KB`);
      continue;
    }
    if (!DRY) {
      fs.mkdirSync(path.dirname(path.join(ROOT, destRel)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, destRel), buf);
    }
    results.shipped.push(`${destRel}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
  const seal = path.join(ROOT, "apps/web/public/seals", `${WORLD}.webp`);
  if (!fs.existsSync(seal)) {
    results.missing.push(`${WORLD}.webp (shipped seal)`);
  } else {
    const buf = await sharp(seal)
      .resize(OG_SEAL.size, OG_SEAL.size, { fit: "cover" })
      .png()
      .toBuffer();
    const destRel = `apps/web/public/og/${WORLD}/seal.png`;
    if (buf.length > OG_SEAL.budget) {
      results.overBudget.push(`${destRel} over 60 KB cap`);
    } else {
      if (!DRY) fs.writeFileSync(path.join(ROOT, destRel), buf);
      results.shipped.push(`${destRel}  ${(buf.length / 1024).toFixed(1)} KB`);
    }
  }
}
```

Register the mode and extend the usage string.
- [ ] **Step 2: Run** `node scripts/art/ingest.mjs og --dry-run` — expect 4 plate lines shipped, seal reported missing (Wave 3 ships it).
- [ ] **Step 3: Run for real:** `node scripts/art/ingest.mjs og` — 4 JPEGs land in `apps/web/public/og/deep-orbit/`.

### Task 9: OG route composites the plate

**Files:**
- Create: `apps/web/app/api/og/og-assets.ts`
- Test: `apps/web/app/api/og/og-assets.test.ts`
- Modify: `apps/web/app/api/og/route.tsx`

- [ ] **Step 1: Failing test** for the pure resolver:

```ts
import { describe, it, expect } from "vitest";
import { ogPlatePath, ogSealPath } from "./og-assets";

describe("og asset resolution", () => {
  it("resolves the deep-orbit hero plate JPEG", () => {
    expect(ogPlatePath("deep-orbit")).toBe("/og/deep-orbit/bridge.jpg");
  });
  it("resolves nothing for worlds without art", () => {
    expect(ogPlatePath("terra-grid")).toBeUndefined();
  });
  it("resolves the seal PNG only for worlds with art", () => {
    expect(ogSealPath("deep-orbit")).toBe("/og/deep-orbit/seal.png");
    expect(ogSealPath("nova-canvas")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implement `og-assets.ts`** (pure, edge-safe, no fs):

```ts
/** OG derivatives of the hero plates (ingest.mjs og mode). JPEG/PNG, not
 *  WebP: satori's raster decoding is the constraint. Mirrors HERO_PLATE in
 *  lib/location-art.ts — same one-world map, same typo defence. */
const OG_PLATE: Record<string, string> = { "deep-orbit": "bridge" };

export function ogPlatePath(worldSlug: string): string | undefined {
  const location = OG_PLATE[worldSlug];
  return location ? `/og/${worldSlug}/${location}.jpg` : undefined;
}

export function ogSealPath(worldSlug: string): string | undefined {
  return OG_PLATE[worldSlug] ? `/og/${worldSlug}/seal.png` : undefined;
}
```

- [ ] **Step 3:** In `route.tsx` (`kind=default` branch only): resolve, fetch, tolerate failure —

```tsx
let plate: ArrayBuffer | undefined;
const platePath = ogPlatePath(world);
if (platePath) {
  try {
    const res = await fetch(new URL(platePath, req.nextUrl.origin));
    if (res.ok) plate = await res.arrayBuffer();
  } catch {
    /* text-only card is the floor */
  }
}
```

Then in the JSX, under the root div (satori supports absolute stacking; later siblings paint on top):

```tsx
{plate && (
  // @ts-expect-error satori accepts ArrayBuffer img src
  <img src={plate} tw="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
)}
{plate && (
  <div
    tw="absolute inset-0"
    style={{ background: "linear-gradient(180deg, rgba(14,14,14,0.30) 0%, rgba(14,14,14,0.84) 75%)" }}
  />
)}
```

Existing branding/title/accent-strip content renders above unchanged. `digest` kind untouched.
- [ ] **Step 4: Run** unit tests — PASS. Manual check: `pnpm --filter web dev`, then `curl -s -o /tmp/og.png -w "%{http_code}" "http://localhost:3000/api/og?title=Test&world=deep-orbit"` → 200; open `/tmp/og.png` and confirm plate + legible title; repeat with `world=terra-grid` → text-only card still renders.

### Wave 1 checkpoint

- [ ] Full web + content suites green, typecheck green.

---

## Wave 2 — mission patches

### Task 10: patch bible + generation driver

**Files:**
- Create: `docs/patch-bible.md` (the contract: style token + 12 prompts, mirroring the masters.mjs pattern where the script carries the text and the bible is canon)
- Create: `scripts/art/patches.mjs`
- Modify: `scripts/art/generate.mjs` (PHASES += `"patches"`, `"seals"`)

Shared patch style token (append to every patch prompt):

```
embroidered space-mission patch on a near-black field, circular warm brass
#A89060 border ring, flat cel-shaded fill with bold clean linework, green
#6BAA8A glow accents, single central emblem, stitched texture suggestion,
cohesive series look, not photorealistic, absolutely no text, lettering,
numerals, letters or logos anywhere.
```

Emblem prompts, one per module (subject drawn from the module's title):

| module | emblem |
|---|---|
| foundations | a luminous wireframe cube of stacked data planes held in a gloved hand |
| neural-networks | layered lattice of nodes converging to a single bright output star |
| training-loop | a descending orbital spiral tightening toward a glowing minimum point |
| browser-runtimes | a browser window frame with a small starship engine glowing inside it |
| signal-processing | a clean sine wave passing through a prism and emerging as sharp pulses |
| recurrent-networks | an ouroboros loop of signal arrows around a small memory core |
| anomaly-detection | one red-tinged spike breaking a calm green telemetry line, crosshair ring |
| advanced-time-series | three forecast trajectories fanning out from a comet's path |
| llm-integration | a speech-bubble constellation linked by circuit traces to a ship antenna |
| optimization-edge | a compact satellite shedding excess panels, streamlined for descent |
| capstone | the DEEP SCAN dish antenna fully deployed over a cleared orbital field |

`patches.mjs` follows `masters.mjs` exactly: a `PATCHES` map, `--count` flag, shells out to `generate.mjs --provider fal --phase patches --size 1024x1024`. The seal rides along as a twelfth entry invoked as `node scripts/art/patches.mjs seal`:

```
seal: world-completion crest for the same series, a brass laurel of three
concentric orbital rings around a small keystone star, heavier and more
formal than a mission patch, radial symmetry
```

(phase `seals`, id `deep-orbit`).

- [ ] **Step 1:** Write both files; add the two phases to `generate.mjs` PHASES.
- [ ] **Step 2: Verify plumbing without spend:** `node scripts/art/patches.mjs nonexistent` → "unknown patch" error, exit 1.

### Task 11: ingest `patches` + `seals` modes

**Files:**
- Modify: `scripts/art/ingest.mjs`

- [ ] **Step 1:** Change `emit()`'s branch from `spec === PORTRAIT` to `"size" in spec` (square specs resize `size×size`; wide specs use width/height). Update the comment that documents the old hazard.
- [ ] **Step 2:** Add specs and modes:

```js
const PATCH = { size: 512, quality: 82, budget: 40 * 1024 };

async function patches() {
  const moduleDirs = fs
    .readdirSync(path.join(ROOT, "packages/content/content", WORLD), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const mod of moduleDirs) {
    const src = newest("art-src/patches", mod);
    if (!src) {
      results.missing.push(`${mod} (patch)`);
      continue;
    }
    await emit(src, `apps/web/public/patches/${WORLD}/${mod}.webp`, PATCH);
  }
}

async function seals() {
  const src = newest("art-src/seals", WORLD);
  if (!src) {
    results.missing.push(`${WORLD} (seal)`);
    return;
  }
  await emit(src, `apps/web/public/seals/${WORLD}.webp`, PATCH);
}
```

- [ ] **Step 3: Run** `node scripts/art/ingest.mjs patches --dry-run` — 11 modules reported missing (nothing staged yet), exit 0.

### Task 12: `patch-art.ts` resolver + `ModulePatch` component

**Files:**
- Create: `apps/web/lib/patch-art.ts`
- Test: `apps/web/lib/patch-art.test.ts`
- Create: `packages/ui/src/module-patch.tsx`
- Test: `packages/ui/src/module-patch.test.tsx`
- Modify: `packages/ui/package.json` (exports += `"./module-patch": "./src/module-patch.tsx"`)

- [ ] **Step 1: Failing resolver tests:**

```ts
import { describe, it, expect } from "vitest";
import { patchSrc, sealSrc } from "./patch-art";

describe("patch art resolution", () => {
  it("mints patch URLs only for worlds with patch art", () => {
    expect(patchSrc("deep-orbit", "foundations")).toBe(
      "/patches/deep-orbit/foundations.webp",
    );
    expect(patchSrc("neon-protocol", "foundations")).toBeUndefined();
  });
  it("mints the seal URL only for worlds with patch art", () => {
    expect(sealSrc("deep-orbit")).toBe("/seals/deep-orbit.webp");
    expect(sealSrc("terra-grid")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implement** (`PATCH_WORLDS = new Set(["deep-orbit"])`, same shape as the other resolvers; module slugs come from callers that already hold validated module lists, so the resolver only guards the world).
- [ ] **Step 3: Failing component tests:** renders an img with the given src/size; on error settles to the `fallback` node (pass a `<span>✓</span>`, fire `error` on the img, assert the span replaced it); with no fallback, settles to null; `alt=""` + `aria-hidden` when no `alt` given.
- [ ] **Step 4: Implement `ModulePatch`** — same skeleton as `ArtPlate` (`useImgSettled`, render-nothing contract) plus:

```tsx
export interface ModulePatchProps {
  src: string;
  size?: number;           // rendered box, default 28
  alt?: string;            // absent = decorative
  fallback?: ReactNode;    // rendered instead of null when the img fails
  className?: string;
}
```

`select-none`, `loading="lazy"`, `decoding="async"`, square `width`/`height` from `size`. No brass frame — patches are emblems, not monitors.
- [ ] **Step 5: Run** both new test files — PASS. `pnpm --filter @tensorcraft/ui test` green.

### Task 13: patch surfaces (dashboard, world page, capstone)

**Files:**
- Modify: `apps/web/app/dashboard/dashboard-view.tsx` (+ its test)
- Modify: `apps/web/app/dashboard/page.tsx`
- Modify: `apps/web/app/worlds/[slug]/page.tsx`
- Modify: `apps/web/app/worlds/[slug]/capstone/capstone-client.tsx`

- [ ] **Step 1: Failing dashboard test:** a module with `status: "done"` and `patchSrc` renders the patch (with the ✓ box as its `fallback`); `status: "active"` with a `patchSrc` still renders the `>` box (patches are earned, never previewed).
- [ ] **Step 2:** `DashboardModule` gains `patchSrc?: string`. In the sidebar row, the 28px status box becomes:

```tsx
{m.status === "done" && m.patchSrc ? (
  <ModulePatch src={m.patchSrc} size={28} fallback={statusBox} />
) : (
  statusBox
)}
```

where `statusBox` is the existing bordered glyph div extracted to a local variable. `dashboard/page.tsx` sets `patchSrc: patchSrc(worldSlug, m.slug)` when it builds the modules array.
- [ ] **Step 3:** World page module map: same treatment on rows whose status enum is `"completed"` (this page's vocabulary differs from the dashboard's `"done"` — spec reviewer flag). Find the module-row status marker in `worlds/[slug]/page.tsx` and apply the identical earned-only rule.
- [ ] **Step 4:** Capstone `CertificateCard`: a patch strip — all 11 modules at size 32, `flex flex-wrap gap-2`, above the stats block; each patch decorative, the card copy already says what was completed. Pass the srcs from the server side via existing props plumbing.
- [ ] **Step 5: Run** the web suite — PASS.

### Task 14: all-or-none content gate

**Files:**
- Create: `packages/content/__tests__/patch-art-coverage.test.ts`

- [ ] **Step 1:**

```ts
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const CONTENT = path.resolve(__dirname, "../content");
const PATCHES = path.resolve(__dirname, "../../../apps/web/public/patches");

/** A partial patch set must not ship silently: if a world has any patch
 *  art, every module of that world has a patch. */
describe("patch art coverage", () => {
  for (const world of fs.readdirSync(CONTENT)) {
    const patchDir = path.join(PATCHES, world);
    if (!fs.existsSync(patchDir)) continue;
    it(`${world}: all-or-none`, () => {
      const modules = fs
        .readdirSync(path.join(CONTENT, world), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
      const patches = fs
        .readdirSync(patchDir)
        .filter((n) => n.endsWith(".webp"))
        .map((n) => n.replace(/\.webp$/, ""))
        .sort();
      expect(patches).toEqual(modules);
    });
  }
});
```

- [ ] **Step 2: Run it** — passes vacuously today (no patch dir yet); after Task 15's ingest it enforces the full set.

### Task 15: generate, pick, ingest the patch art

- [ ] **Step 1:** `node scripts/art/patches.mjs --count 3` (33 generations, ~$1). Transient 422s retry; a content-filter 422 means reword that emblem line and rerun that module only.
- [ ] **Step 2:** Review candidates in `art-src/patches/` against the bible: series coherence (same ring weight, same palette), emblem readable at 28px, zero lettering. Rename the winner so name-sort picks it (the `newest()` contract), delete losers.
- [ ] **Step 3:** Copy winners to `docs/art-refs/deep-orbit/patches/` as regeneration anchors (committed pattern — FLUX seeds are not captured).
- [ ] **Step 4:** `node scripts/art/ingest.mjs patches` — 11 shipped, all ≤ 40 KB.
- [ ] **Step 5:** `pnpm --filter @tensorcraft/content test patch-art-coverage` — PASS (now enforcing).
- [ ] **Step 6:** Look at the dashboard and world page in the browser: patches render on done modules, ✓ boxes elsewhere.

### Wave 2 checkpoint

- [ ] Web + ui + content suites green; backlog gains the deferred award-animation item.

---

## Wave 3 — certificate package

### Task 16: generate and ship the seal

- [ ] **Step 1:** `node scripts/art/patches.mjs seal --count 3`; pick the winner (formal, radially symmetric, reads at 72px), anchor it in `docs/art-refs/deep-orbit/patches/`, `node scripts/art/ingest.mjs seals`.
- [ ] **Step 2:** `node scripts/art/ingest.mjs og` — now also emits `og/deep-orbit/seal.png`.

### Task 17: certificate page (seal + patch strip) and world-complete banner

**Files:**
- Modify: `apps/web/app/certificates/[id]/page.tsx` (+ its test)
- Modify: `apps/web/app/worlds/[slug]/page.tsx`

- [ ] **Step 1: Failing tests:** cert page with a deep-orbit cert renders the seal img and an 11-patch strip; a cert for a world without art renders the text-only card (no seal, no strip, no empty space).
- [ ] **Step 2:** Cert page: seal (72px, top-right of the card header, decorative) via `sealSrc(cert.world_id)`; patch strip above the footer paragraph via `getModules(cert.world_id)` (already available server-side in `@tensorcraft/content`) mapped through `patchSrc`. Both wrapped in the null-safe resolver checks. A certificate exists only when every module is complete, so the full strip is truthful by construction.
- [ ] **Step 3:** World page: when the world-complete/capstone banner renders, add the seal beside the banner heading (32px, decorative), resolver-guarded.
- [ ] **Step 4: Run** the tests — PASS.

### Task 18: `cert` OG kind

**Files:**
- Modify: `apps/web/app/api/og/route.tsx`
- Modify: `apps/web/app/certificates/[id]/page.tsx` (metadata images URL)

- [ ] **Step 1:** Add `"cert"` to `VALID_KINDS`. Params: `world`, `learner` (clamped at 100 chars, defaults to "A Tensorcraft learner"), `title` (the world name line). Layout: plate background + scrim as in Task 9, seal PNG (fetched same-origin, same try/catch) at 120px centred above the title, learner name under the title, accent strip at the bottom. Every asset optional; the all-text card is the floor. The URL is public by design — it carries what the public share page already shows.
- [ ] **Step 2:** Cert page metadata: `images: [\`/api/og?kind=cert&world=...&title=...&learner=...\`]`.
- [ ] **Step 3:** Manual: curl the cert OG URL in dev, confirm seal + name + plate; confirm `kind=cert` with a no-art world still renders.

### Wave 3 checkpoint / finish line

- [ ] Battery: `pnpm --filter @tensorcraft/content test`, `pnpm --filter @tensorcraft/ui test`, `pnpm --filter web test`, `pnpm typecheck`.
- [ ] Visual baselines: `RUN_VISUAL=1 pnpm --filter web e2e -- key-pages` (or the repo's actual invocation — check `e2e/visual/key-pages.spec.ts` header) — expect `auth-sign-in` (dark+light) to drift; verify each re-minted baseline **by eye** against the intended design before accepting (2026-08-15 lesson: a regenerated baseline can certify a broken page).
- [ ] Dual-scheme axe suite on touched pages.
- [ ] E2e no-art fixtures: if the repo's existing aborted-route fixtures (2026-08-05 pattern) cover shared components, confirm they exercise the new surfaces; add an aborted-route case for one new plate surface and one patch surface if not.
- [ ] Docs: backlog `[x]` entries for the spine + deferred award-animation item; `docs/scene-bible.md` cross-reference to `docs/patch-bible.md`; character-bible untouched.
- [ ] Memory file update (session record).
