# Pricing Curriculum Signal-Lock Cinematic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the "What's in a World" section on /pricing a once-ever canvas boot cinematic ("signal lock") that settles into a living faint Deep Orbit backdrop behind the module list.

**Architecture:** A new `SceneDraw` (`drawSignalLock`) whose first 3 seconds render a terminal boot and which delegates to `drawOrbit` afterwards, mounted through a new client wrapper (`CurriculumScene`) that resolves boot-vs-settled mode and arms a CSS row-flicker via `[data-boot]` at first intersection. Spec: `docs/superpowers/specs/2026-08-15-pricing-curriculum-signal-lock-design.md` (read it before starting; it is binding).

**Tech Stack:** React 19 client components in Next.js app router, canvas 2D via the existing SceneCanvas chrome, vitest + @testing-library/react, Playwright e2e.

**As-built deviations (2026-08-15, all review-driven and authorized during execution):** the recorder's `ellipse` capture was widened to the full 7-tuple in `test-utils/recording-canvas.ts` (supersedes the out-of-scope fence below; the uncommitted edits that fence protected had been committed by then); the sweep gained a 14% overshoot and ink-mode alpha caps; the contract suites sample t=2.6 (10 tests, not 8); `CurriculumScene` exposes `data-mode` and the wrapper suite grew a no-IntersectionObserver test (8 tests, not 7); `page.test.tsx` gained one test locking the row-class/`--tc-row-delay` contract (supersedes "zero modifications to existing test files"); the stagger got an anchor comment. Visual baselines needed no regeneration: the visual suites mask canvases, so the backdrop produced zero diffs.

**Project rules that override defaults:**
- NEVER run `git add` / `git commit` / `git push`. CLAUDE.md forbids commits on the user's behalf. Every task ends with a STOP checkpoint where the user reviews and commits.
- The working tree already carries uncommitted edits to `packages/ui/src/effects/orbit-canvas.test.ts`, `world-scenes.test.ts`, and `test-utils/recording-canvas.ts`. Build on top of them. Do not revert or re-generate them.
- No user-visible copy changes anywhere in this plan. If you find yourself writing prose a user will read, stop; that is out of scope.

---

## File structure

| File | Action | Responsibility |
| --- | --- | --- |
| `packages/ui/src/effects/signal-lock.ts` | Create | `drawSignalLock` scene: boot timeline 0–3s, then delegate to `drawOrbit` |
| `packages/ui/src/effects/signal-lock.test.ts` | Create | Contract tests (hover continuity, scheme independence, static frame, settled delegation) |
| `packages/ui/src/effects/index.ts` | Modify | Barrel export |
| `apps/web/app/pricing/curriculum-scene.tsx` | Create | Client wrapper: mode resolution, first-intersection boot arming, once-ever flag |
| `apps/web/app/pricing/__tests__/curriculum-scene.test.tsx` | Create | Wrapper behavior tests |
| `apps/web/app/globals.css` | Modify | `tc-curriculum-flicker` keyframes + `[data-boot]` scoped rule |
| `apps/web/app/pricing/curriculum-preview.tsx` | Modify | Wrap content in `CurriculumScene`, add row class + stagger delay var |

---

### Task 1: `drawSignalLock` scene

**Files:**
- Create: `packages/ui/src/effects/signal-lock.ts`
- Create: `packages/ui/src/effects/signal-lock.test.ts`
- Modify: `packages/ui/src/effects/index.ts`

- [x] **Step 1: Write the failing test**

Create `packages/ui/src/effects/signal-lock.test.ts`. This mirrors the structure of `world-scenes.test.ts` (same recorder, same contract) plus the settled-delegation lock that is unique to this scene:

```ts
import { describe, it, expect } from "vitest";
import { drawSignalLock, BOOT_DURATION } from "./signal-lock";
import { drawOrbit } from "./orbit-canvas";
import { recordingCtx } from "./test-utils/recording-canvas";

const RGB: [number, number, number] = [107, 170, 138];
const MID_BOOT = 1.0;
const SETTLED = BOOT_DURATION + 2;

describe("signal lock hover continuity", () => {
  it.each([MID_BOOT, SETTLED])(
    "keeps all geometry identical when hover flips at t=%s",
    (t) => {
      const a = recordingCtx();
      const b = recordingCtx();
      drawSignalLock(a.ctx, 800, 400, RGB, 0, t, "dark");
      drawSignalLock(b.ctx, 800, 400, RGB, 1, t, "dark");
      expect(b.rec).toEqual(a.rec);
    },
  );
});

describe("signal lock scheme independence", () => {
  it.each([MID_BOOT, SETTLED])(
    "draws identical geometry under dark and light scheme at t=%s",
    (t) => {
      const dark = recordingCtx();
      const light = recordingCtx();
      drawSignalLock(dark.ctx, 800, 400, RGB, 0.5, t, "dark");
      drawSignalLock(light.ctx, 800, 400, RGB, 0.5, t, "light");
      expect(light.rec).toEqual(dark.rec);
    },
  );
});

describe("signal lock boot frames", () => {
  it("draws a non-empty static frame at t=0 (resolving noise)", () => {
    const { ctx, rec } = recordingCtx();
    drawSignalLock(ctx, 800, 400, RGB, 0, 0, "dark");
    expect(rec.rects.length).toBeGreaterThan(0);
  });

  it("draws the ring draw-in mid-boot", () => {
    const { ctx, rec } = recordingCtx();
    drawSignalLock(ctx, 800, 400, RGB, 0, 1.6, "dark");
    expect(rec.ellipses.length).toBeGreaterThan(0);
  });
});

describe("signal lock settled delegation", () => {
  it("is exactly drawOrbit past the boot, geometry and styles", () => {
    const boot = recordingCtx();
    const orbit = recordingCtx();
    drawSignalLock(boot.ctx, 800, 400, RGB, 0.45, SETTLED, "dark");
    drawOrbit(orbit.ctx, 800, 400, RGB, 0.45, SETTLED, "dark");
    expect(boot.rec).toEqual(orbit.rec);
    expect(boot.styles).toEqual(orbit.styles);
  });

  it("draws no boot ellipses past the crossfade", () => {
    // drawOrbit never calls ellipse(); the boot rings do. An empty ellipse
    // list past the boot proves the theatrics fully retire.
    const { ctx, rec } = recordingCtx();
    drawSignalLock(ctx, 800, 400, RGB, 0, SETTLED, "dark");
    expect(rec.ellipses).toEqual([]);
  });
});
```

Why these tests: the first two suites are the repo's SceneDraw contract (positions pure in `t`; `hot`/`scheme` style-only), enforced identically for every scene in `world-scenes.test.ts`. The delegation suite locks the spec's core promise: past the boot, this scene IS `drawOrbit`, so the pricing backdrop can never drift from the canonical Deep Orbit scene.

- [x] **Step 2: Run test to verify it fails**

Run (from repo root): `pnpm vitest run packages/ui/src/effects/signal-lock.test.ts`
Expected: FAIL, cannot resolve `./signal-lock`.

- [x] **Step 3: Write the implementation**

Create `packages/ui/src/effects/signal-lock.ts`:

```ts
import { drawOrbit, highlight } from "./orbit-canvas";
import type { SceneDraw } from "./scene-canvas";

/* ── Signal lock: the pricing curriculum boot ──────────────────────
   One-shot cinematic on the SceneDraw time axis: t in [0, BOOT_DURATION)
   plays a terminal boot (static resolves, a scan sweep passes, rings draw
   themselves in), then the scene delegates wholesale to drawOrbit, so the
   settled backdrop can never drift from the canonical Deep Orbit scene.
   Used by apps/web/app/pricing/curriculum-scene.tsx; spec at
   docs/superpowers/specs/2026-08-15-pricing-curriculum-signal-lock-design.md.

   Contract (as every SceneDraw): positions are pure functions of t; hot
   and scheme touch styling only. Deterministic hash() keeps every frame
   reproducible. Ink mode follows the wash-tint rule: the sweep is a
   paper-lifted tint, never the raw hue over a large soft field (the
   grey-storm-cloud lesson in orbit-canvas.tsx). */

export const BOOT_DURATION = 3;
// Crossfade length; the fade runs over [BOOT_DURATION - CROSSFADE,
// BOOT_DURATION] so tuning BOOT_DURATION cannot desync the handoff.
const CROSSFADE = 0.8;

// GLSL-style fract(sin·k) hash, same convention as orbit-canvas.tsx: the
// static frame at any t must match the animated frame at that t.
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const easeOut = (x: number): number => 1 - Math.pow(1 - x, 3);
/** Base hue lerped k toward white: ink mode's thinned-wash tint. */
const wash = (
  [r, g, b]: [number, number, number],
  k: number,
): [number, number, number] => [
  Math.round(r + (255 - r) * k),
  Math.round(g + (255 - g) * k),
  Math.round(b + (255 - b) * k),
];

// Flat silhouettes of ORBIT_RINGS' radii (orbit-canvas.tsx) so the boot
// rings dissolve into the 3D system at roughly their own size.
const RING_RADII = [0.16, 0.3, 0.45, 0.62, 0.8, 1.0];

export const drawSignalLock: SceneDraw = (ctx, w, h, rgb, hot, t, scheme) => {
  const ink = scheme === "light";
  const [r, g, b] = rgb;
  const [hr, hg, hb] = highlight(rgb, scheme);
  const boost = 1 + 0.3 * hot; // styling only, never geometry

  // Crossfade over the boot's last CROSSFADE seconds: real orbit ramps in
  // under the boot marks, boot marks ramp out above it. Both are alpha
  // ramps, so the handoff is a double exposure, never a geometry pop.
  const orbitIn = clamp01((t - (BOOT_DURATION - CROSSFADE)) / CROSSFADE);
  const bootOut = 1 - orbitIn;

  if (orbitIn > 0) {
    ctx.save();
    // drawOrbit paints via rgba() strings and never touches globalAlpha,
    // so an outer globalAlpha scales the whole delegated scene.
    ctx.globalAlpha = orbitIn;
    drawOrbit(ctx, w, h, rgb, hot, t, scheme);
    ctx.restore();
  }
  if (bootOut <= 0) return; // settled: nothing above the delegated scene

  // ── Static noise resolving, t in [0, 0.7] ──
  const noise = (1 - easeOut(clamp01(t / 0.7))) * bootOut;
  if (noise > 0.01) {
    // Re-rolls every 1/60s tick; deterministic at any given t.
    const seed = Math.floor(t * 60) * 7919;
    const a0 = ink ? 0.5 : 0.3;
    for (let i = 0; i < 220; i++) {
      const x = hash(i + seed) * w;
      const y = hash(i + seed + 99) * h;
      ctx.fillStyle = `rgba(${hr},${hg},${hb},${noise * a0 * hash(i + 3) * boost})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // ── Scan sweep, t in (0.15, 1.5) ──
  const sweep = clamp01((t - 0.15) / 1.35);
  if (sweep > 0 && sweep < 1) {
    const sy = sweep * h;
    // Ink: paper-lifted wash tint drawn source-over; dark: raw hue.
    const [sr, sg, sb] = ink ? wash(rgb, 0.55) : rgb;
    const band = ctx.createLinearGradient(0, sy - h * 0.12, 0, sy);
    band.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
    band.addColorStop(
      1,
      `rgba(${sr},${sg},${sb},${(ink ? 0.35 : 0.25) * bootOut * boost})`,
    );
    ctx.fillStyle = band;
    ctx.fillRect(0, sy - h * 0.12, w, h * 0.12);
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${0.8 * bootOut * boost})`;
    ctx.fillRect(0, sy, w, 1.2);
  }

  // ── Rings draw in as arc progress, t in [0.9, 2.2] ──
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.max(w, h) * 0.5;
  const rings = clamp01((t - 0.9) / 1.3);
  for (let i = 0; i < RING_RADII.length; i++) {
    const p = clamp01(rings * 1.6 - i * 0.12);
    if (p <= 0) continue;
    const rr = R * RING_RADII[i];
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      rr,
      rr * 0.38,
      0,
      -Math.PI / 2,
      -Math.PI / 2 + p * Math.PI * 2,
    );
    ctx.strokeStyle = `rgba(${r},${g},${b},${(ink ? 0.55 : 0.4) * bootOut * boost})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (rings > 0.3) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${(ink ? 0.85 : 0.9) * bootOut * boost})`;
    ctx.fill();
  }
};
```

Notes for the implementer:
- Every `if` gating geometry (`noise > 0.01`, `sweep > 0 && sweep < 1`, `p <= 0`, `rings > 0.3`, `bootOut <= 0`) depends on `t` alone. If you add a branch that consults `hot` or `scheme` before producing geometry, the contract tests fail, and they are right.
- The recorder mock has no `globalAlpha` property; plain assignment on it is a harmless expando. Do not "fix" the mock.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/ui/src/effects/signal-lock.test.ts`
Expected: PASS (8 tests).

- [x] **Step 5: Barrel export**

In `packages/ui/src/effects/index.ts`, after the SceneCanvas export block, add:

```ts
export { drawSignalLock, BOOT_DURATION } from "./signal-lock";
```

- [x] **Step 6: Verify the effects suite and types**

Run: `pnpm vitest run packages/ui/src/effects` then `pnpm typecheck`
Expected: all effects tests PASS (including the pre-existing, locally-modified orbit/world-scenes suites), typecheck clean.

- [x] **Step 7: STOP - checkpoint**

Report results to the user and wait for them to review/commit. Do not commit.

---

### Task 2: `CurriculumScene` wrapper + flicker CSS

**Files:**
- Create: `apps/web/app/pricing/curriculum-scene.tsx`
- Create: `apps/web/app/pricing/__tests__/curriculum-scene.test.tsx`
- Modify: `apps/web/app/globals.css`

- [x] **Step 1: Write the failing test**

Create `apps/web/app/pricing/__tests__/curriculum-scene.test.tsx`. Before writing, open one neighboring test (`paywall-notice.test.tsx`) and mirror its imports/setup exactly (testing-library entry point, jsdom environment pragma if present). The IntersectionObserver mock follows `packages/ui/src/effects/particle-field.test.tsx` (instance list + captured callback):

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CurriculumScene } from "../curriculum-scene";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  intersect(isIntersecting: boolean) {
    act(() => {
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

/** The wrapper's own observer watches the section div; SceneCanvas's
    watches its canvas. Filter by element type to address the wrapper's. */
const wrapperIo = () =>
  MockIntersectionObserver.instances.find((i) =>
    i.observed.some((el) => el instanceof HTMLDivElement),
  )!;

const mockMatchMedia = (reducedMatches: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion")
        ? reducedMatches
        : false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
};

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockMatchMedia(false);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderScene = () =>
  render(
    <CurriculumScene primary="#6BAA8A" primaryLight="#4A8064">
      <p data-testid="rows">rows</p>
    </CurriculumScene>,
  );

const bootAttr = () =>
  screen.getByTestId("curriculum-scene").getAttribute("data-boot");

describe("CurriculumScene", () => {
  it("does not arm the boot or write the flag before first intersection", () => {
    renderScene();
    expect(bootAttr()).toBeNull();
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBeNull();
  });

  it("arms [data-boot] and writes the once-ever flag at first intersection", () => {
    renderScene();
    wrapperIo().intersect(true);
    expect(bootAttr()).toBe("");
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBe("1");
  });

  it("ignores a non-intersecting entry", () => {
    renderScene();
    wrapperIo().intersect(false);
    expect(bootAttr()).toBeNull();
    expect(window.localStorage.getItem("tc_curriculum_boot_seen")).toBeNull();
  });

  it("mounts settled when the flag is already set", () => {
    window.localStorage.setItem("tc_curriculum_boot_seen", "1");
    renderScene();
    MockIntersectionObserver.instances.forEach((i) => i.intersect(true));
    expect(bootAttr()).toBeNull();
  });

  it("mounts settled under reduced motion", () => {
    mockMatchMedia(true);
    renderScene();
    MockIntersectionObserver.instances.forEach((i) => i.intersect(true));
    expect(bootAttr()).toBeNull();
  });

  it("treats unreadable storage as seen", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    renderScene();
    MockIntersectionObserver.instances.forEach((i) => i.intersect(true));
    expect(bootAttr()).toBeNull();
    spy.mockRestore();
  });

  it("renders children in every mode", () => {
    renderScene();
    expect(screen.getByTestId("rows")).toBeTruthy();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/app/pricing/__tests__/curriculum-scene.test.tsx`
Expected: FAIL, cannot resolve `../curriculum-scene`.

- [x] **Step 3: Write the component**

Create `apps/web/app/pricing/curriculum-scene.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
// Subpath, not the barrel: same sandpack/jsdom rationale as
// world-scene-backdrop.tsx.
import {
  SceneCanvas,
  drawOrbit,
  drawSignalLock,
} from "@tensorcraft/ui/effects";

const SEEN_KEY = "tc_curriculum_boot_seen";

// Any storage read failure counts as seen: when in doubt this section
// shows the list instantly, because it exists to convert (spec, gating).
const seenBoot = (): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const markSeen = (): void => {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // A failed write only means a replay on the next visit.
  }
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const EDGE_MASK: CSSProperties = {
  maskImage:
    "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
};

interface Props {
  /** World primary as hex (world.palette.primary). */
  primary: string;
  /**
   * World primary for light scheme (world.paletteLight.primary).
   * Optional with fallback to `primary`, mirroring WorldSceneBackdrop's
   * `primaryLight?`: SceneCanvas keeps drawing the dark hue when absent,
   * and callers (including test mocks of @tensorcraft/worlds that predate
   * paletteLight) stay valid.
   */
  primaryLight?: string;
  children: ReactNode;
}

/**
 * Signal-lock scene around the curriculum module list. Mode resolves
 * client-side after mount (settled for return visits, reduced motion, or
 * unreadable storage; boot otherwise), so server HTML and the hydration
 * frame are identical and rows are never hidden without JavaScript. The
 * wrapper's own IntersectionObserver is the single boot-start moment: it
 * arms [data-boot] (the CSS row flicker in globals.css) and writes the
 * once-ever flag. Its rootMargin matches SceneCanvas's 120px so both
 * observers release on the same scroll position.
 */
export function CurriculumScene({ primary, primaryLight, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"boot" | "settled" | null>(null);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
      ?.matches;
    if (reduced || seenBoot()) {
      setMode("settled");
      return;
    }
    setMode("boot");
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // No observer means no entry moment: arm now rather than never play.
      setBooting(true);
      markSeen();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setBooting(true);
        markSeen();
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      data-boot={booting ? "" : undefined}
      data-testid="curriculum-scene"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={EDGE_MASK}
      >
        {mode && (
          <SceneCanvas
            draw={mode === "boot" ? drawSignalLock : drawOrbit}
            rgb={hexToRgb(primary)}
            rgbLight={primaryLight ? hexToRgb(primaryLight) : undefined}
            intensity={0.45}
            className="absolute inset-0"
          />
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

Implementation notes:
- `mode` starts `null` and resolves in an effect, deliberately: this client component still server-renders, and localStorage/matchMedia only exist on the client. Resolving pre-paint would either mismatch hydration or flash. The canvas appearing one frame late is invisible; it is decorative.
- SceneCanvas runs its clock for a frame or two after mount before its own observer reports off-screen. For a below-the-fold load the boot may sit ~2 frames into the noise phase when the user arrives. The first 0.7s is noise; this is inside the spec's approximate-sync slack. Do not add plumbing to zero it.

- [x] **Step 4: Add the flicker CSS**

The spec delegates the keyframes' file to this plan, offering "a keyframes
entry next to the app's existing animation utilities" as one option; this
plan exercises that option, since every keyframe in the app lives in
`globals.css` and the rule is scoped by the `[data-boot]` attribute
selector regardless of file. In `apps/web/app/globals.css`, next to the
existing keyframes (around `@keyframes blink`), add:

```css
/* Curriculum signal-lock boot (pricing): rows flicker in like telemetry
   while the canvas boots. curriculum-scene.tsx sets [data-boot] at first
   intersection; without it (no JS, replay visit, reduced motion) rows are
   simply visible. Delays per row via --tc-row-delay span 1.6-2.6s of the
   3s boot (BOOT_DURATION, @tensorcraft/ui effects/signal-lock.ts). */
@media (prefers-reduced-motion: no-preference) {
  [data-boot] .tc-curriculum-row {
    animation: tc-curriculum-flicker 0.5s linear both;
    animation-delay: var(--tc-row-delay, 1.6s);
  }
}
@keyframes tc-curriculum-flicker {
  0% {
    opacity: 0;
  }
  35% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
  65% {
    opacity: 1;
  }
  80% {
    opacity: 0.45;
  }
  100% {
    opacity: 1;
  }
}
```

The `prefers-reduced-motion` media guard is belt-and-braces: the wrapper never sets `[data-boot]` for reduced-motion users, but the CSS must not rely on that.

- [x] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run apps/web/app/pricing/__tests__/curriculum-scene.test.tsx`
Expected: PASS (7 tests).

- [x] **Step 6: STOP - checkpoint**

Report results to the user and wait for them to review/commit. Do not commit.

---

### Task 3: Integrate into `CurriculumPreview`

**Files:**
- Modify: `apps/web/app/pricing/curriculum-preview.tsx`

- [x] **Step 1: Wrap the section content**

In `curriculum-preview.tsx`:

1. Add the import: `import { CurriculumScene } from "./curriculum-scene";`
2. Inside the `LAUNCHED_WORLDS.map`, wrap everything currently inside `<div key={slug}>` (the `h2`, the subtitle `p`, the `ol`, the footer `p`) in:

```tsx
<CurriculumScene
  primary={world.palette.primary}
  primaryLight={world.paletteLight?.primary}
>
  {/* existing h2 / p / ol / footer p, unchanged */}
</CurriculumScene>
```

The optional chain on `paletteLight` matters: `page.test.tsx` mocks
`@tensorcraft/worlds` with worlds that have `palette` but no
`paletteLight` (page.test.tsx:96-112). `CurriculumScene.primaryLight` is
optional with a dark-hue fallback for exactly this reason, so the mock
stays valid and the existing test file needs no edits.

3. On the module `<li>`, prepend `tc-curriculum-row` to the existing className template string and add the stagger delay (right after the existing `className` prop):

```tsx
style={
  {
    "--tc-row-delay": `${(
      1.6 +
      (modules.length > 1 ? i / (modules.length - 1) : 0)
    ).toFixed(2)}s`,
  } as CSSProperties
}
```

with `import type { CSSProperties } from "react";` at the top. Change NOTHING else: no copy edits, no testid changes, no structural reshuffling. `world.palette.primary` / `world.paletteLight?.primary` are the same fields the world page passes to `WorldSceneBackdrop` (see `worlds/[slug]/page.tsx:320-323`).

- [x] **Step 2: Run the pricing unit suites**

Run: `pnpm vitest run apps/web/app/pricing`
Expected: PASS with zero modifications to the existing test files. `page.test.tsx` asserts on `curriculum-preview` and per-module testids; if it fails, the integration broke the pass-through contract; fix the integration, never the test.

- [x] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [x] **Step 4: STOP - checkpoint**

Report results to the user and wait for them to review/commit. Do not commit.

---

### Task 4: Full battery, e2e, and visual verification

**Files:**
- Possibly regenerated: `e2e/visual/key-pages.spec.ts-snapshots/pricing-*.png`, `e2e/visual/responsive.spec.ts-snapshots/pricing-*.png`

- [x] **Step 1: Workspace unit suite**

Run: `pnpm test`
Expected: green across the workspace.

- [x] **Step 2: Functional pricing e2e**

Run: `pnpm test:e2e e2e/pricing.spec.ts` (needs the dev server per the repo's Playwright config; check `playwright.config.ts` `webServer` before assuming).
Expected: PASS as-is. Playwright's `toBeVisible` does not consider opacity, and the flicker finishes ~3.1s in while default timeouts are longer. If the "Module 1 marked free" test flakes mid-flicker anyway, add an `addInitScript` seeding `localStorage.tc_curriculum_boot_seen = "1"` to THAT spec's `beforeEach` (deterministic settled mode) rather than loosening assertions.

- [x] **Step 3: Accessibility e2e**

Run: `pnpm test:e2e e2e/accessibility.spec.ts`
Expected: PASS. The axe suite emulates reduced motion (`accessibility.spec.ts:46`), which mounts settled mode: full-opacity rows over the static backdrop. If a contrast violation appears on the curriculum section, the 0.45 intensity floor is too bright behind the muted row text; lower the floor (0.35, then 0.3) until clean and note the final value for the spec.

- [x] **Step 4: Visual baselines**

Run: `pnpm test:e2e e2e/visual/key-pages.spec.ts e2e/visual/responsive.spec.ts` (these suites are gated on `RUN_VISUAL`; check the spec files' skip condition and set the env var accordingly).
Expected: pricing baselines diff, because the section legitimately gained a static backdrop under reduced motion. Inspect the diff images to confirm the change is exactly the faint orbit scene behind the curriculum section (and nothing else moved), then regenerate with `--update-snapshots` for the pricing baselines only. The working tree already contains regenerated baselines from the Tailwind fix; the new regeneration stacks on top, which is expected.

- [x] **Step 5: See it run**

Use the run skill (or `pnpm dev`) to open /pricing in a real browser and verify by eye, in this order: (1) fresh profile or cleared localStorage, dark scheme: scroll to the section, boot plays once, rows flicker in, scene settles faint; (2) reload: no boot, settled immediately; (3) clear the key, switch light scheme: ink-mode boot reads as marks on paper, no grey storm cloud in the sweep; (4) OS reduced-motion on, cleared key: no boot, static frame, rows visible. Screenshot the settled section for the report.

- [x] **Step 6: STOP - final checkpoint**

Report the full battery results and the by-eye findings to the user. The user decides on committing. Do not commit.

---

## Out of scope (do not do)

- No sound, no copy changes, no tier-card or checkout changes, no scroll-scrubbing.
- No second-world plumbing beyond what falls out of the existing `LAUNCHED_WORLDS.map`.
- No edits to the SceneCanvas chrome or the recording-canvas util beyond what exists in the working tree.
