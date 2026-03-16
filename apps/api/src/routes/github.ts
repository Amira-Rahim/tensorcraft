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

export { github };
