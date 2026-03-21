# Moat UI Design Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance three moat-related UI surfaces — BridgeCallout (tabbed framework switcher), onboarding framework step (side-by-side selector + live preview), and Skill Genome dashboard (radar chart + progress bars + velocity).

**Architecture:** Each enhancement is a self-contained component change. BridgeCallout is a rewrite of an existing component. Onboarding is a modification to one step in an existing page. Skill Genome is a new component added to the dashboard. All share the existing Zensman DeFi design system (brutalist, dark, monospace, no border-radius).

**Tech Stack:** React 18+, Next.js 15, TypeScript, Tailwind CSS, Vitest + React Testing Library, Supabase (data), SVG (radar chart)

**Spec:** `docs/superpowers/specs/2026-03-21-moat-design-enhancements-design.md`

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `packages/themes/src/css/themes.css` | Add `--tc-axis-*` custom properties | Modify |
| `packages/ui/src/mdx/bridge-callout.tsx` | Tabbed framework switcher component | Rewrite |
| `packages/ui/src/mdx/bridge-callout.test.tsx` | Tests for tabbed BridgeCallout | Rewrite |
| `apps/web/app/onboarding/page.tsx` | Side-by-side framework selector + bridge preview | Modify (step 3) |
| `apps/web/app/dashboard/skill-genome.tsx` | Radar + progress bars + velocity component | Create |
| `apps/web/app/dashboard/page.tsx` | Integrate SkillGenome into dashboard | Modify |

---

### Task 1: Add axis color CSS custom properties to themes

**Files:**
- Modify: `packages/themes/src/css/themes.css`

- [ ] **Step 1: Add axis color variables to Deep Orbit theme block**

In `packages/themes/src/css/themes.css`, after line 31 (`--tc-neon-line: #f0c75e;`), add:

```css
  /* Skill Genome axis colors */
  --tc-axis-data-prep: var(--tc-primary);
  --tc-axis-model-arch: var(--tc-tier-structural);
  --tc-axis-training: var(--tc-tier-intuition);
  --tc-axis-evaluation: #c06060;
  --tc-axis-deployment: #b08030;
  --tc-axis-fe-integration: #4a90d9;
```

- [ ] **Step 2: Add axis color variables to all other theme blocks**

Add the same 6 lines after the `--tc-neon-line` line in each of the 4 remaining theme blocks (Neon Protocol after line 51, Signal Ward after line 71, Nova Canvas after line 91, Terra Grid after line 111).

- [ ] **Step 3: Commit**

```bash
git add packages/themes/src/css/themes.css
git commit -m "feat: add --tc-axis-* CSS custom properties for Skill Genome colors"
```

---

### Task 2: Rewrite BridgeCallout as tabbed framework switcher

**Files:**
- Rewrite: `packages/ui/src/mdx/bridge-callout.tsx`
- Test: `packages/ui/src/mdx/bridge-callout.test.tsx`

- [ ] **Step 1: Write failing tests for the tabbed BridgeCallout**

Rewrite `packages/ui/src/mdx/bridge-callout.test.tsx` with these test cases:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BridgeCallout } from "./bridge-callout";

const bridgeWithVariants = {
  feTitle: "Component Props",
  feCode: "function Card(props) { return props.title; }",
  mlTitle: "Training Data",
  mlCode: "model.fit(trainingData, labels)",
  tier: "structural" as const,
};

const bridgeWithoutVariants = {
  feTitle: "CSS initial values",
  feCode: "div { color: initial; }",
  mlTitle: "Weight initialization",
  mlCode: "tf.initializers.glorotNormal()",
  tier: "structural" as const,
};

describe("BridgeCallout", () => {
  it("returns null when bridge is undefined", () => {
    const { container } = render(<BridgeCallout bridge={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders ML title and code regardless of tab", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByText("Training Data")).toBeInTheDocument();
    expect(screen.getByText(/model\.fit/)).toBeInTheDocument();
  });

  it("renders tab bar with 5 framework tabs when bridge has variants", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
  });

  it("defaults active tab to userFramework prop", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="vue" />);
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    expect(vueTab.getAttribute("aria-selected")).toBe("true");
  });

  it("defaults to vanilla when userFramework is undefined", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    const vanillaTab = screen.getByRole("tab", { name: /vanilla/i });
    expect(vanillaTab.getAttribute("aria-selected")).toBe("true");
  });

  it("switches FE content when clicking a different tab", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="react" />);
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    fireEvent.click(vueTab);
    expect(vueTab.getAttribute("aria-selected")).toBe("true");
  });

  it("shows tier badge with correct label", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByText("Structural Bridge")).toBeInTheDocument();
  });

  it("shows connection text in footer", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByTestId("bridge-footer")).toBeInTheDocument();
  });

  it("falls back to generic layout when bridge has no variants", () => {
    render(<BridgeCallout bridge={bridgeWithoutVariants} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByText("CSS initial values")).toBeInTheDocument();
    expect(screen.getByText("Weight initialization")).toBeInTheDocument();
  });

  it("dims tabs for frameworks without variants", () => {
    // bridgeWithVariants maps to a shared bridge — all 5 frameworks have variants
    // For this test, we need a bridge that matches a shared bridge with partial variants
    // The component checks sharedBridge.variants[fw] for each framework
    render(<BridgeCallout bridge={bridgeWithoutVariants} />);
    // No tablist at all for bridges without any variants — this is the fallback case
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("supports keyboard navigation between tabs", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="react" />);
    const reactTab = screen.getByRole("tab", { name: /react/i });
    fireEvent.keyDown(reactTab, { key: "ArrowRight" });
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    expect(document.activeElement).toBe(vueTab);
  });

  it("activates tab on Enter key after arrow navigation", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="react" />);
    const reactTab = screen.getByRole("tab", { name: /react/i });
    fireEvent.keyDown(reactTab, { key: "ArrowRight" });
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    fireEvent.keyDown(vueTab, { key: "Enter" });
    expect(vueTab.getAttribute("aria-selected")).toBe("true");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx vitest run packages/ui/src/mdx/bridge-callout.test.tsx`
Expected: Multiple FAILs (component doesn't have tabs yet)

- [ ] **Step 3: Rewrite the BridgeCallout component**

Rewrite `packages/ui/src/mdx/bridge-callout.tsx`:

```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import {
  BRIDGES,
  type Framework,
  type BridgeVariant,
} from "@tensorcraft/shared";

interface Bridge {
  feTitle: string;
  feCode: string;
  mlTitle: string;
  mlCode: string;
  tier: "identity" | "structural" | "intuition";
}

interface BridgeCalloutProps {
  bridge: Bridge | undefined;
  userFramework?: Framework;
}

const FRAMEWORKS: Framework[] = ["react", "vue", "angular", "svelte", "vanilla"];

const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: "React",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
  vanilla: "Vanilla",
};

const tierColors: Record<Bridge["tier"], string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

const tierLabels: Record<Bridge["tier"], string> = {
  identity: "Identity Bridge",
  structural: "Structural Bridge",
  intuition: "Intuition Bridge",
};

export function BridgeCallout({ bridge, userFramework }: BridgeCalloutProps) {
  if (!bridge) return null;

  // Find matching shared bridge for variants + connection text
  const sharedBridge = BRIDGES.find(
    (b) => b.feConcept === bridge.feTitle || b.mlConcept === bridge.mlTitle,
  );

  const hasVariants = sharedBridge?.variants && Object.keys(sharedBridge.variants).length > 0;

  // If no variants, render the generic fallback layout
  if (!hasVariants) {
    return <GenericBridgeLayout bridge={bridge} />;
  }

  return (
    <TabbedBridgeLayout
      bridge={bridge}
      sharedBridge={sharedBridge!}
      userFramework={userFramework}
    />
  );
}

/** Generic 3-column layout for bridges without variants */
function GenericBridgeLayout({ bridge }: { bridge: Bridge }) {
  const color = tierColors[bridge.tier];

  return (
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5">
          <h4 className="text-[11px] font-mono uppercase tracking-widest mb-3 text-text-muted">
            Frontend
          </h4>
          <h5 className="text-base font-semibold mb-2 text-text-primary">{bridge.feTitle}</h5>
          <code
            className="block p-3 text-[13px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap"
            style={{ color }}
          >
            {bridge.feCode}
          </code>
        </div>
        <div className="p-5">
          <h4 className="text-[11px] font-mono uppercase tracking-widest mb-3 text-text-muted">
            Machine Learning
          </h4>
          <h5 className="text-base font-semibold mb-2 text-text-primary">{bridge.mlTitle}</h5>
          <code
            className="block p-3 text-[13px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap"
            style={{ color }}
          >
            {bridge.mlCode}
          </code>
        </div>
      </div>
      <div className="text-center py-2 border-t border-border">
        <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color }}>
          {tierLabels[bridge.tier]}
        </span>
      </div>
    </div>
  );
}

/** Tabbed layout with framework switcher */
function TabbedBridgeLayout({
  bridge,
  sharedBridge,
  userFramework,
}: {
  bridge: Bridge;
  sharedBridge: (typeof BRIDGES)[number];
  userFramework?: Framework;
}) {
  const defaultTab = userFramework || "vanilla";
  const [activeTab, setActiveTab] = useState<Framework>(defaultTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const color = tierColors[bridge.tier];
  const variants = sharedBridge.variants!;

  // Resolve current variant
  const variant: BridgeVariant | undefined =
    variants[activeTab] ?? variants.vanilla;
  const feTitle = variant?.feConcept || bridge.feTitle;
  const feCode = variant?.feCode || bridge.feCode;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;
      if (e.key === "ArrowRight") {
        nextIndex = (index + 1) % FRAMEWORKS.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (index - 1 + FRAMEWORKS.length) % FRAMEWORKS.length;
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveTab(FRAMEWORKS[index]);
        return;
      } else {
        return;
      }
      e.preventDefault();
      tabRefs.current[nextIndex]?.focus();
    },
    [],
  );

  return (
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
      {/* Tab bar */}
      <div
        className="flex border-b border-border overflow-x-auto"
        role="tablist"
        aria-label="Framework variants"
      >
        {FRAMEWORKS.map((fw, i) => {
          const isActive = fw === activeTab;
          const hasVariant = !!variants[fw];
          return (
            <button
              key={fw}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-controls="bridge-content"
              tabIndex={isActive ? 0 : -1}
              disabled={!hasVariant}
              onClick={() => hasVariant && setActiveTab(fw)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap"
              style={{
                color: isActive ? color : undefined,
                borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                background: isActive ? `color-mix(in srgb, ${color} 15%, transparent)` : undefined,
                opacity: hasVariant ? 1 : 0.35,
                cursor: hasVariant ? "pointer" : "default",
              }}
            >
              {FRAMEWORK_LABELS[fw]}
            </button>
          );
        })}
        {/* Tier badge */}
        <div className="ml-auto flex items-center gap-1.5 px-4 shrink-0">
          <span
            className="w-1.5 h-1.5 inline-block"
            style={{ background: color }}
          />
          <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color }}>
            {tierLabels[bridge.tier]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        id="bridge-content"
        role="tabpanel"
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border"
      >
        {/* FE side */}
        <div className="p-5">
          <h4 className="text-[10px] font-mono uppercase tracking-widest mb-3 text-text-muted">
            Your Framework
          </h4>
          <h5 className="text-sm font-semibold mb-2 text-text-primary">{feTitle}</h5>
          <code
            className="block p-3 text-[12px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap font-mono"
            style={{ color }}
          >
            {feCode}
          </code>
        </div>
        {/* ML side */}
        <div className="p-5">
          <h4 className="text-[10px] font-mono uppercase tracking-widest mb-3 text-text-muted">
            ML Equivalent
          </h4>
          <h5 className="text-sm font-semibold mb-2 text-text-primary">{bridge.mlTitle}</h5>
          <code
            className="block p-3 text-[12px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap font-mono"
            style={{ color }}
          >
            {bridge.mlCode}
          </code>
        </div>
      </div>

      {/* Connection footer */}
      {sharedBridge.connection && (
        <div
          data-testid="bridge-footer"
          className="px-5 py-3 border-t border-border bg-code-bg"
        >
          <span className="font-mono text-[11px] leading-relaxed text-text-muted">
            <span style={{ color }}>// bridge:</span> {sharedBridge.connection}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx vitest run packages/ui/src/mdx/bridge-callout.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/mdx/bridge-callout.tsx packages/ui/src/mdx/bridge-callout.test.tsx
git commit -m "feat: rewrite BridgeCallout as tabbed framework switcher with ARIA support"
```

---

### Task 3: Rewrite onboarding framework step with side-by-side selector + bridge preview

**Files:**
- Modify: `apps/web/app/onboarding/page.tsx` (step 3 section only, approximately lines 265-310)

- [ ] **Step 1: Verify BRIDGES import exists on onboarding page**

The `BRIDGES` import was already added to `apps/web/app/onboarding/page.tsx` during the moat implementation. Verify it exists at the top of the file:

```typescript
import { BRIDGES } from "@tensorcraft/shared";
```

If missing, add it. Do NOT add a duplicate import.

- [ ] **Step 2: Replace step 3 framework section with side-by-side layout**

Find the step 3 block (the `{step === 3 && (` section that renders the framework radio list) and replace the entire block's inner content with:

```tsx
{step === 3 && (
  <div className="flex flex-col items-center text-center w-full animate-fade-up">
    <div className="font-mono text-[9px] text-primary tracking-[0.15em] mb-3.5">
      // PRIMARY TOOLKIT
    </div>
    <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
      What&apos;s your primary framework?
    </h2>
    <p className="text-sm text-text-muted mb-10">
      Pick yours — we&apos;ll show you a bridge preview.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-0.5 w-full max-w-[560px] text-left">
      {/* Framework list */}
      <div className="flex flex-col gap-0.5">
        {FRAMEWORKS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFramework(f.id)}
            className={`flex items-center gap-3 px-5 py-3.5 text-left transition-all border-2 ${
              framework === f.id
                ? "bg-primary/10 border-primary"
                : "bg-surface border-border"
            }`}
          >
            <span
              className="font-mono text-base w-6 text-center"
              style={{
                color:
                  framework === f.id
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
              }}
            >
              {f.id === "react" ? "⚛" : f.id === "vue" ? "◆" : f.id === "angular" ? "▲" : f.id === "svelte" ? "◐" : "{ }"}
            </span>
            <span
              className="font-mono text-xs"
              style={{
                color:
                  framework === f.id
                    ? "var(--tc-text)"
                    : "var(--tc-muted)",
              }}
            >
              {f.label}
            </span>
          </button>
        ))}
      </div>
      {/* Bridge preview */}
      <div className="bg-surface-raised border border-border p-4">
        {framework ? (
          (() => {
            const previewBridge = BRIDGES.find((b) => b.id === 1);
            const variant =
              previewBridge?.variants?.[framework as keyof typeof previewBridge.variants];
            return (
              <>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted mb-3">
                  // BRIDGE PREVIEW
                </div>
                <div className="font-mono text-[11px] font-semibold text-text-primary mb-2">
                  {previewBridge?.mlConcept} ⇄{" "}
                  {variant?.feConcept || previewBridge?.feConcept}
                </div>
                <div className="bg-code-bg border border-border p-3 font-mono text-[11px] text-primary leading-relaxed whitespace-pre-wrap mb-3">
                  {variant?.feCode || previewBridge?.connection}
                </div>
                <div className="font-mono text-[9px] text-text-muted">
                  This is how bridges will look in your lessons →
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full min-h-[160px]">
            <p className="font-mono text-[11px] text-text-muted text-center">
              Select a framework to preview
              <br />
              your bridges
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify visually**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx next dev --port 3000`
Navigate to `/onboarding`, advance to step 3, click each framework, verify preview updates.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/onboarding/page.tsx
git commit -m "feat: onboarding framework step with side-by-side selector and live bridge preview"
```

---

### Task 4: Create Skill Genome radar chart utility

**Files:**
- Create: `apps/web/app/dashboard/skill-genome.tsx`

- [ ] **Step 1: Create the SkillGenome component**

Create `apps/web/app/dashboard/skill-genome.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";

interface GenomeAxis {
  key: string;
  label: string;
  shortLabel: string;
  proficiency: number; // 0-100
  color: string;       // CSS custom property
}

const AXES: Omit<GenomeAxis, "proficiency">[] = [
  { key: "data_prep", label: "Data Prep", shortLabel: "DATA", color: "var(--tc-axis-data-prep)" },
  { key: "model_arch", label: "Model Arch", shortLabel: "MODEL", color: "var(--tc-axis-model-arch)" },
  { key: "training", label: "Training", shortLabel: "TRAIN", color: "var(--tc-axis-training)" },
  { key: "evaluation", label: "Evaluation", shortLabel: "EVAL", color: "var(--tc-axis-evaluation)" },
  { key: "deployment", label: "Deployment", shortLabel: "DEPLOY", color: "var(--tc-axis-deployment)" },
  { key: "fe_integration", label: "FE Integration", shortLabel: "FE INT", color: "var(--tc-axis-fe-integration)" },
];

interface SkillGenomeProps {
  data: Array<{ skill_axis: string; proficiency: number; velocity: number }>;
}

/** Convert 0-100 proficiency to SVG coordinates on a hexagonal radar */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number,
): [number, number] {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function RadarChart({
  values,
  size,
}: {
  values: number[];
  size: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 24; // padding for labels
  const n = AXES.length;

  // Concentric rings at 33%, 66%, 100%
  const rings = [0.33, 0.66, 1.0];

  // Axis lines
  const axisLines = Array.from({ length: n }, (_, i) => {
    const [x, y] = polarToCartesian(cx, cy, maxR, i, n);
    return `M${cx},${cy} L${x},${y}`;
  });

  // Ring polygons
  const ringPolygons = rings.map((r) => {
    const points = Array.from({ length: n }, (_, i) => {
      const [x, y] = polarToCartesian(cx, cy, maxR * r, i, n);
      return `${x},${y}`;
    }).join(" ");
    return points;
  });

  // Data polygon
  const dataPoints = values.map((v, i) => {
    const r = (v / 100) * maxR;
    const [x, y] = polarToCartesian(cx, cy, r, i, n);
    return { x, y };
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Labels
  const labelPositions = AXES.map((axis, i) => {
    const [x, y] = polarToCartesian(cx, cy, maxR + 16, i, n);
    return { x, y, label: axis.shortLabel };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Axis lines */}
      {axisLines.map((d, i) => (
        <path key={`axis-${i}`} d={d} stroke="var(--tc-border)" strokeWidth="0.5" />
      ))}
      {/* Rings */}
      {ringPolygons.map((points, i) => (
        <polygon key={`ring-${i}`} points={points} fill="none" stroke="var(--tc-border)" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="var(--tc-primary)"
        fillOpacity="0.15"
        stroke="var(--tc-primary)"
        strokeWidth="2"
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="4" fill="var(--tc-primary)" />
      ))}
      {/* Labels */}
      {labelPositions.map((lp, i) => (
        <text
          key={`label-${i}`}
          x={lp.x}
          y={lp.y}
          fill="var(--tc-text)"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}

export function SkillGenome({ data }: SkillGenomeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger bar animations after mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // If no data, show empty state
  if (data.length === 0) {
    return (
      <div className="brutalist-shadow bg-surface-raised border border-border p-5 my-6">
        <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-6">
          // SKILL GENOME
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-4xl text-primary opacity-40 mb-4">◎</span>
          <p className="font-mono text-[13px] text-text-muted text-center mb-4">
            Complete exercises to unlock
            <br />
            your Skill Genome
          </p>
          <div className="w-full max-w-[240px]">
            <div className="h-1 bg-border w-full" />
            <div className="font-mono text-[9px] text-text-muted text-center mt-2">
              0 / 6 axes active
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build axis values from data
  const axisData: GenomeAxis[] = AXES.map((axis) => {
    const match = data.find((d) => d.skill_axis === axis.key);
    return { ...axis, proficiency: match?.proficiency ?? 0 };
  });

  const radarValues = axisData.map((a) => a.proficiency);

  // Compute average velocity across axes that have data
  const velocities = data.filter((d) => d.velocity !== 0).map((d) => d.velocity);
  const avgVelocity =
    velocities.length > 0
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
      : 0;

  const activeAxes = data.filter((d) => d.proficiency > 0).length;

  return (
    <div className="brutalist-shadow bg-surface-raised border border-border overflow-hidden my-6">
      <div className="p-5">
        <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-4">
          // SKILL GENOME
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
          {/* Radar */}
          <div className="flex justify-center sm:justify-start">
            <div className="hidden sm:block">
              <RadarChart values={radarValues} size={200} />
            </div>
            <div className="block sm:hidden">
              <RadarChart values={radarValues} size={160} />
            </div>
          </div>
          {/* Progress bars */}
          <div className="flex flex-col gap-3 justify-center">
            {axisData.map((axis, i) => (
              <div key={axis.key}>
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[9px] text-text-primary">
                    {axis.label}
                  </span>
                  <span
                    className="font-mono text-[9px] font-semibold"
                    style={{ color: axis.color }}
                  >
                    {Math.round(axis.proficiency)}%
                  </span>
                </div>
                <div className="h-1 bg-border">
                  <div
                    className="h-full transition-all ease-out"
                    style={{
                      width: mounted ? `${axis.proficiency}%` : "0%",
                      background: axis.color,
                      transitionDuration: "600ms",
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Velocity bar */}
      <div className="px-5 py-2 border-t border-border bg-surface flex justify-between">
        <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
          Velocity
        </span>
        <span
          className="font-mono text-[9px] font-semibold"
          style={{
            color:
              avgVelocity > 0
                ? "var(--tc-tier-identity)"
                : avgVelocity < 0
                  ? "var(--tc-axis-evaluation)"
                  : "var(--tc-muted)",
          }}
        >
          {avgVelocity > 0
            ? `▲ +${avgVelocity.toFixed(1)} /week`
            : avgVelocity < 0
              ? `▼ ${avgVelocity.toFixed(1)} /week`
              : "— 0.0 /week"}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx tsc --noEmit`
Expected: No type errors (checks the full project, including the new file)

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/skill-genome.tsx
git commit -m "feat: add SkillGenome component with radar chart, progress bars, and velocity"
```

---

### Task 5: Integrate Skill Genome into the dashboard

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx` (server component — fetches data)
- Modify: `apps/web/app/dashboard/dashboard-view.tsx` (client component — renders UI)

**Important context:** The dashboard uses a server/client split. `page.tsx` is a server component that fetches all data and passes it as props to `DashboardView` (a `"use client"` component). `SkillGenome` is a client component, so it must be rendered **inside** `DashboardView`, not directly in `page.tsx`.

- [ ] **Step 1: Add Supabase query for skill_genome data in page.tsx**

In `apps/web/app/dashboard/page.tsx`, add a skill_genome query after the existing `Promise.all` block (after line 59). Use `activeTheme.slug` (not `activeTheme` which is an object):

```typescript
// Fetch skill genome data for the user's active theme
const { data: genomeData } = await supabase
  .from("skill_genome")
  .select("skill_axis, proficiency, velocity")
  .eq("user_id", user.id)
  .eq("theme_id", activeTheme.slug);
```

- [ ] **Step 2: Pass genomeData as a new prop to DashboardView**

In the `<DashboardView ... />` JSX in `page.tsx` (around line 281), add:

```typescript
genomeData={genomeData ?? []}
```

- [ ] **Step 3: Update DashboardView to accept and render SkillGenome**

In `apps/web/app/dashboard/dashboard-view.tsx`:
1. Add `genomeData` to the component's props interface
2. Import: `import { SkillGenome } from "./skill-genome";`
3. Render `<SkillGenome data={genomeData} />` in the appropriate layout position (after module progress, before bridge collection)

- [ ] **Step 4: Verify visually**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx next dev --port 3000`
Navigate to `/dashboard`. Verify:
- With no genome data: empty state shows ("Complete exercises to unlock your Skill Genome")
- Component renders without errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/dashboard/page.tsx apps/web/app/dashboard/dashboard-view.tsx
git commit -m "feat: integrate SkillGenome component into dashboard page"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full test suite**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run build**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && npx turbo build`
Expected: Build succeeds

- [ ] **Step 4: Manual verification checklist**

Verify in the browser:
- [ ] BridgeCallout: 5 tabs visible, clicking tabs changes FE code, ML stays constant
- [ ] BridgeCallout: user's framework tab is active by default
- [ ] BridgeCallout: bridges without variants show generic layout (no tabs)
- [ ] BridgeCallout: arrow key navigation works between tabs
- [ ] Onboarding step 3: side-by-side layout, clicking framework shows bridge preview
- [ ] Onboarding step 3: no selection shows placeholder text
- [ ] Onboarding step 3: mobile view stacks vertically
- [ ] Dashboard: Skill Genome renders empty state for new users
- [ ] Dashboard: progress bars animate on page load with stagger
