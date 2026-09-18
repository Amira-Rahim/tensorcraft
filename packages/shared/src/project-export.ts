// One contract for the folder preview and the API. No arbitrary repository paths.
export const ROOM_PROJECT_FILES = [
  ".gitignore",
  "CODE-LICENSE.txt",
  "DATA-LICENSE.md",
  "README.md",
  "RUBRIC.md",
  "app.mjs",
  "artifact.mjs",
  "check.mjs",
  "data.json",
  "evaluate.mjs",
  "evaluation.mjs",
  "index.html",
  "package-lock.json",
  "package.json",
  "plan.json",
  "preprocessing.mjs",
  "report.md",
  "serve.mjs",
  "train.mjs",
] as const;
export const ROOM_MODEL_FILES = [
  "model/model.json",
  "model/weights.bin",
  "model/preprocessing.json",
  "model/parity.json",
  "model/checksums.json",
] as const;
export const PROJECT_MAX_BYTES = 4 * 1024 * 1024;
export const PROJECT_MAX_FILES = 100;
export const PROJECT_BODY_LIMIT = 6 * 1024 * 1024;

export interface ProjectFile {
  path: string;
  base64: string;
}
export interface ProjectTarget {
  repositoryId: number;
  fullName: string;
  private: boolean;
  url: string;
}

export function isProjectPath(path: string): boolean {
  return (
    (ROOM_PROJECT_FILES as readonly string[]).includes(path) ||
    (ROOM_MODEL_FILES as readonly string[]).includes(path) ||
    /^runs\/(validation|test)-[a-zA-Z0-9-]{1,100}\.json$/.test(path) ||
    /^src\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}\.(mjs|js|json)$/.test(path)
  );
}

/** Validates paths and encoded sizes before decoding or contacting GitHub. */
export function validateProjectFiles(input: unknown): ProjectFile[] {
  if (!Array.isArray(input) || input.length > PROJECT_MAX_FILES)
    throw new Error(`Select at most ${PROJECT_MAX_FILES} project files.`);
  const seen = new Set<string>();
  let total = 0;
  for (const file of input) {
    if (!file || typeof file.path !== "string" || !isProjectPath(file.path))
      throw new Error("The selection contains an unsupported project path.");
    if (seen.has(file.path)) throw new Error(`Duplicate file: ${file.path}`);
    seen.add(file.path);
    if (
      typeof file.base64 !== "string" ||
      file.base64.length > Math.ceil(PROJECT_MAX_BYTES / 3) * 4 ||
      file.base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)
    )
      throw new Error(`Invalid file encoding: ${file.path}`);
    total +=
      (file.base64.length / 4) * 3 -
      (file.base64.endsWith("==") ? 2 : file.base64.endsWith("=") ? 1 : 0);
    if (total > PROJECT_MAX_BYTES)
      throw new Error("The project exceeds the 4 MiB export limit.");
  }
  const missing = [...ROOM_PROJECT_FILES, ...ROOM_MODEL_FILES].filter(
    (path) => !seen.has(path),
  );
  if (missing.length)
    throw new Error(
      `Missing project files: ${missing.join(", ")}. Run training and artifact checks first.`,
    );
  for (const phase of ["validation", "test"])
    if (![...seen].some((path) => path.startsWith(`runs/${phase}-`)))
      throw new Error(`Include a saved ${phase} evaluation run.`);
  return input as ProjectFile[];
}
