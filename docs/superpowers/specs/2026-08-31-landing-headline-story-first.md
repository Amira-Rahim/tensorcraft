# Landing hero - story-first headline

**Date:** 2026-08-31
**Status:** Implemented
**Scope:** Headline rewrite of `LandingHero`; nothing else in the hero moves
**Supersedes:** The May 8 curiosity-hook headline. Its earlier implementation record remains in git history.

## Goal

Lead the homepage with what the product is (a story-driven path from
JavaScript into ML) instead of a curiosity hook that a cold visitor must
decode. Owner decision, 2026-08-31: Tensorcraft has no brand awareness and
distribution is the constraint, so nearly all traffic arrives cold; for a
zero-awareness brand, category clarity in the headline beats cleverness.
The prior headline named no category, and its accented second line ("Turns
Out You're Fluent.") carried no information when read alone, which is how
skimmers read a two-line display headline.

## Prior state

```text
ML SPEAKS JAVASCRIPT.
TURNS OUT YOU'RE FLUENT.
```

Curiosity-hook shape, iterated 2026-05-08. Retired for the reasons above,
not for quality: the hook shape is right for warm traffic, and the fluency
wedge it carried survives elsewhere (bridge section h2 "Every ML Concept
Has a JavaScript Anchor" directly below the hero, onboarding headline "You
Already Think Like an ML Engineer").

## Same-session iteration (2026-08-31)

The owner opened with "Tensorcraft. Stories that will take you from Js to
ML developer". Iteration dropped the brand name from the strongest slot
(the header wordmark already carries it), dropped the hedging "will", and
matched the endpoints (language to language). Two alternatives were offered
and declined: "Machine Learning, Taught as a Story, in JavaScript." and "A
Sci-Fi Story That Teaches You ML in JavaScript." The owner chose their own
tightened line.

Known tradeoff, accepted: "take you from X to Y" is the standard course
template. It is redeemed one scroll down, where the bridge section's
JS-to-ML pairs instantiate "from JavaScript to ML" concretely.

## New state

```text
STORIES THAT
TAKE YOU FROM
JAVASCRIPT TO ML.
```

Three explicit word-group lines, accent (`text-primary`) on the final one.
The hero's 620px column fits about 18 mono characters at text-6xl, so a
two-span layout free-wraps into four lines with "YOU" and "ML." orphaned;
implementing this surfaced that the PRIOR headline had the same fate (it
rendered as four lines, "ML SPEAKS / JAVASCRIPT. / TURNS OUT YOU'RE /
FLUENT.", ever since the 2026-06-10 conversion pass halved the hero for
the demo column; the masked baselines could never show it). The stair
inverts the prior layout's weakness: the visually loudest (accent) line is
the one that survives being read alone. Each non-final span keeps a
trailing space so textContent and the accessibility tree read as one
sentence.

At 320px (text-5xl, ~281px column) the groups wrap further into six
natural word-lines with no clipping; the old headline clipped there
("JAVASCRIPT." is 11 mono chars, about 12px wider than the column).

Everything else in the hero is unchanged: subhead ("Skip Python. Learn
machine learning in JavaScript, in the browser. You'll build a model and
ship it."), both CTAs, and the live Deep Scan demo panel. The subhead
carries the category and method; the demo still proves that ML runs in the
visitor's tab.

**Same-day follow-up (owner request), supersedes the sentence above about
the demo panel:** the live Deep Scan proof panel is REMOVED from the hero
entirely (first its terminal header bar, then, on a second request, the
whole panel). The hero is now a single left-aligned text column over the
ParticleField; the grid, the dynamic `DeepScanDemo` import, and the
`hero-demo-panel` wrapper are gone from `landing-hero.tsx`. `DeepScanDemo`
itself is untouched (an interim `headerLabel: null` contract was reverted
as unused) and still mounts inside lessons; the landing page's live proof
of "ML runs in your tab" now rests on the bridge section and the free
module 1 one click away. Tests inverted to guard the removal
(`page.test.tsx`, `e2e/landing.spec.ts`); the demo settle-waits came out
of both visual specs (nothing to wait for on the landing page); landing
baselines re-minted a third time.

**Third same-day follow-up (owner: "structure the header better to use
this whitespace"):** with the panel gone, the hero's furniture huddled in
the left half. Restructured as a full-width fluid type wall: the headline
scales as `clamp(3rem, 10vw - 1rem, 8.5rem)`. The formula comes from the
longest line (17 mono chars at 0.555em per char: 0.6em advance minus
0.045em tracking) having to clear the `md:px-20` gutters at every width;
the 3rem floor is exactly the old mobile size (no change below ~640px)
and the ceiling stops ultrawide growth at 136px. Below the wall, the
subhead (left) and both CTAs (right) sit on one `justify-between`
baseline row spanning the same measure; the row stacks below `md`.
Measured 48/60.8/112/128px at 320/768/1280/1440, no horizontal overflow.

**Fourth same-day follow-up (owner request):** the bridge section's exit
CTA ("Write your first tensor (a nested array of numbers), free") is
removed along with its bordered strip; the section now ends on the
connection band. The hero's primary CTA and the closing section's CTA
both already point at the same free lesson. Unit test inverted to guard
the removal; landing baselines re-minted.

Incidental fixes while verifying: `e2e/landing.spec.ts` "final CTA opens
the free lesson" is now `test.slow()`. It is the suite's only navigation
into the lesson route, which compiles on demand on a cold local
`next dev` (9.5s measured) on top of compiling "/", and that blew the
default 30s budget (failed 3/3 cold, passed 2/2 warm; unrelated to the
hero change). CI runs `next start` and is unaffected. Also
`npx playwright install webkit` was needed locally: the iPhone SE and
iPad mobile projects run WebKit, and the binary was missing from the
Playwright cache, failing silently in any run piped through `tail`.

## Test impact

`e2e/landing.spec.ts` ("renders hero section with headline") asserts the
headline text and is the real gate: the landing visual baselines
magenta-mask the entire hero (the ParticleField canvas spans it, and
`maskCanvas` masks every canvas), so no baseline can see the headline.
Updated to the new lines.

Landing visual baselines (4x `responsive.spec.ts` widths +
`key-pages.spec.ts` dark and light) re-minted with this change; they were
already stale from the 2026-08-31 re-price. The re-mint surfaced a real
flake: the hero's Deep Scan demo is ssr:false with no IO gate, so fullPage
height at 320px depended on whether capture caught the one-line "loading"
render or the sample rows (108px delta, self-fail on verify). Fixed by
exposing `data-status` on the demo root and waiting for the terminal
"done" state in both visual specs before capture.
