# Avatar Photo Upload — Design Spec

**Date:** 2026-04-13
**Status:** Approved

## Overview

Enable users to upload a profile photo that replaces the letter-initial avatar across the settings page, dashboard, and header navigation. Photos are stored in Supabase Storage and referenced via the existing `avatar_url` column on the `profiles` table.

## Storage & Database

### Supabase Storage bucket: `avatars`

- **Visibility:** Public (avatars are displayed in the UI and are not sensitive)
- **File naming:** `{userId}.webp` — one file per user, overwritten on re-upload (no orphan cleanup needed)
- **RLS policies:**
  - Authenticated users can INSERT and UPDATE files matching `{userId}.*` (their own avatar only)
  - Authenticated users can DELETE files matching `{userId}.*`
  - Public SELECT (read) access for all files in the bucket

### Database

No schema changes required. The existing `avatar_url text` column on the `profiles` table stores the public URL after upload. The existing API `PATCH /api/profiles/:userId` already validates `avatar_url` (URL format, https/http protocol, max 2048 chars).

### Migration

New migration file: `015_avatars_storage_bucket.sql`
- Creates the `avatars` bucket
- Sets up storage RLS policies

## Client-side Upload Flow

### Resize logic

1. User clicks "Change photo" button, which triggers a hidden `<input type="file" accept="image/*">`
2. **Validation:** Reject non-image MIME types and files larger than 5MB (before loading into memory)
3. Load the file into an `Image` element
4. Draw onto a 256x256 canvas using **center-crop** (square crop from the center, not stretch/distort)
5. Export as `image/webp` at quality 0.8 to produce a `Blob`
6. Upload the blob to Supabase Storage: `avatars/{userId}.webp` with `upsert: true`
7. Get the public URL via `supabase.storage.from('avatars').getPublicUrl()`
8. Update `profiles.avatar_url` with the public URL, appending `?t={timestamp}` as a cache-buster
9. Update local component state to show the new avatar immediately (no page refresh)

### Error handling

- File type validation before processing (reject non-image MIME types)
- File size guard before resize (reject > 5MB to avoid loading huge files into memory)
- Inline error message on failure — no silent swallowing

### UX during upload

- Button text changes to "Uploading..." with `disabled` state while in progress
- On success, avatar updates immediately in the UI

## Shared `UserAvatar` Component

A shared component to avoid duplicating avatar rendering logic across three locations:

```
UserAvatar({ url, name, size })
```

- If `url` is truthy: render an `<img>` with `object-fit: cover`, square dimensions
- If `url` is falsy: render the first letter of `name` as a letter initial (existing behavior)
- `size` prop controls dimensions (36px for header, 56px for settings, etc.)
- Styled to match the existing aesthetic: square shape, border, monospace font for the fallback initial

### File location

`apps/web/app/components/user-avatar.tsx`

## Integration Points

### 1. Settings page (`apps/web/app/settings/settings-form.tsx`)

- Replace the hardcoded initial-letter `<div>` with `UserAvatar`
- Remove `disabled` from the "Change photo" button
- Wire the button to trigger the hidden file input
- Connect the upload flow (resize, upload, update profile, update local state)
- Use the existing `fileInputRef` and `uploading` state that are already scaffolded

### 2. Dashboard page (`apps/web/app/dashboard/page.tsx`)

- Already fetches `avatar_url` from the profile
- Pass `avatarUrl` through to `DashboardView`
- Replace the initial-letter rendering with `UserAvatar`

### 3. Header / UserMenu (`apps/web/app/components/user-menu.tsx`)

- Currently only has the auth `User` object (no profile data)
- Add a profile fetch for `avatar_url` and `display_name` from the `profiles` table
- Replace the initial-letter `<button>` content with `UserAvatar`
- Fall back to the letter initial when no avatar is set (existing behavior preserved)

## Out of Scope

- Avatar removal/delete button (can be added later)
- Server-side image processing or CDN transforms
- Gravatar fallback
- Avatar display in any other locations beyond settings, dashboard, and header
