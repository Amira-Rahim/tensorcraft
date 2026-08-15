# Journey ring redesign - living scene cards, sequential stack

Date: 2026-08-15. Approved by owner in-session after two mockup rounds
(direction B "living scene cards", layout 1 "sequential stack", connectors
unlabeled).

## Problem

The /journey world list rendered five identical gray boxes: number chip,
name, badge row, tagline, repeated "Join waitlist" link. No world identity,
no visual expression of the ring the page exists to sell.

## Design

One component, `JourneyRing`, renders all five worlds as a full-width
vertical stack in ring order, for signed-in AND signed-out visitors (the
separate signed-out `<ol>` in page.tsx is deleted; the page builds guest
world states from the manifests).

**Hero card** - the world the learner should be in: `recommendedNext`,
falling back to the first launched world. Tall card, 2px world-color
border, brutalist shadow, the world's signature `SceneCanvas` animation as
backdrop (hover/focus-ignited, same renderer as homepage strip and
/worlds). Top strip: zero-padded position + specialization (left), status
(right). Name large in the world's palette primary, tagline under it.
Footer: progress meter + "n / m lessons" when signed in and owned. CTA
label by state: Continue (owned), Start (live unowned), Join waitlist
(not launched, e.g. after finishing all live worlds). Whole card links to
`/worlds/[slug]`.

**Slim rows** - every other world: full-width single-line rows. Static
low-opacity scene wash, ignites on hover/focus. Number (world hue,
reduced weight), name in the world's FULL palette primary (AA-verified in
world-properties tests; never alpha-faded text), tagline in sans muted,
right-aligned status label (Complete / In progress / Available / Coming
soon). In-progress rows add a mini meter. Whole row links to the world
page; no repeated waitlist labels (the coming-soon stub hosts the form).

**Connectors** - 2px vertical gradient threads between cards, world i
primary → world i+1 primary, no text. After the last card, a short thread
back to the first with the literal "05 ⟶ 01". Scheme-aware via
`.tc-journey-conn` CSS (dark/light var pairs), mirroring the
`.tc-world-card` `--card-active-primary` mechanism in globals.css.

## Shared cleanup

`SCENE_BY_SLUG` existed in four copies (world-cards-grid,
world-scene-backdrop, coming-soon-scene, five-worlds-section); the ring
would be the fifth. Extracted to `apps/web/lib/scene-by-slug.ts`; all
users import it.

## Accessibility and performance

Canvases `aria-hidden`; card links carry `aria-label` with name + tagline
(+ "coming soon"); progressbar roles kept. Five canvases per page matches
/worlds today. Palette hues come from the AA-gated world manifests.

## Testing

- `journey-ring.test.tsx`: SceneCanvas mocked (world-cards-grid pattern).
  Asserts hero selection (recommendedNext, fallback, not-launched → Join
  waitlist), slim-row statuses, whole-card links, guest variant, meter
  clamp survives.
- Guest state builder unit-tested (pure function).
- /journey axe e2e coverage unchanged (anonymous render still has the
  sign-in band + stack).
- No visual baselines exist for /journey; none minted (canvases would be
  masked anyway).
