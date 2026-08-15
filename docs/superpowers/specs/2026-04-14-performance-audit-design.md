# Performance Audit - Full Optimization Sweep - Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

No Core Web Vitals monitoring, heavy libraries loaded eagerly (Sandpack), no `next/image` usage, no bundle analysis, no ISR/cache strategy, no Lighthouse CI.

## Solution

Full optimization sweep: monitoring + lazy loading + image optimization + caching + CI enforcement.

## Changes

### 1. Core Web Vitals monitoring via PostHog

**Modify:** `apps/web/app/components/analytics-provider.tsx`

PostHog supports web-vitals capture natively. Enable it in the PostHog init config:

```typescript
posthog.init(key, {
  capture_performance: { web_vitals: true },
  // ... existing config
});
```

This automatically captures LCP, FID, CLS, INP, TTFB and sends them to PostHog's performance dashboard. No custom `reportWebVitals` function needed.

### 2. Lazy-load Sandpack with dynamic import

**Modify:** `packages/ui/src/mdx/exercise.tsx`

The Exercise component imports Sandpack eagerly at the top of the file. Wrap it with `next/dynamic`:

```typescript
import dynamic from "next/dynamic";

const SandpackProvider = dynamic(
  () => import("@codesandbox/sandpack-react").then(m => m.SandpackProvider),
  { ssr: false, loading: () => <ExerciseLoading /> }
);
```

Create a lightweight `ExerciseLoading` skeleton that renders immediately while Sandpack loads.

### 3. Convert avatar to next/image

**Modify:** `apps/web/app/components/user-avatar.tsx`

Replace the plain `<img>` tag with `next/image`:

```tsx
import Image from "next/image";

<Image
  src={avatarUrl}
  alt={displayName}
  width={32}
  height={32}
  className="..."
  unoptimized={avatarUrl.startsWith("http")} // external URLs
/>
```

### 4. Install and configure @next/bundle-analyzer

**Modify:** `apps/web/package.json` - add `@next/bundle-analyzer` as dev dependency
**Modify:** `apps/web/next.config.ts` - wrap config with analyzer when `ANALYZE=true`

```typescript
import withBundleAnalyzer from "@next/bundle-analyzer";
const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default analyze(nextConfig);
```

Add npm script: `"analyze": "ANALYZE=true next build"`

### 5. Add ISR/revalidate to content pages

**Modify:** Theme pages, module pages, lesson pages - add `revalidate` export:

```typescript
export const revalidate = 3600; // Revalidate every hour
```

This enables Incremental Static Regeneration on Vercel - pages are cached and rebuilt in the background.

Pages to add revalidate:
- `apps/web/app/themes/page.tsx` - 3600 (1 hour)
- `apps/web/app/themes/[slug]/page.tsx` - 3600
- `apps/web/app/themes/[slug]/[module]/page.tsx` - 3600
- `apps/web/app/pricing/page.tsx` - 3600
- `apps/web/app/page.tsx` (landing) - 3600

NOT on dynamic pages that need fresh auth data: lesson pages, dashboard, settings, onboarding, auth.

### 6. Add Lighthouse CI to GitHub Actions

**Create:** `.github/workflows/lighthouse.yml`

A workflow that runs Lighthouse on key pages after deployment:
- Landing page
- Pricing page
- Themes page

Uses `treosh/lighthouse-ci-action` with budget assertions:
- Performance score ≥ 80
- LCP < 3s
- CLS < 0.15

Runs on pull requests to main.

### 7. Optimize canvas animations

**Modify:** `apps/web/app/components/ambient-background.tsx`

The particle animation runs at full 60fps with 200+ particles. Add:
- `requestAnimationFrame` throttling to 30fps (every other frame)
- Reduce particle count on mobile: `count={isMobile ? 80 : count}`
- Use `will-change: transform` on the canvas for GPU compositing

## What Doesn't Change

- Font loading - already optimized with next/font + swap
- OG image generation - already edge-optimized
- Middleware performance - already excludes static assets
- Shiki lazy loading - already implemented in CodeBlock

## Verification

1. `pnpm build` passes
2. PostHog dashboard shows LCP/CLS/INP metrics within 24 hours
3. `ANALYZE=true pnpm --filter @tensorcraft/web build` generates bundle report
4. Lighthouse CI runs on PR and reports scores
5. Avatar renders via next/image (check Network tab for /_next/image)
6. Sandpack only loads when an exercise scrolls into view
7. Content pages have `revalidate: 3600` header
8. Tests + docs updated
