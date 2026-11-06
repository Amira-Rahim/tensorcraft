# Marketing Copy Audit - 2026-04-26

Goal: convert without sounding manufactured. AI-tells flagged + rewritten across landing, hero, learn, pricing, themes, analogy-breaks. Tone alignment: terse, technical, brutalist (matches existing "T_ tensorcraft" / "FE → ML · bridge online" voice).

## Files audited

| File | Status |
|---|---|
| `apps/web/app/page.tsx` | edited - final CTA tightened, redundant "explore" CTA reframed |
| `apps/web/app/components/landing-hero.tsx` | edited 2026-05-08 - headline rewrite (curiosity hook: "ML Speaks JavaScript. Turns Out You're Fluent.") + secondary-CTA anchor fix (#five-c-loop → /learn). Same-day audience-callout draft ("ML for Frontend Devs. No Python Required.") iterated past for hook strength. The historical implementation record remains in git history. The [August 31 story-first design](../superpowers/specs/2026-08-31-landing-headline-story-first.md) records the current headline direction. |
| `apps/web/app/components/landing-analogy-breaks.tsx` | removed 2026-05-08 - section deleted from homepage as redundant w/ BRIDGE TIERS + BRIDGE SYSTEM |
| `apps/web/app/themes/page.tsx` | edited - "Whether you're..." pattern removed, direct address |
| `apps/web/app/learn/page.tsx` | edited - "Explore" → "See" |
| `apps/web/app/pricing/page.tsx` | edited - "Explore" → "See", honest "what you don't get" qualifier added |
| `apps/web/app/auth/page.tsx` | clean - tagline already on-brand |
| `apps/web/app/components/landing-bridge-tiers.tsx` | removed 2026-05-08 - section deleted from homepage; tier taxonomy stays in product (lesson callouts, dashboard, glossary) |
| `apps/web/app/components/landing-five-c-loop.tsx` | removed 2026-05-08 - section deleted from homepage; "5C" terminology was internal jargon, not user-facing copy |

## AI-tells found + actions

| Pattern | Where | Action |
|---|---|---|
| "Whether you're a React developer **exploring** neural networks or a Vue engineer..." | `themes/page.tsx:60` | Removed. Replaced with direct list of frameworks + concrete claim |
| "Explore All Themes" CTA (3×) | `learn`, `pricing`, `page.tsx` | "See All 5 Themes" / "Start Module 1" - concrete verbs |
| "discover the gap between the analogy and the real ML the hard way" | `landing-analogy-breaks.tsx:56-59` | Replaced with "Most ML courses use analogies and let you find the gaps in production." Tighter, less Aesopian |
| "Just open the lesson and start reading" + "Or explore our" trailing CTA | `page.tsx:185-203` | Removed redundant "Or explore" CTA. Reframed glossary link as "Want a glossary first? Browse 50 ML terms with FE bridges" - gives concrete reason |
| Em-dash overuse in hero (3 in one paragraph) | `landing-hero.tsx:51-55` | Reduced to 1, replaced others with periods/commas |

## Conversion patterns added

- **Specificity over abstraction**: hero now says "fifty-five lessons, one deployable model" instead of "build amazing models". Numbers convert.
- **Loss-aversion frame**: hero subhead says "stop past the honest limit" - names the cost of NOT taking the course.
- **Honest qualifier (1 line below CTAs)**: "Want to be a research ML engineer in PyTorch? This is not your course." Self-disqualifies the wrong audience, raises trust with the right audience.
- **Pricing footer honesty**: "What you don't get: Python ecosystem, GPU training, paper-grade math beyond chain rule. fast.ai and Karpathy's Zero-to-Hero are excellent and free." Names the alternatives. Strongest credibility move available without testimonials.
- **CTA verb specificity**: every primary CTA is now an action ("Start Module 1", "See All 5 Themes"), no generic "Get Started".

## Tone consistency

Voice held against the auth tagline benchmark ("You Already Think Like an ML Engineer" + footer "FE → ML · bridge online"):
- Direct address (you / your)
- Mono-font signposts ("// HONEST ANALOGIES", "// module 1 · free")
- Technical anchors not metaphors ("245 lessons", "100% coverage")
- No hype words (cutting-edge, world-class, unleash, transform - none present)

## What was deliberately not touched

- Capstone narrative passages - story scaffolding is a brand feature, not marketing copy
- Lesson body MDX - pedagogical voice differs from marketing voice
- Pricing tier table - already concrete and conversion-clean
- `LandingFiveCLoop`, `BridgePreviewSection`, `FiveWorldsSection` - content-design heavy, separate audit pass
- All testimonial / social-proof patterns - deferred per user request

## Verification

```bash
# Em-dash count in hero (target: ≤2 per paragraph)
grep -c " - " apps/web/app/components/landing-hero.tsx

# AI-tell scan (should return 0 user-facing matches; test files OK)
grep -rE "Explore All|Whether you'?re|discover the gap|game-chang|cutting-edge|unleash|transform your" \
  --include="*.tsx" apps/web/app | grep -v "test\|spec\|capstone/page"

# Tone - check honest qualifier present
grep -l "Want to be a research" apps/web/app/components/landing-hero.tsx
grep -l "What you don" apps/web/app/pricing/page.tsx
```

## Next pass (deferred, not blocking)

- Audit `LandingFiveCLoop` + `FiveWorldsSection` + `BridgePreviewSection` for tricolon overload + tonal drift.
- Audit `auth-form.tsx` button labels for conversion specificity.
- Audit `themes/[slug]/page.tsx` dynamic theme intros (5 pages) for hype words.
- Audit blog post titles when blog content lands (Deliverable F).
