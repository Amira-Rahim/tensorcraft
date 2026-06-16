# Character Personas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 5 Deep Orbit characters a visual identity: a written design bible with image-gen prompts, plus a `CharacterAvatar` component (real art when present, branded placeholder until then) wired into the dialogue and the Briefing cast card.

**Architecture:** A markdown design bible (content). A theme-agnostic `CharacterAvatar` in `packages/ui` that renders an `<img>` and falls back to a monogram/AI-glyph placeholder via `onError`. Manifest characters gain `slug`/`aliases?`/`isAI?`. The app injects `avatarSrc` into `Dialogue` (via a lesson-content wrapper that looks up the theme manifest) and into `SceneCard` (via a `themeSlug` lookup). Real cel-shaded art is produced externally later using the bible prompts; placeholders ship now. Animation is a separate future stream.

**Tech Stack:** Next.js, TypeScript, React, vitest + @testing-library/react. Spec: `docs/superpowers/specs/2026-06-15-character-personas-design.md`.

> **COMMIT POLICY:** Repo CLAUDE.md forbids agent commits. No `git add/commit/push`. Each task ends "leave uncommitted; report files." User commits.
>
> **COPY RULE:** No em dashes (style bible rule 6).
>
> **PATHS:** lesson page files in `apps/web/app/themes/[slug]/[module]/[lesson]/`. `CharacterAvatar` lives in `packages/ui/src/character-avatar.tsx`, exported from `packages/ui/src/index.ts`. Live Dialogue is `packages/ui/src/mdx/dialogue.tsx`.
>
> **TEST CMDS:** unit `npx vitest run <path>` (root); full `npx vitest run`; typecheck `npm run typecheck` + `npx tsc --noEmit` in apps/web (ignore the 3 known pre-existing failing test files: onboarding/page.test.tsx, pricing/__tests__/pricing-tiers.test.tsx, settings/settings-form.test.tsx).
>
> **NOTE:** `themeId` passed around lesson-content/lesson-steps holds the slug value ("deep-orbit"). `packages/ui` must NOT import `@tensorcraft/themes` (keep it presentational); the theme lookup happens in the app layer only.

---

### Task 1: `CharacterAvatar` component

**Files:**
- Create: `packages/ui/src/character-avatar.tsx`
- Create: `packages/ui/src/character-avatar.test.tsx`
- Modify: `packages/ui/src/index.ts` (root export)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterAvatar } from "./character-avatar";

describe("CharacterAvatar", () => {
  it("renders an img with src and alt when given a src", () => {
    render(<CharacterAvatar name="Commander Mirza" src="/characters/deep-orbit/commander-mirza.webp" />);
    const img = screen.getByTestId("character-avatar-img") as HTMLImageElement;
    expect(img.getAttribute("alt")).toBe("Commander Mirza");
    expect(img.getAttribute("src")).toContain("commander-mirza.webp");
  });

  it("falls back to a monogram placeholder on image error", () => {
    render(<CharacterAvatar name="Commander Mirza" src="/missing.webp" />);
    fireEvent.error(screen.getByTestId("character-avatar-img"));
    expect(screen.getByTestId("character-avatar-placeholder").textContent).toBe("CM");
  });

  it("shows a monogram placeholder when no src is given", () => {
    render(<CharacterAvatar name="Dr. Farah" />);
    expect(screen.getByTestId("character-avatar-placeholder").textContent).toBe("DF");
  });

  it("shows an AI glyph (no letters) for AI characters", () => {
    render(<CharacterAvatar name="ARIA" isAI />);
    const el = screen.getByTestId("character-avatar-placeholder");
    expect(el.textContent).not.toMatch(/[A-Z]{2}/);
    expect(el.getAttribute("aria-label")).toBe("ARIA");
  });
});
```

- [ ] **Step 2: Run to verify FAIL** (`npx vitest run packages/ui/src/character-avatar.test.tsx`).

- [ ] **Step 3: Implement** `packages/ui/src/character-avatar.tsx`:

```tsx
"use client";
import { useState } from "react";

interface CharacterAvatarProps {
  /** Display name; drives initials + alt text. */
  name: string;
  /** Conventional asset path; may 404 (then placeholder). */
  src?: string;
  /** Theme accent for border + placeholder text. */
  accentColor?: string;
  /** AI characters render an abstract glyph instead of a monogram. */
  isAI?: boolean;
  /** Square px size. */
  size?: number;
}

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

export function CharacterAvatar({
  name,
  src,
  accentColor = "var(--tc-primary)",
  isAI = false,
  size = 40,
}: CharacterAvatarProps) {
  const [failed, setFailed] = useState(false);
  const frame = {
    width: size,
    height: size,
    border: `2px solid ${accentColor}`,
    background: "var(--tc-surface)",
    borderRadius: 0,
  } as const;

  if (!src || failed) {
    return (
      <div
        data-testid="character-avatar-placeholder"
        role="img"
        aria-label={name}
        className="shrink-0 select-none flex items-center justify-center font-mono font-bold"
        style={{ ...frame, color: accentColor }}
      >
        {isAI ? (
          <span aria-hidden="true" style={{ fontSize: size * 0.5 }}>&#9673;</span>
        ) : (
          <span style={{ fontSize: size * 0.32, letterSpacing: "1px" }}>{initials(name)}</span>
        )}
      </div>
    );
  }

  return (
    <img
      data-testid="character-avatar-img"
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0"
      style={{ ...frame, objectFit: "cover" }}
    />
  );
}
```

- [ ] **Step 4: Export** from `packages/ui/src/index.ts`: add `export { CharacterAvatar } from "./character-avatar";` (after the mdx export block, with the shared-components grouping).

- [ ] **Step 5: Run PASS** + `npm run typecheck`. Leave uncommitted; report files.

---

### Task 2: Manifest data (`slug`/`aliases`/`isAI`)

**Files:**
- Modify: `packages/themes/src/types.ts` (`ThemeCharacter`)
- Modify: `packages/themes/src/deep-orbit.ts` (populate the 5)
- Test: `packages/themes/src/theme-properties.test.ts` (append)

- [ ] **Step 1: Write the failing test** (append to `theme-properties.test.ts`):

```ts
describe("Deep Orbit character avatars", () => {
  const chars = themes["deep-orbit"]!.characters;
  it("every character has a kebab-case slug", () => {
    for (const c of chars) {
      expect(c.slug, `${c.name} needs a slug`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
  it("slugs are unique", () => {
    const slugs = chars.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("ARIA is flagged isAI", () => {
    const aria = chars.find((c) => c.name === "ARIA");
    expect(aria?.isAI).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify FAIL.**

- [ ] **Step 3: Extend the type** in `packages/themes/src/types.ts`:

```ts
export interface ThemeCharacter {
  name: string;
  role: string;
  personality: string;
  /** kebab-case id for the avatar asset path. */
  slug?: string;
  /** Alternate speaker strings used in dialogue (deep-orbit needs none). */
  aliases?: string[];
  /** AI characters render an abstract glyph, not a portrait/monogram. */
  isAI?: boolean;
}
```

- [ ] **Step 4: Populate** the 5 deep-orbit characters in `packages/themes/src/deep-orbit.ts`:
  - Commander Mirza -> `slug: "commander-mirza"`
  - Dr. Farah -> `slug: "dr-farah"`
  - Chief Nazari -> `slug: "chief-nazari"`
  - Ensign Demir -> `slug: "ensign-demir"`
  - ARIA -> `slug: "aria", isAI: true`

- [ ] **Step 5: Run PASS** + typecheck. Leave uncommitted; report files.

---

### Task 3: Avatar in `Dialogue` + lesson-content injection

**Files:**
- Modify: `packages/ui/src/mdx/dialogue.tsx` (optional avatar props)
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` (Dialogue wrapper injects avatarSrc)
- Test: `packages/ui/src/mdx/dialogue.test.tsx` (new or extend)

- [ ] **Step 1: Write the failing test** for Dialogue (new `packages/ui/src/mdx/dialogue.test.tsx` if absent; else extend):

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialogue } from "./dialogue";

describe("Dialogue avatar", () => {
  it("renders no avatar by default", () => {
    render(<Dialogue speaker="Chief Nazari">Line.</Dialogue>);
    expect(screen.queryByTestId("character-avatar-placeholder")).toBeNull();
    expect(screen.queryByTestId("character-avatar-img")).toBeNull();
  });
  it("renders an avatar when avatarName is provided", () => {
    render(
      <Dialogue speaker="Chief Nazari" avatarName="Chief Nazari" avatarSrc="/characters/deep-orbit/chief-nazari.webp">
        Line.
      </Dialogue>,
    );
    expect(screen.getByTestId("character-avatar-img")).toBeInTheDocument();
    // speaker name still present
    expect(screen.getByText("Chief Nazari")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run FAIL.**

- [ ] **Step 3: Implement Dialogue props.** In `dialogue.tsx`:
  - Import: `import { CharacterAvatar } from "../character-avatar";`
  - Extend `DialogueProps` with `avatarSrc?: string; avatarName?: string; isAI?: boolean;`.
  - Inside the outer `<div ... data-dialogue="true">`, BEFORE the speaker-name div, render the avatar centered when `avatarName` is set:

```tsx
{avatarName && (
  <div className="flex justify-center mb-2">
    <CharacterAvatar name={avatarName} src={avatarSrc} isAI={isAI} size={44} />
  </div>
)}
```

  - Do NOT change the outer `div` (the `data-dialogue` node the playback timeline keys on), the `data-script-beat` behavior, the `cutTo` divider, or `data-testid="direction"`. The avatar is an additive child only.

- [ ] **Step 4: Inject from the app.** In `lesson-content.tsx`:
  - Add `import { themes } from "@tensorcraft/themes";` (top of file).
  - Replace `Dialogue: wrapVisibility("Dialogue", Dialogue),` with a custom wrapper (mirror the Quiz/RecallPrompt wrappers; `themeId` holds the slug):

```tsx
Dialogue: (props: React.ComponentProps<typeof Dialogue>) => {
  // Preserve wrapVisibility's epilogue bypass: Dialogue renders unconditionally
  // inside an <Epilogue> (Consequence step), else it is gated by shouldShow.
  const insideEpilogue = useContext(EpilogueContext);
  if (!insideEpilogue && !shouldShow("Dialogue")) return null;
  const chars = themeId ? (themes[themeId]?.characters ?? []) : [];
  const ch = chars.find(
    (c) => c.name === props.speaker || c.aliases?.includes(props.speaker),
  );
  const avatar =
    ch?.slug
      ? { avatarSrc: `/characters/${themeId}/${ch.slug}.webp`, avatarName: ch.name, isAI: ch.isAI }
      : {};
  return <Dialogue {...props} {...avatar} />;
},
```

  - **Important:** verify how `wrapVisibility` implements its epilogue bypass and replicate it exactly (the snippet above assumes `useContext(EpilogueContext)`; confirm `EpilogueContext` is the in-scope context and that `wrapVisibility` bypasses `shouldShow` when inside an epilogue). The wrapper arrow is rendered by MDX as a component, so `useContext` is a valid hook call here.
  - Keep the components object memoized; `themeId` is already a dep of that memo. Confirm `shouldShow` is in scope (the Quiz wrapper uses it).

- [ ] **Step 5: Run** `npx vitest run packages/ui/src/mdx/dialogue.test.tsx "apps/web/app/themes/[slug]/[module]/[lesson]/"` (all PASS, incl. the playback test still green) + typecheck.

- [ ] **Step 6: Leave uncommitted; report files.**

---

### Task 4: Avatar in the Briefing cast card (`SceneCard`)

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (`SceneCard` + its call site)

- [ ] **Step 1: Pass `themeSlug` to SceneCard.** At the SceneCard call site (~line 442), add `themeSlug={themeSlug}` (the prop already exists on `LessonStepsInner`). Update the `SceneCard` signature to accept `themeSlug: string`.

- [ ] **Step 2: Look up characters + render avatars.** In `SceneCard`, add `import { themes } from "@tensorcraft/themes";` (top of file if not present) and replace the speaker text chips with avatar + name/role rows:

```tsx
const chars = themes[themeSlug]?.characters ?? [];
// ...in the cast block, for each speaker:
{speakers.map((s) => {
  const ch = chars.find((c) => c.name === s || c.aliases?.includes(s));
  return (
    <div key={s} className="flex items-center gap-2">
      <CharacterAvatar
        name={s}
        src={ch?.slug ? `/characters/${themeSlug}/${ch.slug}.webp` : undefined}
        accentColor={theme.palette.primary}
        isAI={ch?.isAI}
        size={30}
      />
      <div className="flex flex-col">
        <span className="font-mono text-xs" style={{ color: theme.palette.text }}>{s}</span>
        {ch?.role && (
          <span className="font-mono text-[10px]" style={{ color: theme.palette.muted }}>{ch.role}</span>
        )}
      </div>
    </div>
  );
})}
```

  Import `CharacterAvatar` from `@tensorcraft/ui`. Keep the "Cast" kicker. A speaker with no matching character still renders (avatar placeholder from the name).

- [ ] **Step 3: Update tests.** If `lesson-steps.test.tsx` asserts the old cast-chip structure, adjust to the new rows; keep all step-state + playback assertions green. (The cast card is on the Briefing step; ensure the playback test, which renders Briefing, still passes - SceneCard is in the rail, not the beat stream.)

- [ ] **Step 4: Run** `npx vitest run "apps/web/app/themes/[slug]/[module]/[lesson]/"` + typecheck. PASS.

- [ ] **Step 5: Visual check (preferred).** Dev server: a deep-orbit Briefing step shows placeholder avatars (monograms; ARIA glyph) in the cast card and above dialogue speakers. If a `/characters/deep-orbit/*.webp` is dropped in, it replaces the placeholder.

- [ ] **Step 6: Leave uncommitted; report files.**

---

### Task 5: Character bible doc

**Files:**
- Create: `docs/character-bible.md`
- Test: `packages/content/src/character-bible.test.ts` (light completeness guard, new)

- [ ] **Step 1: Write the completeness guard first**:

```ts
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const bible = fs.readFileSync(
  path.resolve(__dirname, "../../../docs/character-bible.md"),
  "utf-8",
);

describe("character bible", () => {
  it("defines the shared cel-shaded style token", () => {
    expect(bible.toLowerCase()).toContain("cel-shaded");
  });
  it.each(["commander-mirza", "dr-farah", "chief-nazari", "ensign-demir", "aria"])(
    "has a sheet for deep-orbit character %s",
    (slug) => {
      expect(bible).toContain(slug);
    },
  );
  it("has no em dashes", () => {
    expect(bible).not.toContain("—");
  });
});
```

Confirm the relative path from `packages/content/src/` to repo-root `docs/` resolves (adjust `../` depth if needed).

- [ ] **Step 2: Run FAIL** (file missing).

- [ ] **Step 3: Write `docs/character-bible.md`.** Structure:
  - **Style token** (verbatim from the spec): "cel-shaded cartoon illustration, clean bold linework, flat shading with one soft key light, slightly stylized proportions, head-and-shoulders framing, near-black background, theme-accent rim light, cohesive ensemble cast, not photorealistic."
  - **Asset convention** + **placeholder behavior** (one paragraph).
  - **Template** (the field list).
  - **Deep Orbit** section: a full sheet for each of the 5, using the template, with appearance imagined from `packages/themes/src/deep-orbit.ts` personalities + the richer backstory in `docs/scripts/deep-orbit.md`. Each sheet includes its `slug`, palette (theme primary `#6BAA8A` + bronze accent `#A89060`), a 4-state expression set, and a ready image-gen prompt ending in the style token. ARIA's sheet specifies an abstract waveform/ring glyph (no face) and notes `isAI`.
  - **Other themes** (Neon Protocol, Signal Ward, Nova Canvas, Terra Grid): one stub line per character (name + role), marked "sheet pending (gated on theme launch)". Pull the rosters from each theme manifest.
  - No em dashes.

- [ ] **Step 4: Run the guard PASS.** Leave uncommitted; report files.

---

### Task 6: Docs + full verification

**Files:**
- Modify: `docs/dev-plan.md`
- Verify: full suites

- [ ] **Step 1: dev-plan note.** Add a "Deferred (character personas)" entry: (a) real cel-shaded art is pending external production (prompts in `docs/character-bible.md`); drop files at `apps/web/public/characters/<theme>/<slug>.webp` to replace placeholders; (b) the other 20 character sheets + their theme wiring are gated on those themes launching; (c) character *animation* (entrance/talking/expression states) is a planned follow-up stream that consumes the expression sets.

- [ ] **Step 2: Full verification** (report exact numbers): `npm run typecheck` + `npx tsc --noEmit` in apps/web (ignore the 3 known pre-existing failing test files); full `npx vitest run`; content build `pnpm --filter @tensorcraft/content build:content`.

- [ ] **Step 3: Leave uncommitted; report all files changed across the stream for the user to review and commit.**

---

## File structure summary

| File | Responsibility |
|---|---|
| `packages/ui/src/character-avatar.tsx` | avatar + placeholder/AI-glyph (Task 1) |
| `packages/ui/src/index.ts` | export CharacterAvatar (Task 1) |
| `packages/themes/src/types.ts`, `deep-orbit.ts` | slug/aliases/isAI (Task 2) |
| `packages/ui/src/mdx/dialogue.tsx` | optional avatar props (Task 3) |
| `.../[lesson]/lesson-content.tsx` | inject avatarSrc into Dialogue (Task 3) |
| `.../[lesson]/lesson-steps.tsx` | avatars in SceneCard cast (Task 4) |
| `docs/character-bible.md` | the design bible + prompts (Task 5) |
| `packages/content/src/character-bible.test.ts` | bible completeness guard (Task 5) |
| `docs/dev-plan.md` | deferred notes (Task 6) |
