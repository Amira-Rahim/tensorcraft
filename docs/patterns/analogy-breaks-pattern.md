# Pattern: "Where the analogy breaks"

Status: required for `structural` and `intuition` bridges. Optional for `identity`.
Owner: content + UI.
Date: 2026-04-25.

## Problem

73% of Tensorcraft lesson bridges are tier `structural`, 10% are `intuition`. These tiers describe **partial mappings** between an FE concept and an ML concept - same shape, different mechanism. Without an explicit limit statement, a learner who internalizes the analogy will **carry the FE concept's full mental model into ML and predict wrong**.

Concrete failure mode (from sampled CNN architecture lesson):
- Bridge says "CNN layer stack ↔ React component composition" (tier `structural`).
- Learner concludes "I can reorder layers like I reorder children in a Layout."
- Reality: reorder children → layout shifts predictably; reorder CNN layers → model fails to learn anything.

The analogy is real and useful. The unstated limit is what creates the wrong inference.

## Pattern

Every `structural` and `intuition` bridge MUST include a `breaks:` field that answers one question:

> **If a learner pushes this analogy too far, what specific mistake will they make?**

`identity` bridges MAY include `breaks:` but it is rarely needed - by definition the FE concept literally is the ML concept (e.g. `Math.max(0, x) === ReLU`).

## Where it lives

Two places, in precedence order:

1. **Inline in lesson frontmatter** - `concept.bridge.breaks: "..."`. Highest precedence. Use when the analogy break is lesson-specific.
2. **Canonical registry** - `breaks?: string` field on each entry in `packages/shared/src/bridges.ts`. Use when the break is intrinsic to the bridge itself (e.g. "Components are stateless; CNN layers carry mutable weights").

The `BridgeCallout` component renders inline first, falling back to canonical.

## Writing rules

1. **Lead with the concrete failure mode.** Not "the analogy is imperfect" - instead "if you reorder layers like you reorder children, the model fails to learn."
2. **One to three sentences.** Max ~280 chars. If it needs more, the analogy is too weak - consider downgrading the tier.
3. **State both sides.** "Components do X; CNN layers do Y." Symmetry surfaces the gap.
4. **Use technical terms exact.** Don't soften: say "mutable learned weights" not "internal stuff."
5. **No hedging.** Not "may break", "could be different", "in some cases" - state what's true.
6. **No story voice.** This is a technical caveat, not narrative. Skip dialog tags and character names.

## Examples

### Good

> Components are stateless pure functions of props; CNN layers carry mutable learned weights. Reorder React children → layout shifts predictably. Reorder CNN layers → the model loses its learned feature hierarchy and must retrain from scratch.

For "Component composition ↔ CNN layer stack" (structural)

> An rAF loop runs at 60Hz with deterministic frame timing; an epoch runs as fast as the GPU allows and the data takes orders of magnitude longer per iteration. The loop pattern matches; the timescale and determinism do not.

For "rAF loop ↔ Training epoch" (structural)

> A debounce keeps the **most recent** call; NMS keeps the **highest-confidence** box, regardless of order. Both suppress redundant events, but the selection criterion is different.

For "Debounce ↔ Non-Max Suppression" (structural)

### Bad

> ❌ "These are similar but not identical concepts." (vague - every structural bridge is "similar but not identical")
> ❌ "Be careful when applying this analogy in different contexts." (no concrete failure)
> ❌ "Like our character Noor said, sometimes things look the same but aren't." (story voice; no technical content)
> ❌ "It might break in edge cases." (hedging)

## When to skip

- Tier is `identity` AND the codes are literally interchangeable. Adding a `breaks:` here adds noise.
- The bridge is a passing reference in prose, not the primary concept of the lesson.

## When to downgrade tier instead

If you find yourself writing a `breaks:` longer than 3 sentences, the bridge probably isn't the tier you think it is:
- `identity` claimed but you need a caveat → demote to `structural`.
- `structural` claimed but the break is "different domains, same vibe" → demote to `intuition`.
- `intuition` claimed and the break is "almost everything" → drop the bridge, find a stronger one.

## Lifecycle

- New lesson PR: reviewer rejects if structural/intuition bridge missing `breaks:` field.
- Existing lessons: tracked retrofit per `analogy-breaks-retrofit-playbook.md`.
- Canonical registry change: PR adding a structural bridge MUST also add `breaks:`.

## Related

- `packages/shared/src/bridges.ts` - canonical 50-bridge registry.
- `packages/ui/src/mdx/bridge-callout.tsx` - renders the bridge + breaks footer.
- `docs/audits/bridge-tier-audit-2026-04-25.md` - current state of all 295 lesson bridges.
- `docs/patterns/analogy-breaks-retrofit-playbook.md` - rollout plan.
