/**
 * Builds commit payloads for exercise solutions.
 * Follows the repo structure defined in tech-spec section 5.4.
 */

interface CommitPayload {
  /** File path within the repository */
  path: string;
  /** File contents (source code) */
  contents: string;
}

interface BuildCommitParams {
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  code: string;
  fileName?: string;
}

/**
 * Builds the file path and commit message for an exercise solution.
 *
 * File structure: solutions/{theme}/{module}/{lesson}/solution.ts
 * Commit message: feat({module}): Complete exercise -- {lesson}
 */
export function buildCommitPayload(params: BuildCommitParams): {
  files: CommitPayload[];
  message: string;
} {
  const { themeSlug, moduleSlug, lessonSlug, code, fileName } = params;

  const resolvedFileName = fileName || "solution.ts";
  const filePath = `solutions/${themeSlug}/${moduleSlug}/${lessonSlug}/${resolvedFileName}`;

  const message = `feat(${moduleSlug}): Complete exercise -- ${lessonSlug}`;

  return {
    files: [
      {
        path: filePath,
        contents: code,
      },
    ],
    message,
  };
}

/**
 * Builds the repository name for a given theme.
 * Convention: tensorcraft-{theme-slug}
 */
export function buildRepoName(themeSlug: string): string {
  return `tensorcraft-${themeSlug}`;
}

/**
 * Builds the repository description for a given theme.
 */
export function buildRepoDescription(themeSlug: string): string {
  return `Tensorcraft exercise solutions for ${themeSlug}`;
}
