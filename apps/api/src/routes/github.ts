import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { isValidThemeSlug, isValidSlug, isLaunched } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";
import {
  buildOAuthAuthorizeUrl,
  buildRepoName,
  commitLessonArtifact,
  createOrGetRepo,
  ensureThemeRepo,
  exchangeCodeForToken,
  getGitHubUsername,
  GitHubApiError,
  pushFile,
  revokeUserToken,
} from "../lib/github";
import { logger } from "../lib/logger";
import { captureServer, SERVER_EVENTS } from "../lib/posthog";

const github = new Hono<AppEnv>();

// ──────────────────────────────────────────────────────────────────────────
// Structured error helper — keeps error shapes consistent across endpoints
// ──────────────────────────────────────────────────────────────────────────

type StructuredErrorCode =
  | "github_not_connected"
  | "github_token_expired"
  | "github_repo_access_revoked"
  | "github_api_error"
  | "github_rate_limited"
  | "validation_error"
  | "internal_error";

function structuredError(
  code: StructuredErrorCode,
  message: string,
  extra?: Record<string, unknown>,
): { error: string; code: StructuredErrorCode } & Record<string, unknown> {
  return { error: message, code, ...(extra ?? {}) };
}

/**
 * Maps a GitHubApiError to the right HTTP status + structured code.
 * Critical for graceful degradation when repo access is revoked (403/404).
 */
function mapGitHubError(err: unknown): {
  status: 401 | 403 | 404 | 429 | 500;
  body: ReturnType<typeof structuredError>;
} {
  if (err instanceof GitHubApiError) {
    if (err.status === 401) {
      return {
        status: 401,
        body: structuredError(
          "github_token_expired",
          "GitHub token expired or revoked. Please reconnect your GitHub account.",
        ),
      };
    }
    if (err.status === 403 || err.status === 404) {
      return {
        status: err.status,
        body: structuredError(
          "github_repo_access_revoked",
          "GitHub repository access revoked or repo not found. Your integration is still active — retry once you reinstall the GitHub App.",
        ),
      };
    }
    if (err.status === 429) {
      return {
        status: 429,
        body: structuredError(
          "github_rate_limited",
          "GitHub rate limit hit. Try again shortly.",
        ),
      };
    }
    return {
      status: 500,
      body: structuredError("github_api_error", "GitHub API error", {
        upstreamStatus: err.status,
      }),
    };
  }
  return {
    status: 500,
    body: structuredError("internal_error", "Unexpected error"),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// POST /api/github/connect — Initiates the GitHub App OAuth flow
// ──────────────────────────────────────────────────────────────────────────

github.use("/connect", authMiddleware);

github.post("/connect", async (c) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  let redirectUri = process.env.GITHUB_CALLBACK_URL;
  if (!redirectUri) {
    let appUrl = process.env.APP_URL;
    if (!appUrl) {
      if (process.env.NODE_ENV === "production") {
        return c.json(
          structuredError(
            "internal_error",
            "GitHub callback URL is not configured",
          ),
          500,
        );
      }
      appUrl = "http://localhost:3000";
    }
    redirectUri = `${appUrl}/api/github/callback`;
  }

  if (!clientId) {
    return c.json(
      structuredError(
        "internal_error",
        "GitHub App is not configured on this server",
      ),
      500,
    );
  }

  // Include user id in state so the callback can associate the token, and
  // pin the same state to a short-lived HttpOnly cookie so the callback can
  // verify the request originated from this server's `/connect` flow (CSRF
  // defense — without the cookie pin, an attacker could craft a callback URL
  // with their own userId and ride the victim's GitHub session into the
  // attacker's profile).
  const userId = c.get("userId");
  const state = `${userId}.${crypto.randomUUID()}`;

  setCookie(c, "tc_gh_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/api/github",
    maxAge: 600, // 10 min — covers the GitHub redirect round-trip
  });

  const url = buildOAuthAuthorizeUrl({ clientId, redirectUri, state });

  return c.json({ url, state });
});

// ──────────────────────────────────────────────────────────────────────────
// GET /api/github/callback — Exchanges OAuth code for a user token
// ──────────────────────────────────────────────────────────────────────────
//
// This endpoint is called by GitHub after the user authorizes the App.
// It does NOT require our own auth middleware — identity is encoded in
// `state` (userId.{uuid}). In production, `state` should be additionally
// validated against a signed cookie set by /connect.

github.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    return c.json(
      structuredError("validation_error", `GitHub returned error: ${error}`),
      400,
    );
  }

  if (!code || !state) {
    return c.json(
      structuredError(
        "validation_error",
        "Missing `code` or `state` query parameter",
      ),
      400,
    );
  }

  // CSRF defense: the `state` query param must match the `tc_gh_oauth_state`
  // cookie set by `/connect`. Without this check, an attacker could redirect
  // the victim's browser to GitHub and complete the OAuth dance with an
  // attacker-controlled `userId.uuid` state, binding the victim's GitHub
  // identity to the attacker's profile row.
  const cookieState = getCookie(c, "tc_gh_oauth_state");
  if (!cookieState) {
    return c.json(
      structuredError(
        "validation_error",
        "OAuth state cookie missing — restart the GitHub connect flow",
      ),
      400,
    );
  }
  const a = Buffer.from(state);
  const b = Buffer.from(cookieState);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    deleteCookie(c, "tc_gh_oauth_state", { path: "/api/github" });
    return c.json(
      structuredError("validation_error", "OAuth state mismatch"),
      400,
    );
  }
  // One-shot: invalidate cookie immediately so the same state can't be replayed.
  deleteCookie(c, "tc_gh_oauth_state", { path: "/api/github" });

  const [userId] = state.split(".");
  if (!userId) {
    return c.json(structuredError("validation_error", "Invalid state"), 400);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_CALLBACK_URL ??
    `${process.env.APP_URL ?? "http://localhost:3000"}/api/github/callback`;

  if (!clientId || !clientSecret) {
    return c.json(
      structuredError(
        "internal_error",
        "GitHub App is not configured on this server",
      ),
      500,
    );
  }

  try {
    const tokens = await exchangeCodeForToken({
      clientId,
      clientSecret,
      code,
      redirectUri,
    });

    // Look up the username so we can persist it alongside the token.
    const username = await getGitHubUsername(tokens.access_token);
    if (!username) {
      return c.json(
        structuredError(
          "github_api_error",
          "Failed to fetch GitHub user after token exchange",
        ),
        500,
      );
    }

    // Use the admin client here — no user-scoped Supabase JWT available
    // in the callback request. RLS on `profiles` must still allow this
    // via the service role.
    const { getSupabaseAdminClient } = await import("@tensorcraft/supabase");
    const supabase = getSupabaseAdminClient();

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        github_token: tokens.access_token,
        github_username: username,
        github_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (dbError) {
      logger.error(
        { err: dbError, route: "github.callback", userId },
        "Failed to persist GitHub token (callback)",
      );
      return c.json(
        structuredError("internal_error", "Failed to store GitHub token"),
        500,
      );
    }

    return c.json({ connected: true, username });
  } catch (err) {
    const mapped = mapGitHubError(err);
    return c.json(mapped.body, mapped.status);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/github/disconnect — Revokes token + clears DB columns
// ──────────────────────────────────────────────────────────────────────────

github.use("/disconnect", authMiddleware);

github.post("/disconnect", async (c) => {
  const userId = c.get("userId");
  const supabase = getSupabaseServerClient(c.get("accessToken"));

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("id", userId)
    .single();

  if (fetchErr) {
    return c.json(
      structuredError("internal_error", "Failed to read profile"),
      500,
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const token = profile?.github_token as string | null | undefined;

  // Best-effort revocation — if env vars are missing or GitHub is down, we
  // still want to clear our DB so the user is locally disconnected.
  if (token && clientId && clientSecret) {
    try {
      await revokeUserToken({
        clientId,
        clientSecret,
        accessToken: token,
      });
    } catch (err) {
      logger.warn(
        { err, route: "github.disconnect", userId },
        "Token revocation failed (continuing to clear DB)",
      );
    }
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      github_token: null,
      github_username: null,
      github_connected: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateErr) {
    return c.json(
      structuredError("internal_error", "Failed to clear GitHub fields"),
      500,
    );
  }

  return c.json({ disconnected: true });
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/github/commit — Commits a lesson artifact to per-theme repo
// ──────────────────────────────────────────────────────────────────────────

github.use("/commit", authMiddleware);

github.post("/commit", async (c) => {
  const userId = c.get("userId");

  let body: {
    themeId: string;
    lessonId: string;
    code: string;
    moduleId?: string;
    readmeDelta?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      structuredError("validation_error", "Invalid JSON body"),
      400,
    );
  }

  const { themeId, lessonId, code, moduleId, readmeDelta } = body;

  if (!themeId || !lessonId || typeof code !== "string") {
    return c.json(
      structuredError(
        "validation_error",
        "themeId, lessonId, and code are required",
      ),
      400,
    );
  }

  if (!isValidThemeSlug(themeId)) {
    return c.json(structuredError("validation_error", "Invalid themeId"), 400);
  }
  if (!isLaunched(themeId)) {
    return c.json(
      structuredError("validation_error", "Theme is not yet launched"),
      400,
    );
  }
  if (!isValidSlug(lessonId)) {
    return c.json(structuredError("validation_error", "Invalid lessonId"), 400);
  }
  if (moduleId && !isValidSlug(moduleId)) {
    return c.json(structuredError("validation_error", "Invalid moduleId"), 400);
  }
  if (code.length > 102_400) {
    return c.json(
      structuredError("validation_error", "Code exceeds maximum size (100KB)"),
      400,
    );
  }

  const supabase = getSupabaseServerClient(c.get("accessToken"));
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("github_token, github_username")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    return c.json(
      structuredError("internal_error", "Failed to read profile"),
      500,
    );
  }

  const token = profile.github_token as string | null;
  const username = profile.github_username as string | null;

  if (!token || !username) {
    return c.json(
      structuredError(
        "github_not_connected",
        "GitHub is not connected. Connect it from Settings.",
      ),
      400,
    );
  }

  try {
    // Ensure the per-theme repo + README exist.
    await ensureThemeRepo(token, username, themeId, { isPrivate: false });

    const result = await commitLessonArtifact({
      accessToken: token,
      username,
      themeSlug: themeId,
      moduleId: moduleId ?? "module-unknown",
      lessonId,
      code,
      readmeDelta,
    });

    // Authoritative engagement event — fires only on a confirmed GitHub push.
    // Matches the server-side pattern used for payment_completed (§6i).
    captureServer(
      SERVER_EVENTS.CODE_PUSHED,
      {
        themeId,
        lessonId,
        // No explicit exerciseSlug on this endpoint; the artifact is stored at
        // `${moduleId}/${lessonId}` so lessonId doubles as the exercise id.
        exerciseSlug: lessonId,
        commitSha: result.commitSha,
      },
      userId,
    );

    return c.json({ success: true, ...result });
  } catch (err) {
    const mapped = mapGitHubError(err);
    logger.error(
      {
        err,
        route: "github.commit",
        userId,
        themeId,
        lessonId,
        status: mapped.status,
      },
      "GitHub commit failed",
    );
    return c.json(mapped.body, mapped.status);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/github/retroactive-push — Push all completed artifacts for a theme
// ──────────────────────────────────────────────────────────────────────────
//
// Runs in-process (single request). For background infra, see the TODO in
// dev-plan §5f — deferred until a job queue (Upstash QStash / Fly Machines
// cron) is wired up. Progress is returned synchronously in the response.

github.use("/retroactive-push", authMiddleware);

github.post("/retroactive-push", async (c) => {
  const userId = c.get("userId");

  let body: { themeId: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      structuredError("validation_error", "Invalid JSON body"),
      400,
    );
  }

  if (!body.themeId || !isValidThemeSlug(body.themeId)) {
    return c.json(
      structuredError("validation_error", "themeId must be a valid theme slug"),
      400,
    );
  }
  if (!isLaunched(body.themeId)) {
    return c.json(
      structuredError("validation_error", "Theme is not yet launched"),
      400,
    );
  }

  const supabase = getSupabaseServerClient(c.get("accessToken"));

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("github_token, github_username")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    return c.json(
      structuredError("internal_error", "Failed to read profile"),
      500,
    );
  }

  const token = profile.github_token as string | null;
  const username = profile.github_username as string | null;
  if (!token || !username) {
    return c.json(
      structuredError("github_not_connected", "GitHub is not connected."),
      400,
    );
  }

  // Fetch completed lessons in chronological order.
  const { data: lessonsRaw, error: lessonsErr } = await supabase
    .from("theme_progress")
    .select("module_id, lesson_id, completed_at")
    .eq("user_id", userId)
    .eq("theme_id", body.themeId)
    .eq("status", "completed")
    .order("completed_at", { ascending: true });

  if (lessonsErr) {
    return c.json(
      structuredError("internal_error", "Failed to fetch theme_progress"),
      500,
    );
  }

  const completedRows = (lessonsRaw ?? []) as Array<{
    module_id: string;
    lesson_id: string;
    completed_at: string | null;
  }>;

  // Look up the latest passing submitted_code for each lesson.
  const lessonIds = completedRows.map((r) => r.lesson_id);
  const attemptsByLesson = new Map<string, string>();
  if (lessonIds.length > 0) {
    const { data: attempts } = await supabase
      .from("exercise_attempts")
      .select("lesson_id, submitted_code, passed, attempted_at")
      .eq("user_id", userId)
      .eq("theme_id", body.themeId)
      .in("lesson_id", lessonIds)
      .order("attempted_at", { ascending: false });

    for (const a of (attempts ?? []) as Array<{
      lesson_id: string;
      submitted_code: string | null;
      passed: boolean;
    }>) {
      // First occurrence wins — attempts are sorted newest-first.
      if (a.passed && a.submitted_code && !attemptsByLesson.has(a.lesson_id)) {
        attemptsByLesson.set(a.lesson_id, a.submitted_code);
      }
    }
  }

  const completed = completedRows.map((row) => ({
    ...row,
    submitted_code: attemptsByLesson.get(row.lesson_id) ?? null,
  }));
  if (completed.length === 0) {
    return c.json({
      pushed: 0,
      skipped: 0,
      failed: 0,
      total: 0,
      results: [],
    });
  }

  // Ensure the per-theme repo first (single call, not per lesson).
  try {
    await ensureThemeRepo(token, username, body.themeId, { isPrivate: false });
  } catch (err) {
    const mapped = mapGitHubError(err);
    return c.json(mapped.body, mapped.status);
  }

  const results: Array<{
    lessonId: string;
    status: "pushed" | "skipped" | "failed";
    commitSha?: string;
    url?: string;
    error?: string;
  }> = [];

  let pushed = 0;
  let skipped = 0;
  let failed = 0;

  for (const lesson of completed) {
    const lessonId = lesson.lesson_id as string;
    const moduleId = (lesson.module_id as string) ?? "module-unknown";
    const code = lesson.submitted_code as string | null;

    if (!code) {
      skipped++;
      results.push({ lessonId, status: "skipped", error: "No submitted code" });
      continue;
    }

    try {
      const res = await commitLessonArtifact({
        accessToken: token,
        username,
        themeSlug: body.themeId,
        moduleId,
        lessonId,
        code,
        readmeDelta: lesson.completed_at
          ? `- ${moduleId}/${lessonId} — completed ${String(lesson.completed_at).slice(0, 10)}`
          : undefined,
      });
      pushed++;
      results.push({ lessonId, status: "pushed", ...res });
      captureServer(
        SERVER_EVENTS.CODE_PUSHED,
        {
          themeId: body.themeId,
          lessonId,
          exerciseSlug: lessonId,
          commitSha: res.commitSha,
        },
        userId,
      );
    } catch (err) {
      failed++;
      const mapped = mapGitHubError(err);
      results.push({
        lessonId,
        status: "failed",
        error: mapped.body.error,
      });
      // Abort early if the token is bad or repo access was revoked —
      // no point retrying lesson-by-lesson.
      if (
        mapped.body.code === "github_token_expired" ||
        mapped.body.code === "github_repo_access_revoked"
      ) {
        break;
      }
    }
  }

  return c.json({
    pushed,
    skipped,
    failed,
    total: completed.length,
    results,
  });
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/github/token — (legacy) persist a provider OAuth token directly
// ──────────────────────────────────────────────────────────────────────────

github.use("/token", authMiddleware);

github.post("/token", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: { github_token: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.github_token || typeof body.github_token !== "string") {
    return c.json({ error: "github_token (string) is required" }, 400);
  }

  const username = await getGitHubUsername(body.github_token);
  if (!username) {
    return c.json({ error: "Invalid GitHub token" }, 400);
  }

  const supabase = getSupabaseServerClient(token);

  const { error } = await supabase
    .from("profiles")
    .update({
      github_token: body.github_token,
      github_username: username,
      github_connected: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    logger.error(
      { err: error, route: "github.token", userId },
      "Failed to persist GitHub token",
    );
    return c.json({ error: "Failed to store GitHub token" }, 500);
  }

  return c.json({ stored: true, username });
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/github/push — (legacy) flat-file push to `tensorcraft-exercises`
// Kept for backward compatibility with the existing frontend; new code should
// use POST /api/github/commit which targets per-theme repos.
// ──────────────────────────────────────────────────────────────────────────

github.use("/push", authMiddleware);

github.post("/push", async (c) => {
  const userId = c.get("userId");

  let body: {
    exerciseSlug: string;
    code: string;
    themeId: string;
    moduleId: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { exerciseSlug, code, themeId, moduleId } = body;

  if (!exerciseSlug || !code || !themeId || !moduleId) {
    return c.json(
      { error: "exerciseSlug, code, themeId, and moduleId are required" },
      400,
    );
  }

  if (
    !isValidSlug(exerciseSlug) ||
    !isValidSlug(themeId) ||
    !isValidSlug(moduleId)
  ) {
    return c.json({ error: "Invalid slug in request" }, 400);
  }
  if (code.length > 102_400) {
    return c.json({ error: "Code exceeds maximum size (100KB)" }, 400);
  }

  const supabase = getSupabaseServerClient(c.get("accessToken"));
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return c.json({ error: "Failed to retrieve user profile" }, 500);
  }

  const providerToken = profile.github_token as string | null;
  if (!providerToken) {
    return c.json(
      {
        error:
          "GitHub access token not available. Please sign out and sign back in with GitHub to reconnect.",
      },
      403,
    );
  }

  try {
    const username = await getGitHubUsername(providerToken);
    if (!username) {
      return c.json({ error: "Failed to fetch GitHub username" }, 500);
    }

    const repoName = "tensorcraft-exercises";
    await createOrGetRepo(providerToken, repoName);

    const filePath = `${themeId}/${moduleId}/${exerciseSlug}.ts`;
    const commitMessage = `feat(${moduleId}): Complete exercise -- ${exerciseSlug}`;

    const result = await pushFile(
      providerToken,
      username,
      repoName,
      filePath,
      code,
      commitMessage,
    );

    return c.json({ success: true, url: result.url });
  } catch (err) {
    if (err instanceof GitHubApiError) {
      const mapped = mapGitHubError(err);
      return c.json(mapped.body, mapped.status);
    }
    logger.error(
      { err, route: "github.push", userId, themeId, moduleId, exerciseSlug },
      "GitHub push failed",
    );
    return c.json(
      {
        error: "Failed to push code to GitHub",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }
});

// ──────────────────────────────────────────────────────────────────────────
// GET /api/github/status — Check if user has GitHub connected
// ──────────────────────────────────────────────────────────────────────────

github.use("/status", authMiddleware);

github.get("/status", async (c) => {
  const userId = c.get("userId");
  const supabase = getSupabaseServerClient(c.get("accessToken"));

  const { data, error } = await supabase
    .from("profiles")
    .select("github_username, github_connected, github_token")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: !!data.github_connected && !!data.github_token,
    username: data.github_username ?? undefined,
    repoName: data.github_connected
      ? buildRepoName("{theme-slug}") // placeholder client can substitute
      : undefined,
  });
});

export { github };

// Exported for tests that want to call the error mapper directly.
export {
  mapGitHubError as __mapGitHubError,
  structuredError as __structuredError,
};
