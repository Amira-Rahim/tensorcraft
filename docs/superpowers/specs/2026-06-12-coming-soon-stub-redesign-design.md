# Coming-Soon Stub Redesign (all 4 unlaunched themes)

**Date:** 2026-06-12
**Status:** Approved design, pending implementation
**Owner page:** `apps/web/app/themes/[slug]/coming-soon-stub.tsx`

## Problem

The current coming-soon stub (`/themes/signal-ward` and the 3 other unlaunched
themes) is a thin placeholder:

1. Manifest data goes unused: character `personality` lines, `careerPaths`
   with salary ranges, and theme `terminology` are never rendered.
2. "What you'll build" is a single line that repeats the hero description.
3. Layout is imbalanced: the left column runs ~970px, the right ~590px,
   leaving a dead zone under the waitlist form.
4. No atmosphere. The theme palette appears only in small labels and one
   button. No motif, no in-world framing.
5. Weak conversion framing: the waitlist form has no value proposition and
   the Deep Orbit cross-sell is a single underlined text link.

Approved direction: **Hybrid** -- an atmospheric in-world hero plus
substantive body sections, applied to all 4 coming-soon themes.

## Goals

- Make each stub sell both the fantasy (story framing, motif, cast) and the
  outcome (curriculum roster, skills, career paths).
- Promote waitlist capture into the hero; repeat it at the foot of the page.
- Upgrade the Deep Orbit cross-sell from a text link to a card.
- Reuse one layout for all 4 themes, driven by per-theme data.

## Non-goals

- No change to JSON-LD (stays `availability: PreOrder`). A future option is
  `syllabusSections` from the module roster; deliberately out of scope given
  the JSON-LD truthfulness findings in
  `docs/audits/copy-humanization-reaudit-2026-06-10.md`.
- No change to routes, sitemap, pricing, or `LAUNCHED_THEMES` gating.
- No real lesson content. Velite still excludes coming-soon MDX; all roster
  content is hand-curated teaser data.

## Data model

Extend `ThemeManifest` (`packages/themes/src/types.ts`) with an optional
`preview` block, populated in each theme file:

```ts
interface ThemePreviewModule {
  order: number;        // 1-11
  title: string;        // from docs/scripts/<slug>.md module outlines
  free?: boolean;       // exactly one (module 1)
  capstone?: boolean;   // exactly one (module 11)
}

interface ThemePreview {
  statusBoard: {
    org: string;        // e.g. "MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD"
    status: string;     // e.g. "SYSTEM OFFLINE · REBUILD PENDING"
  };
  ctaLabel: string;     // hero waitlist button, e.g. "Get paged"
  modules: ThemePreviewModule[];  // exactly 11
  skills: string[];     // 8 short chips
}

interface ThemeManifest {
  // ...existing fields
  preview?: ThemePreview;
}
```

`preview` is optional; every section that consumes it renders nothing when
absent, so a future theme without preview data degrades to roughly the
current stub. All 4 current coming-soon themes ship with full `preview`
data (decided: scope B, all themes now).

Note: the script docs drift from the manifests in places (script says
"Caduceus Medical Center", manifest says "Meridian General"; the script
protagonist Khalil became the manifest skeptic Dr. Khalil). **Manifests win**
for all names. Script docs are used only for module titles and skill topics,
which are concept-level and stable.

### Per-theme content

Module titles come from `docs/scripts/<slug>.md` module headers (M1 free,
M11 capstone in every theme):

| # | Signal Ward | Neon Protocol | Nova Canvas | Terra Grid |
|---|---|---|---|---|
| 1 | ML Through Text | ML Through Vision | Generative Basics | Edge AI Basics |
| 2 | Tokenization & Preprocessing | Image Data | Latent Spaces | Model Optimization Fundamentals |
| 3 | Word Embeddings | Convolutional Neural Networks | Generative Adversarial Networks | Quantization |
| 4 | Sequence Models | Object Detection | Variational Autoencoders | Pruning & Distillation |
| 5 | Attention Mechanisms | Segmentation | Diffusion Models | Edge Deployment |
| 6 | Transformers & BERT | Feature Extraction | Style Transfer | MLOps Pipelines |
| 7 | Named Entity Recognition | Transfer Learning | Multimodal Learning | Monitoring & Drift Detection |
| 8 | Text Classification & Triage | Real-Time Detection | CLIP & Alignment | Federated Learning |
| 9 | Question Answering & RAG | Generative Vision | Audio Generation | A/B Testing Models |
| 10 | Production NLP & Privacy | Deployment | Creative Deployment | Scale & Reliability |
| 11 | Capstone: Diagnostic One | Capstone: Protocol Sentinel | Capstone: The Biennale | Capstone: Terra Grid Intelligence |

Status boards (both lines derived from each manifest's `description`; the
exact strings below are the spec, no field lookup involved):

- **signal-ward:** "MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD" /
  "SYSTEM OFFLINE · REBUILD PENDING"; CTA "Get paged"
- **neon-protocol:** "NEURALCORE HQ · SURVEILLANCE GRID" /
  "200 CAMERAS DARK · REBUILD PENDING"; CTA "Get the signal"
- **nova-canvas:** "NOVA LABS · INSTALLATION CONTROL" /
  "CO-CREATION SYSTEM OFFLINE"; CTA "Save my invite"
- **terra-grid:** "TERRA SYSTEMS · GLOBAL OPERATIONS" /
  "FIELD ACCURACY 67% · INTERVENTION REQUIRED"; CTA "Put me on call"

Skill chips (8 each):

- **signal-ward:** tokenization, embeddings, RNNs/LSTMs, self-attention,
  transformers & BERT, NER, RAG, clinical NLP
- **neon-protocol:** CNNs, object detection, segmentation, transfer
  learning, real-time vision, GANs, model optimization, in-browser inference
- **nova-canvas:** GANs, VAEs, diffusion models, latent spaces, style
  transfer, CLIP & multimodal, audio generation, creative deployment
- **terra-grid:** quantization, pruning & distillation, edge deployment,
  MLOps pipelines, drift detection, federated learning, A/B testing,
  reliability at scale

Career paths and cast (with personality lines) come from existing manifest
fields; no new data needed.

## Page layout (top to bottom)

All sections render inside the existing theme palette; spacing and brutalist
borders follow the design system (2px borders, rounded-none, JetBrains Mono
labels, 0.15-0.2em letter-spacing uppercase kickers).

1. **Hero (in-world status board).** Org line top-left, status chip
   top-right (accent color). Display name large, tagline, theme motif SVG,
   description (max-w 560px), then the waitlist form inline with the
   per-theme CTA label and microcopy: "One email when {displayName} ships.
   Nothing else." The "Coming soon" badge concept is replaced by the status
   chip, which carries the same information in-world. Keep a visually
   hidden "Coming soon" string for SEO/clarity inside the hero kicker.
2. **Stats strip.** 4 cells, full-width, bordered: "11 {modulePlural}",
   "55 {lessonPlural}" (fixed launch-scope constant, 11 modules x 5
   lessons; not derived from `preview`, which carries no lesson counts), "1 Capstone Model", "{Module 1 term} 1 free at
   launch". Plurals derived by appending "s" to `terminology.module` /
   `terminology.lesson` (Ward/Procedure, Sector/Protocol, Gallery/Session,
   Station/Operation; "Gallerys" is wrong, so use a tiny irregular-plural
   map: Gallery to Galleries).
3. **Module roster.** Kicker "THE 11 {MODULE_PLURAL}". 2-column grid of
   bordered rows: "W01 · Title" style prefix using the first letter of the
   module term + zero-padded order. Module 1 gets a FREE badge and primary
   border; module 11 spans both columns, accent border, centered.
4. **Skills + cast (2 columns).**
   - Left: "WHAT YOU'LL MASTER" chip cloud (8 chips), then "WHERE IT
     LEADS" with `careerPaths` lines, salary range highlighted in primary.
   - Right: "ON SHIFT" (terminology-flavored kicker per theme is overkill;
     use one shared kicker "THE CAST" if "on shift" reads too medical for
     other themes -- implementer's call, single string constant). First 3
     characters in manifest array order as cards with name, role, and the
     personality line in italics; remaining names in one muted line (for
     signal-ward that is "+ Dr. Khalil, MEDI"). No hand-curated selection;
     manifest order is the spec.
5. **Footer row (2 cards).** Left: waitlist repeat, primary border, label
   "WAITLIST", heading reuses CTA framing. Right: Deep Orbit cross-sell
   card, label "CAN'T WAIT?", heading "Deep Orbit is live now", body
   "Time-Series & Signals. Same ML foundations track, different world.
   Start free", linking to `/themes/deep-orbit`.

Mobile: stats strip wraps 2x2, roster and skills/cast collapse to one
column, footer cards stack.

## Components

- **`ComingSoonStub`** (existing, rewritten): stays a server component;
  owns layout and section composition. Sections small enough to live in the
  same file or a sibling `coming-soon-sections.tsx` if it grows past ~300
  lines.
- **`ComingSoonMotif`** (new, server): pure SVG, `aria-hidden`, stroke =
  `palette.primary`, switch on slug: ECG pulse line (signal-ward), camera
  scanline grid (neon-protocol), waveform (nova-canvas), topographic grid
  (terra-grid). Default: flat line with one pulse. No animation in v1
  (respects reduced-motion by default; subtle CSS dash animation optional
  later).
- **`ThemeWaitlistForm`** (existing, modified): rendered twice per page, so:
  - new `idSuffix` prop appended to the input id to keep ids unique;
  - new `source` prop forwarded to `submitWaitlist` (currently hardcoded
    "coming-soon-stub") with values `coming-soon-hero` and
    `coming-soon-footer`, so funnel analytics can compare placements;
  - new optional `ctaLabel` prop (default "Notify");
  - `data-testid`s gain the suffix too (existing e2e selectors must be
    updated in the same change).
- **`AmbientBackground`** stays.

## Accessibility and copy rules

- All text at WCAG 2.1 AA contrast. Microcopy uses `palette.muted`
  (#A0A0A0 family) at minimum; never #707070-on-#1C1C1C (3.9:1, fails).
- Motif SVG is decorative: `aria-hidden="true"`.
- Two waitlist forms: labels stay unique via `idSuffix`; success message
  `role="status"` already present.
- Copy follows `docs/story-style-bible.md`, including rule 6: no em dashes.
- Salary figures, module counts, and titles must match manifests and
  script docs; if curriculum scope changes at authoring time, update
  `preview` data in the same PR (trust rule: no numbers the repo cannot
  back).

## Testing

- **`packages/themes/src/theme-properties.test.ts`**: for every
  coming-soon theme manifest with `preview`: exactly 11 modules, orders
  1-11 unique, exactly one `free` (order 1), exactly one `capstone`
  (order 11), exactly 8 skills, non-empty statusBoard/ctaLabel.
- **Stub component test** (vitest + testing-library, new file next to
  component): renders roster (11 rows), FREE badge once, both waitlist
  forms with distinct input ids, personality lines present, Deep Orbit
  card href, sections absent when `preview` stripped from a fixture
  manifest.
- **e2e**: update existing coming-soon waitlist spec for the new
  `data-testid` suffixes; assert hero form submits and success state shows
  without affecting the footer form.
- Full suites green before done: typecheck, vitest, e2e (per repo rule:
  docs + tests updated before reporting done).

## Documentation updates

- `docs/launch-scope.md`: one-line amendment describing the richer stub
  (still within the "stub page with waitlist" decision).
- `docs/dev-plan.md` untouched (nothing deferred) unless implementation
  defers a section; then record it there.

## Rollout

Single PR. No migrations, no env changes, static content only. Affects 4
routes: `/themes/{neon-protocol,signal-ward,nova-canvas,terra-grid}`.
