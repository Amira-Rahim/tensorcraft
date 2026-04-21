"use client";

/**
 * Phase 11 §11d Wave 3 — Settings page brutalist redesign.
 *
 * 5-tab sidebar (Profile / Notifications / GitHub / Theme / Account), brutalist
 * square-track Toggle component, theme preview picker (writes
 * `profiles.preferred_theme_id`), and GitHub connect/disconnect wired to the
 * live API endpoints in `apps/api/src/routes/github.ts`:
 *   - POST /api/github/connect  — returns { url } → redirect into OAuth flow.
 *   - POST /api/github/disconnect — revokes token + clears DB columns.
 *
 * All controls use `rounded-none`, mono labels, CSS vars, and
 * `focus-visible:outline-2 focus-visible:outline-primary`. Purchases live on
 * the Account tab alongside sign-out + delete-account stub.
 */

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getApiUrl } from "@/lib/api-url";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { UserAvatar } from "@/app/components/user-avatar";
import { resizeImage } from "@/lib/resize-image";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "github", label: "GitHub" },
  { id: "theme", label: "Theme" },
  { id: "account", label: "Account" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Brutalist toggle — square track + square thumb. ON fills w/ primary, OFF
// uses border color. Flat linear transition for "brutalist" feel.
// ---------------------------------------------------------------------------

export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      data-testid={`toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="relative inline-flex flex-shrink-0 rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        width: 44,
        height: 22,
        background: on ? "var(--tc-primary)" : "transparent",
        border: `2px solid ${on ? "var(--tc-primary)" : "var(--tc-border)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.12s linear, border-color 0.12s linear",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 block"
        style={{
          width: 14,
          height: 14,
          top: 2,
          left: on ? 22 : 2,
          background: on ? "var(--tc-bg)" : "var(--tc-border)",
          transition: "left 0.12s linear, background 0.12s linear",
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SettingsFormProps {
  email: string;
  displayName: string;
  avatarUrl: string;
  githubUsername: string;
  githubConnected: boolean;
  emailAlerts: boolean;
  weeklyDigest: boolean;
  preferredThemeId: string;
  purchases: Array<{
    planId: string;
    themeIds: string[];
    amount: number;
    createdAt: string;
  }>;
}

export function SettingsForm({
  email,
  displayName: initialName,
  avatarUrl: initialAvatar,
  githubUsername: initialGithub,
  githubConnected: initialGithubConnected,
  emailAlerts: initialEmailAlerts,
  weeklyDigest: initialWeeklyDigest,
  preferredThemeId: initialThemeId,
  purchases,
}: SettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabId>("profile");

  // Profile
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts);
  const [weeklyDigest, setWeeklyDigest] = useState(initialWeeklyDigest);

  // GitHub
  const [githubUser] = useState(initialGithub);
  const [githubConnected, setGithubConnected] = useState(
    initialGithubConnected,
  );
  const [githubBusy, setGithubBusy] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Theme
  const [themeId, setThemeId] = useState<string>(initialThemeId);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);

  // Save state (Profile + Notifications share one save button per tab)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ------------------------------------------------------------------
  // Avatar upload (Profile tab)
  // ------------------------------------------------------------------

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploading(true);
    setError(null);

    try {
      const blob = await resizeImage(file);
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  // ------------------------------------------------------------------
  // Profile + notifications save
  // ------------------------------------------------------------------

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

    // Profile fields (display_name, avatar_url) write direct via RLS.
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);

    // Notification prefs go through PATCH /api/preferences so the API
    // can reconcile Kit tag membership (subscribe / unsubscribe from the
    // "lesson complete" + "weekly digest" Kit sequences). The DB write
    // is the source of truth; Kit is best-effort.
    let prefsError: string | null = null;
    if (
      emailAlerts !== initialEmailAlerts ||
      weeklyDigest !== initialWeeklyDigest
    ) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const res = await fetch(`${getApiUrl()}/api/preferences`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              email_alerts: emailAlerts,
              weekly_digest: weeklyDigest,
            }),
          });
          if (!res.ok) {
            prefsError = "Failed to save notification preferences";
          }
        } catch {
          prefsError = "Network error saving preferences";
        }
      }
    }

    setSaving(false);
    if (updateError || prefsError) {
      setError(prefsError ?? "Failed to save settings");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // ------------------------------------------------------------------
  // Theme picker save (writes preferred_theme_id)
  // ------------------------------------------------------------------

  async function handleThemeSelect(nextId: string) {
    setThemeId(nextId);
    setThemeSaving(true);
    setThemeSaved(false);
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setThemeSaving(false);
      return;
    }
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ preferred_theme_id: nextId })
      .eq("id", user.id);
    setThemeSaving(false);
    if (!upErr) {
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    }
  }

  // ------------------------------------------------------------------
  // GitHub connect / disconnect — wired to apps/api/src/routes/github.ts
  // ------------------------------------------------------------------

  async function handleGithubConnect() {
    setGithubBusy(true);
    setGithubError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setGithubError("Not authenticated");
        setGithubBusy(false);
        return;
      }

      const res = await fetch(`${getApiUrl()}/api/github/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setGithubError(body.error ?? "Failed to start GitHub connect");
        setGithubBusy(false);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Network error");
      setGithubBusy(false);
    }
  }

  async function handleGithubDisconnect() {
    setGithubBusy(true);
    setGithubError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setGithubError("Not authenticated");
        setGithubBusy(false);
        return;
      }

      const res = await fetch(`${getApiUrl()}/api/github/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setGithubError(body.error ?? "Failed to disconnect");
        setGithubBusy(false);
        return;
      }
      setGithubConnected(false);
      setGithubBusy(false);
      router.refresh();
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Network error");
      setGithubBusy(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // ------------------------------------------------------------------
  // Theme preview cards (derived once)
  // ------------------------------------------------------------------

  const themeCards = useMemo(
    () =>
      themeSlugs.map((slug) => {
        const t = themes[slug];
        return {
          slug,
          name: t.displayName,
          tagline: t.tagline,
          specialization: t.specialization,
          primary: t.palette.primary,
          accent: t.palette.accent,
          surface: t.palette.surface,
          bg: t.palette.bg,
          border: t.palette.border,
        };
      }),
    [],
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div
      className="flex flex-col md:flex-row gap-6 md:gap-8"
      data-testid="settings-root"
    >
      {/* Sidebar (md+) / horizontal tabs (mobile) */}
      <aside
        className="md:w-[220px] md:flex-shrink-0"
        aria-label="Settings sections"
      >
        <div
          className="font-mono mb-4 hidden md:block"
          style={{
            fontSize: 9,
            color: "var(--tc-muted)",
            letterSpacing: "0.14em",
          }}
        >
          // SETTINGS
        </div>
        <div
          className="flex md:flex-col gap-px overflow-x-auto md:overflow-visible"
          role="tablist"
          aria-orientation="vertical"
          data-testid="settings-tabs"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`settings-panel-${t.id}`}
                id={`settings-tab-${t.id}`}
                data-testid={`settings-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className="text-left font-mono rounded-none transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                style={{
                  padding: "14px 16px",
                  minHeight: 44,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: active ? "var(--tc-text)" : "var(--tc-muted)",
                  background: active ? "var(--tc-surface)" : "transparent",
                  borderLeft: `2px solid ${active ? "var(--tc-primary)" : "transparent"}`,
                  borderBottom: `2px solid ${active ? "var(--tc-primary)" : "transparent"}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Content */}
      <main
        className="flex-1 min-w-0"
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
      >
        {tab === "profile" && (
          <Panel label="PROFILE">
            {/* Avatar */}
            <div className="flex items-center gap-5 mb-8">
              <UserAvatar url={avatarUrl} name={displayName} size={56} />
              <div>
                <div
                  className="font-mono"
                  style={{ fontSize: 13, color: "var(--tc-text)" }}
                >
                  {displayName || "Unnamed"}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 10, color: "var(--tc-muted)" }}
                >
                  {email}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="change-photo"
                  className="font-mono mt-2 rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  style={{
                    fontSize: 10,
                    color: "var(--tc-primary)",
                    background: "transparent",
                    border: "1px solid var(--tc-primary)",
                    padding: "10px 14px",
                    minHeight: 44,
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.4 : 1,
                  }}
                >
                  {uploading ? "Uploading..." : "Change photo"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Upload profile photo"
                onChange={handleFileSelect}
              />
            </div>

            {/* Display name */}
            <Field label="Display Name" htmlFor="settings-name">
              <input
                id="settings-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                style={{
                  background: "var(--tc-surface-overlay)",
                  border: "2px solid var(--tc-border)",
                  color: "var(--tc-text)",
                  fontSize: 12,
                  padding: "10px 14px",
                }}
              />
            </Field>

            {/* Email (read-only) */}
            <Field label="Email" htmlFor="settings-email">
              <input
                id="settings-email"
                type="email"
                value={email}
                readOnly
                className="w-full font-mono cursor-not-allowed rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                style={{
                  background: "var(--tc-code-bg)",
                  border: "2px solid var(--tc-border)",
                  color: "var(--tc-muted)",
                  fontSize: 12,
                  padding: "10px 14px",
                }}
              />
            </Field>

            <SaveRow
              saving={saving}
              saved={saved}
              error={error}
              onSave={handleSave}
              testId="save-profile"
            />
          </Panel>
        )}

        {tab === "notifications" && (
          <Panel label="NOTIFICATIONS">
            <ToggleRow
              label="Email on lesson complete"
              description="Get a short email whenever you complete a lesson."
              on={emailAlerts}
              onChange={() => setEmailAlerts((v) => !v)}
            />
            <ToggleRow
              label="Weekly progress digest"
              description="Sunday summary of bridges learned + streak."
              on={weeklyDigest}
              onChange={() => setWeeklyDigest((v) => !v)}
            />
            <SaveRow
              saving={saving}
              saved={saved}
              error={error}
              onSave={handleSave}
              testId="save-notifications"
            />
          </Panel>
        )}

        {tab === "github" && (
          <Panel label="GITHUB INTEGRATION">
            <div
              className="flex items-center gap-3 mb-6"
              data-testid="github-status"
            >
              <div
                className="rounded-none"
                style={{
                  width: 10,
                  height: 10,
                  background: githubConnected
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
                }}
                aria-hidden="true"
              />
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: githubConnected
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {githubConnected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
            </div>

            {githubConnected && githubUser && (
              <div
                className="mb-6 rounded-none"
                style={{
                  background: "var(--tc-code-bg)",
                  border: "1px solid var(--tc-border)",
                  padding: "16px 20px",
                }}
              >
                <div
                  className="font-mono"
                  style={{ fontSize: 12, color: "var(--tc-text)" }}
                >
                  @{githubUser}
                </div>
                <div
                  className="font-mono mt-1"
                  style={{ fontSize: 10, color: "var(--tc-muted)" }}
                >
                  Lesson artifacts push to tensorcraft-&lt;theme&gt; repos.
                </div>
              </div>
            )}

            <p
              className="mb-5"
              style={{
                fontSize: 12,
                color: "var(--tc-muted)",
                lineHeight: 1.6,
              }}
            >
              Connect GitHub so each completed lesson commits to your own
              repository. Tensorcraft stores only a personal OAuth token — no
              passwords, no private code mirroring.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {githubConnected ? (
                <button
                  type="button"
                  onClick={handleGithubDisconnect}
                  disabled={githubBusy}
                  data-testid="github-disconnect"
                  className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "transparent",
                    color: "var(--tc-text)",
                    border: "2px solid var(--tc-border)",
                    fontSize: 11,
                    padding: "12px 22px",
                    minHeight: 44,
                    cursor: githubBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {githubBusy ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGithubConnect}
                  disabled={githubBusy}
                  data-testid="github-connect"
                  className="font-mono font-bold rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--tc-primary)",
                    color: "var(--tc-bg)",
                    border: "2px solid var(--tc-primary)",
                    fontSize: 11,
                    padding: "12px 22px",
                    minHeight: 44,
                    cursor: githubBusy ? "not-allowed" : "pointer",
                    letterSpacing: "0.08em",
                  }}
                >
                  {githubBusy ? "Connecting..." : "Connect GitHub →"}
                </button>
              )}
              {githubError && (
                <span
                  role="alert"
                  className="font-mono"
                  style={{ fontSize: 11, color: "var(--tc-primary)" }}
                  data-testid="github-error"
                >
                  {githubError}
                </span>
              )}
            </div>
          </Panel>
        )}

        {tab === "theme" && (
          <Panel label="PREFERRED THEME">
            <p
              className="mb-6"
              style={{
                fontSize: 12,
                color: "var(--tc-muted)",
                lineHeight: 1.6,
              }}
            >
              Pick the theme that powers your dashboard palette and ambient
              effects. You can always switch per-theme while a lesson is open.
            </p>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="radiogroup"
              aria-label="Preferred theme"
              data-testid="theme-grid"
            >
              {themeCards.map((t) => {
                const active = t.slug === themeId;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-testid={`theme-preview-${t.slug}`}
                    onClick={() => handleThemeSelect(t.slug)}
                    disabled={themeSaving}
                    className="relative text-left rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover disabled:opacity-60"
                    style={{
                      background: t.surface,
                      border: `2px solid ${active ? t.primary : t.border}`,
                      padding: 16,
                      cursor: themeSaving ? "wait" : "pointer",
                    }}
                  >
                    {/* Palette swatches */}
                    <div className="flex gap-0 mb-3">
                      {[t.primary, t.accent, t.bg, t.border].map((c, i) => (
                        <div
                          key={i}
                          aria-hidden="true"
                          style={{
                            width: 22,
                            height: 22,
                            background: c,
                            border: "1px solid rgba(0,0,0,0.25)",
                          }}
                        />
                      ))}
                    </div>

                    <div
                      className="font-mono mb-1"
                      style={{
                        fontSize: 12,
                        color: t.primary,
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                      }}
                    >
                      {t.name.toUpperCase()}
                    </div>
                    <div
                      className="font-mono mb-2"
                      style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}
                    >
                      {t.specialization}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.75)",
                        lineHeight: 1.4,
                      }}
                    >
                      {t.tagline}
                    </div>

                    {/* Active indicator */}
                    <div
                      className="absolute top-2 right-2 font-mono"
                      style={{
                        fontSize: 9,
                        color: active ? t.primary : "transparent",
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                      }}
                      aria-hidden="true"
                    >
                      ● ACTIVE
                    </div>
                  </button>
                );
              })}
            </div>

            {themeSaving && (
              <div
                className="font-mono mt-4"
                style={{ fontSize: 10, color: "var(--tc-muted)" }}
              >
                Saving...
              </div>
            )}
            {themeSaved && (
              <div
                className="font-mono mt-4"
                style={{ fontSize: 10, color: "var(--tc-primary)" }}
                data-testid="theme-saved"
              >
                Saved
              </div>
            )}
          </Panel>
        )}

        {tab === "account" && (
          <Panel label="ACCOUNT">
            {/* GitHub username (display + edit — saved w/ profile flow) */}
            <div className="mb-8">
              <div
                className="font-mono mb-2"
                style={{
                  fontSize: 9,
                  color: "var(--tc-muted)",
                  letterSpacing: "0.14em",
                }}
              >
                // PURCHASES
              </div>

              {purchases.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {purchases.map((purchase, i) => (
                    <div
                      key={i}
                      className="rounded-none"
                      style={{
                        background: "var(--tc-code-bg)",
                        border: "1px solid var(--tc-border)",
                        padding: "18px 22px",
                      }}
                    >
                      <div
                        className="font-mono mb-1"
                        style={{ fontSize: 12, color: "var(--tc-text)" }}
                      >
                        {purchase.themeIds
                          .map((id) => themes[id]?.displayName ?? id)
                          .join(" + ")}{" "}
                        —{" "}
                        {purchase.planId === "single"
                          ? "Single Theme"
                          : purchase.planId === "twoBundle"
                            ? "Two Themes"
                            : purchase.planId === "threeBundle"
                              ? "Three Themes"
                              : purchase.planId === "allFive"
                                ? "All Five"
                                : purchase.planId}
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 10, color: "var(--tc-muted)" }}
                      >
                        One-time purchase · ${purchase.amount} ·{" "}
                        {new Date(purchase.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="font-mono"
                  style={{ fontSize: 12, color: "var(--tc-muted)" }}
                >
                  No purchases yet.
                </div>
              )}
            </div>

            {/* Password change note (magic-link only) */}
            <div className="mb-8">
              <div
                className="font-mono mb-2"
                style={{
                  fontSize: 9,
                  color: "var(--tc-muted)",
                  letterSpacing: "0.14em",
                }}
              >
                // PASSWORD
              </div>
              <p
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--tc-muted)",
                  lineHeight: 1.6,
                }}
              >
                Tensorcraft uses magic-link sign-in — there&apos;s no password
                to change. We&apos;ll email you a fresh link every time you sign
                in.
              </p>
            </div>

            {/* Danger zone */}
            <div
              className="pt-6 rounded-none"
              style={{ borderTop: "1px solid var(--tc-border)" }}
            >
              <div
                className="font-mono mb-4"
                style={{
                  fontSize: 9,
                  color: "var(--color-error)",
                  letterSpacing: "0.14em",
                }}
              >
                // DANGER ZONE
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  data-testid="sign-out"
                  className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  style={{
                    fontSize: 11,
                    padding: "12px 22px",
                    minHeight: 44,
                    border: "2px solid var(--tc-border)",
                    background: "transparent",
                    color: "var(--tc-text)",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm((v) => !v)}
                  data-testid="delete-account"
                  className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  style={{
                    fontSize: 11,
                    padding: "12px 22px",
                    minHeight: 44,
                    border: "2px solid var(--color-error)",
                    background: "transparent",
                    color: "var(--color-error)",
                    cursor: "pointer",
                  }}
                >
                  Delete Account
                </button>
              </div>
              {showDeleteConfirm && (
                <div
                  role="alert"
                  className="font-mono mt-4 rounded-none"
                  data-testid="delete-confirm-notice"
                  style={{
                    fontSize: 11,
                    padding: "14px 18px",
                    border: "1px solid var(--color-error)",
                    background:
                      "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    color: "var(--tc-text)",
                    lineHeight: 1.6,
                  }}
                >
                  Account deletion is not yet self-service. Email{" "}
                  <strong style={{ color: "var(--color-error)" }}>
                    support@tensorcraft.app
                  </strong>{" "}
                  from your signed-in address and we&apos;ll wipe everything
                  within 48 hours.
                </div>
              )}
            </div>
          </Panel>
        )}
      </main>
    </div>
  );
}

// ===========================================================================
// Internal panel + field helpers — keep tabs visually identical.
// ===========================================================================

function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border-2 bg-surface-raised rounded-none"
      style={{
        borderColor: "var(--tc-border)",
        padding: 32,
      }}
    >
      <div
        className="font-mono mb-6"
        style={{
          fontSize: 9,
          color: "var(--tc-primary)",
          letterSpacing: "0.14em",
        }}
      >
        // {label}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="font-mono mb-1.5 block"
        style={{
          fontSize: 10,
          color: "var(--tc-muted)",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  on,
  onChange,
}: {
  label: string;
  description?: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-6"
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--tc-border)",
      }}
    >
      <div className="min-w-0">
        <div
          className="font-mono"
          style={{ fontSize: 12, color: "var(--tc-text)" }}
        >
          {label}
        </div>
        {description && (
          <div
            className="font-mono mt-1"
            style={{ fontSize: 10, color: "var(--tc-muted)", lineHeight: 1.5 }}
          >
            {description}
          </div>
        )}
      </div>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}

function SaveRow({
  saving,
  saved,
  error,
  onSave,
  testId,
}: {
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  testId: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div className="flex items-center gap-3 mt-6">
      <button
        type="button"
        onClick={onSave}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        disabled={saving}
        data-testid={testId}
        className="font-mono font-bold rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50"
        style={{
          background: hov ? "transparent" : "var(--tc-primary)",
          color: hov ? "var(--tc-primary)" : "var(--tc-bg)",
          border: "2px solid var(--tc-primary)",
          fontSize: 11,
          padding: "12px 28px",
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: hov ? "4px 4px 0 var(--tc-primary)" : "none",
          transform: hov ? "translate(-2px,-2px)" : "none",
          transition: "all 0.12s linear",
          letterSpacing: "0.08em",
        }}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
      {saved && (
        <span
          className="font-mono"
          data-testid={`${testId}-saved`}
          style={{
            fontSize: 11,
            color: "var(--tc-primary)",
            letterSpacing: "0.08em",
          }}
        >
          Saved
        </span>
      )}
      {error && (
        <span
          role="alert"
          className="font-mono"
          data-testid={`${testId}-error`}
          style={{
            fontSize: 11,
            color: "var(--color-error)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
