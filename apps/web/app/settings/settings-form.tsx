"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { themes, themeSlugs } from "@tensorcraft/themes";

const THEMES = themeSlugs.map((slug) => ({
  id: slug,
  name: themes[slug].displayName,
  color: themes[slug].palette.primary,
}));

interface SettingsFormProps {
  email: string;
  displayName: string;
  avatarUrl: string;
  preferredThemeId: string;
}

export function SettingsForm({
  email,
  displayName: initialName,
  avatarUrl: initialAvatar,
  preferredThemeId: initialTheme,
}: SettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [preferredTheme, setPreferredTheme] = useState(initialTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        preferred_theme_id: preferredTheme,
      })
      .eq("id", user.id);

    setSaving(false);
    if (updateError) {
      setError("Failed to save settings");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section className="p-6 bg-surface-raised border border-border">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-widest mb-5 text-text-muted">
          Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="settings-display-name"
              className="block text-xs font-mono mb-1.5 text-text-muted"
            >
              Display Name
            </label>
            <input
              id="settings-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 px-4 border border-border bg-surface text-sm text-text-primary outline-none transition-colors focus:border-primary/40"
            />
          </div>

          <div>
            <label
              htmlFor="settings-email"
              className="block text-xs font-mono mb-1.5 text-text-muted"
            >
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              readOnly
              className="w-full h-11 px-4 border border-border bg-surface text-sm text-text-muted outline-none cursor-not-allowed opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="settings-avatar-url"
              className="block text-xs font-mono mb-1.5 text-text-muted"
            >
              Avatar URL
            </label>
            <input
              id="settings-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-11 px-4 border border-border bg-surface text-sm text-text-primary outline-none transition-colors focus:border-primary/40"
            />
          </div>
        </div>
      </section>

      {/* Theme Preference */}
      <section className="p-6 bg-surface-raised border border-border">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-widest mb-1 text-text-muted">
          Default Theme
        </h2>
        <p className="text-xs mb-5 text-text-muted opacity-70">
          Theme applies to your learning content and code editor
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPreferredTheme(t.id)}
              className={`p-3 text-left border transition-all ${
                preferredTheme === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-surface"
              }`}
            >
              <div
                className="w-full h-1 mb-2"
                style={{ background: t.color }}
              />
              <span
                className={`text-xs font-medium font-mono ${
                  preferredTheme === t.id
                    ? "text-text-primary"
                    : "text-text-muted"
                }`}
              >
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6 text-sm font-medium font-mono bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-sm text-primary font-mono">Saved</span>}
        {error && (
          <span className="text-sm text-red-500 font-mono">{error}</span>
        )}
      </div>

      {/* Danger Zone */}
      <section className="p-6 bg-surface-raised border border-red-500/15">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-widest mb-2 text-red-500">
          Danger Zone
        </h2>
        <p className="text-xs mb-4 text-text-muted">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="h-9 px-4 text-xs font-medium font-mono border border-border text-text-muted hover:text-text-primary hover:border-primary/30 transition-all brutalist-hover"
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="h-9 px-4 text-xs font-medium font-mono border border-red-500/30 bg-red-500/8 text-red-500 hover:bg-red-500/15 transition-all brutalist-hover"
          >
            Delete Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 text-xs border border-red-500/15 bg-red-500/5 text-text-muted">
            Account deletion is not yet available. Please contact{" "}
            <strong className="text-text-primary">
              support@tensorcraft.dev
            </strong>{" "}
            to request account deletion.
          </div>
        )}
      </section>
    </div>
  );
}
