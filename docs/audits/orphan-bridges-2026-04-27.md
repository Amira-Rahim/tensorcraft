# Orphan Bridges Audit — 2026-04-27

## Finding

281 orphan bridges (lesson `bridge:` frontmatter not matching canonical 50-bridge registry). **Each appears in exactly one lesson** — no cross-lesson reuse via the orphan inventory. Only 5 FE concepts repeat across 2+ orphans:

- `scrollIntoView()` (2×)
- `Array.map()` (2×)
- `Service Worker Cache` (2×)
- `Load Balancing` (2×)
- `Seeded Random` (2×)

## Interpretation

Orphan bridges are **bespoke analogies**, intentionally crafted per-lesson to fit specific topics. The canonical registry serves a different role: cross-lesson **reusable** anchors (the 50 entries map to ~47 main-path lessons via fuzzy match).

## Recommendation: keep both purposes separate

- **Canonical (50 entries)** — reusable, cross-theme bridges. Each ships `breaks:` (per the analogy-breaks pattern) and is lookup-able via `BridgeCallout`'s registry fallback.
- **Inline (281 entries)** — lesson-specific. Each lesson author writes the bridge that fits the specific topic. All structural+intuition tier orphans already ship inline `breaks:` (verified by audit: 100% coverage on structural+intuition lessons).

## No action recommended

- Promoting orphans to canonical would not increase reuse (each appears only once).
- Pruning would force lessons to align with weaker canonical bridges, hurting pedagogy.
- The IP value of the orphan corpus is exactly that authors crafted topic-specific analogies — that craft is the curriculum.

## Optional: promote the 5 reused FE concepts to canonical

If you want canonical to grow toward total bridge inventory, promoting the 5 above to dedicated registry entries would let those 10 lessons inherit from the canonical fallback instead of carrying inline copy. This is a maintenance nicety, not a competitive change. Not recommended unless authoring continuity becomes an issue.

## Stats

- Canonical registry: 50 bridges (used by ~47 lessons via fuzzy match)
- Inline orphans: 281 bridges (one per lesson)
- All structural+intuition orphans: have inline `breaks:` (100% coverage)

Audit closed: orphan inventory is intentional, not technical debt.
