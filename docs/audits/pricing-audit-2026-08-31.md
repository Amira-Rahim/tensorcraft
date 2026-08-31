# Pricing audit and re-price decision (2026-08-31)

Status: decision executed, propagation complete, visual baseline re-mint
pending. Owner decisions recorded below; do not re-litigate them from this
document alone.

## What changed

| Tier | Old (2026-06-20) | New (2026-08-31) | New savings vs per-world retail |
|---|---|---|---|
| Free Preview | $0 | $0 | n/a |
| Single World | $59 | $50 | n/a |
| Two Worlds | $99 | $90 | save $10 (10%) |
| Three Worlds | $129 | $135 | save $15 (10%) |
| All 5 Worlds | $159 | $225 | save $25 (10%) |

Source of truth: `PRICING` in `packages/shared/src/constants.ts`. Checkout
uses Stripe inline `price_data`, so deploying this code is the price change;
there is nothing to update in the Stripe dashboard.

## Decision record

1. **Single World to $50.** Owner instruction, 2026-08-31.
2. **Bundles at a flat 10% off retail** ($90 / $135 / $225). The first
   restructure proposal ($85 / $110 / $135) preserved the old ladder's
   escalating discount percentages (15% / 27% / 46%); the owner rejected
   those savings as excessive and picked the flat-10% rule from an options
   list. Consequence: every bundle lands at the same $45 per-world price, so
   the per-world decay assertion in `packages/shared/src/constants.test.ts`
   is now `<=` between bundles (strict `<` only against the single tier).
3. **No launch promo, no former-price anchor.** The founder-anchor pattern
   was killed 2026-06-21 and the launch-then-raise pattern was rejected in
   the 2026-08-09 spec (`docs/superpowers/specs/2026-08-09-pricing-reevaluation-design.md`).
   Both rulings stand.
4. **Revisit trigger unchanged:** reconsider the single price only on real
   conversion data, earliest at 200 paying users (the world-2 gate).

Bundles remain hidden from every user surface (owner directive 2026-08-14:
future product plans are not shown), so the bundle numbers currently matter
to docs, tests, and the self-retiring JSON-LD offer gate only.

## The question this audit answered

The owner asked: what is the correct price, given that the product has not
been marketed and no testimonials exist? Method: three parallel read-only
sweeps on 2026-08-31 (content inventory of `packages/content`, buyer-facing
trust surfaces in `apps/web/app`, platform feature survey across
`apps/web` and `apps/api`).

## What $50 buys (counted from disk, not from marketing copy)

- 56 lessons across 11 modules (5 free in module 1), ~86,000 words of
  lesson prose, 29.1 declared hours (975 lesson-min + 769 exercise-min).
- 65 live graded exercises. Grading is real: learner code runs in a Web
  Worker against real TensorFlow.js 4.22 with a vitest-compatible harness
  (`packages/ui/src/mdx/exercise-runner.ts`), and CI proves every solution
  passes while every starter fails (`exercise-corpus.test.ts`, allowlist
  empty).
- 168 authored hints (3-level ladder on all 56 lessons), 55 in-lesson
  bridges (each labeled where the analogy breaks), 17 derivation drawers,
  115-entry glossary, 6-step lesson progression, capstone module.
- GitHub artifact pipeline (auto-created repo, per-exercise conventional
  commits, retroactive backfill, AES-256-GCM token storage) and
  hash-verifiable purchase-gated certificates.
- 63 scene plates (100% briefing coverage, CI-pinned), 20 character
  portraits, 11 module patches, two shipped trailers (~70 MB), a live
  TFJS demo in the landing hero.

At $50 that is roughly $1.70 per content hour. Reference band from the
2026-06-20 market audit: Udemy floor $15-25; Wes Bos one-time $80-139;
Joy of React $599; Epic React $695; Frontend Masters $390/yr.

## Trust position (the binding constraint on price)

Present: 5-day no-questions refund (stated in four places), a deep free
module with no account required, a real live model demo, two trailers, an
honest comparison page that concedes ground to fast.ai / Karpathy /
Coursera, full curriculum transparency, an explicit no-invented-testimonials
statement on /paywall.

Absent: any social proof (zero testimonials, counts, reviews, community),
any named human (the collective-anonymity stance is an owner policy,
`app/about/page.tsx`), any legal entity on any page (open GDPR TODO in
`app/privacy/page.tsx`), any payment-processor reassurance at the buy
button, and a reachable /about (one inbound link in the whole app, from
/compare; neither page is in nav or footer... /compare is footer-only).

Weak spots a buyer meets early: module 2 (`neural-networks`) is the
thinnest module in the world (~1,087 words/lesson vs the 1,537 average)
and it is the first thing a buyer sees after paying; the shipped world has
zero quizzes although docs promise them; `public/llms.txt` overclaims
(55 lessons / ~22 hours / 295 exercises vs 56 / 29 / 65 live, and
"Module 1 of every world is free" while four worlds are unbuyable);
`app/terms/page.tsx:99-103` still says purchases are US-only, which
contradicts the EU/UK opening of 2026-08-31.

## Assessment

**$50 is the correct list price. The defensible cold-start band is
$39-$50; sit at the top of it.**

Why not lower:
1. Distribution, not price, is the constraint (fresh-eyes rerun
   2026-07-25). With near-zero traffic, a cut buys nothing; the first 200
   buyers come from the free module converting qualified visitors.
2. $50 already concedes roughly 40% against the $80-139 named-author band
   for being unknown. Cutting further double-counts the trust deficit and
   re-buckets the product with Udemy, wasting the art and film that exist
   to signal otherwise.
3. Prices are sticky here: with anchors and promos ruled out, whatever is
   charged now is the price. $50 keeps a later $59-79 test honest; $29
   forecloses it.

Why not higher: the product has strong artifact credibility and near-zero
human credibility. Until a person is named or real testimonials exist, $50
is the ceiling.

Fallback: if real conversion data shows pricing-page bounce after
free-module completion, drop to $39. Below $39, change strategy (free
world 1 entirely), not the sticker.

Levers that beat a price cut, ranked: (1) name a person (standing owner
rejection noted in `docs/roadmap.md` §2 P3 and the identity-privacy rule;
recorded here as the largest willingness-to-pay suppressor, not reopened);
(2) refund window length (5 days is shorter than the course's own 29
stated hours; 14-30 days is the cheapest trust available; reverses the
owner's 2026-08-23 decision, so owner-only); (3) checkout microcopy
("Secure checkout via Stripe" + refund restatement at the button) and nav
reachability for /about and /compare; (4) fix the llms.txt and terms
overclaims before any marketing push.

## Propagation record (all uncommitted, this session)

Code: `packages/shared/src/constants.ts` (+ its test),
`packages/supabase/seed.ts` ($50 fixture), web tests with hardcoded price
text (`pricing-tiers.test.tsx`, paywall `page.test.tsx`,
`module-map-client.test.tsx`, `world-cards-grid.test.tsx`), two stale
current-fact comments (`course-jsonld.ts`, `pricing-tiers.tsx`).
Public SEO: `public/llms.txt`, `public/.well-known/ai-plugin.json`.
Docs: prd, product-plan (upgrade example now $40 = $90 - $50),
marketing-plan (launch revenue projection now $10,000-$25,000), dev-plan
(history lines note the re-price), api-reference, pre-launch-checklist,
ui-ux-notes, post-launch-backlog.

Verification: shared 17/17, web 681/681 (110 files), api 326/326,
typecheck clean, em-dash and slop-lexicon gates green. Dated audit
snapshots, dated specs, and internally-consistent stored-amount test
fixtures ($49/$129 mock purchases) were left unchanged on purpose, as were
historical narrative comments citing $59.

Not done: visual baseline re-mint (`e2e/visual/*-snapshots`; price text
renders on landing, /pricing, world module maps, paywall). Held pending
owner confirmation of the final single price at time of writing. Follow-up
tasks from this audit live in `docs/post-launch-backlog.md` under
"Pricing re-price follow-ups (2026-08-31)".
