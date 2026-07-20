# Coming-soon info sections redesign

Date: 2026-07-19 · Status: approved (user picked "Mixed per section" from three previewed directions)

## Problem

On coming-soon theme pages, "You'll master", "Where it leads", and "The cast"
share one visual treatment (bold mono heading + list). No distinct style, no
information architecture: a capability inventory, salary data, and narrative
characters all render as the same flat list.

## Decision

Each section gets the form native to its data. All render in the page's
brand-green + neutrals ink (see `feedback_brand_green_only_coming_soon`
memory / theme-provider behavior), inside the existing 1120px column and
2-column grid.

Shared section-header grammar (matches the roster header): title bold left,
mono-xs muted meta right.

### You'll master — counted prose

Unchanged slash-separated prose line (green virgules). Header gains right
meta: `{n} capabilities` from `preview.skills.length`. Smallest change; the
prose form already reads well.

### Where it leads — salary range bars

`careerPaths` entries follow `"Name ($lowK-$highK)"` (verified across all 4
manifests, 2-3 entries each). Parse low/high; render each role as a row:

- name (text-sm), fixed-width column
- track (flex-1): baseline hairline; absolute green fill from
  `low/axisTop` to `high/axisTop`
- range label right, mono-xs green: `$102K–$168K`

`axisTop = ceil(max(high)/50)*50` per theme. Header meta: `to $${axisTop}K / yr`.
Unparseable entry falls back to a plain text row (defensive only; none today).
Pure CSS, server-rendered.

### The cast — personnel dossiers

Reuse `CharacterAvatar` from `@tensorcraft/ui` (client island): 40px
initial-block, `accentColor` = page green, `isAI` passed through (abstract
glyph). Row: avatar + (name bold, role muted caps inline; personality italic
below). Hairline separators stay. `+ castRest names` footnote stays.

## Out of scope

Roster, hero, waitlist band, palette values, /themes cards.

## Testing

Update `coming-soon-stub.test.tsx`: capabilities count meta, one salary-bar
row label, `character-avatar-placeholder` count = 3. Existing assertions
(names, personalities, cross-sell) unchanged.

## Sync

Push an `info-sections` preview card to the "Tensorcraft Design System"
claude.ai/design project alongside the existing hero/roster/waitlist cards.
