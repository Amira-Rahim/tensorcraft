# @tensorcraft/bridges

50 canonical analogies from frontend to ML, with explicit failure-mode labels.

```bash
npm install @tensorcraft/bridges
```

```typescript
import { BRIDGES } from "@tensorcraft/bridges";

const relu = BRIDGES.find((b) => b.mlConcept === "Activation functions (ReLU)");
// {
//   id: 14,
//   feConcept: 'Math.max(0, x)',
//   mlConcept: 'Activation functions (ReLU)',
//   tier: 'identity',
//   connection: 'ReLU is literally Math.max(0, x) — same function, same math, different name.',
//   ...
// }
```

## Why this exists

Most ML analogies are right enough to start, wrong enough to mislead in
production. This package ships the analogy-tier system from
[tensorcraft.app](https://tensorcraft.app) — every structural and intuition
bridge includes a `breaks` field that names the concrete failure mode if you
push the analogy too far.

## Tiers

- **`identity`** — the FE concept literally is the ML concept. Example:
  `Math.max(0, x)` is ReLU. No failure mode.
- **`structural`** — same shape, different domain. Example: `Promise.all`
  with chunk size shapes a batch. The `breaks` field names where the
  reasoning diverges (memory budget, gradient noise, etc).
- **`intuition`** — same mental model, different math. Example: gradient
  descent and reconciliation both incrementally reduce a measured gap. The
  `breaks` names what the rhyme leaves out.

## API

```typescript
import {
  BRIDGES, // Bridge[]
  BRIDGE_TIER_LABELS, // { identity: 'Identity', ... }
  BRIDGE_TIER_COLORS, // { identity: '#00D4FF', ... }
  BRIDGE_CATEGORY_LABELS, // { 'deep-orbit': 'Deep Orbit', ... }
  type Bridge,
  type BridgeTier,
  type BridgeCategory,
  type Framework,
} from "@tensorcraft/bridges";
```

`Bridge` shape:

```typescript
interface Bridge {
  id: number;
  mlConcept: string;
  feConcept: string;
  tier: "identity" | "structural" | "intuition";
  connection: string;
  category:
    | "shared"
    | "deep-orbit"
    | "neon-protocol"
    | "signal-ward"
    | "nova-canvas"
    | "terra-grid";
  variants?: Partial<Record<Framework, BridgeVariant>>;
  breaks?: string; // required by content guideline for structural + intuition
}
```

## Examples

Find every bridge with a documented failure mode:

```typescript
import { BRIDGES } from "@tensorcraft/bridges";

const honest = BRIDGES.filter((b) => b.breaks);
// 36+ entries — see them all at https://tensorcraft.app/bridges
```

Group by tier:

```typescript
const byTier = BRIDGES.reduce<Record<string, Bridge[]>>((acc, b) => {
  (acc[b.tier] ||= []).push(b);
  return acc;
}, {});
```

Render a per-framework code variant (React, Vue, Angular, Svelte, vanilla):

```typescript
const propsToTraining = BRIDGES.find((b) => b.id === 1);
const reactCode = propsToTraining?.variants?.react?.feCode;
```

## License

MIT. Use it in your course, blog, slides, conference talk, or internal docs.
A backlink to [tensorcraft.app](https://tensorcraft.app) is appreciated but
not required.

## Contributing

The canonical bridge registry lives at
[github.com/tensorcraft/tensorcraft](https://github.com/tensorcraft/tensorcraft)
in `packages/shared/src/bridges.ts`. PRs welcome — especially new entries
with rigorously written `breaks` fields. See `docs/patterns/analogy-breaks-pattern.md`
for the writing guide.
