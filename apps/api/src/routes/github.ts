import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";
import { createOrGetRepo, pushFile, getGitHubUsername } from "../lib/github";

const github = new Hono<AppEnv>();

/**
 * Validates that a slug contains only lowercase alphanumeric characters and hyphens.
 * Rejects path traversal attempts and any unsafe characters.
 */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

// ──────────────────────────────────────────────
// POST /api/github/token — Persist GitHub OAuth provider token
// ──────────────────────────────────────────────

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

  // Validate the token by fetching the GitHub user
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
    console.error("Failed to persist GitHub token:", error);
    return c.json({ error: "Failed to store GitHub token" }, 500);
  }

  return c.json({ stored: true, username });
});

// ──────────────────────────────────────────────
// POST /api/github/push — Push exercise code to user's repo via REST API
// ──────────────────────────────────────────────

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

  // Validate slugs to prevent path traversal and injection
  if (!isValidSlug(exerciseSlug)) {
    return c.json(
      {
        error:
          "Invalid exerciseSlug. Only lowercase letters, numbers, and hyphens are allowed.",
      },
      400,
    );
  }

  if (!isValidSlug(themeId)) {
    return c.json(
      {
        error:
          "Invalid themeId. Only lowercase letters, numbers, and hyphens are allowed.",
      },
      400,
    );
  }

  if (!isValidSlug(moduleId)) {
    return c.json(
      {
        error:
          "Invalid moduleId. Only lowercase letters, numbers, and hyphens are allowed.",
      },
      400,
    );
  }

  // Limit code size (100KB)
  if (code.length > 102_400) {
    return c.json({ error: "Code exceeds maximum size (100KB)" }, 400);
  }

  // Get the user's GitHub token from the profiles table
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
    // Get GitHub username
    const username = await getGitHubUsername(providerToken);
    if (!username) {
      return c.json({ error: "Failed to fetch GitHub username" }, 500);
    }

    // Create or get the exercises repo
    const repoName = "tensorcraft-exercises";
    await createOrGetRepo(providerToken, repoName);

    // Build file path and commit message
    const filePath = `${themeId}/${moduleId}/${exerciseSlug}.ts`;
    const commitMessage = `feat(${moduleId}): Complete exercise -- ${exerciseSlug}`;

    // Push the file
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
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("GitHub push failed:", {
      error: errorMessage,
      userId,
    });

    if (
      errorMessage.includes("401") ||
      errorMessage.includes("Bad credentials")
    ) {
      return c.json(
        {
          error:
            "GitHub token expired. Please sign out and sign back in to reconnect.",
        },
        401,
      );
    }

    return c.json(
      {
        error: "Failed to push code to GitHub",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }
});

// ──────────────────────────────────────────────
// GET /api/github/status — Check if user has GitHub connected
// ──────────────────────────────────────────────

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
  });
});

export { github };
