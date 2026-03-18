/**
 * GitHub REST API client helpers.
 * Uses plain fetch — no external packages required.
 */

const GITHUB_API = "https://api.github.com";
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

/**
 * Creates a new repository or returns an existing one.
 * If the repo already exists (422), fetches and returns it.
 */
export async function createOrGetRepo(
  accessToken: string,
  repoName: string,
): Promise<GitHubRepoResponse> {
  // Try to create the repo
  const createRes = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: headers(accessToken),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      name: repoName,
      description: `Tensorcraft exercise solutions — ${repoName}`,
      private: true,
      auto_init: true,
    }),
  });

  if (createRes.ok) {
    return createRes.json() as Promise<GitHubRepoResponse>;
  }

  // 422 means repo already exists — fetch it instead
  if (createRes.status === 422) {
    const userRes = await fetch(`${GITHUB_API}/user`, {
      headers: headers(accessToken),
    });

    if (!userRes.ok) {
      throw new Error("Failed to fetch GitHub user");
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
      throw new Error(`Failed to fetch existing repo: ${repoRes.status}`);
    }

    return repoRes.json() as Promise<GitHubRepoResponse>;
  }

  const errorBody = await createRes.text();
  throw new Error(`Failed to create repo (${createRes.status}): ${errorBody}`);
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
    throw new Error(`Failed to get file (${res.status})`);
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
  // Check if file already exists to get its SHA (required for updates)
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
    const errorBody = await res.text();
    throw new Error(`Failed to push file (${res.status}): ${errorBody}`);
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
    throw new Error("401 Unauthorized — GitHub token expired or revoked");
  }

  if (!res.ok) return null;

  const user = (await res.json()) as { login: string };
  return user.login;
}
