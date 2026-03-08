# Tensorcraft UI/UX Design Notes v3.2

This document specifies the interaction design, layout, animation, and visual system for the Tensorcraft learning platform. All measurements are in logical pixels unless otherwise noted. All colors reference CSS custom properties defined in the theme system (Part 5).

---

## PART 1: THEME SELECTION SCREEN

### 1.1 Layout

The theme selection screen is the first meaningful interaction after signup. It presents all five Tensorcraft themes as selectable cards.

- **Desktop (1280px+):** 5-column grid with equal-width cards. `grid-template-columns: repeat(5, 1fr)`. Gap: 24px. Max container width: 1200px, centered. Each card is approximately 216px wide. Cards have a 3:4 aspect ratio enforced via `aspect-ratio: 3/4`.
- **Tablet (768px-1279px):** 2-column grid. `grid-template-columns: repeat(2, 1fr)`. Gap: 20px. Container padding: 32px. The fifth card spans full width on its own row: `&:last-child { grid-column: 1 / -1; max-width: 50%; margin: 0 auto; }`.
- **Mobile (< 768px):** Single-column stack. Each card is full-width. Gap: 16px. Container padding: 16px. Cards switch to a horizontal layout on mobile: artwork on the left (40%), text on the right (60%), using `flex-direction: row`. Card height is fixed at 120px on mobile to prevent excessive scrolling.

### 1.2 Coming Soon Card Design

Themes not yet released display a "Coming Soon" state that conveys anticipation without frustration.

- **Visual treatment:** Card artwork is rendered at 40% opacity with a CSS `grayscale(60%)` filter applied. A diagonal ribbon in the top-right corner reads "Coming Soon" in the theme's accent color on a dark background (`rgba(0,0,0,0.7)`). Ribbon is 120px wide, rotated 45deg, positioned with `overflow: hidden` on the card container. The theme title and one-sentence narrative hook are visible but rendered in `--theme-muted` color (see Part 5).
- **Hover state:** On hover, the card opacity increases to 60% and the grayscale reduces to 30%. A subtle pulse animation plays on the ribbon (opacity oscillates between 0.8 and 1.0, 2s infinite). Cursor changes to `pointer` to indicate the card is interactive. A tooltip appears below the cursor: "Click to get notified when this theme launches."

### 1.3 Coming Soon Click Interaction

Clicking a Coming Soon card opens a slide-up panel (mobile) or a popover card (desktop/tablet) anchored to the clicked card.

- **Panel contents:** Theme key art (full color, no grayscale -- this is the reveal moment). Theme title in `--theme-accent` color. Narrative hook paragraph (2-3 sentences). "Notify me when this launches" email input with submit button. The email input is pre-filled if the user is logged in. A "Learn more about this theme" expandable section with character previews and module outline.
- **Post-submission:** The email input is replaced with a confirmation message: "You're on the list. We'll email you the moment [Theme Name] goes live." The card's ribbon text changes from "Coming Soon" to "Notified" with a checkmark icon. This state persists across sessions (stored in user profile via API, or localStorage for anonymous users).
- **Dismiss:** Click outside the panel, press Escape, or tap the X button. On mobile, swipe down to dismiss the slide-up panel. The panel has a drag handle at the top for swipe affordance.

---

## PART 2: PROGRESS DIAGRAM DESIGN

### 2.1 Art Style

The progress diagram visualizes the learner's journey through a theme's modules and lessons as an interconnected node graph.

- **Style:** Flat, 2D vector art. Clean geometric shapes. Inspired by Figma's layer panel and Linear's project views. Nodes are circles (lessons) connected by straight or gently curved lines (progress paths). Completed sections glow with the theme's accent color. The overall aesthetic is minimal, precise, and technical -- consistent with Tensorcraft's developer-tool feel.
- **NOT:** Do not use isometric projection, 3D renders, skeuomorphic elements, or hand-drawn illustration styles. No gradients on nodes (flat fills only). No drop shadows (use border glow for elevation). The diagram should feel like a system diagram or circuit board, not a game map or fantasy adventure path.

### 2.2 Component States

| State | Visual Treatment |
|-------|-----------------|
| **Locked** | Node fill: `--theme-bg` (dark). Node border: 1px solid `--theme-muted` at 30% opacity. Connection line: dashed, `--theme-muted` at 20% opacity. Icon: lock icon (16px, centered in node). Label text: `--theme-muted`. Node is non-interactive (no hover state, cursor: default). |
| **Active** | Node fill: `--theme-bg`. Node border: 2px solid `--theme-accent`. Connection line from previous completed node: solid, `--theme-accent`. Subtle pulse animation on border (opacity 0.6 to 1.0, 2s ease-in-out infinite). Icon: play icon (16px, centered). Label text: `--theme-text`. Cursor: pointer. Hover: node scale(1.08) with 150ms ease-out. |
| **Completed** | Node fill: `--theme-accent` at 15% opacity. Node border: 2px solid `--theme-accent`. Connection line to next node: solid, `--theme-accent`. Icon: checkmark (16px, `--theme-accent`). Label text: `--theme-text`. Hover: node scale(1.05) with 150ms ease-out. Click reopens lesson for review. |
| **Connection** | Lines between nodes are SVG `<path>` elements. Default stroke-width: 2px. Completed connections animate a traveling dot (4px circle, `--theme-accent`, moves along path over 1.5s ease-in-out, plays once on completion). Active connections have a gradient stroke from `--theme-accent` to `--theme-muted`. |

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

The stats panel provides an at-a-glance summary of the learner's progress within the current theme.

- **Position:** Fixed to the right edge of the progress diagram viewport on desktop (320px wide, full height of diagram area). Slides up from bottom on mobile (full width, max-height 60vh, draggable to dismiss). Overlays the diagram with a semi-transparent backdrop (`rgba(0,0,0,0.3)`).
- **Content:** Theme completion percentage (large, centered, circular progress ring using SVG). Lessons completed / total lessons. Current streak (consecutive days with at least one lesson completed). Estimated time remaining (based on average lesson duration and remaining lessons). FE bridges encountered / total bridges in theme. A mini-heatmap showing activity over the last 30 days (similar to GitHub contribution graph, using theme accent color at varying opacities).
- **Style:** Background: `--theme-bg` with 1px border in `--theme-muted` at 30% opacity. All text in `--theme-text`. Numbers and percentages in `--theme-accent`. The circular progress ring stroke uses `--theme-accent` for the filled portion and `--theme-muted` at 20% for the remaining portion. Stroke-width: 8px. Ring diameter: 120px.
- **Dismiss:** Click the X button, press Escape, click outside the panel, or swipe right (desktop) / swipe down (mobile). The panel remembers its open/closed state in localStorage.

### 2.5 Screenshot/Share

Learners can capture and share their progress diagram as an image.

- **Capture method:** Use `html2canvas` to render the progress diagram (excluding the stats panel and UI chrome) to a canvas element. Scale factor: 2x for retina-quality output. Output format: PNG.
- **Watermark:** Bottom-right corner of the captured image includes a subtle Tensorcraft watermark: the Tensorcraft logo (24px height) + "tensorcraft.dev" text in `--theme-muted` at 50% opacity. The watermark is added programmatically after canvas capture, not rendered in the DOM.
- **Share:** After capture, display a share modal with options: "Download PNG" (primary), "Copy to Clipboard" (using the Clipboard API), and "Share" (using the Web Share API where supported, falling back to Twitter/X and LinkedIn share URLs with pre-filled text). The pre-filled share text: "I've completed [X]% of [Theme Name] on Tensorcraft! Learning ML through frontend concepts." Include the captured image as the share attachment when the Web Share API supports files.
- **Output:** 2x PNG at the diagram's rendered dimensions. Typical output: 2400x1600px for a desktop-width diagram. File name: `tensorcraft-[theme]-progress.png`.

---

## PART 3: LESSON UI LAYOUT

### 3.1 Desktop Layout (1280px+)

Three-column layout optimized for simultaneous reading and coding.

- **Sidebar:** Fixed left column, 240px wide. Contains: theme logo (32px), module title, lesson list for current module (scrollable if exceeding viewport height), progress indicators (checkmarks for completed lessons, dot for current, lock for locked). Background: `--theme-bg` darkened 5%. Border-right: 1px solid `--theme-muted` at 20%.
- **Narrative panel:** Center column, 60% of remaining width after sidebar. Contains the lesson narrative: MDX-rendered content with prose text, bridge callouts, diagrams, and embedded interactive elements. Max prose width: 680px, centered within the panel. Padding: 48px horizontal, 32px vertical. Scroll is independent of other columns. The narrative panel is the primary reading surface.
- **Code panel:** Right column, 40% of remaining width. Contains the Sandpack-powered code editor and preview. The panel is split vertically: editor on top (60% height), live preview on bottom (40% height). A draggable divider between editor and preview allows resizing. The code panel has its own scroll context. Background: Sandpack's default dark theme, adjusted to match `--theme-bg`.

### 3.2 Tablet Layout (768px-1279px)

The sidebar collapses. Narrative and code share the viewport via sticky tabs.

- **Tabs:** Two sticky tabs at the top of the viewport: "Story" and "Code". Tabs are 48px tall, full width, with the active tab indicated by a 2px bottom border in `--theme-accent`. Tabs remain visible during scroll (sticky positioning). Tab switch is instant (no animation) to avoid disorienting the reader.
- **Story tab:** Full-width narrative content. Same MDX rendering as desktop. Max prose width: 640px, centered. Padding: 32px.
- **Code tab:** Full-width Sandpack editor and preview. Editor takes 55% height, preview 45%. The tab remembers scroll position when switching -- returning to "Story" restores the previous scroll offset.

### 3.3 Mobile Layout (< 768px)

Single-column layout with careful space management.

- **Navigation:** The sidebar is replaced by a hamburger menu (top-left) that opens a full-screen overlay with the lesson list. The current lesson title is displayed in a 48px top bar.
- **Content:** Single column, full width. Padding: 16px. Prose renders at full width with appropriate font size adjustments (see Part 5 type scale).
- **Code editor:** Embedded inline within the narrative flow at the points where exercises appear. The editor has a minimum height of 300px and a maximum height of 60vh. The preview renders below the editor (not side-by-side). A "Run" button (44px tall, full width) triggers code execution and scrolls to the preview output.
- **Tab navigation:** Dropdown tabs replace the sticky tabs from tablet layout. A dropdown selector at the top allows switching between "Story", "Code", and "Bridges" views. The dropdown is 44px tall with a chevron indicator.

### 3.4 FE Bridge Moments

Bridge moments are the core pedagogical feature -- the point where a frontend concept is explicitly mapped to an ML concept. These require special UI treatment.

- **Split-panel view:** When a bridge moment occurs in the narrative, the layout temporarily shifts to a side-by-side comparison. On desktop: the narrative panel splits into two equal columns -- left shows the FE concept (with code example), right shows the ML concept (with code example). A glowing bridge connector (animated SVG line with `--theme-accent` color) visually links the two sides. On tablet/mobile: the bridge is presented as a stacked comparison (FE on top, ML below) with the bridge connector rotated to vertical.
- **Sidebar indicator:** In the desktop sidebar, bridge moments are indicated with a small bridge icon (16px) next to the lesson title. Hovering the icon shows a tooltip: "This lesson contains [N] FE-to-ML bridges."
- **Code Hike scrollytelling:** For complex bridges that require step-by-step explanation, use Code Hike's scrollytelling component. The narrative scrolls on the left while the code panel on the right highlights and transitions between code states in sync with the scroll position. Each scroll step corresponds to one mapping point in the bridge. Code Hike annotations highlight the specific lines being discussed with a `--theme-accent` background at 15% opacity.

### 3.5 Checkpoint Quiz Component

After every 2-3 lessons, a checkpoint quiz tests comprehension. The quiz is embedded inline in the narrative flow.

- **Radio button targets:** Each answer option is a radio button with a 44px minimum touch target (WCAG 2.5.5 compliant). The radio button is custom-styled: a 20px circle with 2px border in `--theme-muted`, filled with `--theme-accent` when selected. The label text is positioned to the right of the radio button with 12px gap. Each option has a full-width clickable area (the entire row is the hit target, not just the radio circle).
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
| Bridge connector SVG | Animated glowing line between FE and ML code panels | Hidden (replaced by a static "Bridge" label between stacked panels) |
| Code editor line numbers | Visible | Hidden (saves horizontal space in the 300px editor) |
| Hint level indicators | Visible (3 dots showing current hint level) | Hidden (replaced by swipe gesture with chevron affordance) |
| Breadcrumb navigation | Visible (Theme > Module > Lesson) | Hidden (replaced by back arrow + lesson title in top bar) |

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
| `--text-2xl` | 32px / 2rem | 700 | Page titles, theme names on selection screen, hero headings |
| `--text-3xl` | 40px / 2.5rem | 700 | Landing page hero headline, marketing pages only (not used in app) |

**Font stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` for all UI text. `'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace` for all code (editor, inline code, code blocks). Inter is loaded via `next/font/google` with `display: 'swap'` and subsets `['latin']`. JetBrains Mono is loaded similarly.

**Line heights:**

- Body text (16-20px): `line-height: 1.7` (generous for readability in long-form narrative)
- Headings (25-40px): `line-height: 1.3`
- Code: `line-height: 1.6`
- UI labels and buttons: `line-height: 1.4`
- Captions (12px): `line-height: 1.5`

### 5.2 Color System

Each theme defines six CSS custom properties. All five themes share the same property names, enabling instant theme switching via a single class change on the root element.

| Theme | `--theme-bg` | `--theme-text` | `--theme-accent` | `--theme-accent-hover` | `--theme-border` | `--theme-muted` |
|-------|-------------|---------------|------------------|----------------------|-----------------|----------------|
| Deep Orbit | `#0B0D1A` | `#E2E8F0` | `#6C63FF` | `#8B83FF` | `#1E293B` | `#64748B` |
| Neon Protocol | `#0A0E12` | `#E0E7EE` | `#00FFC8` | `#33FFD6` | `#1A2332` | `#5E7A8A` |
| Signal Ward | `#0D0B14` | `#E4E0F0` | `#FF6B6B` | `#FF8A8A` | `#221E2E` | `#7A6B8A` |
| Ghost Lattice | `#080C10` | `#DCE4EC` | `#FFD93D` | `#FFE066` | `#182028` | `#5A6A7A` |
| Axiom Shelf | `#0C0A0F` | `#E8E2F0` | `#A78BFA` | `#C4B5FD` | `#201C28` | `#6E6480` |

**Accessibility requirements:**

- `--theme-text` on `--theme-bg` must meet WCAG AA contrast ratio (4.5:1 minimum). All themes exceed this: Deep Orbit = 13.2:1, Neon Protocol = 12.8:1, Signal Ward = 12.5:1, Ghost Lattice = 13.0:1, Axiom Shelf = 12.9:1.
- `--theme-accent` on `--theme-bg` must meet WCAG AA for large text (3:1 minimum). Verified for all themes. For small text using accent color, always pair with a background that ensures 4.5:1. If accent color alone does not meet contrast on `--theme-bg` for small text, use `--theme-text` instead and reserve `--theme-accent` for borders, icons, and large headings.
- `--theme-muted` is intentionally lower contrast and must NOT be used for essential information. It is for decorative borders, disabled states, and supplementary labels only. Users must be able to complete all tasks without reading `--theme-muted` text.
- Focus indicators: All interactive elements use a 2px `--theme-accent` outline with 2px offset on `:focus-visible`. This is a global style applied in the base CSS. Never suppress or override focus indicators.

**Dark mode note:** Tensorcraft is dark-mode only. There is no light mode. The dark aesthetic is a core brand element. All design decisions assume a dark background. The `color-scheme: dark` meta tag is set in the document head to inform the browser (affects scrollbar styling, form controls, etc.). System-level forced colors (Windows High Contrast Mode) are respected via `@media (forced-colors: active)` -- in this mode, all custom colors are replaced with system colors and borders become visible.
