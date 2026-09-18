import { createHash } from "node:crypto";
import {
  type ProjectFile,
  type ProjectTarget,
  validateProjectFiles,
} from "@tensorcraft/shared";
import { GitHubApiError } from "./github";

const REPO = "tensorcraft-deep-orbit";
export class ProjectExportError extends Error {}

async function request<T>(
  token: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Tensorcraft-API",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(15_000),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok)
    throw new GitHubApiError(response.status, await response.text());
  return response.json() as Promise<T>;
}

export async function projectTarget(
  token: string,
  username: string,
): Promise<ProjectTarget & { branch: string }> {
  const repo = await request<{
    id: number;
    full_name: string;
    private: boolean;
    default_branch: string;
  }>(token, `/repos/${encodeURIComponent(username)}/${REPO}`);
  if (repo.full_name.toLowerCase() !== `${username}/${REPO}`.toLowerCase())
    throw new ProjectExportError(
      "The repository moved. Reconnect GitHub and preview the destination again.",
    );
  return {
    repositoryId: repo.id,
    fullName: repo.full_name,
    private: repo.private,
    url: `https://github.com/${repo.full_name}`,
    branch: repo.default_branch,
  };
}

/** A content-addressed snapshot: retries do not overwrite prior submissions. */
export async function exportRoomProject(
  token: string,
  username: string,
  input: {
    files: ProjectFile[];
    repositoryId: number;
    private: boolean;
  },
) {
  const files = validateProjectFiles(input.files)
    .map((file) => {
      const bytes = Buffer.from(file.base64, "base64");
      if (bytes.toString("base64") !== file.base64)
        throw new ProjectExportError("Invalid file encoding.");
      let content: string | undefined;
      if (file.path !== "model/weights.bin") {
        try {
          content = new TextDecoder("utf-8", {
            fatal: true,
            ignoreBOM: true,
          }).decode(bytes);
        } catch {
          throw new ProjectExportError(`Text file is not UTF-8: ${file.path}`);
        }
      }
      const sha = createHash("sha1")
        .update(`blob ${bytes.length}\0`)
        .update(bytes)
        .digest("hex");
      return { ...file, content, sha };
    })
    .sort((a, b) => a.path.localeCompare(b.path, "en"));
  const digest = createHash("sha256")
    .update(JSON.stringify(files.map((f) => [f.path, f.base64])))
    .digest("hex");
  const folder = `projects/room-occupancy-v1/${digest}`;
  const target = await projectTarget(token, username);
  if (
    target.repositoryId !== input.repositoryId ||
    target.private !== input.private
  )
    throw new ProjectExportError(
      "The repository or its visibility changed. Preview the destination again before publishing.",
    );
  const base = `/repos/${encodeURIComponent(username)}/${REPO}`;
  const ref = `heads/${target.branch.split("/").map(encodeURIComponent).join("/")}`;
  let weightSha: string | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    const head = await request<{ object: { sha: string } }>(
      token,
      `${base}/git/ref/${ref}`,
    ).catch((error) => {
      if (error instanceof GitHubApiError && error.status === 409)
        throw new ProjectExportError(
          "The repository is empty. Add a README or save a course exercise before publishing a project.",
        );
      throw error;
    });
    const commit = await request<{ tree: { sha: string } }>(
      token,
      `${base}/git/commits/${head.object.sha}`,
    );
    const tree = await request<{
      truncated: boolean;
      tree: { path: string; sha: string; type: string; mode: string }[];
    }>(token, `${base}/git/trees/${commit.tree.sha}?recursive=1`);
    if (tree.truncated)
      throw new ProjectExportError(
        "This repository is too large for project export. Download and publish the folder manually.",
      );
    const existing = tree.tree.filter(
      (entry) => entry.path === folder || entry.path.startsWith(`${folder}/`),
    );
    if (existing.length) {
      const blobs = existing.filter((entry) => entry.type === "blob");
      if (
        blobs.length !== files.length ||
        !files.every((file) =>
          blobs.some(
            (entry) =>
              entry.path === `${folder}/${file.path}` &&
              entry.sha === file.sha &&
              entry.mode === "100644",
          ),
        )
      )
        throw new ProjectExportError(
          "This snapshot was changed on GitHub. Export a revised local project to create a new snapshot.",
        );
      return {
        url: `${target.url}/tree/${head.object.sha}/${folder}`,
        commitSha: head.object.sha,
        folder,
        alreadyPublished: true,
      };
    }
    // Refuse to replace a file/symlink where a parent directory should be.
    if (
      tree.tree.some(
        (entry) =>
          ["projects", "projects/room-occupancy-v1"].includes(entry.path) &&
          entry.type !== "tree",
      )
    )
      throw new ProjectExportError(
        "A file occupies the project's parent folder on GitHub. Move that file before exporting.",
      );
    if (!weightSha) {
      const weights = files.find((file) => file.path === "model/weights.bin")!;
      weightSha = (
        await request<{ sha: string }>(token, `${base}/git/blobs`, "POST", {
          content: weights.base64,
          encoding: "base64",
        })
      ).sha;
    }
    const created = await request<{ sha: string }>(
      token,
      `${base}/git/trees`,
      "POST",
      {
        base_tree: commit.tree.sha,
        tree: files.map((file) => ({
          path: `${folder}/${file.path}`,
          mode: "100644",
          type: "blob",
          ...(file.content === undefined
            ? { sha: weightSha }
            : { content: file.content }),
        })),
      },
    );
    const next = await request<{ sha: string }>(
      token,
      `${base}/git/commits`,
      "POST",
      {
        message: "Save room occupancy project snapshot",
        tree: created.sha,
        parents: [head.object.sha],
      },
    );
    try {
      await request(token, `${base}/git/refs/${ref}`, "PATCH", {
        sha: next.sha,
        force: false,
      });
      return {
        url: `${target.url}/tree/${next.sha}/${folder}`,
        commitSha: next.sha,
        folder,
        alreadyPublished: false,
      };
    } catch (error) {
      // A concurrent exercise commit must survive. Rebuild on the new head.
      if (
        !(error instanceof GitHubApiError) ||
        ![409, 422].includes(error.status)
      )
        throw error;
      const current = await request<{ object: { sha: string } }>(
        token,
        `${base}/git/ref/${ref}`,
      );
      if (current.object.sha === head.object.sha)
        throw new ProjectExportError(
          "GitHub rejected the branch update. Check repository rules or share your project as a ZIP.",
        );
    }
  }
  throw new ProjectExportError(
    "The repository kept changing during export. Retry when other saves have finished.",
  );
}
