# Mobile Lesson Navigation - Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

The step-based lesson page is mobile-responsive (single column, no sidebar) but lacks mobile-native interactions: no swipe gestures for step navigation, and no way to see/jump to other lessons without leaving the page.

## Solution

Two additions: swipe gestures for step navigation + a bottom drawer for the module lesson list.

## Changes

### 1. Swipe gestures for step navigation

**Modify:** `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx`

Add touch event handlers to the step viewport div:
- `onTouchStart` - record X position
- `onTouchEnd` - calculate delta X. If `|deltaX| > 50px`:
  - Swipe left (negative delta) = `goNext()` (advance to next step)
  - Swipe right (positive delta) = `goBack()` (go to previous step)
- Respect `canContinue` - swipe left won't work on the Challenge step if exercise isn't passed
- Only horizontal swipes (ignore if `|deltaY| > |deltaX|` - user is scrolling)
- No visual indicator needed - this is a natural mobile interaction users expect

Implementation: ~15 lines in the existing component. Use `useRef` for touch start position. No external library needed.

### 2. Bottom drawer for module lesson list

**Create:** `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-drawer.tsx`

A client component that renders:
- **Trigger button:** Small button in the top nav bar (next to "← Module" link) showing a list icon or "≡". Only visible on mobile (`md:hidden`).
- **Drawer:** A bottom sheet that slides up from the bottom of the screen when triggered.
  - Module name header
  - List of all lessons in the module with status indicators:
    - ✓ = completed (green/primary)
    - ● = current (primary, highlighted)
    - ○ = available (muted)
    - 🔒 = locked (dimmed)
  - Tapping a lesson navigates to it (if not locked)
  - Backdrop overlay - tap outside to close
  - Slide-down animation on close

**Props:**
```typescript
interface LessonDrawerProps {
  lessons: Array<{
    slug: string;
    title: string;
    order: number;
    locked: boolean;
    completed: boolean;
  }>;
  currentLessonSlug: string;
  themeSlug: string;
  moduleSlug: string;
  moduleName: string;
  theme: { palette: { primary: string; text: string; muted: string; surface: string; border: string; bg: string } };
}
```

The lesson data (including locked/completed status) is already available in the parent `page.tsx` server component and passed to `LessonSteps`. `LessonSteps` passes it down to `LessonDrawer`.

### 3. Pass lesson list data to LessonSteps

**Modify:** `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx`

The server component already has `moduleLessons` and `completedLessonSlugs`. Pass a `lessons` prop to `LessonSteps` with the computed list (slug, title, order, locked, completed).

**Modify:** `lesson-steps.tsx` - accept the new `lessons` prop and render `<LessonDrawer>`.

### 4. Update loading skeleton

**Modify:** `apps/web/app/themes/[slug]/[module]/[lesson]/loading.tsx`

Remove the old sidebar skeleton layout (`hidden lg:block w-64`). Replace with a simple centered loading state matching the step-based layout.

## What Doesn't Change

- Step-based progression logic - unchanged
- Desktop layout - unchanged (drawer only shows on mobile via `md:hidden`)
- LessonContent / MDX rendering - unchanged
- Progress tracking - unchanged

## Verification

1. `pnpm build` passes
2. On mobile (or narrow viewport):
   - Swipe left on lesson content → advances to next step
   - Swipe right → goes to previous step
   - Swipe left blocked on Challenge step when exercise not passed
   - Drawer trigger button visible in top bar
   - Tap drawer button → lesson list slides up from bottom
   - Current lesson highlighted, completed lessons show ✓
   - Tap another lesson → navigates to it
   - Tap backdrop → drawer closes
3. On desktop: drawer trigger hidden, swipe has no effect (mouse events not captured)
4. Tests: swipe gesture hook, drawer open/close
5. Docs: dev-plan updated, architecture reflects mobile nav
