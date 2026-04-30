/**
 * @tensorcraft/bridges
 *
 * 50 canonical FE↔ML bridges with explicit failure-mode statements ("breaks").
 * Re-exports from the Tensorcraft monorepo's `@tensorcraft/shared` package
 * with no UI dependency. MIT-licensed.
 *
 * Usage:
 *
 *   import { BRIDGES, BRIDGE_TIER_LABELS } from '@tensorcraft/bridges';
 *
 *   const reluBridge = BRIDGES.find(b => b.mlConcept === 'Activation functions (ReLU)');
 *   console.log(reluBridge.feConcept); // 'Math.max(0, x)'
 *   console.log(reluBridge.tier);      // 'identity'
 *
 * Filter by tier:
 *
 *   const honestStructural = BRIDGES.filter(
 *     b => b.tier === 'structural' && b.breaks
 *   );
 */
export {
  BRIDGES,
  BRIDGE_TIER_COLORS,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "@tensorcraft/shared";
export type {
  Bridge,
  BridgeTier,
  BridgeCategory,
  BridgeVariant,
  Framework,
} from "@tensorcraft/shared";
