"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { themes, themeSlugs } from "@tensorcraft/themes";

const SIDEBAR_ITEMS = [
  "Profile",
  "GitHub",
  "Theme",
  "Notifications",
  "Billing",
] as const;

type Section = (typeof SIDEBAR_ITEMS)[number];

const THEME_OPTIONS = themeSlugs.map((slug) => ({
  id: slug,
  name: themes[slug].displayName,
  bg: themes[slug].palette.bg,
  accent: themes[slug].palette.primary,
}));

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative flex-shrink-0"
      style={{
        width: 40,
        height: 22,
        background: on ? "var(--tc-primary)" : "var(--tc-muted)",
        border: `2px solid ${on ? "var(--tc-primary)" : "var(--tc-muted)"}`,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      aria-pressed={on}
      aria-label="Toggle"
    >
      <div
        className="absolute"
        style={{
          width: 14,
          height: 14,
          background: "var(--tc-bg)",
          top: 2,
          left: on ? 22 : 2,
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

interface SettingsFormProps {
  email: string;
  displayName: string;
  avatarUrl: string;
  preferredThemeId: string;
  githubUsername: string;
  githubConnected: boolean;
  emailAlerts: boolean;
  weeklyDigest: boolean;
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
  preferredThemeId: initialTheme,
  githubUsername: initialGithub,
  githubConnected: initialGithubConnected,
  emailAlerts: initialEmailAlerts,
  weeklyDigest: initialWeeklyDigest,
  purchases,
}: SettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("Profile");
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [githubUser, setGithubUser] = useState(initialGithub);
  const [githubConnected, setGithubConnected] = useState(
    initialGithubConnected,
  );
  const [preferredTheme, setPreferredTheme] = useState(initialTheme);
  const [autoPush, setAutoPush] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts);
  const [weeklyDigest, setWeeklyDigest] = useState(initialWeeklyDigest);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovSave, setHovSave] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initial = displayName.charAt(0).toUpperCase() || "?";

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
        preferred_theme_id: preferredTheme,
        github_username: githubUser || null,
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
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="w-[200px] flex-shrink-0">
        <div
          className="font-mono mb-4"
          style={{
            fontSize: 9,
            color: "var(--tc-muted)",
            letterSpacing: "0.12em",
          }}
        >
          // SETTINGS
        </div>
        <div className="flex flex-col gap-px">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className="text-left font-mono transition-all"
              style={{
                padding: "10px 16px",
                fontSize: 11,
                color: section === item ? "var(--tc-text)" : "var(--tc-muted)",
                background:
                  section === item ? "var(--tc-surface)" : "transparent",
                borderLeft: `2px solid ${section === item ? "var(--tc-primary)" : "transparent"}`,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {/* Profile */}
        {section === "Profile" && (
          <div
            className="border-2 bg-surface-raised"
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
                letterSpacing: "0.12em",
              }}
            >
              // PROFILE
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-5 mb-8">
              <div
                className="flex-shrink-0 flex items-center justify-center font-mono"
                style={{
                  width: 56,
                  height: 56,
                  background: "rgba(107,170,138,0.12)",
                  border: "2px solid var(--tc-primary)",
                  fontSize: 22,
                  color: "var(--tc-primary)",
                }}
              >
                {initial}
              </div>
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
                  className="font-mono mt-2"
                  style={{
                    fontSize: 10,
                    color: "var(--tc-primary)",
                    background: "transparent",
                    border: "1px solid var(--tc-primary)",
                    padding: "3px 10px",
                    cursor: "pointer",
                  }}
                >
                  Change photo
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-4">
              <div>
                <div
                  className="font-mono mb-1.5"
                  style={{ fontSize: 10, color: "var(--tc-muted)" }}
                >
                  <label htmlFor="settings-name">Display Name</label>
                </div>
                <input
                  id="settings-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full font-mono outline-none"
                  style={{
                    background: "var(--tc-surface-overlay)",
                    border: "2px solid var(--tc-border)",
                    color: "var(--tc-text)",
                    fontSize: 12,
                    padding: "10px 14px",
                  }}
                />
              </div>

              <div>
                <div
                  className="font-mono mb-1.5"
                  style={{ fontSize: 10, color: "var(--tc-muted)" }}
                >
                  <label htmlFor="settings-email">Email</label>
                </div>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full font-mono outline-none cursor-not-allowed"
                  style={{
                    background: "var(--tc-code-bg)",
                    border: "2px solid var(--tc-border)",
                    color: "var(--tc-muted)",
                    fontSize: 12,
                    padding: "10px 14px",
                  }}
                />
              </div>

              <div>
                <div
                  className="font-mono mb-1.5"
                  style={{ fontSize: 10, color: "var(--tc-muted)" }}
                >
                  <label htmlFor="settings-github">GitHub Username</label>
                </div>
                <div
                  className="flex items-center"
                  style={{
                    border: "2px solid var(--tc-border)",
                    background: "var(--tc-surface-overlay)",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-muted)",
                      padding: "10px 14px",
                      borderRight: "1px solid var(--tc-border)",
                    }}
                  >
                    @
                  </span>
                  <input
                    id="settings-github"
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    className="flex-1 font-mono outline-none"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--tc-text)",
                      fontSize: 12,
                      padding: "10px 14px",
                    }}
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  onMouseEnter={() => setHovSave(true)}
                  onMouseLeave={() => setHovSave(false)}
                  disabled={saving}
                  className="font-mono font-bold self-start disabled:opacity-50"
                  style={{
                    background: hovSave ? "transparent" : "var(--tc-primary)",
                    color: hovSave ? "var(--tc-primary)" : "var(--tc-bg)",
                    border: "2px solid var(--tc-primary)",
                    fontSize: 11,
                    padding: "12px 28px",
                    cursor: "pointer",
                    boxShadow: hovSave
                      ? "4px 4px 0 var(--tc-primary, #6BAA8A)"
                      : "none",
                    transform: hovSave ? "translate(-2px,-2px)" : "none",
                    transition: "all 0.1s ease",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saved && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--tc-primary)",
                    }}
                  >
                    Saved
                  </span>
                )}
                {error && (
                  <span
                    className="font-mono text-red-400"
                    style={{ fontSize: 11 }}
                  >
                    {error}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GitHub */}
        {section === "GitHub" && (
          <div
            className="border-2 bg-surface-raised"
            style={{ borderColor: "var(--tc-border)", padding: 32 }}
          >
            <div
              className="font-mono mb-6"
              style={{
                fontSize: 9,
                color: "var(--tc-primary)",
                letterSpacing: "0.12em",
              }}
            >
              // GITHUB INTEGRATION
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: initialGithubConnected
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
                }}
              />
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: initialGithubConnected
                    ? "var(--tc-primary)"
                    : "var(--tc-muted)",
                }}
              >
                {initialGithubConnected ? "Connected" : "Not connected"}
              </span>
            </div>

            {initialGithubConnected && githubUser && (
              <div
                className="mb-6"
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
              </div>
            )}

            <div
              className="flex justify-between items-center"
              style={{
                padding: "14px 0",
                borderBottom: "1px solid var(--tc-border)",
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: 11, color: "var(--tc-text)" }}
              >
                Auto-push on exercise completion
              </span>
              <Toggle on={autoPush} onChange={() => setAutoPush((v) => !v)} />
            </div>

            <button
              type="button"
              className="font-mono mt-5"
              style={{
                background: "transparent",
                color: "var(--tc-muted)",
                border: "2px solid var(--tc-border)",
                fontSize: 10,
                padding: "8px 20px",
                cursor: "pointer",
              }}
            >
              {initialGithubConnected ? "Disconnect" : "Connect GitHub"}
            </button>
          </div>
        )}

        {/* Theme */}
        {section === "Theme" && (
          <div
            className="border-2 bg-surface-raised"
            style={{ borderColor: "var(--tc-border)", padding: 32 }}
          >
            <div
              className="font-mono mb-6"
              style={{
                fontSize: 9,
                color: "var(--tc-primary)",
                letterSpacing: "0.12em",
              }}
            >
              // DEFAULT THEME
            </div>

            <div className="flex flex-col gap-0.5">
              {THEME_OPTIONS.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setPreferredTheme(th.id)}
                  className="flex items-center gap-4 text-left transition-all"
                  style={{
                    padding: "16px 20px",
                    background:
                      preferredTheme === th.id
                        ? "rgba(107,170,138,0.06)"
                        : "var(--tc-surface-overlay)",
                    border: `2px solid ${preferredTheme === th.id ? "var(--tc-primary)" : "var(--tc-border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      background: th.bg,
                      border: `2px solid ${th.accent}40`,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `${th.accent}15`,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      color: "var(--tc-text)",
                    }}
                  >
                    {th.name}
                  </span>
                  {preferredTheme === th.id && (
                    <span
                      className="font-mono ml-auto"
                      style={{
                        fontSize: 9,
                        color: "var(--tc-primary)",
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {section === "Notifications" && (
          <div
            className="border-2 bg-surface-raised"
            style={{ borderColor: "var(--tc-border)", padding: 32 }}
          >
            <div
              className="font-mono mb-6"
              style={{
                fontSize: 9,
                color: "var(--tc-primary)",
                letterSpacing: "0.12em",
              }}
            >
              // NOTIFICATIONS
            </div>

            <div
              className="flex justify-between items-center"
              style={{
                padding: "16px 0",
                borderBottom: "1px solid var(--tc-border)",
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: 11, color: "var(--tc-text)" }}
              >
                Email on lesson complete
              </span>
              <Toggle
                on={emailAlerts}
                onChange={() => setEmailAlerts((v) => !v)}
              />
            </div>

            <div
              className="flex justify-between items-center"
              style={{
                padding: "16px 0",
                borderBottom: "1px solid var(--tc-border)",
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: 11, color: "var(--tc-text)" }}
              >
                Weekly progress digest
              </span>
              <Toggle
                on={weeklyDigest}
                onChange={() => setWeeklyDigest((v) => !v)}
              />
            </div>
          </div>
        )}

        {/* Billing */}
        {section === "Billing" && (
          <div
            className="border-2 bg-surface-raised"
            style={{ borderColor: "var(--tc-border)", padding: 32 }}
          >
            <div
              className="font-mono mb-6"
              style={{
                fontSize: 9,
                color: "var(--tc-primary)",
                letterSpacing: "0.12em",
              }}
            >
              // BILLING
            </div>

            {purchases.length > 0 ? (
              purchases.map((purchase, i) => (
                <div key={i} className="mb-5">
                  <div
                    className="mb-5"
                    style={{
                      background: "var(--tc-code-bg)",
                      border: "1px solid var(--tc-border)",
                      padding: "20px 24px",
                    }}
                  >
                    <div
                      className="font-mono mb-1"
                      style={{
                        fontSize: 12,
                        color: "var(--tc-text)",
                      }}
                    >
                      {purchase.themeIds
                        .map((id) => themes[id]?.displayName ?? id)
                        .join(" + ")}{" "}
                      &mdash;{" "}
                      {purchase.planId === "single"
                        ? "Single Theme"
                        : purchase.planId === "double"
                          ? "Two Themes"
                          : purchase.planId === "triple"
                            ? "Three Themes"
                            : purchase.planId}
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        color: "var(--tc-muted)",
                      }}
                    >
                      One-time purchase &middot; ${purchase.amount} &middot;{" "}
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
                </div>
              ))
            ) : (
              <div
                className="font-mono"
                style={{ fontSize: 12, color: "var(--tc-muted)" }}
              >
                No purchases yet.
              </div>
            )}

            {/* Sign out / Delete */}
            <div
              className="mt-8 pt-6"
              style={{ borderTop: "1px solid var(--tc-border)" }}
            >
              <div
                className="font-mono mb-4 text-red-400"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.12em",
                }}
              >
                // DANGER ZONE
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    padding: "8px 20px",
                    border: "2px solid var(--tc-border)",
                    background: "transparent",
                    color: "var(--tc-muted)",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="font-mono text-red-400 border-2 border-red-400 bg-red-400/10"
                  style={{
                    fontSize: 10,
                    padding: "8px 20px",
                    cursor: "pointer",
                  }}
                >
                  Delete Account
                </button>
              </div>
              {showDeleteConfirm && (
                <div
                  className="font-mono mt-4 border border-red-400/30 bg-red-400/10"
                  style={{
                    fontSize: 11,
                    padding: "16px 20px",
                    color: "var(--tc-muted)",
                  }}
                >
                  Account deletion is not yet available. Contact{" "}
                  <strong style={{ color: "var(--tc-text)" }}>
                    support@tensorcraft.dev
                  </strong>{" "}
                  to request deletion.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
