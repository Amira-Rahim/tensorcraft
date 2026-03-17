import { Hono } from "hono";
import {
  getInstallationGraphqlClient,
  createCommitOnBranch,
  getBranchHeadOid,
  buildCommitPayload,
  buildRepoName,
} from "@tensorcraft/github";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";
import { createOrGetRepo, pushFile, getGitHubUsername } from "../lib/github";

const github = new Hono<AppEnv>();

// ──────────────────────────────────────────────
// POST /api/github/connect — Store GitHub installation ID for user
// ──────────────────────────────────────────────

github.use("/connect", authMiddleware);

github.post("/connect", async (c) => {
  const userId = c.get("userId");

  let body: { installationId: number; githubUsername: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.installationId || typeof body.installationId !== "number") {
    return c.json({ error: "installationId (number) is required" }, 400);
  }

  if (!body.githubUsername || typeof body.githubUsername !== "string") {
    return c.json({ error: "githubUsername (string) is required" }, 400);
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      github_username: body.githubUsername,
      github_connected: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to store GitHub connection:", error);
    return c.json(
      {
        error: "Failed to store GitHub connection",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ connected: true });
});

// ──────────────────────────────────────────────
// POST /api/github/commit — Push exercise solution to user's repo
// ──────────────────────────────────────────────

github.use("/commit", authMiddleware);

github.post("/commit", async (c) => {
  const userId = c.get("userId");

  let body: {
    themeSlug: string;
    moduleSlug: string;
    lessonSlug: string;
    code: string;
    fileName?: string;
    installationId: number;
    repoOwner: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Validate required fields
  const { themeSlug, moduleSlug, lessonSlug, code, installationId, repoOwner } =
    body;

  if (!themeSlug || !moduleSlug || !lessonSlug || !code) {
    return c.json(
      { error: "themeSlug, moduleSlug, lessonSlug, and code are required" },
      400,
    );
  }

  if (!installationId || typeof installationId !== "number") {
    return c.json({ error: "installationId (number) is required" }, 400);
  }

  if (!repoOwner || typeof repoOwner !== "string") {
    return c.json({ error: "repoOwner (string) is required" }, 400);
  }

  // Build commit payload
  const { files, message } = buildCommitPayload({
    themeSlug,
    moduleSlug,
    lessonSlug,
    code,
    fileName: body.fileName,
  });

  const repoName = buildRepoName(themeSlug);

  // Get installation-scoped GraphQL client
  const graphqlClient = getInstallationGraphqlClient(installationId);

  // Get the current HEAD OID for the default branch
  const branchInfo = await getBranchHeadOid(graphqlClient, {
    repoOwner,
    repoName,
  });

  if (!branchInfo) {
    return c.json(
      {
        error: `Repository ${repoOwner}/${repoName} not found or has no default branch. Please install the GitHub App on this repository.`,
      },
      404,
    );
  }

  // Create the commit
  try {
    const commit = await createCommitOnBranch(graphqlClient, {
      repoOwner,
      repoName,
      branchName: branchInfo.branchName,
      expectedHeadOid: branchInfo.oid,
      message,
      files,
    });

    return c.json({
      commitUrl: commit.url,
      commitOid: commit.oid,
      repoUrl: `https://github.com/${repoOwner}/${repoName}`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("GitHub commit failed:", {
      error: errorMessage,
      userId,
      repoOwner,
      repoName,
    });

    // Provide actionable error messages
    if (errorMessage.includes("NOT_FOUND")) {
      return c.json(
        {
          error:
            "Repository not found. Please ensure the GitHub App is installed on the target repository.",
        },
        404,
      );
    }

    if (errorMessage.includes("FORBIDDEN") || errorMessage.includes("403")) {
      return c.json(
        {
          error:
            "Permission denied. Please check the GitHub App installation permissions.",
        },
        403,
      );
    }

    return c.json(
      {
        error: "Failed to create commit on GitHub",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }
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

  // Limit code size (100KB)
  if (code.length > 102_400) {
    return c.json({ error: "Code exceeds maximum size (100KB)" }, 400);
  }

  // Get the user's GitHub access token from Supabase auth provider
  const supabase = getSupabaseAdminClient();
  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(userId);

  if (userError || !userData?.user) {
    return c.json({ error: "Failed to retrieve user data" }, 500);
  }

  // Extract GitHub access token from user's identity
  const githubIdentity = userData.user.identities?.find(
    (id) => id.provider === "github",
  );

  if (!githubIdentity) {
    return c.json(
      { error: "GitHub account not connected. Please sign in with GitHub." },
      403,
    );
  }

  const providerToken = githubIdentity.identity_data?.provider_token as
    | string
    | undefined;

  if (!providerToken) {
    return c.json(
      {
        error:
          "GitHub access token not available. Please reconnect your GitHub account.",
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
          error: "GitHub token expired. Please reconnect your GitHub account.",
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

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("github_username, github_connected")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: !!data.github_connected,
    username: data.github_username ?? undefined,
  });
});

export { github };
