/**
 * GitHub REST API client helpers.
 * Uses plain fetch, no external packages required.
 *
 * Covers:
 *   - OAuth connect / callback exchange / token revocation (GitHub App)
 *   - Repository creation with auto-generated README
 *   - File push (create or update)
 *   - Commit retry with exponential backoff
 *
 * All external credentials live in env vars, see `.env.example`.
 */

import { logger } from "./logger";

const GITHUB_API = "https://api.github.com";
const GITHUB_OAUTH_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_OAUTH_TOKEN = "https://github.com/login/oauth/access_token";
const FETCH_TIMEOUT_MS = 15_000; // 15-second timeout for all GitHub API calls

interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
  name: string;
  path: string;
  html_url: string;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  owner: { login: string };
}

interface GitHubPushResponse {
  content: {
    name: string;
    path: string;
    sha: string;
    html_url: string;
  };
  commit: {
    sha: string;
    html_url: string;
    message: string;
  };
}

function headers(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "Tensorcraft-API",
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Retry helper, exponential backoff (max 3 retries) for transient failures
// ──────────────────────────────────────────────────────────────────────────

/** Errors we should retry on. 5xx and 429 are transient; 4xx (except 429) are not. */
export function isTransientStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Runs `fn` with exponential-backoff retries on transient failures.
 * Defaults: max 3 retries (4 total attempts), 250ms base delay.
 *
 * `fn` should throw a `GitHubApiError` with `.status` for HTTP errors
 * so we can decide whether to retry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 3;
  const baseDelay = opts.baseDelayMs ?? 250;
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const isTransient =
        typeof status === "number" ? isTransientStatus(status) : true;

      if (!isTransient || attempt >= maxRetries) {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

/** Typed error for GitHub HTTP failures, carries `.status` for retry logic. */
export class GitHubApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string, message?: string) {
    super(message ?? `GitHub API error (${status}): ${body}`);
    this.name = "GitHubApiError";
    this.status = status;
    this.body = body;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// OAuth flow, GitHub App (not OAuth App)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Builds the GitHub App authorization URL. The frontend redirects the user here.
 * `state` is a CSRF token the caller must also store (e.g., in a signed cookie)
 * and verify during the callback.
 */
export function buildOAuthAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const qs = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
  });
  return `${GITHUB_OAUTH_AUTHORIZE}?${qs.toString()}`;
}

/**
 * Exchanges an OAuth code for a user access token.
 * For GitHub Apps this is a short-lived user-to-server token.
 */
export interface GitHubOAuthTokens {
  access_token: string;
  token_type: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<GitHubOAuthTokens> {
  const res = await fetch(GITHUB_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Tensorcraft-API",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  if (!res.ok) {
    throw new GitHubApiError(res.status, await res.text());
  }

  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (data.error || !data.access_token) {
    throw new GitHubApiError(
      400,
      JSON.stringify(data),
      data.error_description ??
        data.error ??
        "Missing access_token in response",
    );
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type ?? "bearer",
    scope: data.scope,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    refresh_token_expires_in: data.refresh_token_expires_in,
  };
}

/** Refresh tokens rotate on each use. Callers must serialize and persist them. */
export async function refreshUserToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<GitHubOAuthTokens> {
  const response = await fetch(GITHUB_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Tensorcraft-API",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
    }),
  });
  const data = (await response.json()) as GitHubOAuthTokens & {
    error?: string;
  };
  if (!response.ok || data.error || !data.access_token || !data.refresh_token) {
    // The OAuth body can contain credentials. Never attach it to an error.
    const invalid = ["bad_refresh_token", "expired_refresh_token"].includes(
      data.error ?? "",
    );
    throw new GitHubApiError(
      invalid || response.status === 401 ? 401 : 502,
      "GitHub token renewal failed",
    );
  }
  return data;
}

/**
 * Revokes a user's token against GitHub's grant endpoint.
 * Uses the App's client_id/client_secret (Basic auth).
 * 204 = revoked. 404 = already invalid (treat as success).
 */
export async function revokeUserToken(params: {
  clientId: string;
  clientSecret: string;
  accessToken: string;
}): Promise<void> {
  const basic = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  const res = await fetch(
    `${GITHUB_API}/applications/${params.clientId}/grant`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Tensorcraft-API",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      body: JSON.stringify({ access_token: params.accessToken }),
    },
  );

  // 204 No Content is success. 404 means the grant is already gone, also success.
  if (res.status === 204 || res.status === 404) {
    return;
  }

  throw new GitHubApiError(res.status, await res.text());
}

// ──────────────────────────────────────────────────────────────────────────
// Repo + file operations
// ──────────────────────────────────────────────────────────────────────────

/**
 * Creates a new repository or returns an existing one.
 * If the repo already exists (422), fetches and returns it.
 */
export async function createOrGetRepo(
  accessToken: string,
  repoName: string,
  opts?: { description?: string; isPrivate?: boolean },
): Promise<GitHubRepoResponse> {
  const createRes = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: headers(accessToken),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      name: repoName,
      description:
        opts?.description ?? `Tensorcraft exercise solutions: ${repoName}`,
      private: opts?.isPrivate ?? false,
      auto_init: true,
    }),
  });

  if (createRes.ok) {
    return createRes.json() as Promise<GitHubRepoResponse>;
  }

  // 422 means repo already exists, fetch it instead
  if (createRes.status === 422) {
    const userRes = await fetch(`${GITHUB_API}/user`, {
      headers: headers(accessToken),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!userRes.ok) {
      throw new GitHubApiError(userRes.status, await userRes.text());
    }

    const user = (await userRes.json()) as { login: string };

    const repoRes = await fetch(
      `${GITHUB_API}/repos/${user.login}/${repoName}`,
      {
        headers: headers(accessToken),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );

    if (!repoRes.ok) {
      throw new GitHubApiError(repoRes.status, await repoRes.text());
    }

    return repoRes.json() as Promise<GitHubRepoResponse>;
  }

  throw new GitHubApiError(createRes.status, await createRes.text());
}

/**
 * Gets file content and SHA from a repository.
 * Returns null if the file does not exist (404).
 */
export async function getFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: headers(accessToken),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new GitHubApiError(res.status, await res.text());
  }

  const data = (await res.json()) as GitHubFileResponse;
  return {
    sha: data.sha,
    content: Buffer.from(data.content, "base64").toString("utf-8"),
  };
}

/**
 * Pushes (creates or updates) a file to a repo using the Contents API.
 * PUT /repos/{owner}/{repo}/contents/{path}
 */
export async function pushFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
): Promise<{ url: string; commitSha: string }> {
  const existing = await getFile(accessToken, owner, repo, path);

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
  };

  if (existing) {
    body.sha = existing.sha;
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(accessToken),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    throw new GitHubApiError(res.status, await res.text());
  }

  const data = (await res.json()) as GitHubPushResponse;
  return {
    url: data.content.html_url,
    commitSha: data.commit.sha,
  };
}

/**
 * Fetches the authenticated GitHub user's username.
 */
export async function getGitHubUsername(
  accessToken: string,
): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: headers(accessToken),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (res.status === 401) {
    throw new GitHubApiError(
      401,
      "Unauthorized: GitHub token expired or revoked",
    );
  }

  if (!res.ok) return null;

  const user = (await res.json()) as { login: string };
  return user.login;
}

// ──────────────────────────────────────────────────────────────────────────
// README + repo name helpers (per tech-spec 5.4)
// ──────────────────────────────────────────────────────────────────────────

/** Builds the canonical repo name for a world: tensorcraft-{world-slug} */
export function buildRepoName(worldSlug: string): string {
  return `tensorcraft-${worldSlug}`;
}

/**
 * Auto-generates the README template for a Tensorcraft world repo.
 * Includes world badge, description, module list, and a link back to the platform.
 */
export function buildReadmeTemplate(params: {
  worldSlug: string;
  worldName?: string;
  description?: string;
  /** Optional module list for the world; omitted → default "Modules 01-11". */
  modules?: Array<{ slug: string; title: string }>;
}): string {
  const { worldSlug } = params;
  const worldName =
    params.worldName ??
    worldSlug
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  const description =
    params.description ??
    `Exercise solutions for the Tensorcraft ${worldName} course.`;
  const badge = `![World](https://img.shields.io/badge/Tensorcraft-${encodeURIComponent(
    worldName,
  )}-0a84ff)`;

  const modulesSection = (() => {
    if (!params.modules || params.modules.length === 0) {
      return Array.from({ length: 11 }, (_, i) => {
        const n = String(i + 1).padStart(2, "0");
        return `- Module ${n}`;
      }).join("\n");
    }
    return params.modules.map((m) => `- \`${m.slug}\`: ${m.title}`).join("\n");
  })();

  return [
    `# tensorcraft-${worldSlug}`,
    "",
    badge,
    "",
    description,
    "",
    "## Modules",
    "",
    modulesSection,
    "",
    "## About",
    "",
    "This repository is automatically maintained by [Tensorcraft](https://tensorcraft.app),",
    "an interactive, story-driven platform teaching JavaScript engineers ML with TensorFlow.js.",
    "Each commit corresponds to a completed lesson exercise.",
    "",
    "> Learn more at https://tensorcraft.app",
    "",
  ].join("\n");
}

/**
 * Creates (or fetches) the per-world repo and writes the README template if
 * the repo was just created. Safe to call repeatedly.
 */
export async function ensureWorldRepo(
  accessToken: string,
  username: string,
  worldSlug: string,
  opts?: { worldName?: string; description?: string; isPrivate?: boolean },
): Promise<GitHubRepoResponse> {
  const repoName = buildRepoName(worldSlug);
  const repo = await createOrGetRepo(accessToken, repoName, {
    description: opts?.description,
    isPrivate: opts?.isPrivate,
  });

  // Write the README if it doesn't already exist.
  const existing = await getFile(accessToken, username, repoName, "README.md");
  if (!existing) {
    const readme = buildReadmeTemplate({
      worldSlug,
      worldName: opts?.worldName,
      description: opts?.description,
    });
    await pushFile(
      accessToken,
      username,
      repoName,
      "README.md",
      readme,
      "docs: initialize Tensorcraft README",
    );
  }

  return repo;
}

/**
 * Commits a single lesson artifact to the user's per-world repo with
 * exponential-backoff retries on transient failures. Optionally appends
 * `readmeDelta` to `PROGRESS.md` (not README.md, to avoid churn).
 */
export async function commitLessonArtifact(params: {
  accessToken: string;
  username: string;
  worldSlug: string;
  moduleId: string;
  lessonId: string;
  code: string;
  /**
   * Exercise slug for the artifact filename. Six lessons embed two
   * exercises; a lesson-keyed path made the second pass overwrite the
   * first (2026-07-13 audit, accepted-v1 then fixed). Exercise slugs are
   * unique across the corpus. Falls back to lessonId for callers that
   * predate the field.
   */
  exerciseSlug?: string;
  /** Optional one-line progress delta to append to `PROGRESS.md`. */
  readmeDelta?: string;
  /** File extension for the solution, default .ts */
  fileExt?: string;
}): Promise<{ url: string; commitSha: string }> {
  const {
    accessToken,
    username,
    worldSlug,
    moduleId,
    lessonId,
    code,
    exerciseSlug,
    readmeDelta,
    fileExt = "ts",
  } = params;

  const repoName = buildRepoName(worldSlug);
  const artifactId = exerciseSlug ?? lessonId;
  const filePath = `${moduleId}/${artifactId}.${fileExt}`;
  const commitMessage = `feat(${moduleId}): Complete exercise -- ${artifactId}`;

  const result = await withRetry(() =>
    pushFile(accessToken, username, repoName, filePath, code, commitMessage),
  );

  if (readmeDelta) {
    try {
      const progressPath = "PROGRESS.md";
      const existing = await getFile(
        accessToken,
        username,
        repoName,
        progressPath,
      );
      const prev = existing?.content ?? "# Progress\n\n";
      const next = `${prev}${prev.endsWith("\n") ? "" : "\n"}${readmeDelta}\n`;
      await withRetry(() =>
        pushFile(
          accessToken,
          username,
          repoName,
          progressPath,
          next,
          `docs(${moduleId}): update PROGRESS for ${lessonId}`,
        ),
      );
    } catch (err) {
      // Progress-file updates are best-effort, never block the artifact commit.
      logger.warn(
        {
          err,
          source: "github.commitLessonArtifact",
          worldSlug,
          moduleId,
          lessonId,
          githubRepo: repoName,
        },
        "Failed to update PROGRESS.md",
      );
    }
  }

  return result;
}
