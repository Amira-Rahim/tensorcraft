"use client";

/**
 * Settings page brutalist redesign.
 *
 * 4-tab sidebar (Profile / Notifications / GitHub / Account), brutalist
 * square-track Toggle component, GitHub connect/disconnect wired to live API
 * endpoints in `apps/api/src/routes/github.ts`:
 *   - POST /api/github/connect , returns { url } → redirect into OAuth flow.
 *   - POST /api/github/disconnect, revokes token + clears DB columns.
 *
 * The "World" tab + preferred-world picker were removed when the launch
 * scoped down to one world. Active world is route-derived now (whichever
 * world the learner is currently inside), not user-selected. The
 * `profiles.preferred_world_id` column is left as a tombstone for revival.
 *
 * All controls use `rounded-none`, mono labels, CSS vars, and
 * `focus-visible:outline-2 focus-visible:outline-primary`. Purchases live on
 * the Account tab alongside sign-out + delete-account stub.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getApiUrl } from "@/lib/api-url";
import { worlds } from "@tensorcraft/worlds";
import { LAUNCHED_WORLDS } from "@tensorcraft/shared";
import { UserAvatar } from "@/app/components/user-avatar";
import { resizeImage } from "@/lib/resize-image";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { reportDataError } from "@/lib/report-data-error";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "github", label: "GitHub" },
  { id: "account", label: "Account" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Brutalist toggle, square track + square thumb. ON fills w/ primary, OFF
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
        border: `2px solid ${on ? "var(--tc-primary)" : "var(--tc-border-interactive)"}`,
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
  purchases: Array<{
    planId: string;
    worldIds: string[];
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
  const [pushSummary, setPushSummary] = useState<string | null>(null);

  // Save state (Profile + Notifications share one save button per tab)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Self-serve erasure (Tier 1-LEGAL): typed confirmation + real endpoint.
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteState, setDeleteState] = useState<"idle" | "deleting" | "error">(
    "idle",
  );
  const [exportState, setExportState] = useState<
    "idle" | "exporting" | "error"
  >("idle");

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
      if (!user) throw new Error(ERROR_MESSAGES.session_expired);

      const filePath = `${user.id}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // The result used to be discarded entirely, so a failed write still ran
      // setAvatarUrl below and the UI showed the new avatar regardless. The
      // optimistic update stays (re-uploading is cheap, a broken form is not),
      // but the failure is no longer invisible.
      const { error: avatarError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", user.id);
      reportDataError("settings.updateAvatar", avatarError);

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

  // Wrapped in try/finally. `getUser()` and the profile update sat outside any
  // handler, so a throw from either skipped `setSaving(false)` and left the
  // button spinning with no error and no retry - the user could not tell
  // whether their name had saved. The correct pattern already existed at
  // handleAvatarUpload in this same file.
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await performSave();
    } catch {
      setError(ERROR_MESSAGES.network);
    } finally {
      setSaving(false);
    }
  }

  async function performSave() {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(ERROR_MESSAGES.session_expired);
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

    // setSaving(false) now lives in handleSave's finally, so it runs on the
    // throwing paths too.
    reportDataError("settings.updateProfile", updateError);

    if (updateError || prefsError) {
      setError(prefsError ?? updateError?.message ?? "Failed to save settings");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  // ------------------------------------------------------------------
  // GitHub connect / disconnect, wired to apps/api/src/routes/github.ts
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
        setGithubError(ERROR_MESSAGES.session_expired);
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
        setGithubError(ERROR_MESSAGES.session_expired);
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

  async function handleRetroactivePush() {
    setGithubBusy(true);
    setGithubError(null);
    setPushSummary(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setGithubError(ERROR_MESSAGES.session_expired);
        setGithubBusy(false);
        return;
      }

      // One request per launched world; V1 this is just Deep Orbit.
      let pushed = 0;
      let skipped = 0;
      let failed = 0;
      for (const worldId of LAUNCHED_WORLDS) {
        const res = await fetch(`${getApiUrl()}/api/github/retroactive-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ worldId }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setGithubError(body.error ?? "Retroactive push failed");
          setGithubBusy(false);
          return;
        }
        const summary = (await res.json()) as {
          pushed: number;
          skipped: number;
          failed: number;
        };
        pushed += summary.pushed;
        skipped += summary.skipped;
        failed += summary.failed;
      }
      setPushSummary(
        `Pushed ${pushed} · skipped ${skipped} · failed ${failed}`,
      );
      setGithubBusy(false);
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
          SETTINGS
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
                  border: "2px solid var(--tc-border-interactive)",
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
                  border: "2px solid var(--tc-border-interactive)",
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
                  Lesson artifacts push to tensorcraft-&lt;world&gt; repos.
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
              Connect GitHub and each lesson you complete lands as a commit in
              your own repository. Solution repos are created public on your
              GitHub account. Tensorcraft stores only a personal OAuth token, no
              passwords, no private code mirroring.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {githubConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleGithubDisconnect}
                    disabled={githubBusy}
                    data-testid="github-disconnect"
                    className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "transparent",
                      color: "var(--tc-text)",
                      border: "2px solid var(--tc-border-interactive)",
                      fontSize: 11,
                      padding: "12px 22px",
                      minHeight: 44,
                      cursor: githubBusy ? "not-allowed" : "pointer",
                    }}
                  >
                    {githubBusy ? "Working..." : "Disconnect"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRetroactivePush}
                    disabled={githubBusy}
                    data-testid="github-retroactive-push"
                    className="font-mono font-bold rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--tc-primary)",
                      color: "var(--tc-on-primary)",
                      border: "2px solid var(--tc-primary)",
                      fontSize: 11,
                      padding: "12px 22px",
                      minHeight: 44,
                      cursor: githubBusy ? "not-allowed" : "pointer",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {githubBusy ? "Working..." : "Push solved exercises"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleGithubConnect}
                  disabled={githubBusy}
                  data-testid="github-connect"
                  className="font-mono font-bold rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 brutalist-hover brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--tc-primary)",
                    color: "var(--tc-on-primary)",
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
              {pushSummary && (
                <p
                  role="status"
                  data-testid="github-push-summary"
                  className="mt-4 font-mono"
                  style={{ fontSize: 11, color: "var(--tc-primary)" }}
                >
                  {pushSummary}
                </p>
              )}
              {githubError && (
                <span
                  role="alert"
                  className="font-mono"
                  // Error state must not render in the brand success color
                  // (2026-07-14 audit): use the error red.
                  style={{ fontSize: 11, color: "var(--color-error)" }}
                  data-testid="github-error"
                >
                  {githubError}
                </span>
              )}
            </div>
          </Panel>
        )}

        {tab === "account" && (
          <Panel label="ACCOUNT">
            {/* GitHub username (display + edit, saved w/ profile flow) */}
            <div className="mb-8">
              <div
                className="font-mono mb-2"
                style={{
                  fontSize: 9,
                  color: "var(--tc-muted)",
                  letterSpacing: "0.14em",
                }}
              >
                PURCHASES
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
                        {purchase.worldIds
                          .map((id) => worlds[id]?.displayName ?? id)
                          .join(" + ")}
                        {": "}
                        {purchase.planId === "single"
                          ? "Single World"
                          : purchase.planId === "twoBundle"
                            ? "Two Worlds"
                            : purchase.planId === "threeBundle"
                              ? "Three Worlds"
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
                PASSWORD
              </div>
              <p
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--tc-muted)",
                  lineHeight: 1.6,
                }}
              >
                Tensorcraft uses magic-link sign-in; there&apos;s no password to
                change. We&apos;ll email you a fresh link every time you sign
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
                DANGER ZONE
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
                    border: "2px solid var(--tc-border-interactive)",
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
              {/* Data export (GDPR Art. 15/20). Same panel as deletion so
                  both rights live where the privacy page points. */}
              <div className="mt-4">
                <button
                  type="button"
                  data-testid="export-data"
                  disabled={exportState === "exporting"}
                  onClick={async () => {
                    setExportState("exporting");
                    try {
                      const { apiFetch } = await import("@/lib/api-fetch");
                      const res = await apiFetch("/api/profiles/export", {
                        timeoutMs: 30_000,
                      });
                      if (!res.ok) throw new Error(String(res.status));
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `tensorcraft-export-${new Date().toISOString().slice(0, 10)}.json`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      setExportState("idle");
                    } catch {
                      setExportState("error");
                    }
                  }}
                  className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  style={{
                    fontSize: 11,
                    padding: "12px 22px",
                    minHeight: 44,
                    border: "2px solid var(--tc-border-interactive)",
                    background: "transparent",
                    color: "var(--tc-text)",
                    cursor: "pointer",
                  }}
                >
                  {exportState === "exporting"
                    ? "Preparing export…"
                    : "Export my data (JSON)"}
                </button>
                {exportState === "error" && (
                  <p
                    role="alert"
                    className="font-mono mt-2"
                    style={{ fontSize: 11, color: "var(--color-error)" }}
                  >
                    Export failed. Try again, or email support@tensorcraft.app.
                  </p>
                )}
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
                  <p className="m-0 mb-3">
                    This permanently deletes your account, progress,
                    certificates, and settings. Purchase records are retained
                    without any link to you, as tax law requires. This cannot be
                    undone. Type{" "}
                    <strong style={{ color: "var(--color-error)" }}>
                      DELETE
                    </strong>{" "}
                    to confirm.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label htmlFor="delete-confirm-input" className="sr-only">
                      Type DELETE to confirm account deletion
                    </label>
                    <input
                      id="delete-confirm-input"
                      data-testid="delete-confirm-input"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="flex-1 min-w-0 font-mono bg-page px-3 py-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                      style={{
                        fontSize: 12,
                        border: "1px solid var(--tc-border-interactive)",
                        color: "var(--tc-text)",
                      }}
                    />
                    <button
                      type="button"
                      data-testid="delete-confirm-submit"
                      disabled={
                        deleteConfirmText !== "DELETE" ||
                        deleteState === "deleting"
                      }
                      onClick={async () => {
                        setDeleteState("deleting");
                        try {
                          const { apiFetch } = await import("@/lib/api-fetch");
                          const res = await apiFetch("/api/profiles/delete", {
                            method: "POST",
                            timeoutMs: 30_000,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ confirm: "DELETE" }),
                          });
                          if (!res.ok) throw new Error(String(res.status));
                          // The auth user no longer exists; drop the local
                          // session and land on the homepage.
                          const supabase = getSupabaseBrowserClient();
                          await supabase.auth.signOut().catch(() => {});
                          window.location.assign("/");
                        } catch {
                          setDeleteState("error");
                        }
                      }}
                      className="font-mono rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50"
                      style={{
                        fontSize: 11,
                        padding: "10px 18px",
                        minHeight: 44,
                        border: "2px solid var(--color-error)",
                        background: "var(--color-error)",
                        color: "var(--tc-on-primary)",
                        cursor:
                          deleteConfirmText === "DELETE"
                            ? "pointer"
                            : "default",
                      }}
                    >
                      {deleteState === "deleting"
                        ? "Deleting…"
                        : "Permanently delete"}
                    </button>
                  </div>
                  {deleteState === "error" && (
                    <p
                      className="m-0 mt-2"
                      style={{ color: "var(--color-error)" }}
                    >
                      Deletion failed. Try again, or email
                      support@tensorcraft.app from your signed-in address.
                    </p>
                  )}
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
// Internal panel + field helpers, keep tabs visually identical.
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
        {label}
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
          color: hov ? "var(--tc-primary)" : "var(--tc-on-primary)",
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
