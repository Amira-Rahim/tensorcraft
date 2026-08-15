# Coming-Soon Stub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the coming-soon theme stub (`/themes/{signal-ward,neon-protocol,nova-canvas,terra-grid}`) as an in-world status-board page with module roster, skills, careers, cast personality, and dual waitlist capture.

**Architecture:** Add an optional `preview` block to `ThemeManifest` populated in all 4 unlaunched theme files; rewrite `ComingSoonStub` (server component) to render hero status board, stats strip, module roster, skills/cast columns, and footer CTA row; add a per-slug decorative `ComingSoonMotif` SVG; extend `ThemeWaitlistForm` with `idSuffix`/`source`/`ctaLabel` props so it can render twice per page.

**Tech Stack:** Next.js App Router (server components), TypeScript, vitest + @testing-library/react, Playwright e2e. Spec: `docs/superpowers/specs/2026-06-12-coming-soon-stub-redesign-design.md`.

> **COMMIT POLICY (overrides the usual commit steps):** This repo's CLAUDE.md forbids committing on the user's behalf. Do NOT run `git add`/`git commit`. Each task ends with "leave changes uncommitted; report files touched". The user commits.
>
> **COPY RULE:** No em dashes anywhere in user-facing copy (`docs/story-style-bible.md` rule 6).

---

### Task 1: `ThemePreview` types + manifest data + property tests

**Files:**
- Modify: `packages/themes/src/types.ts`
- Modify: `packages/themes/src/signal-ward.ts`
- Modify: `packages/themes/src/neon-protocol.ts`
- Modify: `packages/themes/src/nova-canvas.ts`
- Modify: `packages/themes/src/terra-grid.ts`
- Test: `packages/themes/src/theme-properties.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `packages/themes/src/theme-properties.test.ts`:

```ts
describe("Coming-soon preview data", () => {
  const COMING_SOON = [
    "signal-ward",
    "neon-protocol",
    "nova-canvas",
    "terra-grid",
  ] as const;

  it.each([...COMING_SOON])("theme '%s' has a preview block", (slug) => {
    expect(themes[slug].preview).toBeDefined();
  });

  it.each([...COMING_SOON])(
    "theme '%s' preview has exactly 11 modules ordered 1-11",
    (slug) => {
      const mods = themes[slug].preview!.modules;
      expect(mods).toHaveLength(11);
      expect(mods.map((m) => m.order)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      ]);
    },
  );

  it.each([...COMING_SOON])(
    "theme '%s' preview has exactly one free module (order 1) and one capstone (order 11)",
    (slug) => {
      const mods = themes[slug].preview!.modules;
      const free = mods.filter((m) => m.free);
      const capstone = mods.filter((m) => m.capstone);
      expect(free).toHaveLength(1);
      expect(free[0]!.order).toBe(1);
      expect(capstone).toHaveLength(1);
      expect(capstone[0]!.order).toBe(11);
    },
  );

  it.each([...COMING_SOON])(
    "theme '%s' preview has 8 skills and non-empty status board",
    (slug) => {
      const preview = themes[slug].preview!;
      expect(preview.skills).toHaveLength(8);
      expect(preview.statusBoard.org).toBeTruthy();
      expect(preview.statusBoard.status).toBeTruthy();
      expect(preview.ctaLabel).toBeTruthy();
    },
  );

  it.each([...COMING_SOON])(
    "theme '%s' preview copy contains no em dashes",
    (slug) => {
      const json = JSON.stringify(themes[slug].preview);
      expect(json).not.toContain(" - ");
    },
  );

  it("deep-orbit has no preview block (launched themes do not need one)", () => {
    expect(themes["deep-orbit"]!.preview).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/themes/src/theme-properties.test.ts` (from repo root; use the repo's usual test invocation if different, check `package.json` scripts)
Expected: FAIL, `preview` undefined.

- [ ] **Step 3: Add types**

In `packages/themes/src/types.ts`, before `ThemeManifest`:

```ts
/**
 * One module row in a coming-soon curriculum teaser.
 * Titles come from docs/scripts/<slug>.md module outlines.
 */
export interface ThemePreviewModule {
  /** 1-11 */
  order: number;
  title: string;
  /** Exactly one per theme, always module 1 */
  free?: boolean;
  /** Exactly one per theme, always module 11 */
  capstone?: boolean;
}

/**
 * Teaser data for coming-soon stub pages. Hand-curated; real lesson
 * content for these themes is excluded from the build until launch.
 */
export interface ThemePreview {
  /** In-world framing for the hero, e.g. org board + incident status */
  statusBoard: {
    org: string;
    status: string;
  };
  /** Hero waitlist button label, e.g. "Get paged" */
  ctaLabel: string;
  /** Exactly 11 entries */
  modules: ThemePreviewModule[];
  /** Exactly 8 short skill chips */
  skills: string[];
}
```

Add to `ThemeManifest`:

```ts
  /** Coming-soon teaser data; absent for launched themes */
  preview?: ThemePreview;
```

Export the new interfaces from the package if `index.ts` re-exports types explicitly (check `packages/themes/src/index.ts`; mirror however `ThemeManifest` is exported).

- [ ] **Step 4: Add preview data to all 4 manifests**

`packages/themes/src/signal-ward.ts` (inside the manifest object, after `careerPaths`):

```ts
  preview: {
    statusBoard: {
      org: "MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD",
      status: "SYSTEM OFFLINE · REBUILD PENDING",
    },
    ctaLabel: "Get paged",
    modules: [
      { order: 1, title: "ML Through Text", free: true },
      { order: 2, title: "Tokenization & Preprocessing" },
      { order: 3, title: "Word Embeddings" },
      { order: 4, title: "Sequence Models" },
      { order: 5, title: "Attention Mechanisms" },
      { order: 6, title: "Transformers & BERT" },
      { order: 7, title: "Named Entity Recognition" },
      { order: 8, title: "Text Classification & Triage" },
      { order: 9, title: "Question Answering & RAG" },
      { order: 10, title: "Production NLP & Privacy" },
      { order: 11, title: "Capstone: Diagnostic One", capstone: true },
    ],
    skills: [
      "tokenization",
      "embeddings",
      "RNNs/LSTMs",
      "self-attention",
      "transformers & BERT",
      "NER",
      "RAG",
      "clinical NLP",
    ],
  },
```

`packages/themes/src/neon-protocol.ts`:

```ts
  preview: {
    statusBoard: {
      org: "NEURALCORE HQ · SURVEILLANCE GRID",
      status: "200 CAMERAS DARK · REBUILD PENDING",
    },
    ctaLabel: "Get the signal",
    modules: [
      { order: 1, title: "ML Through Vision", free: true },
      { order: 2, title: "Image Data" },
      { order: 3, title: "Convolutional Neural Networks" },
      { order: 4, title: "Object Detection" },
      { order: 5, title: "Segmentation" },
      { order: 6, title: "Feature Extraction" },
      { order: 7, title: "Transfer Learning" },
      { order: 8, title: "Real-Time Detection" },
      { order: 9, title: "Generative Vision" },
      { order: 10, title: "Deployment" },
      { order: 11, title: "Capstone: Protocol Sentinel", capstone: true },
    ],
    skills: [
      "CNNs",
      "object detection",
      "segmentation",
      "transfer learning",
      "real-time vision",
      "GANs",
      "model optimization",
      "in-browser inference",
    ],
  },
```

`packages/themes/src/nova-canvas.ts`:

```ts
  preview: {
    statusBoard: {
      org: "NOVA LABS · INSTALLATION CONTROL",
      status: "CO-CREATION SYSTEM OFFLINE",
    },
    ctaLabel: "Save my invite",
    modules: [
      { order: 1, title: "Generative Basics", free: true },
      { order: 2, title: "Latent Spaces" },
      { order: 3, title: "Generative Adversarial Networks" },
      { order: 4, title: "Variational Autoencoders" },
      { order: 5, title: "Diffusion Models" },
      { order: 6, title: "Style Transfer" },
      { order: 7, title: "Multimodal Learning" },
      { order: 8, title: "CLIP & Alignment" },
      { order: 9, title: "Audio Generation" },
      { order: 10, title: "Creative Deployment" },
      { order: 11, title: "Capstone: The Biennale", capstone: true },
    ],
    skills: [
      "GANs",
      "VAEs",
      "diffusion models",
      "latent spaces",
      "style transfer",
      "CLIP & multimodal",
      "audio generation",
      "creative deployment",
    ],
  },
```

`packages/themes/src/terra-grid.ts`:

```ts
  preview: {
    statusBoard: {
      org: "TERRA SYSTEMS · GLOBAL OPERATIONS",
      status: "FIELD ACCURACY 67% · INTERVENTION REQUIRED",
    },
    ctaLabel: "Put me on call",
    modules: [
      { order: 1, title: "Edge AI Basics", free: true },
      { order: 2, title: "Model Optimization Fundamentals" },
      { order: 3, title: "Quantization" },
      { order: 4, title: "Pruning & Distillation" },
      { order: 5, title: "Edge Deployment" },
      { order: 6, title: "MLOps Pipelines" },
      { order: 7, title: "Monitoring & Drift Detection" },
      { order: 8, title: "Federated Learning" },
      { order: 9, title: "A/B Testing Models" },
      { order: 10, title: "Scale & Reliability" },
      { order: 11, title: "Capstone: Terra Grid Intelligence", capstone: true },
    ],
    skills: [
      "quantization",
      "pruning & distillation",
      "edge deployment",
      "MLOps pipelines",
      "drift detection",
      "federated learning",
      "A/B testing",
      "reliability at scale",
    ],
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run packages/themes/src/theme-properties.test.ts`
Expected: PASS (all new + all pre-existing tests).

- [ ] **Step 6: Typecheck**

Run the repo's typecheck (check root `package.json`, likely `npm run typecheck` or `turbo typecheck`).
Expected: clean.

- [ ] **Step 7: Leave changes uncommitted; report files touched.**

---

### Task 2: `ComingSoonMotif` decorative SVG

**Files:**
- Create: `apps/web/app/themes/[slug]/coming-soon-motif.tsx`
- Test: `apps/web/app/themes/[slug]/__tests__/coming-soon-motif.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ComingSoonMotif } from "../coming-soon-motif";

describe("ComingSoonMotif", () => {
  it.each(["signal-ward", "neon-protocol", "nova-canvas", "terra-grid"])(
    "renders a decorative aria-hidden svg for %s",
    (slug) => {
      const { container } = render(
        <ComingSoonMotif slug={slug} color="#65C07D" />,
      );
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.getAttribute("aria-hidden")).toBe("true");
    },
  );

  it("falls back to a default motif for unknown slugs", () => {
    const { container } = render(
      <ComingSoonMotif slug="unknown" color="#FFFFFF" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "apps/web/app/themes/[slug]/__tests__/coming-soon-motif.test.tsx"`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`apps/web/app/themes/[slug]/coming-soon-motif.tsx`:

```tsx
interface Props {
  slug: string;
  color: string;
}

/**
 * Decorative per-theme hero motif. Pure presentational SVG; every variant
 * keeps the same viewBox so the hero layout is identical across themes.
 */
export function ComingSoonMotif({ slug, color }: Props) {
  const paths: Record<string, React.ReactNode> = {
    // ECG pulse line
    "signal-ward": (
      <polyline
        points="0,18 180,18 195,18 205,4 215,32 225,18 420,18 435,8 445,28 455,18 800,18"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    ),
    // Camera scanline grid: horizontal sweep + tick marks
    "neon-protocol": (
      <>
        <line x1="0" y1="18" x2="800" y2="18" stroke={color} strokeWidth="2" />
        {[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x) => (
          <line
            key={x}
            x1={x}
            y1="10"
            x2={x}
            y2="26"
            stroke={color}
            strokeWidth="1"
          />
        ))}
        <rect
          x="392"
          y="6"
          width="24"
          height="24"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </>
    ),
    // Audio waveform bars
    "nova-canvas": (
      <>
        {Array.from({ length: 40 }, (_, i) => {
          const heights = [6, 14, 22, 30, 22, 14];
          const h = heights[i % heights.length]!;
          return (
            <line
              key={i}
              x1={i * 20 + 10}
              y1={18 - h / 2}
              x2={i * 20 + 10}
              y2={18 + h / 2}
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
      </>
    ),
    // Topographic grid: baseline + rising contour
    "terra-grid": (
      <>
        <line x1="0" y1="30" x2="800" y2="30" stroke={color} strokeWidth="1" />
        <polyline
          points="0,30 120,26 240,28 360,14 480,20 600,8 720,16 800,12"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="36"
      viewBox="0 0 800 36"
      preserveAspectRatio="none"
    >
      {paths[slug] ?? (
        <polyline
          points="0,18 380,18 392,6 404,30 416,18 800,18"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "apps/web/app/themes/[slug]/__tests__/coming-soon-motif.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Leave changes uncommitted; report files touched.**

---

### Task 3: `ThemeWaitlistForm` props (`idSuffix`, `source`, `ctaLabel`)

**Files:**
- Modify: `apps/web/app/themes/[slug]/theme-waitlist-form.tsx`
- Test: `apps/web/app/themes/[slug]/__tests__/theme-waitlist-form.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeWaitlistForm } from "../theme-waitlist-form";
import { signalWard } from "@tensorcraft/themes";
import { submitWaitlist } from "@/lib/waitlist";

vi.mock("@/lib/waitlist", () => ({
  submitWaitlist: vi.fn().mockResolvedValue("done"),
}));

const baseProps = {
  themeSlug: "signal-ward",
  themeName: "Signal Ward",
  palette: signalWard.palette,
};

describe("ThemeWaitlistForm", () => {
  beforeEach(() => {
    vi.mocked(submitWaitlist).mockClear();
  });

  it("appends idSuffix to input id and testids", () => {
    render(<ThemeWaitlistForm {...baseProps} idSuffix="hero" source="coming-soon-hero" />);
    const input = screen.getByTestId("theme-waitlist-input-signal-ward-hero");
    expect(input.id).toBe("waitlist-signal-ward-hero");
    expect(
      screen.getByTestId("theme-waitlist-submit-signal-ward-hero"),
    ).toBeInTheDocument();
  });

  it("defaults to no suffix and legacy source for backward compatibility", () => {
    render(<ThemeWaitlistForm {...baseProps} />);
    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward"),
    ).toBeInTheDocument();
  });

  it("passes source through to submitWaitlist", async () => {
    render(
      <ThemeWaitlistForm
        {...baseProps}
        idSuffix="footer"
        source="coming-soon-footer"
      />,
    );
    fireEvent.change(
      screen.getByTestId("theme-waitlist-input-signal-ward-footer"),
      { target: { value: "a@b.co" } },
    );
    fireEvent.click(
      screen.getByTestId("theme-waitlist-submit-signal-ward-footer"),
    );
    await waitFor(() =>
      expect(submitWaitlist).toHaveBeenCalledWith(
        "a@b.co",
        "signal-ward",
        "coming-soon-footer",
      ),
    );
  });

  it("renders custom ctaLabel", () => {
    render(<ThemeWaitlistForm {...baseProps} ctaLabel="Get paged" />);
    expect(screen.getByText("Get paged")).toBeInTheDocument();
  });
});
```

Two forms on one page each manage independent state; ids/testids stay unique via the suffix.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "apps/web/app/themes/[slug]/__tests__/theme-waitlist-form.test.tsx"`
Expected: FAIL (unknown props / wrong testids).

- [ ] **Step 3: Implement**

In `theme-waitlist-form.tsx`:

```ts
interface Props {
  themeSlug: string;
  themeName: string;
  palette: ThemePalette;
  /** Distinguishes multiple forms on one page; appended to ids/testids */
  idSuffix?: string;
  /** Analytics source recorded in the waitlist table */
  source?: string;
  /** Submit button label */
  ctaLabel?: string;
}
```

Inside the component:

```ts
export function ThemeWaitlistForm({
  themeSlug,
  themeName,
  palette,
  idSuffix,
  source = "coming-soon-stub",
  ctaLabel = "Notify",
}: Props) {
  const suffix = idSuffix ? `-${idSuffix}` : "";
```

Then replace:
- `submitWaitlist(trimmed, themeSlug, "coming-soon-stub")` with `submitWaitlist(trimmed, themeSlug, source)`
- input `id={`waitlist-${themeSlug}`}` with `` id={`waitlist-${themeSlug}${suffix}`} `` and the label `htmlFor` to match
- `data-testid={`theme-waitlist-input-${themeSlug}`}` with `` data-testid={`theme-waitlist-input-${themeSlug}${suffix}`} ``
- `data-testid={`theme-waitlist-submit-${themeSlug}`}` with `` data-testid={`theme-waitlist-submit-${themeSlug}${suffix}`} ``
- button text `{status === "submitting" ? "..." : "Notify"}` with `{status === "submitting" ? "..." : ctaLabel}`
- success div `data-testid="theme-waitlist-success"` with `` data-testid={`theme-waitlist-success${suffix}`} ``

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "apps/web/app/themes/[slug]/__tests__/theme-waitlist-form.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Search for other usages**

Run: `grep -rn "ThemeWaitlistForm\|theme-waitlist-" apps/web e2e --include="*.ts*" -l`
Confirm only `coming-soon-stub.tsx` renders the form and which tests reference the testids; e2e updates land in Task 5. If the dashboard "Notify me" cards (see `docs/launch-scope.md` change table) also use this component, apply the same default-prop audit there: defaults keep their behavior identical.

- [ ] **Step 6: Leave changes uncommitted; report files touched.**

---

### Task 4: Rewrite `ComingSoonStub`

**Files:**
- Modify: `apps/web/app/themes/[slug]/coming-soon-stub.tsx` (full rewrite)
- Test: `apps/web/app/themes/[slug]/__tests__/coming-soon-stub.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoonStub } from "../coming-soon-stub";
import { signalWard } from "@tensorcraft/themes";
import type { ThemeManifest } from "@tensorcraft/themes";

describe("ComingSoonStub", () => {
  it("renders status board, roster, skills, careers, cast, and both forms", () => {
    render(<ComingSoonStub theme={signalWard} />);

    // Hero status board
    expect(
      screen.getByText("MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SYSTEM OFFLINE · REBUILD PENDING"),
    ).toBeInTheDocument();

    // Roster: 11 modules, free badge, capstone title
    expect(screen.getByText(/ML Through Text/)).toBeInTheDocument();
    expect(screen.getByText("FREE")).toBeInTheDocument();
    expect(screen.getByText(/Capstone: Diagnostic One/)).toBeInTheDocument();

    // Stats strip uses theme terminology
    expect(screen.getByText(/11 Wards/i)).toBeInTheDocument();
    expect(screen.getByText(/55 Procedures/i)).toBeInTheDocument();

    // Skills + careers
    expect(screen.getByText("clinical NLP")).toBeInTheDocument();
    expect(screen.getByText(/NLP Engineer/)).toBeInTheDocument();

    // Cast: first 3 in manifest order with personality, rest in muted line
    expect(
      screen.getByText("Shows concern through action, not speeches"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Khalil, MEDI/)).toBeInTheDocument();

    // Two waitlist forms with distinct ids
    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward-hero"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward-footer"),
    ).toBeInTheDocument();

    // Deep Orbit cross-sell card
    const crossSell = screen.getByRole("link", { name: /deep orbit/i });
    expect(crossSell).toHaveAttribute("href", "/themes/deep-orbit");
  });

  it("hides preview-driven sections when preview is absent", () => {
    const stripped: ThemeManifest = { ...signalWard, preview: undefined };
    render(<ComingSoonStub theme={stripped} />);
    expect(screen.queryByText(/ML Through Text/)).not.toBeInTheDocument();
    expect(screen.queryByText(/11 Wards/i)).not.toBeInTheDocument();
    // Waitlist still renders
    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward-hero"),
    ).toBeInTheDocument();
  });

  it("keeps the JSON-LD PreOrder offer", () => {
    const { container } = render(<ComingSoonStub theme={signalWard} />);
    const ld = container.querySelector('script[type="application/ld+json"]');
    expect(ld!.textContent).toContain("PreOrder");
  });
});
```

Note: copy the mock patterns from `__tests__/module-map-client.test.tsx`: it mocks `next/link` as a plain anchor (do the same here for the cross-sell href assertion), and mock `AmbientBackground` if it breaks jsdom rendering: `vi.mock("@/app/components/ambient-background", () => ({ AmbientBackground: () => null }))`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "apps/web/app/themes/[slug]/__tests__/coming-soon-stub.test.tsx"`
Expected: FAIL (old layout, missing testids).

- [ ] **Step 3: Rewrite the component**

Full replacement of `coming-soon-stub.tsx`. Structure (all styling via the existing inline-palette pattern, 2px borders, `rounded-none`, mono kickers with 0.15-0.2em tracking; follow the current file's idiom):

```tsx
import Link from "next/link";
import type { ThemeManifest } from "@tensorcraft/themes";
import { PRICING } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { ThemeWaitlistForm } from "./theme-waitlist-form";
import { ComingSoonMotif } from "./coming-soon-motif";

interface Props {
  theme: ThemeManifest;
}

// Irregular plurals for theme module/lesson terminology.
const PLURALS: Record<string, string> = { Gallery: "Galleries" };
const plural = (word: string) => PLURALS[word] ?? `${word}s`;

export function ComingSoonStub({ theme }: Props) {
  const slug = theme.slug;
  const preview = theme.preview;
  const palette = theme.palette;
  const modulePlural = plural(theme.terminology.module);
  const lessonPlural = plural(theme.terminology.lesson);
  // Roster prefix: first letter of module term + zero-padded order (W01...)
  const prefix = theme.terminology.module[0]!.toUpperCase();

  const courseJsonLd = { /* unchanged from current file */ };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: palette.bg }}
      data-testid={`coming-soon-stub-${slug}`}
    >
      <script type="application/ld+json" ... />
      <AmbientBackground count={120} />

      {/* 1. HERO: in-world status board */}
      <header className="relative z-10 px-6 md:px-12 pt-12 pb-10" style={{ borderBottom: `1px solid ${palette.border}` }}>
        <div className="max-w-[900px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: palette.accent }}>
              {preview?.statusBoard.org ?? theme.specialization}
              <span className="sr-only"> (coming soon)</span>
            </span>
            {preview && (
              <span className="font-mono text-xs uppercase tracking-[0.15em] px-3 py-1 border-2" style={{ color: palette.accent, borderColor: palette.accent }}>
                {preview.statusBoard.status}
              </span>
            )}
          </div>
          <h1 className="font-mono text-5xl font-bold mb-3 leading-tight" style={{ color: palette.text, letterSpacing: "-0.02em" }}>
            {theme.displayName}
          </h1>
          <p className="text-xl leading-relaxed mb-4" style={{ color: palette.text }}>{theme.tagline}</p>
          <div className="my-5"><ComingSoonMotif slug={slug} color={palette.primary} /></div>
          <p className="text-base leading-relaxed max-w-[560px] mb-7" style={{ color: palette.muted }}>{theme.description}</p>
          <div className="max-w-[480px]">
            <ThemeWaitlistForm
              themeSlug={slug}
              themeName={theme.displayName}
              palette={palette}
              idSuffix="hero"
              source="coming-soon-hero"
              ctaLabel={preview?.ctaLabel ?? "Notify"}
            />
            <p className="font-mono text-xs mt-2" style={{ color: palette.muted }}>
              One email when {theme.displayName} ships. Nothing else.
            </p>
          </div>
        </div>
      </header>

      {/* 2. STATS STRIP (preview-gated) */}
      {preview && (
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 text-center" style={{ borderBottom: `1px solid ${palette.border}` }}>
          {/* cells: 11 {modulePlural} / 55 {lessonPlural} / 1 Capstone Model / {module} 1 Free at Launch */}
          {/* 55 is a fixed launch-scope constant: 11 modules x 5 lessons */}
        </div>
      )}

      {/* 3. MODULE ROSTER (preview-gated) */}
      {preview && (
        <section className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 py-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] mb-5" style={{ color: palette.primary }}>
            The 11 {modulePlural}
          </h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {preview.modules.map((m) => (
              <li
                key={m.order}
                className={`border-2 px-4 py-3 font-mono text-sm ${m.capstone ? "md:col-span-2 text-center" : ""}`}
                style={{
                  background: palette.surface,
                  borderColor: m.free ? palette.primary : m.capstone ? palette.accent : palette.border,
                  color: m.free ? palette.text : m.capstone ? palette.accent : palette.muted,
                }}
              >
                {prefix}{String(m.order).padStart(2, "0")} · {m.title}
                {m.free && (
                  <span className="ml-2 text-xs border px-1.5 py-0.5" style={{ color: palette.primary, borderColor: palette.primary }}>
                    FREE
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. SKILLS + CAST two-column */}
      <section className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 pb-10 grid gap-10 md:grid-cols-2">
        <div>
          {preview && (
            <>
              <h2 ...>What you&rsquo;ll master</h2>
              {/* chip cloud: preview.skills, bordered spans */}
            </>
          )}
          <h2 ...>Where it leads</h2>
          {/* theme.careerPaths lines; wrap the $...K range in a span colored palette.primary.
              Split on the first "(" so "NLP Engineer ($114K-$237K)" renders as
              name + highlighted range. */}
        </div>
        <div>
          <h2 ...>The cast</h2>
          {/* first 3 of theme.characters: name (bold), role (accent), personality (italic, muted) */}
          {/* remaining: one muted line "+ " + names joined ", " */}
        </div>
      </section>

      {/* 5. FOOTER ROW: waitlist repeat + Deep Orbit cross-sell */}
      <section className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 pb-16 grid gap-4 md:grid-cols-2">
        <div className="border-2 p-6" style={{ borderColor: palette.primary, background: palette.surface }}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: palette.primary }}>Waitlist</p>
          <ThemeWaitlistForm
            themeSlug={slug}
            themeName={theme.displayName}
            palette={palette}
            idSuffix="footer"
            source="coming-soon-footer"
            ctaLabel={preview?.ctaLabel ?? "Notify"}
          />
        </div>
        <Link href="/themes/deep-orbit" className="border-2 p-6 block brutalist-hover" style={{ borderColor: palette.border, background: palette.surface }}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: palette.accent }}>Can&rsquo;t wait?</p>
          <p className="font-mono text-sm font-bold mb-2" style={{ color: palette.text }}>Deep Orbit is live now</p>
          <p className="text-sm" style={{ color: palette.muted }}>
            Time-Series &amp; Signals. Same ML foundations track, different world. Start free &rarr;
          </p>
        </Link>
      </section>
    </main>
  );
}
```

The `...` sections follow the exact kicker style shown elsewhere in the file. Keep `courseJsonLd` byte-identical to the current implementation. Contrast rule: never use colors below `palette.muted` for text (WCAG AA).

- [ ] **Step 4: Run tests**

Run: `npx vitest run "apps/web/app/themes/[slug]/__tests__/"`
Expected: all PASS (stub, motif, waitlist form, module-map-client).

- [ ] **Step 5: Visual check**

Start dev server, view `/themes/signal-ward` and `/themes/terra-grid` at desktop + 375px width. Verify: status chip wraps cleanly on mobile, roster collapses to 1 column, no horizontal scroll, motif renders per theme.

- [ ] **Step 6: Leave changes uncommitted; report files touched.**

---

### Task 5: e2e updates, docs, full verification

**Files:**
- Modify: `e2e/themes.spec.ts`
- Modify: `docs/launch-scope.md`
- Verify: full suites

- [ ] **Step 1: Update e2e selectors and extend coverage**

In `e2e/themes.spec.ts`, the existing test references `theme-waitlist-input-neon-protocol`; update to the hero form and assert both forms:

```ts
test("coming-soon theme route renders waitlist stub, not 404", async ({
  page,
}) => {
  const response = await page.goto("/themes/neon-protocol");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByTestId("coming-soon-stub-neon-protocol"),
  ).toBeVisible();
  await expect(
    page.getByTestId("theme-waitlist-input-neon-protocol-hero"),
  ).toBeVisible();
  await expect(
    page.getByTestId("theme-waitlist-input-neon-protocol-footer"),
  ).toBeVisible();
});
```

Add a roster smoke test:

```ts
test("coming-soon stub shows module roster from preview data", async ({
  page,
}) => {
  await page.goto("/themes/signal-ward");
  await expect(page.getByText("W01 · ML Through Text")).toBeVisible();
  await expect(
    page.getByText("W11 · Capstone: Diagnostic One"),
  ).toBeVisible();
});
```

(Prefix = first letter of `terminology.module`; Signal Ward's module term is "Ward", hence "W". Verify the rendered prefix in the browser before finalizing the assertion.)

**Deliberate deviation from spec:** the spec asks e2e to submit the hero form and assert success. Skipped: an e2e submit would insert into the live Supabase waitlist table, and no existing e2e test submits. Source forwarding and form independence are unit-tested in Task 3; e2e asserts both forms render with distinct testids.

Search for any other tests referencing old testids: `grep -rn "theme-waitlist" e2e apps/web --include="*.ts*"` and update all hits.

- [ ] **Step 2: Run e2e themes spec**

Run: `npx playwright test e2e/themes.spec.ts` (use repo's e2e script if different)
Expected: PASS.

- [ ] **Step 3: Amend `docs/launch-scope.md`**

In the "What is gated to 'coming soon'" bullet describing the stub, extend to:

```
- **`/themes/{slug}` for unlaunched themes** renders a stub: in-world status
  board hero, theme motif, hand-curated module roster + skills (manifest
  `preview` block), cast with personality lines, career paths, JSON-LD
  `availability: PreOrder`, and waitlist capture in hero + footer
  (sources `coming-soon-hero` / `coming-soon-footer`).
```

- [ ] **Step 4: Full verification**

Run: typecheck, full vitest, full e2e (commands per root `package.json`).
Expected: all green. Per repo rule, docs + tests must be updated before reporting done.

- [ ] **Step 5: Leave changes uncommitted; report all files touched across tasks for user review and commit.**
