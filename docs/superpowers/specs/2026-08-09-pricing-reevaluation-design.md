# Pricing re-evaluation after the character art shipped

Date: 2026-08-09 · Status: approved (user picked "Hold $59, restructure" from
three directions)

## Problem

Deep Orbit gained 16 character portraits and 63 scene plates on 2026-08-09
(commit `2638147`), at a marginal production cost of roughly $5. That raises a
fair question: does the ladder in `PRICING` still price the product honestly?

Investigating it surfaced a second problem larger than the first. The pricing
page sells a five-rung ladder of which only two rungs exist:

- Only `deep-orbit` has launched, so `$0` and `$59` are the only buyable SKUs.
- `$99`, `$129`, and `$159` render as disabled cards. Theme 2 is gated behind
  "theme 1 launched + at least 200 users" (`project_theme2_gate`), so those
  cards are not near-term products.
- The disabled copy reads "Available when more themes launch"
  (`apps/web/app/pricing/pricing-tiers.tsx:411`), which implies a roadmap the
  gate does not promise.
- JSON-LD emits all five offers. **An earlier draft of this spec claimed the
  bundles were marked `PreOrder` and treated that as a defect. That was wrong**,
  and it was corrected on 2026-08-09 during implementation. Audit R3-7 already
  fixed the PreOrder overclaim on 2026-07-19; the offers correctly carry
  `OutOfStock`, and `apps/web/app/pricing/page.tsx` carried a comment saying so.
  The claim came from a stale memory note rather than from reading the function.

  `OutOfStock` is truthful: the product exists in the catalog and is not
  currently purchasable. **No change is warranted here.** What was genuinely
  missing is test coverage, which is what let the original PreOrder value
  survive several audits.

The net effect is an anchoring inversion. A five-card grid whose only live paid
card is the second-cheapest presents $59 as a stripped entry tier, when $59 is
the entire product.

Meanwhile the art itself is invisible on the buying surface. No pricing,
paywall, or marketing surface mentions illustration, portraits, or artwork. The
Single tier's feature list (`pricing-tiers.tsx:317-323`) reads `56 lessons / 11
modules / Capstone / GitHub push / Certificate / Lifetime updates`, a spec sheet
describing a text course.

## Decision

**`PRICING` does not change.** `$0 / $59 / $99 / $129 / $159` in
`packages/shared/src/constants.ts:99-105` stay exactly as they are.

Three reasons:

1. **No market signal exists.** Stripe's flag has never been flipped, so nobody
   has paid anything. The 2026-06-20 raise from $49 to $59 was already made on a
   benchmark audit rather than sales. A second raise on an asset-count change
   would stack an unvalidated guess on an unvalidated guess.
2. **Art is a quality signal, not a scope signal.** Buyers at this price point
   decide on outcome: can I ship a model, does this get me hired. Illustrations
   move completion, word of mouth, and the "not a $15 Udemy course" instinct at
   the moment of decision. Those are conversion and retention levers. Charging
   for them converts an advantage into a tax.
3. **Distribution is the binding constraint**, per the 2026-07-25 fresh-eyes
   rerun. A raise tightens the constraint that is already binding.

What changes instead: the page stops misrepresenting what is for sale, and
starts showing the evidence that justifies the $59 already asked.

### Rejected alternatives

**Raise to $69-79.** Defensible against Wes Bos ($80-130) and far under Epic
React ($695), but it prices an unproven product upward on a $5 cost basis at the
exact moment volume matters for the theme-2 gate. If conversion suffers, the
price and the funnel are not separable after the fact.

**Launch price $39-49, rising to $59 after the gate.** Buys distribution
directly, and the 200-user gate is a clean trigger that makes a later rise
honest. Rejected because the founder-anchor pattern was deliberately killed on
2026-06-21 to avoid fictitious former prices, and this reintroduces a cousin of
it. It also anchors below the premium-indie band the product was built for.

### Revisit trigger

Reconsider `PRICING.single` only on real conversion data from Deep Orbit. The
earliest honest moment to test $79 is 200 paying users, the same threshold as
the theme-2 gate. Art shipping is recorded here as a pricing input that was
considered and deliberately rejected, so the question does not get re-litigated
from scratch.

## Buying surface

`apps/web/app/pricing/pricing-tiers.tsx` currently renders `lg:grid-cols-5`
where three columns are dead. At that width each card gets roughly 230px, which
is why the feature lists are terse mono strings. The layout constraint and the
communication problem are the same problem.

### Two-card decision row

Free and Single take half the row each. Single keeps its `Available Now` ribbon
and its recommended border while it is the only paid tier (the existing
`launchedThemeCount < 5` conditional already does this).

Both cards keep `data-testid` and `data-plan-id` unchanged. `CheckoutButton`,
its `planId` contract, and the analytics hooks are untouched.

### Bundles demote to a roadmap strip

The three bundle tiers stop being cards with dead CTAs and become a compact
ladder that reads as information, not as a cart. No checkout button, no disabled
button, no "BEST VALUE" ribbon.

Condition copy states the actual gate without implying a date. It must not read
as a schedule.

`PRICING.twoBundle`, `.threeBundle`, and `.allFive` stay defined, and the
checkout API keeps accepting them. The API already rejects baskets containing
unlaunched themes via `validateThemeIds` to `isLaunched`, so the plan IDs are
safe to keep alive while unsellable. When `LAUNCHED_THEMES.length` grows, the
cards return off the same constant with no further edit.

### JSON-LD keeps all five offers, and gains its first tests

**Revised 2026-08-09 during implementation**, after the `PreOrder` premise above
proved false.

The offers array is unchanged in content: all five tiers, availability derived
by `availabilityFor`, which already reports `OutOfStock` for anything not yet
launched and flips to `InStock` on its own as themes ship. Filtering the bundles
out was implemented, reviewed, and then reverted, because it would have
overridden a correct and documented decision on a false premise.

What does change is testability. The array was built inline inside the page
component, so nothing could import it, and it had **zero test coverage**. That
is precisely how a stale `PreOrder` string survived multiple audits until a
human noticed it by eye in R3-7.

It moves to `apps/web/app/pricing/pricing-jsonld.ts` behind
`buildPricingOffers()`, with tests asserting that every tier is listed, that
prices come from `PRICING` rather than literals, that availability matches
`LAUNCHED_THEMES.length`, and that **no offer ever carries `PreOrder`**. That
last assertion is the regression guard the human eye was standing in for. It
was verified by reintroducing `PreOrder` and confirming two tests go red.

## Art as purchase evidence

### Ownership split with the art-marketing-surfaces spec

**Revised 2026-08-09 after discovering a conflict.** An earlier approved design,
`docs/superpowers/specs/2026-08-09-art-marketing-surfaces-design.md`, already
owns art distribution across marketing surfaces. Its **Wave 3 is an eleven-frame
module filmstrip on `/pricing#curriculum`**.

This spec originally proposed a three-plate proof strip above the tier cards and
put module thumbnails out of scope on byte grounds. That was written without
knowledge of the other design, and it argued against an approved decision. Two
things the other spec gets right that this one had wrong:

- **Byte cost is already solved.** Wave 3 caps aggregate bytes *at ingest* with
  a script that exits 1, rather than relying on a reviewer to notice. The
  "1.3 MB is too heavy" objection assumed no such enforcement existed.
- **Light mode was unaddressed here.** The art is dark-only raster and light
  mode shipped 2026-07-23. The other spec defines the treatment that makes dark
  plates legible in a light page: 2px `--tc-border`, brass inner rule, and a
  `4px 4px 0` offset shadow in light scheme only, which is the grammar
  `ScenePortrait` already applies at `globals.css:417`. This spec had no answer.

**Resolution: the proof strip is dropped.** All `/pricing` art belongs to the
other spec's Wave 3. This spec owns commercial honesty only: which SKUs are
advertised, which counts are quoted, and what the structured data claims.

**Consequence to accept.** The "Every lesson illustrated" copy below ships
before Wave 3 puts any plate on `/pricing`. That is honest, because the claim
describes the product rather than the page, and it is gated by the coverage test
below. But the page will assert illustration without showing it until Wave 3
lands, which weakens the claim. Sequence Wave 3 soon after this work.

### Feature list copy

The Single tier gains **"Every lesson illustrated."**

Not "63 scenes". All 56 briefings have a plate, so "every lesson" is true and
stays true. The 63 count includes 7 epilogues and drifts the moment epilogue
coverage changes. The count belongs in supporting copy where a test pins it.

The Free tier mentions its art too. `foundations` carries 6 plates, and the free
module is the funnel.

## Truth repairs

Four small fixes, none currently guarded by a test.

1. **`21 bonus deep-dive lessons` is wrong; 23 exist.**
   `pricing-tiers.tsx:268` hardcodes the literal `21`.

   **The correct constant already exists and is already right.**
   `EXTRAS_LESSON_COUNT = 23` lives at
   `packages/content/src/built-themes.ts:51` and was updated correctly by the
   2026-07-27 math gap fill. It is also already pinned to the filesystem,
   transitively: `end-of-lesson.test.ts:43` asserts
   `files.length === EXPECTED_BUILT_LESSONS`, a sum that includes it, so the
   constant cannot drift from the corpus without a red test.

   So this is not a missing constant or a missing gate. It is one surface that
   pasted a literal instead of reading the source of truth. **No new constant
   and no new pin are needed.**

   The fix has one real constraint. `pricing-tiers.tsx` is a client component,
   and `@tensorcraft/content` exports only `.` to `src/index.ts`, which
   re-exports `../.velite`. Importing it client-side would pull compiled
   content into the browser bundle. But `pricing/page.tsx` is a server
   component and already imports `@tensorcraft/content` siblings. So the count
   crosses the boundary as a serializable prop:
   `<PricingTiers extrasLessons={EXTRAS_LESSON_COUNT} />`. One source of
   truth, no mirror, no bundle cost.

2. **"Every lesson illustrated" is gated by coverage, not by a count.**
   Pinning `63` would create exactly the drift this repair is fixing. Instead a
   content test asserts that every built `deep-orbit` lesson has a plate at
   `apps/web/public/scenes/deep-orbit/<module>/<lesson>.webp`. If it passes, the
   claim is true by construction, and it stays true as lessons are added.

3. **Bundle-condition copy** rewritten per the buying-surface section.

4. ~~**JSON-LD bundle offers removed.**~~ **Withdrawn 2026-08-09.** The premise
   was false; see the JSON-LD section above. The offers array keeps all five
   tiers and gains test coverage instead.

5. **Page metadata also advertises the unbuyable bundles.**
   `pricing/page.tsx:13-39` puts `$159` in the `<title>`, the meta description,
   the OpenGraph description, and the Twitter description ("bundles up to
   $159"). This is the same misrepresentation as the JSON-LD offers, on four
   more surfaces.

   Unlike the JSON-LD, this one is a judgement call rather than a clear defect:
   a title reading "From $0 to $159" is a range claim, not an offer, and it
   carries SEO weight. **Flagged for a decision during implementation, not
   changed unilaterally.** The conservative fix is to drop "bundles up to $159"
   from the three descriptions and leave the title alone.

## Verification and blast radius

The server diff is zero. `PRICING`, the checkout API, `validateThemeIds`, and
the Stripe webhook are untouched. This is a presentation change.

The unit-test cost is higher than it first looks. Six of the seven tests in
`pricing-tiers.test.tsx` are written against the five-card shape rather than
against behavior, so they break on a layout change that alters no purchase
logic. Rewriting them is an opportunity to assert what matters (the buyable
SKUs, the plan IDs that reach checkout, the recommended tier) instead of the
card count.

| Surface | Impact |
| --- | --- |
| `apps/web/app/pricing/__tests__/pricing-tiers.test.tsx` | 6 of 7 tests assert the five-card grid and are rewritten. Only "Single tier CTA sends planId=single" (line 183) survives untouched. The `describe` name itself says "brutalist 5-tier grid" and is renamed. |
| `e2e/pricing.spec.ts:14` | `shows all 5 tier cards`. Rewritten. |
| Visual baselines | 6 regenerate: `pricing` and `pricing-light`, plus `pricing-320/768/1024/1440`. |
| Dual axe matrix | Re-run light and dark. New images need alt coverage. |

New tests to add:

- **Scene-plate coverage gate**: every built `deep-orbit` lesson has a plate.
  This is what makes "Every lesson illustrated" safe to print.
- **JSON-LD offer assertions.** No test covered the offers array, which is
  precisely why the `PreOrder` value survived until a human caught it in R3-7.
  Four assertions now cover membership, availability, prices, and a standing
  no-`PreOrder` guard.

No extras-count pin is added; `end-of-lesson.test.ts` already provides it.

## Out of scope

- **All `/pricing` art.** Owned by
  `docs/superpowers/specs/2026-08-09-art-marketing-surfaces-design.md` Wave 3,
  per the ownership split above. This spec adds no images to the page.
- **Any change to `PRICING` values**, per the Decision section.
- **Paywall page restructure.** `apps/web/app/paywall` and
  `pricing/paywall-notice.tsx` keep their current copy. Only the shared refund
  and art claims propagate if they quote counts.
