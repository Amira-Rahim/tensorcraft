# Favicon & Search Image — Design Spec

## Goal

Add a favicon (browser tab icon) and apple touch icon to tensorcraft.app. The favicon adapts its color to match the user's last-viewed theme via a cookie.

## Current State

- No favicon, icon, or apple-icon files exist
- The `T_` brand mark is already used in the nav bar and OG image
- OG images (for Google search results) are already generated via `/api/og`
- Theme is set via `data-theme` attribute on a wrapper div; no theme cookie exists

## Design

### Icon Mark

Solid square with `T_` text — the existing brand mark from the nav and OG image. Dark text (#181818) on a theme-colored background.

### Dynamic Favicon — `app/icon.tsx`

- Uses Next.js `ImageResponse` to generate a 32x32 PNG
- Reads `tc_theme` cookie from the request to determine the primary color
- Falls back to Deep Orbit green (#6BAA8A) when no cookie is set
- Export `size = { width: 32, height: 32 }` and `contentType = "image/png"`

### Dynamic Apple Icon — `app/apple-icon.tsx`

- Same approach, 180x180 PNG for iOS home screen
- Reads the same `tc_theme` cookie

### Static Fallback — `app/favicon.ico`

- Static .ico file using Deep Orbit green
- For legacy browsers and crawlers that don't process dynamic routes

### Theme Cookie — `themes/[slug]/layout.tsx`

- Set a `tc_theme` cookie with the theme slug when a user visits any theme page
- Cookie properties: `path=/`, `maxAge=1 year`, `sameSite=lax`
- Non-sensitive, functional cookie — no consent gating required

## Files

| File | Action |
|------|--------|
| `apps/web/app/icon.tsx` | Create — dynamic 32px favicon |
| `apps/web/app/apple-icon.tsx` | Create — dynamic 180px apple icon |
| `apps/web/app/favicon.ico` | Create — static fallback |
| `apps/web/app/themes/[slug]/layout.tsx` | Modify — set `tc_theme` cookie |
| `apps/web/public/favicon-brainstorm.html` | Delete — cleanup |

## Not Changing

- `layout.tsx` metadata — Next.js auto-detects `icon.tsx`, no manual `<link>` tags needed
- `/api/og` route — already generates Google search images correctly
- Structured data `logo` field — separate concern
