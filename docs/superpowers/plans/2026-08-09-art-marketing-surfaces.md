# Deep Orbit Art on Marketing Surfaces — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **PROJECT RULE, OVERRIDES THE SKILL DEFAULT: never run `git add`, `git commit`, or `git push`.** `CLAUDE.md` forbids committing on the user's behalf. Every task below ends in a **Checkpoint** step (run the suite, leave the tree dirty) where the skill would normally say "Commit." The user commits.

**Goal:** Put the Deep Orbit art on the marketing surfaces — location plates on the landing page and theme pages, a cast row on the Deep Orbit theme page, and a module filmstrip on pricing — without disturbing the landing hero or regressing light mode.

**Architecture:** One new leaf component, `ArtPlate`, owns the whole "dark raster on a light-capable page" problem: it renders a framed image, and it renders nothing when the image is absent or fails. Everything else composes it. Existing components are extended with optional props rather than replaced, because four of the five themes have no art and must render exactly as they do today.

**Tech Stack:** Next.js App Router, React 19, Tailwind, vitest + @testing-library/react (unit), Playwright + @axe-core/playwright (e2e), `sharp` via `scripts/art/ingest.mjs` (asset pipeline).

**Spec:** `docs/superpowers/specs/2026-08-09-art-marketing-surfaces-design.md`

**Phases ship independently.** Phase 1 is the spine and is worth shipping alone. Phase 2 depends on nothing in Phase 1. Phase 3 depends on Phase 1's CSS and on an editorial decision that has not been made yet. Stopping after any phase leaves the product in a coherent state.

---

## File structure

| File | Responsibility | Phase |
|---|---|---|
| `scripts/art/ingest.mjs` | *Modify.* Add a `masters` mode. | 1 |
| `packages/ui/src/art-plate.tsx` | *Create.* A dark raster plate that vanishes when its image is absent. The only new component. | 1 |
| `packages/ui/src/art-plate.test.tsx` | *Create.* | 1 |
| `packages/ui/src/index.ts` | *Modify.* Export `ArtPlate`. | 1 |
| `apps/web/app/globals.css` | *Modify.* `.tc-art-plate` frame, beside the existing `.tc-scene-portrait` rule. | 1 |
| `packages/themes/src/css/themes.css` | *Modify.* Add the `--tc-brass` decorative token. | 1 |
| `apps/web/lib/location-art.ts` | *Create.* Theme slug to plate URL. Mirrors `character-art.ts`: the path convention lives app-side, `packages/ui` stays manifest-blind. | 1 |
| `apps/web/lib/location-art.test.ts` | *Create.* | 1 |
| `apps/web/app/themes/[slug]/theme-scene-backdrop.tsx` | *Modify.* Optional `plateSrc` under the existing canvas. | 1 |
| `apps/web/app/themes/[slug]/theme-scene-backdrop.test.tsx` | *Create.* | 1 |
| `apps/web/app/themes/[slug]/page.tsx:315-319` | *Modify.* Pass `plateSrc`. | 1 |
| `apps/web/app/components/five-worlds-section.tsx:70-90` | *Modify.* Plate at `z-0`, canvas to `z-1`. | 1 |
| `e2e/art.spec.ts` | *Create.* No-art fixtures for every new surface. | 1 |
| `apps/web/app/themes/[slug]/theme-cast.tsx` | *Create.* Cast row: four `AnimatedAvatar`, one `AriaWaveformAvatar`. | 2 |
| `apps/web/app/themes/[slug]/theme-cast.test.tsx` | *Create.* | 2 |
| `docs/scene-bible.md` | *Modify.* Name one representative lesson scene per module. | 3 |
| `apps/web/app/pricing/module-filmstrip.tsx` | *Create.* | 3 |

---

## Pre-flight (do this before Task 1.1)

- [ ] **Step 1: Look at the four master candidates**

`newest()` in `scripts/art/ingest.mjs` picks by name sort, which resolves to the latest timestamp, not the approved plate. `bridge` has three candidates, `lab` and `engineering` have two each, `dashboard-station` has one.

Run: `ls art-src/masters`

Open each location's **last-sorting** file and compare it against that location's canon in `docs/scene-bible.md` ("Location canon: master plates"). The `bridge` winner (`bridge-fal-2026-08-09T17-48-56-1.png`) is already confirmed to match its centered, symmetric camera canon. The other three are unverified.

- [ ] **Step 2: If a name-sort winner is the wrong plate, rename the approved file**

Give the approved candidate a later timestamp in its filename. Do **not** teach `newest()` a second selection rule; it is shared with the portraits and scenes modes, which have no approval gate and must keep "latest wins."

---

## Phase 1: location plates

### Task 1.1: `masters` ingest mode

**Files:**
- Modify: `scripts/art/ingest.mjs`

There is no test harness for the art scripts, so `--dry-run` is the red/green mechanism.

- [ ] **Step 1: Run the mode before it exists, to see it fail**

Run: `node scripts/art/ingest.mjs masters --dry-run`
Expected: exits 1 with `usage: ingest.mjs portraits|scenes [--dry-run]`

- [ ] **Step 2: Add the location list and size spec**

In `scripts/art/ingest.mjs`, below the existing `SCENE` constant:

```js
const LOCATIONS = ["bridge", "lab", "engineering", "dashboard-station"];

// Same frame as a scene: the masters ARE the reference plates the scenes
// were generated against (docs/scene-bible.md), so they share dimensions
// and budget. `emit()` selects its resize branch by `spec === PORTRAIT`
// reference equality, so this object falls through to the width/height
// branch with no change to emit().
const MASTER = { width: 1536, height: 1024, quality: 72, budget: 200 * 1024 };
```

- [ ] **Step 3: Add the `masters()` function**

Below `scenes()`:

```js
/** Location master plates, reused as marketing / theme-page art. Unlike
    portraits and scenes these went through a human approval gate, so the
    caller is responsible for making the newest staged file BE the approved
    one (see the pre-flight in the plan). */
async function masters() {
  for (const location of LOCATIONS) {
    const src = newest("art-src/masters", location);
    if (!src) {
      results.missing.push(`${location} (master plate)`);
      continue;
    }
    await emit(
      src,
      `apps/web/public/locations/${THEME}/${location}.webp`,
      MASTER,
    );
  }
}
```

- [ ] **Step 4: Wire the mode into the dispatcher and the usage string**

Replace the dispatch block at the bottom of the file:

```js
if (mode === "portraits") await portraits();
else if (mode === "scenes") await scenes();
else if (mode === "masters") await masters();
else {
  console.error("usage: ingest.mjs portraits|scenes|masters [--dry-run]");
  process.exit(1);
}
```

Add the mode to the usage block in the file's header docblock too.

- [ ] **Step 5: Dry-run, then ship for real**

Run: `node scripts/art/ingest.mjs masters --dry-run`
Expected: `[dry run] shipped 4:` followed by four lines, each under 200 KB, and no `OVER BUDGET` section.

Then run: `node scripts/art/ingest.mjs masters`
Expected: the same four lines.

Verify: `ls apps/web/public/locations/deep-orbit/`
Expected: `bridge.webp  dashboard-station.webp  engineering.webp  lab.webp`

- [ ] **Step 6: Checkpoint**

Open each of the four `.webp` files and confirm they are the plates you approved in the pre-flight. Do not commit.

---

### Task 1.2: the `--tc-brass` token

**Files:**
- Modify: `packages/themes/src/css/themes.css`

`#A89060` is the metal trim in every piece of Deep Orbit art. The plate frame needs it, and a raw hex in `globals.css` would sit outside the palette system.

- [ ] **Step 1: Add the token to the Deep Orbit blocks**

`themes.css` has no `:root` block; it is organized per theme, `[data-theme="<slug>"]` and `[data-theme="<slug>"][data-scheme="light"]`. Brass is Deep Orbit's art metal specifically, so the token belongs in that theme's blocks and nowhere else. Theme 2 will bring its own.

Add to `[data-theme="deep-orbit"]` (line 13) and to `[data-theme="deep-orbit"][data-scheme="light"]` (line 294), **same value in both**: the art does not change between schemes, so neither does its frame.

```css
  /* Brass trim, matching the metal in the Deep Orbit art (#A89060). A
     decorative frame colour ONLY: never a text or icon colour, so it sits
     outside the WCAG contrast gate that governs the text tokens. Identical
     in both schemes because the raster art it frames is identical in both. */
  --tc-brass: #a89060;
```

- [ ] **Step 2: Verify the palette gate still passes**

Run: `pnpm test -- packages/themes`
Expected: PASS, including `wcag.ts`'s checks. The new token is not a text token, so no contrast pair changes.

- [ ] **Step 3: Checkpoint**

---

### Task 1.3: the `ArtPlate` component

**Files:**
- Create: `packages/ui/src/art-plate.tsx`
- Create: `packages/ui/src/art-plate.test.tsx`
- Modify: `packages/ui/src/index.ts`

This is the whole "dark raster on a light-capable page" contract in one leaf. Model it on `scene-portrait.tsx`, which solves the same problem for lessons.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/art-plate.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArtPlate } from "./art-plate";

const SRC = "/locations/deep-orbit/bridge.webp";

describe("ArtPlate", () => {
  it("renders a lazy, decorative plate by default", () => {
    render(<ArtPlate src={SRC} />);
    const img = screen.getByTestId("art-plate");
    expect(img).toHaveAttribute("src", SRC);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("becomes a described image when alt text is authored", () => {
    render(<ArtPlate src={SRC} alt="The bridge of the Archimedes" />);
    const img = screen.getByTestId("art-plate");
    expect(img).toHaveAttribute("alt", "The bridge of the Archimedes");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("renders nothing at all when the image 404s (art-agnostic contract)", () => {
    const { container } = render(<ArtPlate src={SRC} />);
    fireEvent.error(screen.getByTestId("art-plate"));
    expect(container.firstChild).toBeNull();
  });

  it("drops its frame when bleeding to the edge of a section", () => {
    render(<ArtPlate src={SRC} bleed />);
    expect(screen.getByTestId("art-plate").className).toContain(
      "tc-art-plate-bleed",
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- packages/ui/src/art-plate.test.tsx`
Expected: FAIL, cannot resolve `./art-plate`.

- [ ] **Step 3: Write the component**

Create `packages/ui/src/art-plate.tsx`:

```tsx
"use client";
import { useCallback, useRef, useState } from "react";
import { useImgSettled } from "./use-img-settled";

/* ── ArtPlate: a raster art plate on a marketing surface ──────────────
   The Deep Orbit art is dark in both colour schemes: a .webp cannot
   re-render per scheme the way the procedural canvases do. So a plate is
   never presented as a page background (which would read as a hole in a
   light page) but as a ship monitor: hard border, brass inner rule, house
   offset shadow in light. See `.tc-art-plate` in the host app's CSS.

   Art is optional by contract, exactly like ScenePortrait: on error this
   renders NOTHING, so a surface with no art is byte-identical to the
   layout it had before the art existed. Components may ship before
   assets. */

export interface ArtPlateProps {
  src: string;
  /** Meaningful description. Absent means decorative: plates usually sit
   *  behind a heading that already names the place. */
  alt?: string;
  /** Full-bleed section ground: drops the frame, since the section's own
   *  borders are already doing that job. */
  bleed?: boolean;
  className?: string;
}

export function ArtPlate({ src, alt, bleed = false, className }: ArtPlateProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // An SSR'd plate can 404 before hydration attaches onError; recover the
  // lost verdict from the DOM (see use-img-settled.ts).
  const settle = useCallback(
    (ok: boolean) => {
      if (!ok) setFailed(src);
    },
    [src],
  );
  useImgSettled(imgRef, src, settle);
  if (failed === src) return null;

  return (
    <img
      ref={imgRef}
      data-testid="art-plate"
      src={src}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : "true"}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
      className={[
        "tc-art-plate",
        bleed ? "tc-art-plate-bleed" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- packages/ui/src/art-plate.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Export it**

In `packages/ui/src/index.ts`, next to the `ScenePortrait` export:

```ts
export { ArtPlate } from "./art-plate";
export type { ArtPlateProps } from "./art-plate";
```

- [ ] **Step 6: Checkpoint**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

---

### Task 1.4: the plate frame CSS

**Files:**
- Modify: `apps/web/app/globals.css` (beside the `.tc-scene-portrait` rule at line 417)

- [ ] **Step 1: Add the rules**

```css
/* Raster art plates on marketing surfaces (see packages/ui/src/art-plate.tsx).
   The art is dark in both schemes, so it is framed as a lit monitor rather
   than bled as a page background. Same grammar as .tc-scene-portrait in
   lessons: hard edge, no radius, house offset shadow in light only. */
.tc-art-plate {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  border: 2px solid var(--tc-border);
  border-radius: 0;
  outline: 1px solid
    color-mix(in srgb, var(--tc-brass, var(--tc-border)) 45%, transparent);
  outline-offset: -3px;
}

[data-scheme="light"] .tc-art-plate {
  box-shadow: 4px 4px 0 var(--tc-border);
}

/* Full-bleed ground: the section's own borders frame it. */
.tc-art-plate-bleed {
  border: 0;
  outline: 0;
}

[data-scheme="light"] .tc-art-plate-bleed {
  box-shadow: none;
}
```

`outline` rather than an inset `box-shadow` for the brass rule, so the light-scheme offset shadow can be declared independently instead of having to restate the inner ring.

- [ ] **Step 2: Checkpoint**

Nothing consumes these classes yet. Run `pnpm lint` and move on.

---

### Task 1.5: `location-art.ts`

**Files:**
- Create: `apps/web/lib/location-art.ts`
- Create: `apps/web/lib/location-art.test.ts`

Lives app-side for the same reason `character-art.ts` does: `packages/ui` is deliberately manifest-blind, so the asset-path convention stays in one place in the app.

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/location-art.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { heroPlateSrc } from "./location-art";

describe("heroPlateSrc", () => {
  it("resolves Deep Orbit to its Bridge plate", () => {
    expect(heroPlateSrc("deep-orbit")).toBe("/locations/deep-orbit/bridge.webp");
  });

  it("returns undefined for a theme with no art, so consumers degrade", () => {
    expect(heroPlateSrc("neon-protocol")).toBeUndefined();
  });

  it("returns undefined for an unknown slug rather than minting a 404 URL", () => {
    expect(heroPlateSrc("not-a-theme")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- apps/web/lib/location-art.test.ts`
Expected: FAIL, cannot resolve `./location-art`.

- [ ] **Step 3: Write the module**

Create `apps/web/lib/location-art.ts`:

```ts
/* Location plate resolution for marketing surfaces. Lives app-side because
   packages/ui is manifest-blind, exactly like character-art.ts: components
   take srcs, the asset-path convention (docs/scene-bible.md) stays here.

   Ingested by `node scripts/art/ingest.mjs masters` to
   /locations/<theme>/<location>.webp. */

/** The location that stands for each theme on a marketing surface. Only
    Deep Orbit has art; the other four resolve to undefined and every
    consumer falls back to its canvas-only render. An unknown slug resolves
    to undefined too, so a typo can never mint a guaranteed-404 URL. */
const HERO_PLATE: Record<string, string> = {
  "deep-orbit": "bridge",
};

export function heroPlateSrc(themeSlug: string): string | undefined {
  const location = HERO_PLATE[themeSlug];
  return location ? `/locations/${themeSlug}/${location}.webp` : undefined;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- apps/web/lib/location-art.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Checkpoint**

---

### Task 1.6: `ThemeSceneBackdrop` accepts a plate

**Files:**
- Modify: `apps/web/app/themes/[slug]/theme-scene-backdrop.tsx`
- Create: `apps/web/app/themes/[slug]/theme-scene-backdrop.test.tsx`

Extend, do not replace. This component serves all five themes and four of them have no art.

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/themes/[slug]/theme-scene-backdrop.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeSceneBackdrop } from "./theme-scene-backdrop";

// SceneCanvas needs a real 2D context; the backdrop's contract here is
// layer composition, not drawing.
vi.mock("@tensorcraft/ui/effects", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  SceneCanvas: () => <div data-testid="scene-canvas" />,
}));

const PRIMARY = "#6BAA8A";

describe("ThemeSceneBackdrop", () => {
  it("renders canvas only when the theme has no plate", () => {
    render(<ThemeSceneBackdrop slug="neon-protocol" primary={PRIMARY} />);
    expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("art-plate")).toBeNull();
  });

  it("layers the plate beneath the canvas when one is supplied", () => {
    render(
      <ThemeSceneBackdrop
        slug="deep-orbit"
        primary={PRIMARY}
        plateSrc="/locations/deep-orbit/bridge.webp"
      />,
    );
    expect(screen.getByTestId("art-plate")).toHaveAttribute(
      "src",
      "/locations/deep-orbit/bridge.webp",
    );
    expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
  });

  it("still renders the plate for a theme with no draw function", () => {
    render(
      <ThemeSceneBackdrop
        slug="not-a-theme"
        primary={PRIMARY}
        plateSrc="/locations/deep-orbit/bridge.webp"
      />,
    );
    expect(screen.getByTestId("art-plate")).toBeInTheDocument();
  });

  it("renders nothing when the theme has neither draw nor plate", () => {
    const { container } = render(
      <ThemeSceneBackdrop slug="not-a-theme" primary={PRIMARY} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- apps/web/app/themes`
Expected: FAIL. `plateSrc` is not a prop, and the third case returns null.

- [ ] **Step 3: Modify the component**

Add to `Props`:

```tsx
  /**
   * Location master plate for themes that have art. Absent for the four
   * unlaunched themes, which then render exactly as they did before the
   * art existed.
   */
  plateSrc?: string;
```

Add `plateSrc` to the destructured params, then replace the early return and the body:

```tsx
  const draw = SCENE_BY_SLUG[slug];
  if (!draw && !plateSrc) return null;

  return (
    <div
      data-testid={`theme-scene-backdrop-${slug}`}
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-screen z-0 pointer-events-none"
      style={{
        maskImage: "linear-gradient(180deg, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, black 55%, transparent 100%)",
      }}
    >
      {plateSrc && (
        <ArtPlate src={plateSrc} bleed className="absolute inset-0" />
      )}
      {draw && (
        <SceneCanvas
          draw={draw}
          rgb={hexToRgb(primary)}
          rgbLight={primaryLight ? hexToRgb(primaryLight) : undefined}
          intensity={intensity}
          // Over a plate the canvas is the reflection on the glass, not
          // the scene itself. SceneCanvasProps exposes className but NOT
          // style, so the dimming rides a utility class; do not add a
          // `style` prop to SceneCanvas for this.
          className={`absolute inset-0${plateSrc ? " opacity-50" : ""}`}
        />
      )}
    </div>
  );
```

Import `ArtPlate` from `@tensorcraft/ui`. Both layers live inside the existing wrapper, so the plate inherits the same bottom fade mask as the canvas.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- apps/web/app/themes`
Expected: PASS, 4 tests.

- [ ] **Step 5: Checkpoint**

Run: `pnpm typecheck`

---

### Task 1.7: wire the theme page

**Files:**
- Modify: `apps/web/app/themes/[slug]/page.tsx:315-319`

- [ ] **Step 1: Pass the plate**

Import `heroPlateSrc` from `@/lib/location-art`, then:

```tsx
      <ThemeSceneBackdrop
        slug={theme.slug}
        primary={theme.palette.primary}
        primaryLight={theme.paletteLight.primary}
        plateSrc={heroPlateSrc(theme.slug)}
      />
```

- [ ] **Step 2: Look at it in both schemes**

Run the dev server and open `/themes/deep-orbit`, then `/themes/neon-protocol`.

Expected: Deep Orbit shows the Bridge plate fading out down the first viewport with the orbit canvas glinting over it. Neon Protocol is unchanged. Toggle the scheme; the plate stays dark in both, and the page around it does not.

- [ ] **Step 3: Checkpoint**

Run: `pnpm typecheck && pnpm test`

---

### Task 1.8: wire the landing page

**Files:**
- Modify: `apps/web/app/components/five-worlds-section.tsx:70-90`

This is the signature moment: the Five Worlds band becomes a viewport onto the Archimedes, with `OrbitCanvas` as the reflection on the glass.

- [ ] **Step 1: Composite the layers**

Inside the flagship `motion.div`, before the existing `<OrbitCanvas>`:

```tsx
        {HERO_PLATE_SRC && (
          <ArtPlate
            src={HERO_PLATE_SRC}
            bleed
            className="absolute inset-0 z-0"
          />
        )}
```

Change the `OrbitCanvas` className from `absolute inset-0 z-0 pointer-events-none` to:

```tsx
          className={`absolute inset-0 z-1 pointer-events-none${
            HERO_PLATE_SRC ? " opacity-50" : ""
          }`}
```

`OrbitCanvasProps` follows `SceneCanvasProps` and exposes `className` but not `style`, so the dimming rides a utility class here too.

At module scope, next to `HERO_CARD`:

```tsx
const HERO_PLATE_SRC = heroPlateSrc(HERO_CARD.slug);
```

The existing content wrapper is already `relative z-10`; leave it alone.

- [ ] **Step 2: Confirm the layer order in the browser**

Open `/` and scroll to Five Worlds.

Expected: the plate is visible behind the type; the orbit canvas animates over it; hovering still ignites the canvas. **If you see no plate, check the z-index first** — the canvas painting over the plate is the most likely failure, and it looks identical to a missing image.

- [ ] **Step 3: Confirm the hero is untouched**

The landing hero and its `DeepScanDemo` panel must be byte-identical. The plate is below the fold and off the LCP path.

Run: `pnpm test -- apps/web/app/page.test.tsx`
Expected: PASS.

- [ ] **Step 4: Checkpoint**

Run: `pnpm typecheck && pnpm test`

---

### Task 1.9: no-art fixtures and accessibility

**Files:**
- Create: `e2e/art.spec.ts`

The unit tests prove the failure path with a synthetic `error` event. This proves it in a real browser, where an SSR'd `<img>` can settle before hydration and the `onError` handler never exists to fire. Copy the abort pattern from `e2e/script-playback.spec.ts:19`.

- [ ] **Step 1: Write the failing test**

Create `e2e/art.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

/**
 * Art is optional by contract. Aborting the asset route (rather than just
 * pointing at a missing file) reproduces the pre-hydration failure that
 * useImgSettled exists to recover: the request dies while the HTML is still
 * streaming, long before React attaches onError.
 */
const SURFACES = [
  { name: "landing Five Worlds", path: "/" },
  { name: "Deep Orbit theme page", path: "/themes/deep-orbit" },
];

for (const surface of SURFACES) {
  test(`${surface.name} renders cleanly with no location art`, async ({
    page,
  }) => {
    await page.route("**/locations/**", (route) => route.abort());
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(surface.path);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("art-plate")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${surface.name} shows the plate when the art is present`, async ({
    page,
  }) => {
    await page.goto(surface.path);
    await expect(page.getByTestId("art-plate").first()).toBeVisible();
  });
}
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e -- e2e/art.spec.ts`
Expected: PASS, 4 tests. A failure on the "no location art" case means a plate is leaving a broken frame in the DOM instead of unmounting.

- [ ] **Step 3: Run the accessibility matrix**

Run: `pnpm test:e2e -- e2e/accessibility.spec.ts`
Expected: PASS. Landing and Theme Detail are already in the `pages` list and are audited in both schemes.

The plates are `aria-hidden` decorative images with empty alt, so they contribute no accessible content. If a contrast violation appears, it is text sitting on the plate rather than on the page background: fix it by darkening the plate's scrim, not by adding `[data-decorative]` to the text.

- [ ] **Step 4: Regenerate visual baselines**

Landing and the theme pages both changed, so their baselines are stale by design.

Run, with the dev server up in another terminal:
```bash
RUN_VISUAL=1 ./node_modules/.bin/playwright test e2e/visual/ --update-snapshots
```

Review every changed baseline image before accepting it. See `docs/visual-regression.md`.

- [ ] **Step 5: Full battery**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`
Expected: all PASS.

- [ ] **Step 6: Update the docs**

- `docs/scene-bible.md`: record that the masters are ingested, and to where.
- `docs/ui-ux-notes.md`: add the plate frame convention and the "art is optional" contract.

- [ ] **Step 7: Phase 1 checkpoint**

Phase 1 is independently shippable. Stop here and hand back for review before starting Phase 2.

---

## Phase 2: cast row on the Deep Orbit theme page

**Nothing in this phase depends on Phase 1.**

### Task 2.1: the cast row

**Files:**
- Create: `apps/web/app/themes/[slug]/theme-cast.tsx`
- Create: `apps/web/app/themes/[slug]/theme-cast.test.tsx`

**Superseded during implementation, 2026-08-10, and already done.** This task
originally branched on `character.isAI` to give ARIA a live
`AriaWaveformAvatar`, because she had no portrait art. A concurrent session
shipped her four portraits mid-build and deleted the waveform component, its
tests, its `effects/index.ts` exports and `ariaWaveformState()`. The row was
rewritten as five uniform `AnimatedAvatar` frames resolved through
`portraitSources()`, which is simpler than the plan below. **Do not restore
the waveform branch.**

What shipped: [theme-cast.tsx](../../../apps/web/app/themes/%5Bslug%5D/theme-cast.tsx),
7 unit tests, mounted under the page header, carrying `tc-on-art` because the
row sits inside the backdrop's first viewport.

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/themes/[slug]/theme-cast.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeCast } from "./theme-cast";

vi.mock("@tensorcraft/ui/effects", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  AriaWaveformAvatar: ({ name }: { name?: string }) => (
    <div data-testid="aria-waveform" aria-label={name} />
  ),
}));

describe("ThemeCast", () => {
  it("renders four portraits and one waveform for Deep Orbit", () => {
    render(<ThemeCast slug="deep-orbit" />);
    expect(screen.getAllByTestId("animated-avatar")).toHaveLength(4);
    expect(screen.getByTestId("aria-waveform")).toBeInTheDocument();
  });

  it("names every crew member and their role", () => {
    render(<ThemeCast slug="deep-orbit" />);
    expect(screen.getByText("Commander Mirza")).toBeInTheDocument();
    expect(screen.getByText("Ship AI")).toBeInTheDocument();
  });

  it("renders nothing for a theme with no characters", () => {
    const { container } = render(<ThemeCast slug="not-a-theme" />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- apps/web/app/themes/[slug]/theme-cast.test.tsx`
Expected: FAIL, cannot resolve `./theme-cast`.

- [ ] **Step 3: Write the component**

Build it from: `themes[slug].characters`, `portraitSources(slug, character)` from `@/lib/character-art`, `hexToRgb` from the same module, `AnimatedAvatar` from `@tensorcraft/ui`, and `AriaWaveformAvatar` from `@tensorcraft/ui/effects`. Return `null` when the theme is unknown or has no characters. Pass `size` large enough to read as a cast row rather than a dialogue avatar (start at 96 and look at it).

Each entry shows the portrait, the character's `name`, and their `role`. Do **not** surface `personality`: it is authoring guidance, and Chief Nazari's reads as a spoiler for her arc.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- apps/web/app/themes/[slug]/theme-cast.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Mount it on the theme page**

Add `<ThemeCast slug={theme.slug} />` to `apps/web/app/themes/[slug]/page.tsx`, below the page header. It self-hides for the four themes with no characters.

- [ ] **Step 6: Checkpoint**

Run: `pnpm typecheck && pnpm test`

- [ ] **Step 7: Fixtures, accessibility, baselines**

Add a `**/characters/**` abort case to `e2e/art.spec.ts` for `/themes/deep-orbit` and assert the row falls back to monogram placeholders rather than broken frames.

Run: `pnpm test:e2e -- e2e/art.spec.ts e2e/accessibility.spec.ts`
Then regenerate the theme-page visual baselines as in Task 1.9 Step 4.

- [ ] **Step 8: Phase 2 checkpoint**

Independently shippable. Hand back for review.

---

## Phase 3: module filmstrip on `/pricing#curriculum`

**Blocked on an editorial decision.** Do not start the component first.

### Task 3.1: name a representative scene per module

**Files:**
- Modify: `docs/scene-bible.md`

Scene art is keyed by lesson. There is no module hero scene. A component that reaches for index `[0]` of a module's lessons would be making an editorial call silently, and it would drift the first time a lesson is reordered.

- [ ] **Step 1: Add the field**

For each of the 11 Deep Orbit modules, name one lesson whose scene stands for the module. Record it in `docs/scene-bible.md` as an explicit per-module field, with a sentence on why that shot represents the module.

**This step needs the user.** Surface the 11 proposed choices and get them confirmed before continuing.

- [ ] **Step 2: Gate it**

Add a content-gate check that every module names a lesson which exists and has shipped scene art. A wrong name must fail the build, not silently drop a frame from the strip.

Run: `pnpm test:exercises`
Expected: PASS, with the new check running.

- [ ] **Step 3: Checkpoint**

### Task 3.2: the filmstrip

**Files:**
- Create: `apps/web/app/pricing/module-filmstrip.tsx`

- [ ] **Step 1: Write the failing test**

Assert: exactly 11 frames, every frame `loading="lazy"`, every frame labelled with its module name, and the strip renders nothing when no module resolves art.

- [ ] **Step 2: Build it on `ArtPlate`**

Framed, not bleeding. Horizontal scroll on narrow viewports with a visible keyboard focus ring on each frame.

- [ ] **Step 3: Cap the page's image weight**

The cap belongs here, not at ingest: these scenes already shipped under the per-file 200 KB cap, and nothing stops a component putting eleven of them on one route.

Add a test asserting the frame count and the summed transfer size of `/scenes/**` responses on `/pricing`. Pick the budget from the measured total and set it as a ceiling, not a target.

- [ ] **Step 4: Accessibility and baselines**

Run: `pnpm test:e2e -- e2e/accessibility.spec.ts`
Then regenerate the `/pricing` visual baseline.

- [ ] **Step 5: Full battery**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`

- [ ] **Step 6: Phase 3 checkpoint**

---

## Definition of done

- `node scripts/art/ingest.mjs masters` ships four plates under budget.
- Landing, `/themes/deep-orbit`, and `/pricing` each show art, and each renders cleanly with its art route aborted.
- The four unlaunched themes render exactly as they did before this work.
- The landing hero and `DeepScanDemo` are unchanged.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` all pass.
- Visual baselines regenerated and reviewed.
- `docs/scene-bible.md` and `docs/ui-ux-notes.md` updated.
- Nothing committed. The user commits.
