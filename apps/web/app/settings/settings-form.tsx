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
      <section
        className="rounded-2xl p-6"
        style={{
          background: "var(--tc-surface, #0F1320)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-widest mb-5"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border text-sm text-white outline-none transition-colors focus:border-white/20"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full h-11 px-4 rounded-lg border text-sm outline-none cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.05)",
                color: "var(--tc-muted, #8B92A5)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-11 px-4 rounded-lg border text-sm text-white outline-none transition-colors focus:border-white/20"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Theme Preference */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: "var(--tc-surface, #0F1320)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Default Theme
        </h2>
        <p className="text-xs mb-5" style={{ color: "rgba(139,146,165,0.7)" }}>
          Theme applies to your learning content and code editor
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPreferredTheme(t.id)}
              className={`rounded-lg p-3 text-left transition-all ${
                preferredTheme === t.id
                  ? "ring-1 ring-white/30"
                  : "hover:bg-white/[0.02]"
              }`}
              style={{
                background:
                  preferredTheme === t.id
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-full h-1 rounded-full mb-2"
                style={{ background: t.color }}
              />
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    preferredTheme === t.id
                      ? "#FFFFFF"
                      : "var(--tc-muted, #8B92A5)",
                }}
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
          className="h-11 px-6 rounded-full text-sm font-medium transition-all disabled:opacity-50"
          style={{
            border: "1px solid rgba(0,212,255,0.3)",
            background: "rgba(0,212,255,0.08)",
            color: "#FFFFFF",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: "#2ECC71" }}>
            Saved
          </span>
        )}
        {error && (
          <span className="text-sm" style={{ color: "#EF4444" }}>
            {error}
          </span>
        )}
      </div>

      {/* Danger Zone */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: "var(--tc-surface, #0F1320)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <h2
          className="text-sm font-semibold uppercase tracking-widest mb-2"
          style={{ color: "#EF4444" }}
        >
          Danger Zone
        </h2>
        <p
          className="text-xs mb-4"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="h-9 px-4 rounded-full text-xs font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "var(--tc-muted, #8B92A5)",
            }}
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="h-9 px-4 rounded-full text-xs font-medium transition-all"
            style={{
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.08)",
              color: "#EF4444",
            }}
          >
            Delete Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div
            className="mt-4 rounded-lg p-4 text-xs"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "var(--tc-muted, #8B92A5)",
            }}
          >
            Account deletion is not yet available. Please contact{" "}
            <strong style={{ color: "#FFFFFF" }}>
              support@tensorcraft.dev
            </strong>{" "}
            to request account deletion.
          </div>
        )}
      </section>
    </div>
  );
}
