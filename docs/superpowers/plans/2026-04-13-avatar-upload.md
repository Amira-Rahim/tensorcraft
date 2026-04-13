# Avatar Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to upload a profile photo that replaces letter-initial avatars across settings, dashboard, and header.

**Architecture:** Direct browser-to-Supabase-Storage upload. Client-side canvas resize to 256x256 WebP before upload. Shared `UserAvatar` component renders photo or letter-initial fallback across three integration points.

**Tech Stack:** Supabase Storage, Canvas API, Next.js 15 (App Router), vitest + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-04-13-avatar-upload-design.md`

---

## Context

The "Change photo" button on the settings page is currently a disabled stub. The database, types, and API validation for `avatar_url` already exist. This plan wires up the actual upload flow and displays avatars in three locations.

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/supabase/migrations/015_avatars_storage_bucket.sql` | Storage bucket + RLS policies |
| Create | `apps/web/lib/resize-image.ts` | Client-side image resize utility |
| Create | `apps/web/lib/__tests__/resize-image.test.ts` | Resize utility tests |
| Create | `apps/web/app/components/user-avatar.tsx` | Shared avatar display component |
| Create | `apps/web/app/components/__tests__/user-avatar.test.tsx` | UserAvatar tests |
| Modify | `apps/web/app/settings/settings-form.tsx` | Wire upload flow, use UserAvatar |
| Modify | `apps/web/app/dashboard/page.tsx:284-295` | Pass avatarUrl prop |
| Modify | `apps/web/app/dashboard/dashboard-view.tsx:71-100,640-656` | Add avatarUrl to props, render UserAvatar |
| Modify | `apps/web/app/components/user-menu.tsx:9-80` | Fetch profile, render UserAvatar |
| Modify | `apps/web/app/components/nav.test.tsx:5-14` | Update supabase mock for profile fetch |

## Dependency Graph

```
Task 1 (migration)  ─┐
Task 2 (resize)     ─┤── independent, can run in parallel
Task 3 (UserAvatar) ─┘
        │
        ├── Task 4 (settings form) — depends on 2 + 3
        ├── Task 5 (dashboard) — depends on 3
        └── Task 6 (header) — depends on 3
                │
                └── Task 7 (test updates) — depends on 6
```

---

### Task 1: Supabase Storage Migration

**Files:**
- Create: `packages/supabase/migrations/015_avatars_storage_bucket.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Create avatars storage bucket (public, for profile photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Owner insert (flat naming: {userId}.webp)
CREATE POLICY "avatars_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '.%')
);

-- Owner update
CREATE POLICY "avatars_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '.%')
);

-- Owner delete
CREATE POLICY "avatars_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '.%')
);
```

- [ ] **Step 2: Commit**

```bash
git add packages/supabase/migrations/015_avatars_storage_bucket.sql
git commit -m "feat: add avatars storage bucket migration with RLS policies"
```

---

### Task 2: Resize Image Utility (TDD)

**Files:**
- Create: `apps/web/lib/__tests__/resize-image.test.ts`
- Create: `apps/web/lib/resize-image.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, vi } from "vitest";
import { resizeImage } from "../resize-image";

describe("resizeImage", () => {
  it("rejects non-image MIME types", async () => {
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    await expect(resizeImage(file)).rejects.toThrow("must be an image");
  });

  it("rejects files larger than 5MB", async () => {
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    await expect(resizeImage(big)).rejects.toThrow("5MB");
  });

  it("accepts a valid image and returns a webp blob", async () => {
    // Mock canvas and image loading for jsdom
    const mockToBlob = vi.fn((cb: BlobCallback) => {
      cb(new Blob(["fake"], { type: "image/webp" }));
    });
    const mockDrawImage = vi.fn();
    const mockGetContext = vi.fn(() => ({
      drawImage: mockDrawImage,
    }));

    vi.stubGlobal("HTMLCanvasElement", class {
      width = 0;
      height = 0;
      getContext = mockGetContext;
      toBlob = mockToBlob;
    });

    // Mock createObjectURL and revokeObjectURL
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });

    // Mock Image
    vi.stubGlobal("Image", class {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    });

    const file = new File(["pixel-data"], "photo.png", { type: "image/png" });
    const blob = await resizeImage(file);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/webp");
    expect(mockDrawImage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run lib/__tests__/resize-image.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
export async function resizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (JPEG, PNG, WebP, etc.)");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File must be smaller than 5MB");
  }

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const SIZE = 256;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Center-crop: use the largest centered square from the source
  const srcSize = Math.min(img.width, img.height);
  const srcX = (img.width - srcSize) / 2;
  const srcY = (img.height - srcSize) / 2;

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create image blob"));
        resolve(blob);
      },
      "image/webp",
      0.8,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm vitest run lib/__tests__/resize-image.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/resize-image.ts apps/web/lib/__tests__/resize-image.test.ts
git commit -m "feat: add resize-image utility with tests"
```

---

### Task 3: UserAvatar Component (TDD)

**Files:**
- Create: `apps/web/app/components/__tests__/user-avatar.test.tsx`
- Create: `apps/web/app/components/user-avatar.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "../user-avatar";

describe("UserAvatar", () => {
  it("renders an img when url is provided", () => {
    render(<UserAvatar url="https://example.com/photo.webp" name="Alice" size={56} />);
    const img = screen.getByRole("img", { name: /alice/i });
    expect(img).toHaveAttribute("src", "https://example.com/photo.webp");
  });

  it("renders the first letter when no url", () => {
    render(<UserAvatar url={null} name="Bob" size={36} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders '?' when name is empty", () => {
    render(<UserAvatar name="" size={36} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run app/components/__tests__/user-avatar.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```tsx
interface UserAvatarProps {
  url?: string | null;
  name: string;
  size: number;
}

export function UserAvatar({ url, name, size }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase() || "?";

  if (url) {
    return (
      <img
        src={url}
        alt={`${name}'s avatar`}
        width={size}
        height={size}
        style={{
          objectFit: "cover",
          border: "2px solid var(--tc-primary)",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      aria-label={`${name || "User"}'s avatar`}
      className="flex items-center justify-center font-mono"
      style={{
        width: size,
        height: size,
        background: "rgba(107,170,138,0.12)",
        border: "2px solid var(--tc-primary)",
        fontSize: size * 0.4,
        color: "var(--tc-primary)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm vitest run app/components/__tests__/user-avatar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/components/user-avatar.tsx apps/web/app/components/__tests__/user-avatar.test.tsx
git commit -m "feat: add UserAvatar component with tests"
```

---

### Task 4: Settings Form — Wire Upload Flow

**Files:**
- Modify: `apps/web/app/settings/settings-form.tsx`

- [ ] **Step 1: Add imports**

Add at top of file:
```ts
import { UserAvatar } from "@/app/components/user-avatar";
import { resizeImage } from "@/lib/resize-image";
```

- [ ] **Step 2: Add the hidden file input**

After the `<UserAvatar>` component (inside the avatar row div), add:
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileSelect}
/>
```

- [ ] **Step 3: Replace the initial-letter div with UserAvatar**

Replace the `<div>` at lines 212-224 (the 56px square with `{initial}`) with:
```tsx
<UserAvatar url={avatarUrl} name={displayName} size={56} />
```

- [ ] **Step 4: Enable the "Change photo" button and wire onClick**

Replace the disabled button (lines 238-252) with:
```tsx
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={uploading}
  className="font-mono mt-2"
  style={{
    fontSize: 10,
    color: "var(--tc-primary)",
    background: "transparent",
    border: "1px solid var(--tc-primary)",
    padding: "3px 10px",
    cursor: uploading ? "not-allowed" : "pointer",
    opacity: uploading ? 0.4 : 1,
  }}
>
  {uploading ? "Uploading..." : "Change photo"}
</button>
```

- [ ] **Step 5: Implement handleFileSelect**

Add this function inside the component, before `handleSave`:
```ts
async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Reset input so re-selecting same file triggers onChange
  if (fileInputRef.current) fileInputRef.current.value = "";

  setUploading(true);
  setError(null);

  try {
    const blob = await resizeImage(file);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const filePath = `${user.id}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, blob, { upsert: true, contentType: "image/webp" });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("id", user.id);

    setAvatarUrl(newUrl);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Upload failed");
  } finally {
    setUploading(false);
  }
}
```

- [ ] **Step 6: Add avatar_url to handleSave payload**

In the `handleSave` function, add `avatar_url: avatarUrl || null` to the `.update()` call (alongside `display_name`, `preferred_theme_id`, etc.).

- [ ] **Step 7: Verify manually — run dev server, test upload flow**

Run: `cd apps/web && pnpm dev`
Test: Navigate to /settings, click "Change photo", select an image. Verify it uploads and displays.

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/settings/settings-form.tsx
git commit -m "feat: wire avatar upload flow in settings form"
```

---

### Task 5: Dashboard Integration

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx:284-295`
- Modify: `apps/web/app/dashboard/dashboard-view.tsx:71-100,640-656`

- [ ] **Step 1: Pass avatarUrl prop from page to view**

In `apps/web/app/dashboard/page.tsx`, after line 285 (`const displayName = ...`), add:
```ts
const avatarUrl = profile?.avatar_url || null;
```

Add `avatarUrl={avatarUrl}` to the `<DashboardView>` JSX props.

- [ ] **Step 2: Add avatarUrl to DashboardProps and render UserAvatar**

In `apps/web/app/dashboard/dashboard-view.tsx`:
- Add `avatarUrl?: string | null;` to the `DashboardProps` interface (after `displayName`)
- Import `UserAvatar` from `@/app/components/user-avatar`
- In the greeting area (around line 647-655), wrap the existing greeting text in a flex container and add the avatar:

```tsx
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
  <UserAvatar url={avatarUrl} name={displayName} size={36} />
  <div>
    {/* existing greeting content */}
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/page.tsx apps/web/app/dashboard/dashboard-view.tsx
git commit -m "feat: display avatar in dashboard greeting"
```

---

### Task 6: Header / UserMenu Integration

**Files:**
- Modify: `apps/web/app/components/user-menu.tsx:9-80`

- [ ] **Step 1: Add profile state and fetch**

Add state inside `UserMenu`:
```ts
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
const [displayName, setDisplayName] = useState<string | null>(null);
```

Inside the existing `useEffect`, after `setUser(data.user)` (line 20), add:
```ts
if (data.user) {
  supabase
    .from("profiles")
    .select("avatar_url, display_name")
    .eq("id", data.user.id)
    .single()
    .then(({ data: profile }) => {
      setAvatarUrl(profile?.avatar_url ?? null);
      setDisplayName(profile?.display_name ?? null);
    });
}
```

- [ ] **Step 2: Replace initial letter with UserAvatar**

Import `UserAvatar`. Replace line 79 (`{initial}`) with:
```tsx
<UserAvatar
  url={avatarUrl}
  name={displayName || user.email || "U"}
  size={32}
/>
```

Adjust the button styling: remove `text-sm font-mono font-bold` (the avatar component handles its own styling). Keep `w-9 h-9 flex items-center justify-center` and the border/bg styles. Set `overflow-hidden` on the button so the avatar image clips to the button boundaries.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/user-menu.tsx
git commit -m "feat: show avatar in header user menu"
```

---

### Task 7: Update Test Mocks

**Files:**
- Modify: `apps/web/app/components/nav.test.tsx:5-14`

- [ ] **Step 1: Update the supabase mock to include `.from()` chain**

The `UserMenu` now calls `supabase.from('profiles').select(...).eq(...).single()`. The existing mock in `nav.test.tsx` only mocks `auth`. Add the `from` chain:

```ts
getSupabaseBrowserClient: () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }),
}),
```

- [ ] **Step 2: Run all tests**

Run: `cd apps/web && pnpm vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/nav.test.tsx
git commit -m "fix: update test mocks for profile fetch in UserMenu"
```

---

## Verification

1. **Migration:** Apply migration to local Supabase (`supabase db push` or `supabase migration up`). Verify `avatars` bucket exists in Storage dashboard.
2. **Upload flow:** Run `pnpm dev`, go to /settings, upload a photo. Verify it appears immediately. Refresh — verify it persists.
3. **Dashboard:** Navigate to /dashboard. Verify the avatar appears in the greeting.
4. **Header:** Verify the avatar appears in the header user menu button on all pages.
5. **Fallback:** Create a new account (no avatar). Verify letter initials show everywhere.
6. **Re-upload:** Upload a different photo. Verify it updates everywhere without stale cache.
7. **Tests:** `cd apps/web && pnpm vitest run` — all pass.
