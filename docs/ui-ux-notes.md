# Tensorcraft UI/UX Design Notes v3.2

> **⚠ V1 launch-scope revert (2026-05-05):** Only **Deep Orbit** ships at V1.
> Onboarding has **no world picker** - new users auto-route to Deep Orbit
> (see Part 1 below for the pre-revert spec, kept as historical reference
> for when additional worlds launch). The settings "active world" tab is
> removed; the `preferred_world_id` column is retained as a tombstone.
> World cards on the dashboard / `/worlds` / `/learn` render the launched
> world as the live hero, with the other 4 worlds shown as muted
> "coming soon" cards that link to per-world stub pages with email-capture
> forms. Authoritative spec: [`launch-scope.md`](./launch-scope.md).

This document specifies the interaction design, layout, animation, and visual system for the Tensorcraft learning platform. All measurements are in logical pixels unless otherwise noted. All colors reference CSS custom properties defined in the world system (Part 5).

---

## PART 1: WORLD SELECTION SCREEN

### 1.1 Layout

The world selection screen is the first meaningful interaction after signup. It presents all five Tensorcraft worlds as selectable cards.

- **Mobile (default):** Single-column stack (`grid grid-cols-1`). Each card is full-width. Gap: 16px. Container padding: 16px. Cards switch to a horizontal layout on mobile: artwork on the left (40%), text on the right (60%), using `flex-direction: row`. Card height is fixed at 120px on mobile to prevent excessive scrolling.
- **md breakpoint (768px+):** 2-column grid (`md:grid-cols-2`). Gap: 20px. Container padding: 32px. The fifth card spans full width on its own row: `&:last-child { grid-column: 1 / -1; max-width: 50%; margin: 0 auto; }`. Cards have a 3:4 aspect ratio enforced via `aspect-ratio: 3/4`.

---

## PART 2: PROGRESS DIAGRAM DESIGN

### 2.1 Art Style

The progress diagram visualizes the learner's journey through a world's modules and lessons as an interconnected node graph.

- **Style:** Flat, 2D vector art. Clean geometric shapes. Inspired by Figma's layer panel and Linear's project views. Nodes are circles (lessons) connected by straight or gently curved lines (progress paths). Completed sections glow with the world's accent color. The overall aesthetic is minimal, precise, and technical -- consistent with Tensorcraft's developer-tool feel.
- **NOT:** Do not use isometric projection, 3D renders, skeuomorphic elements, or hand-drawn illustration styles. No gradients on nodes (flat fills only). No drop shadows (use border glow for elevation). The diagram should feel like a system diagram or circuit board, not a game map or fantasy adventure path.

### 2.2 Component States

| State | Visual Treatment |
|-------|-----------------|
| **Locked** | Node fill: `--world-bg` (dark). Node border: 1px solid `--world-muted` at 30% opacity. Connection line: dashed, `--world-muted` at 20% opacity. Icon: lock icon (16px, centered in node). Label text: `--world-muted`. Node is non-interactive (no hover state, cursor: default). |
| **Active** | Node fill: `--world-bg`. Node border: 2px solid `--world-accent`. Connection line from previous completed node: solid, `--world-accent`. Subtle pulse animation on border (opacity 0.6 to 1.0, 2s ease-in-out infinite). Icon: play icon (16px, centered). Label text: `--world-text`. Cursor: pointer. Hover: node scale(1.08) with 150ms ease-out. |
| **Completed** | Node fill: `--world-accent` at 15% opacity. Node border: 2px solid `--world-accent`. Connection line to next node: solid, `--world-accent`. Icon: checkmark (16px, `--world-accent`). Label text: `--world-text`. Hover: node scale(1.05) with 150ms ease-out. Click reopens lesson for review. |
| **Connection** | Lines between nodes are SVG `<path>` elements. Default stroke-width: 2px. Completed connections animate a traveling dot (4px circle, `--world-accent`, moves along path over 1.5s ease-in-out, plays once on completion). Active connections have a gradient stroke from `--world-accent` to `--world-muted`. |

### 2.3 Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Node unlock | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) | Previous lesson completed, next node transitions from locked to active |
| Completion burst | 600ms | `ease-out` | Lesson marked complete. Node briefly scales to 1.2, accent-colored particle burst (8 particles, radial), then settles to completed state. |
| Path drawing | 800ms | `ease-in-out` | Connection line animates from source node to destination node using SVG `stroke-dashoffset` animation. Plays when a lesson is completed and the next path becomes visible. |
| Traveling dot | 1500ms | `ease-in-out` | After path drawing completes. A small circle travels along the newly drawn path. Fades in at start, fades out at end. |
| Stats panel slide | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) | User clicks the stats toggle button. Panel slides in from the right (desktop) or up from the bottom (mobile). |
| Node hover | 150ms | `ease-out` | Mouse enters node hitbox. Scale and optional glow intensity increase. |

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, all animations are replaced with instant state changes (0ms duration). The traveling dot is hidden. The completion burst is replaced with a simple opacity fade. Node hover still applies scale but without transition. This is enforced globally via a CSS custom property `--motion-duration` that defaults to the specified duration but is overridden to `0ms` when reduced motion is preferred.

### 2.4 Stats Panel

The stats panel provides an at-a-glance summary of the learner's progress within the current world.

- **Position:** Fixed to the right edge of the progress diagram viewport on desktop (320px wide, full height of diagram area). Slides up from bottom on mobile (full width, max-height 60vh, draggable to dismiss). Overlays the diagram with a semi-transparent backdrop (`rgba(0,0,0,0.3)`).
- **Content:** World completion percentage (large, centered, circular progress ring using SVG). Lessons completed / total lessons. Current streak (consecutive days with at least one lesson completed). Estimated time remaining (based on average lesson duration and remaining lessons). JS bridges encountered / total bridges in world. A mini-heatmap showing activity over the last 30 days (similar to GitHub contribution graph, using world accent color at varying opacities).
- **Style:** Background: `--world-bg` with 1px border in `--world-muted` at 30% opacity. All text in `--world-text`. Numbers and percentages in `--world-accent`. The circular progress ring stroke uses `--world-accent` for the filled portion and `--world-muted` at 20% for the remaining portion. Stroke-width: 8px. Ring diameter: 120px.
- **Dismiss:** Click the X button, press Escape, click outside the panel, or swipe right (desktop) / swipe down (mobile). The panel remembers its open/closed state in localStorage.

### 2.5 Screenshot/Share

Learners can capture and share their progress diagram as an image.

- **Capture method:** Use `html2canvas` to render the progress diagram (excluding the stats panel and UI chrome) to a canvas element. Scale factor: 2x for retina-quality output. Output format: PNG.
- **Watermark:** Bottom-right corner of the captured image includes a subtle Tensorcraft watermark: the Tensorcraft logo (24px height) + "tensorcraft.app" text in `--world-muted` at 50% opacity. The watermark is added programmatically after canvas capture, not rendered in the DOM.
- **Share:** After capture, display a share modal with options: "Download PNG" (primary), "Copy to Clipboard" (using the Clipboard API), and "Share" (using the Web Share API where supported, falling back to Twitter/X and LinkedIn share URLs with pre-filled text). The pre-filled share text: "I've completed [X]% of [World Name] on Tensorcraft! Learning ML through JavaScript concepts." Include the captured image as the share attachment when the Web Share API supports files.
- **Output:** 2x PNG at the diagram's rendered dimensions. Typical output: 2400x1600px for a desktop-width diagram. File name: `tensorcraft-[world]-progress.png`.

---

## PART 3: LESSON UI LAYOUT

### 3.1 Desktop Layout (1280px+)

Three-column layout optimized for simultaneous reading and coding.

- **Sidebar:** Fixed left column, 240px wide. Contains: world logo (32px), module title, lesson list for current module (scrollable if exceeding viewport height), progress indicators (checkmarks for completed lessons, dot for current, lock for locked). Background: `--world-bg` darkened 5%. Border-right: 1px solid `--world-muted` at 20%.
- **Narrative panel:** Center column, 60% of remaining width after sidebar. Contains the lesson narrative: MDX-rendered content with prose text, bridge callouts, diagrams, and embedded interactive elements. Max prose width: 680px, centered within the panel. Padding: 48px horizontal, 32px vertical. Scroll is independent of other columns. The narrative panel is the primary reading surface.
- **Code panel:** Right column, 40% of remaining width. Contains the Sandpack-powered code editor and preview. The panel is split vertically: editor on top (60% height), live preview on bottom (40% height). A draggable divider between editor and preview allows resizing. The code panel has its own scroll context. Background: Sandpack's default dark world, adjusted to match `--world-bg`.

### 3.2 Tablet Layout (768px-1279px)

The sidebar collapses. Narrative and code share the viewport via sticky tabs.

- **Tabs:** Two sticky tabs at the top of the viewport: "Story" and "Code". Tabs are 48px tall, full width, with the active tab indicated by a 2px bottom border in `--world-accent`. Tabs remain visible during scroll (sticky positioning). Tab switch is instant (no animation) to avoid disorienting the reader.
- **Story tab:** Full-width narrative content. Same MDX rendering as desktop. Max prose width: 640px, centered. Padding: 32px.
- **Code tab:** Full-width Sandpack editor and preview. Editor takes 55% height, preview 45%. The tab remembers scroll position when switching -- returning to "Story" restores the previous scroll offset.

### 3.3 Mobile Layout (< 768px)

Single-column layout with careful space management.

- **Navigation:** The sidebar is replaced by a hamburger menu (top-left) that opens a full-screen overlay with the lesson list. The current lesson title is displayed in a 48px top bar.
- **Content:** Single column, full width. Padding: 16px. Prose renders at full width with appropriate font size adjustments (see Part 5 type scale).
- **Code editor:** Embedded inline within the narrative flow at the points where exercises appear. The editor has a minimum height of 300px and a maximum height of 60vh. The preview renders below the editor (not side-by-side). A "Run" button (44px tall, full width) triggers code execution and scrolls to the preview output.
- **Tab navigation:** Dropdown tabs replace the sticky tabs from tablet layout. A dropdown selector at the top allows switching between "Story", "Code", and "Bridges" views. The dropdown is 44px tall with a chevron indicator.

### 3.4 JS Bridge Moments

Bridge moments are the core pedagogical feature -- the point where a JavaScript concept is explicitly mapped to an ML concept. These require special UI treatment.

- **Split-panel view:** When a bridge moment occurs in the narrative, the layout temporarily shifts to a side-by-side comparison. On desktop: the narrative panel splits into two equal columns -- left shows the JS concept (with code example), right shows the ML concept (with code example). A glowing bridge connector (animated SVG line with `--world-accent` color) visually links the two sides. On tablet/mobile: the bridge is presented as a stacked comparison (JS on top, ML below) with the bridge connector rotated to vertical.
- **Sidebar indicator:** In the desktop sidebar, bridge moments are indicated with a small bridge icon (16px) next to the lesson title. Hovering the icon shows a tooltip: "This lesson contains [N] JS-to-ML bridges."
- **Code Hike scrollytelling:** For complex bridges that require step-by-step explanation, use Code Hike's scrollytelling component. The narrative scrolls on the left while the code panel on the right highlights and transitions between code states in sync with the scroll position. Each scroll step corresponds to one mapping point in the bridge. Code Hike annotations highlight the specific lines being discussed with a `--world-accent` background at 15% opacity.

### 3.5 Checkpoint Quiz Component

After every 2-3 lessons, a checkpoint quiz tests comprehension. The quiz is embedded inline in the narrative flow.

- **Radio button targets:** Each answer option is a radio button with a 44px minimum touch target (WCAG 2.5.5 compliant). The radio button is custom-styled: a 20px circle with 2px border in `--world-muted`, filled with `--world-accent` when selected. The label text is positioned to the right of the radio button with 12px gap. Each option has a full-width clickable area (the entire row is the hit target, not just the radio circle).
- **Wrong answer feedback:** When a wrong answer is submitted, the selected option's row flashes red (`#EF4444` at 20% opacity background) and shakes horizontally (3px amplitude, 3 cycles, 300ms total -- CSS `@keyframes shake`). A brief explanation appears below the option in red text: "Not quite. [Explanation of why this is wrong.]" The learner can try again immediately.
- **Correct answer feedback:** When the correct answer is submitted, the row flashes green (`#22C55E` at 20% opacity background). A checkmark icon animates in (scale from 0 to 1, 200ms, spring easing). The explanation appears below: "Correct! [Reinforcement of the concept.]" The page auto-scrolls to bring the next content section into view (smooth scroll, 400ms).

### 3.6 Hint Panel

Each exercise includes a hint system with progressive disclosure.

- **Collapsed default:** Hints are collapsed by default. A "Need a hint?" link (styled as a text button, not a primary CTA) appears below the exercise instructions. Clicking expands the hint panel.

- **3 levels of hints:**
  - **Level 1 (Nudge):** A vague directional hint. "Think about how React handles re-renders when state changes." Revealed on first click.
  - **Level 2 (Guidance):** A more specific hint with a code pattern. "Try using `model.fit()` with a callback that logs the loss value -- similar to how you'd use `useEffect` to track state changes." Revealed on second click (requires explicit "Show more" action).
  - **Level 3 (Solution):** The full solution with explanation. Revealed on third click with a confirmation dialog: "Are you sure? Seeing the solution may reduce the learning impact of solving it yourself." User must click "Show solution" to proceed.

- **Mobile interaction:** On mobile, swipe right on the hint panel to advance to the next hint level. A swipe affordance indicator (three dots with a right-pointing chevron) communicates this gesture. Swiping triggers a subtle haptic feedback pulse (using the Vibration API where supported, 10ms pulse).
- **PostHog tracking:** Track hint usage per exercise: `hint_viewed` event with properties `{ exercise_id, hint_level, time_since_exercise_start }`. This data informs content difficulty calibration -- exercises where >60% of learners need Level 3 hints are flagged for revision.

---

## PART 4: MOBILE-SPECIFIC GUIDANCE

### 4.1 Touch Targets

All interactive elements must meet WCAG 2.5.5 (Enhanced) touch target requirements.

- **Minimum size:** 44x44px for all buttons, links, radio buttons, checkboxes, and interactive controls. This is a hard requirement, not a guideline.
- **Spacing:** Adjacent touch targets must have at least 8px of non-interactive space between them. If two buttons are side-by-side, the gap between their hitboxes must be at least 8px.
- **Implementation:** Use `min-height: 44px; min-width: 44px` on all interactive elements. For inline links within prose text, increase the tap target using `padding: 8px 4px; margin: -8px -4px` to expand the hitbox without affecting visual layout. For icon-only buttons, use `padding: 10px` around a 24px icon to reach the 44px minimum.

### 4.2 Hidden Elements on Mobile

Some UI elements that provide value on desktop create clutter on mobile. These are conditionally hidden.

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar lesson list | Visible (fixed 240px column) | Hidden (accessible via hamburger menu overlay) |
| Stats panel toggle | Visible (icon button in top-right of progress diagram) | Hidden (accessible via "Progress" option in hamburger menu) |
| Bridge connector SVG | Animated glowing line between JS and ML code panels | Hidden (replaced by a static "Bridge" label between stacked panels) |
| Code editor line numbers | Visible | Hidden (saves horizontal space in the 300px editor) |
| Hint level indicators | Visible (3 dots showing current hint level) | Hidden (replaced by swipe gesture with chevron affordance) |
| Breadcrumb navigation | Visible (World > Module > Lesson) | Hidden (replaced by back arrow + lesson title in top bar) |

### 4.3 Device Testing Priority

Test on these devices in priority order. The top 3 cover approximately 80% of the mobile developer audience.

| Priority | Device | Screen Size | Rationale |
|----------|--------|-------------|-----------|
| 1 | iPhone 14/15 Pro | 393x852 (logical) | Most common iOS device among developers. Tests the core mobile experience. |
| 2 | Samsung Galaxy S23/S24 | 360x780 (logical) | Most common Android device in the developer demographic. Tests cross-platform rendering. |
| 3 | iPad Air (10.9") | 820x1180 (logical) | Most popular tablet for developers. Tests the tablet breakpoint and 2-column grid. |
| 4 | iPhone SE (3rd gen) | 375x667 (logical) | Smallest actively used iPhone. Stress-tests the mobile layout at minimum viable width. |
| 5 | Pixel 7 | 412x915 (logical) | Reference Android device with stock Chrome. Tests Android-specific quirks (keyboard behavior, scroll handling). |

---

## PART 5: TYPOGRAPHY AND COLOR SYSTEM

### 5.1 Type Scale

All sizes use a 1.25 ratio (Major Third) scale anchored at 16px body text.

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| `--text-xs` | 12px / 0.75rem | 400 | Captions, timestamps, hint level indicators, code line numbers |
| `--text-sm` | 14px / 0.875rem | 400 | Secondary labels, sidebar lesson titles, breadcrumbs, table cells |
| `--text-base` | 16px / 1rem | 400 | Body text, prose paragraphs, quiz options, button labels |
| `--text-lg` | 20px / 1.25rem | 500 | Section headings within lessons, bridge titles, card titles |
| `--text-xl` | 25px / 1.5625rem | 600 | Lesson titles, module headings, stats panel primary numbers |
| `--text-2xl` | 32px / 2rem | 700 | Page titles, world names on selection screen, hero headings |
| `--text-3xl` | 40px / 2.5rem | 700 | Landing page hero headline, marketing pages only (not used in app) |

**Font stack:** `'JetBrains Mono', ui-monospace, monospace` is the primary body font (set on `<body>` via `var(--font-mono)`). `'Inter', ui-sans-serif, system-ui, sans-serif` is available via `var(--font-sans)` for long-form prose paragraphs only. Both are loaded via `next/font/google` with `display: 'swap'` and subsets `['latin']`.

**Line heights:**

- Body text (16-20px): `line-height: 1.7` (generous for readability in long-form narrative)
- Headings (25-40px): `line-height: 1.3`
- Code: `line-height: 1.6`
- UI labels and buttons: `line-height: 1.4`
- Captions (12px): `line-height: 1.5`

### 5.2 Color System - Brutalist Terminal Aesthetic

Tensorcraft uses a unified "Brutalist Terminal" aesthetic across the entire application. All worlds share the same shell tokens; only `--tc-primary` and `--tc-accent` vary per world. World switching is done via `data-world="<slug>"` on `<html>`. Deep Orbit is the default (applied on `:root`).

CSS custom properties are defined in `packages/worlds/src/css/worlds.css` and consumed by the Tailwind `@world` block in `apps/web/app/globals.css`.

#### 5.2.1 Shared Shell Tokens (identical across all worlds)

| Token | CSS Variable | Value | Notes |
| ------- | ------------- | ------- | ------- |
| Background | `--tc-bg` | `#181818` | Page background for all screens |
| Surface | `--tc-surface` | `#232323` | Cards, panels, modals |
| Surface Overlay | `--tc-surface-overlay` | `#313131` | Elevated surfaces, overlays |
| Text | `--tc-text` | `#E0E0E0` | Body text |
| Muted | `--tc-muted` | `#A0A0A0` | Decorative borders, disabled states, supplementary labels |
| Border | `--tc-border` | `#3D3D3D` | Subtle, low-contrast dividers |
| Code BG | `--tc-code-bg` | `#141414` | Code block backgrounds |

#### 5.2.1b Additional Shell Tokens (derived from primary)

| Token | CSS Variable | Value | Notes |
| ------- | ------------- | ------- | ------- |
| Surface Raised | `--tc-surface-raised` | `#2C2C2C` | Ticker, elevated non-modal content |
| Border Active | `--tc-border-active` | `color-mix(in srgb, var(--tc-primary) 25%, transparent)` | Active card borders |
| Border Subtle | `--tc-border-subtle` | `color-mix(in srgb, var(--tc-primary) 12%, transparent)` | Internal dividers |
| Glow | `--tc-glow` | `color-mix(in srgb, var(--tc-primary) 10%, transparent)` | Header glow |
| Primary Muted | `--tc-primary-muted` | `color-mix(in srgb, var(--tc-primary) 8%, transparent)` | Tinted backgrounds |

> **Rename note:** The old `--tc-glow` (which held a per-world neon hex value) was renamed to `--tc-neon-glow`. The new `--tc-glow` above is a primary-derived `color-mix` token used for header glow effects.

#### 5.2.2 Per-World Tokens (only primary and accent vary)

| World | `--tc-primary` | `--tc-accent` |
| ------- | --------------- | -------------- |
| Deep Orbit | `#6BAA8A` (sage green) | `#A89060` (warm gold) |
| Neon Protocol | `#4A90D9` (steel blue) | `#A07090` (muted mauve) |
| Signal Ward | `#65C07D` (medical green) | `#7096B0` (slate blue) |
| Nova Canvas | `#D07070` (warm red) | `#7868A8` (soft purple) |
| Terra Grid | `#C49535` (industrial amber) | `#6BAA8A` (sage green) |

Each world also defines three bridge-tier tokens derived from the palette: `--tc-tier-identity` (matches primary), `--tc-tier-structural` (`#7096B0`), and `--tc-tier-intuition` (`#A89060`).

#### 5.2.3 Tailwind Utility Remapping

The Tailwind `@world` block in `apps/web/app/globals.css` maps CSS custom properties to utility classes:

- `bg-surface` maps to `--tc-surface` (`#232323`) - used for card and panel backgrounds.
- `bg-page` maps to `--tc-bg` (`#181818`) - used for page-level backgrounds.
- `bg-surface-raised` maps to `--tc-surface-raised` (`#2C2C2C`) - used for ticker and elevated non-modal content.

### 5.3 Design Rules

**Key style rules:**

- Zero border-radius everywhere (`--radius-sm` through `--radius-xl` all set to `0`)
- Offset box shadows: `4px 4px 0 rgba(107,170,138,0.25)`
- JetBrains Mono as primary body font (Inter available for long-form prose only)
- Solid navigation bar: 60px height, no blur or glassmorphism
- `// COMMENT` style monospace uppercase section labels (`.comment-label` utility)
- Buttons: square, offset shadow on hover, `translate(-2px,-2px)` hover state
- No glow effects, no neon lines, no animated gradients, no glassmorphism

**WorldPalette interface** (in `packages/worlds/src/types.ts`):

- `bg`, `primary`, `accent`, `surface`, `surfaceOverlay`, `text`, `muted`, `border`, `codeBg`
- Removed: `glow`, `neonLine` (no longer part of the design system)

**Accessibility requirements:**

- `--tc-text` (`#E0E0E0`) on `--tc-bg` (`#181818`) = 12.1:1 contrast ratio, exceeds WCAG AA (4.5:1).
- `--tc-primary` on `--tc-bg` must meet WCAG AA for large text (3:1 minimum). Verified for all worlds.
- `--tc-muted` (`#A0A0A0`) on `--tc-bg` (`#181818`) = 5.6:1 contrast (meets AA). Safe for body text, labels, and secondary information. Still recommended to use `--tc-text` for primary content.
- Focus indicators: All interactive elements use a 2px `--tc-primary` outline with 2px offset on `:focus-visible`. This is a global style applied in the base CSS. Never suppress or override focus indicators.

**Color scheme note:** Tensorcraft supports both light and dark color schemes (added 2026-07-22). Dark remains the core brand aesthetic and the default look designers should reach for first; light mode is a fully designed second palette, not a neutrals flip, built from darkened versions of the existing dark hues (identity preserved, not swapped) and re-verified to WCAG AA contrast per world. The scheme axis is orthogonal to the narrative-world axis: a `data-scheme="light"` (or `"dark"`) attribute on `<html>` sits alongside the existing `data-world="<slug>"` attribute, and `packages/worlds/src/css/worlds.css` defines `[data-world="<slug>"][data-scheme="light"]` override blocks for the same `--tc-*` custom properties, so every token-driven component works untouched. The active scheme persists in the `tc-scheme` localStorage key (`"light" | "dark" | null`; `null` means "follow the OS"); it defaults to following `prefers-color-scheme` and is overridden the moment the user flips the manual toggle. Shipped 2026-07-23; the [July 23 implementation record](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md#L44) records the verification passes. One deliberate gap: the lesson viewer is chromeless (no site nav), so there is no scheme toggle inside lessons - learners flip scheme from any other page or via the OS.

Canvas scene art gets a genuinely different render language per scheme rather than a recolor: the dark scheme is "light emitted from darkness" (additive `"lighter"` compositing, hues lifted toward white), while the light scheme is "ink on paper" (`"multiply"` compositing, so overlapping marks pool darker like wet ink; hues are deepened toward near-black instead of lifted toward white; base alphas scale up because a tinted ink mark needs more body than a glow on black to read). Scene geometry never branches on scheme, only the render mode does. The `color-scheme` value tracks the active scheme so the browser can style scrollbars, form controls, etc. accordingly, and OG images and favicons intentionally stay dark regardless of scheme. System-level forced colors (Windows High Contrast Mode) are respected via `@media (forced-colors: active)` -- in this mode, all custom colors are replaced with system colors and borders become visible. See `docs/audits/light-mode-readiness-2026-07-22.md` for the design rationale and `docs/superpowers/plans/2026-07-22-light-mode.md` for the implementation plan.

**Character-art motion rules (added 2026-08-05, character animation stream):**

- Character portraits are diegetic stills (personnel-file photos, ship-monitor frames), so an avatar at rest is fully static: no breathing, no scale loops, no idle motion. The permitted motion vocabulary is exactly three moves, all confined to script playback on the Briefing step:
  1. **Entrance**: the portrait "develops" from grayscale to color (opacity + `filter: grayscale`) 0.15s after its dialogue beat reveals; it never gets its own transform, so it cannot fight the beat's translateY.
  2. **Talking**: the newest revealed dialogue's avatar runs a 2px scanline sweep (`.tc-avatar-scan`, `steps(24)`, ~2.2s loop, `--tc-primary` at 35%): a mechanical CRT-refresh read, not a glow. Selected in pure CSS off the `[data-beat-shown]` attributes the playback timeline already stamps.
  3. **Expression crossfade**: `AnimatedAvatar` fades an expression variant over the neutral portrait (240ms opacity), gated on the variant's own `onLoad` so a half-decoded frame never shows.
- ARIA is the exception and the counterpoint: never raster, never a face (character bible hard rule). Her avatar is a live procedural waveform (`AriaWaveformAvatar`, a `SceneDraw` on `SceneCanvas`) whose continuous animation IS her liveness, so she carries no scanline. Her four waveform states map 1:1 to her manifest expression ids.
- All three moves collapse under `prefers-reduced-motion`: the global duration backstop nulls the transitions, the scanline is hidden outright, and playback already short-circuits to the finished state.
- Raster portraits keep their near-black art in BOTH schemes (they cannot re-render like canvas art); the frame presents them as diegetic panels, with the house `4px 4px 0` offset shadow added in light scheme so a panel reads as a mounted print, not a hole in the page.

---

## PART 6: AUTH, ONBOARDING, PAYWALL, AND BRIDGE EXPLORER SCREENS

These four screens were identified as gaps in the original screen inventory and have been added as prototypes.

### 6.1 Auth / Login Screen (`auth.html`)

The signup and login screen provides three authentication methods.

- **Methods:** GitHub OAuth, Google OAuth, and email magic link. Each is presented as a full-width pill button stacked vertically. GitHub button has the GitHub icon + "Continue with GitHub". Google button has the Google icon + "Continue with Google". Email magic link has a text input for email address + "Send Magic Link" submit button.
- **Layout:** Centered card (max-width: 420px) on the `#080B16` background. Card uses `#0F1320` surface with `rgba(255,255,255,0.06)` border. Tensorcraft logo above the card. Headline: "Welcome to Tensorcraft". Subtext toggles between "Sign up" and "Log in" modes via a text link below the form.
- **Post-auth:** Successful signup redirects to the onboarding flow (Section 6.2). Returning users who have completed onboarding are redirected to their dashboard.

### 6.2 Onboarding Flow (`/onboarding` route)

A 3-step post-signup flow that orients the new user.

- **Step 1 - Welcome:** Headline "You Already Think Like an ML Engineer" (matches the landing page hero). Brief value proposition paragraph. "Let's get started" CTA button.
- **Step 2 - Choose World:** Displays available worlds as selectable cards (same card style as world-selection screen but simplified). User picks their starting world. Deep Orbit is pre-highlighted as the recommended first world.
- **Step 3 - Start Learning:** Confirmation screen showing the selected world, estimated time commitment, and a "Begin Module 1" CTA. Also shows a skip option: "Explore other worlds first".
- **Progress indicator:** A 3-dot stepper at the top of the card shows current position (filled dot = current, hollow = remaining).
- **Persistence:** Onboarding completion is stored in the user profile. Users who have completed onboarding are never shown it again.

### 6.3 Paywall / Upgrade Modal (`paywall.html`)

Appears after completing the Module 1 free preview when a free-tier user attempts to access Module 2+.

- **Trigger:** Navigating to any lesson in Module 2 or beyond while on the free tier.
- **Layout:** Centered modal overlay with backdrop blur. Modal card (max-width: 520px) on `#0F1320` surface.
- **Content:** Headline "Unlock the full [World Name] journey". Feature comparison (free vs. paid). Per-model price displayed prominently: "$50 - lifetime access to this world". Pill-shaped CTA: "Unlock [World Name]". Secondary link: "View all worlds" (links to pricing page).
- **Dismiss:** Click outside the modal or X button. User is returned to the Module 1 content they can still access.

> **PRICING DISCREPANCY:** The PRD (Section 8) defines a subscription model ($19/mo Pro, $39/seat Team), but the product-plan (Part 2) and the prototypes use per-model pricing ($50 per world, lifetime access). The paywall prototype implements per-model pricing. This discrepancy must be resolved before V1.0 launch. See also the flag in the PRD.

### 6.4 Bridge Explorer (`bridge-explorer.html`)

A V1.0 feature for browsing all JS-to-ML bridges across worlds.

- **Purpose:** A standalone browsable directory of all 50+ JS-to-ML bridges, not tied to a specific lesson. Allows learners to search and explore bridges by JS concept or ML concept.
- **Layout:** Full-page layout with search bar at top (pill-shaped input). Below: filterable grid of bridge cards. Each card shows: JS concept (left), arrow connector, ML concept (right), one-line summary, and the world it belongs to.
- **Filters:** Filter by world (checkboxes), by ML category (e.g., "Training", "Architecture", "Data Prep"), or by JS category (e.g., "React", "CSS", "DOM").
- **Card interaction:** Clicking a bridge card expands it inline to show the full analogy text, code examples for both JS and ML sides, and a "Go to lesson" link.
- **Responsive:** On mobile, bridge cards stack vertically. The filter panel collapses into a slide-out drawer accessible via a filter icon button.

---

## PART 7: RASTER ART ON MARKETING SURFACES

Added 2026-08-10 with the Deep Orbit location plates. Spec:
`docs/superpowers/specs/2026-08-09-art-marketing-surfaces-design.md`.

### 7.1 The problem this part exists to solve

The Deep Orbit art is dark raster and cannot re-render per colour scheme the
way the procedural canvases do. Light mode ships. So every surface that puts
art behind content has to answer: what happens on paper?

### 7.2 Art is optional by contract

`ArtPlate` (`packages/ui/src/art-plate.tsx`) renders **nothing** when its
image is missing or fails, matching `ScenePortrait`. Components may ship
before their assets, and a surface with no art is byte-identical to the
layout it had before the art existed. Never add a placeholder frame.

The failure has to be proven in a real browser, not only in jsdom: an SSR'd
`<img>` can settle before hydration attaches `onError`, which is what
`useImgSettled` recovers. `e2e/art.spec.ts` aborts the asset route rather
than pointing at a missing file, so the request dies mid-stream.

### 7.3 The frame

A plate is presented as a lit monitor, never bled as a page background:
2px `--tc-border`, a brass inner rule on `--tc-brass`, and the house
`4px 4px 0` offset shadow in light scheme only. `--tc-brass` is constant
across schemes and is deliberately NOT `--tc-accent`, which holds the same
value in dark but darkens to clear AA as text in light.

Full-bleed grounds (`bleed`) drop the frame, because the section's own
borders already do that job.

### 7.4 `tc-on-art`: regions that sit on the art

A region laid over dark art is a lit viewport in a room, not part of the
page surface. In light scheme it opts back onto the dark palette via
`.tc-on-art`. Without it, `--tc-text` (#1f1f1f) lands on a near-black plate
at roughly 1:1.

Three separate overrides are required, and each fixes a different failure:

1. **`--tc-*` tokens** - for anything reading `var(--tc-…)` directly.
2. **`--color-*` tokens** - Tailwind's `@world` emits
   `--color-text-muted: var(--tc-muted)` at `:root`, and a custom property is
   substituted where it is *declared*, so it already computed to the light
   value up there. Redefining `--tc-muted` deeper cannot reach
   `text-text-muted`.
3. **`color`** - inherits as a computed value, so an element with no colour
   of its own already holds body's. Re-resolving it is what reaches headings
   that carry no colour class.

Canvases layered over a plate also keep their **dark** hue: `rgbLight` was
minted for a paper background and all but vanishes on near-black art.

### 7.5 What the gates can and cannot see

- **axe cannot check text over an image.** It compares CSS colours and never
  samples the picture behind. Text on a busy passage of a plate needs a veil
  and a human eye, not a green axe run.
- **The axe suite is unreliable against `next dev`.** Two runs gave 26 and
  then 9 failures on pages the change never touched, barely overlapping, in
  34 minutes; the same suite against a production build gave 37/37 in 14.7s.
  Run accessibility gates against `pnpm build` + `pnpm --filter
  @tensorcraft/web start`, not the dev server.
