import {
  isProjectPath,
  PROJECT_MAX_BYTES,
  PROJECT_MAX_FILES,
  validateProjectFiles,
  type ProjectFile,
} from "@tensorcraft/shared";

/** Reads only known project files. Dependencies, Git metadata and dotfiles stay local. */
export async function readProjectFolder(
  selected: File[],
): Promise<{ files: ProjectFile[]; skipped: number; bytes: number }> {
  const roots = new Set(
    selected.map((file) => file.webkitRelativePath.split("/")[0]),
  );
  if (
    roots.size !== 1 ||
    selected.some((file) => !file.webkitRelativePath.includes("/"))
  )
    throw new Error("Choose the extracted room-occupancy-v1 folder.");
  const included = selected
    .map((file) => ({
      file,
      path: file.webkitRelativePath.split("/").slice(1).join("/"),
    }))
    .filter(({ path }) => isProjectPath(path));
  const bytes = included.reduce((sum, { file }) => sum + file.size, 0);
  if (bytes > PROJECT_MAX_BYTES || included.length > PROJECT_MAX_FILES)
    throw new Error(
      "Export supports up to 100 files and 4 MiB. Keep older runs separately, or publish the folder manually.",
    );
  const files: ProjectFile[] = [];
  for (const { file, path } of included) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buffer.length; i += 8192)
      binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
    files.push({ path, base64: btoa(binary) });
  }
  validateProjectFiles(files);
  return { files, skipped: selected.length - included.length, bytes };
}
