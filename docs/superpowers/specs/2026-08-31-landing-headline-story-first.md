# Landing hero - story-first headline

**Date:** 2026-08-31
**Status:** Implemented
**Scope:** Headline rewrite of `LandingHero`; nothing else in the hero moves
**Supersedes:** [2026-05-08-landing-headline-audience-callout.md](2026-05-08-landing-headline-audience-callout.md)

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

**Same-day follow-up (owner request):** the demo panel's terminal header
bar ("LIVE DEMO · running in your tab") is removed from the hero. The
`DeepScanDemo` prop contract is now `headerLabel?: string | null`:
`undefined` keeps the lesson default label, `null` omits the bar entirely
(only the hero passes `null`). The panel opens on its framing line, which
already says what it is. Unit tests cover both branches
(`deep-scan-demo.test.tsx`); landing baselines re-minted again.

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
