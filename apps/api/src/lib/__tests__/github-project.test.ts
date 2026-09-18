// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  ROOM_MODEL_FILES,
  ROOM_PROJECT_FILES,
  validateProjectFiles,
} from "@tensorcraft/shared";
import { exportRoomProject } from "../github-project";

const files = () =>
  [
    ...ROOM_PROJECT_FILES,
    ...ROOM_MODEL_FILES,
    "runs/test-1.json",
    "runs/validation-1.json",
  ].map((path) => ({
    path,
    base64: (path === "model/weights.bin"
      ? Buffer.from([0, 255, 128, 10, 0])
      : Buffer.from(`\uFEFF${path}: temperature 21°C\n`)
    ).toString("base64"),
  }));
const hash = (data: Buffer) =>
  createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex");
let calls: { path: string; method: string; body: any }[];
let tree: { path: string; sha: string; type: string; mode?: string }[];
let pending: typeof tree;
let head: string;
let race: boolean;
let truncated: boolean;
let blocked: boolean;
let privateRepo: boolean;
let blobs: Map<string, Buffer>;
beforeEach(() => {
  calls = [];
  tree = [{ path: "foundations/tensor.ts", sha: "exercise", type: "blob" }];
  pending = [];
  head = "first";
  race = false;
  truncated = false;
  blocked = false;
  privateRepo = false;
  blobs = new Map();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname;
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      const method = init.method!;
      calls.push({ path, method, body });
      const response = (data: unknown, status = 200) =>
        Response.json(data, { status });
      if (path === "/repos/learner/tensorcraft-deep-orbit")
        return response({
          id: 17,
          full_name: "learner/tensorcraft-deep-orbit",
          private: privateRepo,
          default_branch: "course/main",
        });
      if (path.endsWith("/git/ref/heads/course/main"))
        return response({ object: { sha: head } });
      if (method === "GET" && path.includes("/git/commits/"))
        return response({ tree: { sha: `tree-${head}` } });
      if (method === "GET" && path.includes("/git/trees/"))
        return response({ tree, truncated });
      if (path.endsWith("/git/blobs")) {
        expect(body.encoding).toBe("base64");
        const bytes = Buffer.from(body.content, "base64"),
          sha = hash(bytes);
        blobs.set(sha, bytes);
        return response({ sha }, 201);
      }
      if (path.endsWith("/git/trees")) {
        expect(body.base_tree).toBe(`tree-${head}`);
        pending = [
          ...tree,
          ...body.tree.map((entry: any) => {
            expect(entry.mode).toBe("100644");
            expect(entry.path).toMatch(
              /^projects\/room-occupancy-v1\/[a-f0-9]{64}\//,
            );
            const bytes =
              entry.content === undefined
                ? blobs.get(entry.sha)!
                : Buffer.from(entry.content);
            blobs.set(hash(bytes), bytes);
            return {
              path: entry.path,
              sha: hash(bytes),
              type: "blob",
              mode: "100644",
            };
          }),
        ];
        return response({ sha: "pending-tree" }, 201);
      }
      if (path.endsWith("/git/commits")) {
        expect(body.parents).toEqual([head]);
        return response({ sha: "published" }, 201);
      }
      if (method === "PATCH") {
        expect(body.force).toBe(false);
        if (blocked) return response({ message: "branch protection" }, 422);
        if (race) {
          race = false;
          head = "concurrent";
          tree.push({
            path: "training-loop/model.ts",
            sha: "other-exercise",
            type: "blob",
            mode: "100644",
          });
          return response({}, 422);
        }
        tree = pending;
        head = body.sha;
        return response({ object: { sha: head } });
      }
      throw new Error(`Unexpected GitHub request: ${path}`);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
const publish = (selected = files()) =>
  exportRoomProject("test-token", "learner", {
    files: selected,
    repositoryId: 17,
    private: false,
  });

it("exports exact UTF-8 and binary bytes atomically and retains unrelated work", async () => {
  const result = await publish();
  expect(result.url).toContain("/tree/published/projects/room-occupancy-v1/");
  expect(tree[0]).toEqual({
    path: "foundations/tensor.ts",
    sha: "exercise",
    type: "blob",
  });
  for (const file of files()) {
    const entry = tree.find((e) => e.path === `${result.folder}/${file.path}`)!;
    expect(blobs.get(entry.sha)).toEqual(Buffer.from(file.base64, "base64"));
  }
  expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(1);
  expect(calls.some((c) => c.path === "/user/repos")).toBe(false);
});
it("makes repeat submissions read-only, even after a lost response", async () => {
  await publish();
  calls = [];
  expect((await publish(files().reverse())).alreadyPublished).toBe(true);
  expect(calls.every((c) => c.method === "GET")).toBe(true);
});
it("rebuilds after a concurrent commit without dropping it", async () => {
  race = true;
  await publish();
  expect(tree.some((e) => e.sha === "other-exercise")).toBe(true);
  expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(2);
  expect(calls.filter((c) => c.path.endsWith("/git/blobs"))).toHaveLength(1);
});
it("does not retry a protection failure or claim success", async () => {
  blocked = true;
  await expect(publish()).rejects.toThrow("rejected the branch update");
  expect(head).toBe("first");
  expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(1);
});
it("stops before writes when preview visibility changed or the tree is truncated", async () => {
  privateRepo = true;
  await expect(publish()).rejects.toThrow("visibility changed");
  privateRepo = false;
  truncated = true;
  await expect(publish()).rejects.toThrow("too large");
  expect(calls.every((c) => c.method === "GET")).toBe(true);
});
it("does not overwrite an edited snapshot or a conflicting parent file", async () => {
  await publish();
  tree[1].sha = "user-edit";
  calls = [];
  await expect(publish()).rejects.toThrow("changed on GitHub");
  tree = [{ path: "projects", sha: "file", type: "blob" }];
  await expect(publish()).rejects.toThrow("parent folder");
  expect(calls.every((c) => c.method === "GET")).toBe(true);
});
it("rejects unsupported paths, duplicates, missing artifacts, invalid encoding and excess size before network access", async () => {
  for (const path of [
    "../README.md",
    ".env",
    ".git/config",
    ".github/workflows/run.yml",
    "src/../../secret.js",
    "model/link",
  ]) {
    await expect(
      publish([...files(), { path, base64: "YQ==" }]),
    ).rejects.toThrow("unsupported");
  }
  await expect(publish([...files(), files()[0]])).rejects.toThrow("Duplicate");
  await expect(
    publish(files().filter((f) => f.path !== "model/weights.bin")),
  ).rejects.toThrow("Missing");
  await expect(
    publish(files().filter((f) => !f.path.startsWith("runs/test-"))),
  ).rejects.toThrow("test evaluation");
  await expect(
    publish(files().map((f) => ({ ...f, base64: "???=" }))),
  ).rejects.toThrow("encoding");
  await expect(
    publish(
      files().map((f) =>
        f.path === "model/weights.bin"
          ? { ...f, base64: Buffer.alloc(4 * 1024 * 1024).toString("base64") }
          : f,
      ),
    ),
  ).rejects.toThrow("4 MiB");
  expect(calls).toHaveLength(0);
  expect(() => validateProjectFiles(null)).toThrow();
});
