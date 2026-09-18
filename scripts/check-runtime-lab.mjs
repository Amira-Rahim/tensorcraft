import { chromium, expect } from "@playwright/test";
import { createServer } from "vite";
import {
  mkdtemp,
  mkdir,
  copyFile,
  readFile,
  writeFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir, platform, arch, cpus } from "node:os";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { exportOnnx } from "./runtime-lab/export-onnx.mjs";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createWriteStream, existsSync } from "node:fs";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const scratch = await mkdtemp(join(tmpdir(), "tensorcraft-runtime-lab-"));
const publicDir = join(scratch, "public");
const models = join(publicDir, "models");
await mkdir(join(models, "deep-scan"), { recursive: true });
const modelSource = existsSync(join(root, "models/deep-scan"))
  ? join(root, "models/deep-scan")
  : join(root, "apps/web/public/models/deep-scan");
for (const file of ["model.json", "weights.bin"])
  await copyFile(join(modelSource, file), join(models, "deep-scan", file));
const artifacts = await exportOnnx(
  join(models, "deep-scan"),
  join(models, "deep-scan.onnx"),
);
for (const [pkg, target] of [
  ["@tensorflow/tfjs-backend-wasm", "tf-wasm"],
  ["onnxruntime-web", "ort-wasm"],
  ["@huggingface/transformers", "hf-wasm"],
]) {
  let folder = dirname(require.resolve(pkg));
  // Both main entry points live in dist.
  await mkdir(join(publicDir, target));
  for (const name of await readdir(folder))
    if (/\.(wasm|mjs)$/.test(name))
      await copyFile(join(folder, name), join(publicDir, target, name));
}

const pretrained = process.argv.includes("--pretrained");
const hfArtifact = JSON.parse(
  await readFile(
    new URL("./runtime-lab/pretrained-files.json", import.meta.url),
  ),
);
if (pretrained) {
  const assetCache = join(
    root,
    "test-results/runtime-model-cache",
    hfArtifact.revision,
  );
  for (const { name, bytes: expectedBytes, sha256 } of hfArtifact.files) {
    const cached = join(assetCache, name);
    await mkdir(dirname(cached), { recursive: true });
    try {
      await readFile(cached);
    } catch {
      const response = await fetch(
        `https://huggingface.co/${hfArtifact.model}/resolve/${hfArtifact.revision}/${name}`,
      );
      if (!response.ok)
        throw Error(`Model download ${name}: HTTP ${response.status}`);
      await pipeline(response.body, createWriteStream(cached + ".tmp"));
      const { rename } = await import("node:fs/promises");
      await rename(cached + ".tmp", cached);
    }
    const bytes = await readFile(cached);
    expect(bytes.length).toBe(expectedBytes);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sha256);
    await mkdir(dirname(join(publicDir, "hf/sentiment", name)), {
      recursive: true,
    });
    await copyFile(cached, join(publicDir, "hf/sentiment", name));
  }
}

// CLI must be a real tensorflowjs_converter executable, not an IO shim.
const converter = process.env.TFJS_CONVERTER;
const conversion = {};
if (converter) {
  for (const [name, bits] of [
    ["q8", 8],
    ["q16", 16],
  ]) {
    execFileSync(
      converter,
      [
        "--input_format=tfjs_layers_model",
        "--output_format=tfjs_layers_model",
        `--quantize_uint${bits}=*`,
        join(models, "deep-scan/model.json"),
        join(models, name),
      ],
      { timeout: 180_000, stdio: ["ignore", "pipe", "pipe"] },
    );
    const manifest = JSON.parse(
      await readFile(join(models, name, "model.json")),
    );
    const paths = [
      ...new Set(manifest.weightsManifest.flatMap((g) => g.paths)),
    ];
    const weightBytes = (
      await Promise.all(paths.map((p) => readFile(join(models, name, p))))
    ).reduce((n, b) => n + b.length, 0);
    expect(weightBytes).toBe((673 * bits) / 8);
    expect(
      manifest.weightsManifest
        .flatMap((g) => g.weights)
        .every((w) => w.quantization?.dtype === `uint${bits}`),
    ).toBe(true);
    conversion[name] = { weightBytes, bits };
  }
}

const server = await createServer({
  root: join(root, "scripts/runtime-lab"),
  publicDir,
  logLevel: "error",
  plugins: [
    {
      name: "untransformed-wasm-loader",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const path = new URL(req.url, "http://localhost").pathname;
          if (!/^\/(ort|hf)-wasm\/[a-z0-9.-]+\.(mjs|wasm)$/.test(path))
            return next();
          try {
            const bytes = await readFile(join(publicDir, path));
            res.setHeader(
              "Content-Type",
              path.endsWith(".mjs") ? "text/javascript" : "application/wasm",
            );
            res.end(bytes);
          } catch {
            res.statusCode = 404;
            res.end();
          }
        });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 0, fs: { allow: [root, scratch] } },
});
let browser;
const report = {
  recordedAt: new Date().toISOString(),
  environment: {
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0].model,
    node: process.version,
  },
  artifacts,
  checks: {},
};
try {
  await server.listen();
  const headless = process.env.RUNTIME_HEADFUL !== "1";
  browser = await chromium.launch({ headless });
  report.environment.headless = headless;
  report.environment.browser = browser.version();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("browser:", msg.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => !!window.lab, { timeout: 60_000 });
  report.environment.runtime = await page.evaluate(() => window.lab.init());
  report.checks.runtime = await page.evaluate(() => window.lab.compare());
  report.checks.inferenceCache = await page.evaluate(() =>
    window.lab.inferenceCache(),
  );
  report.checks.backends = await page.evaluate(() => window.lab.backends());
  const seeded = await page.evaluate(() => window.lab.cacheSeed());
  // Reload the page online first, then disable network for model retrieval.
  // Model caching alone cannot provide an offline application shell.
  await page.reload();
  await page.waitForFunction(() => !!window.lab);
  await page.evaluate(() => window.lab.init());
  await context.setOffline(true);
  const offline = await page.evaluate(() => window.lab.cacheOffline());
  expect(offline).toBeCloseTo(seeded.score, 6);
  expect(await page.evaluate(() => window.lab.cacheMissingOffline())).toBe(
    true,
  );
  await context.setOffline(false);
  report.checks.indexedDb = {
    persistedAcrossReload: true,
    offlineScore: offline,
    missingOfflineRejected: true,
    cacheWriteFailure: await page.evaluate(() =>
      window.lab.cacheWriteFailure(),
    ),
  };
  await page.route("**/models/deep-scan/weights.bin", (r) =>
    r.fulfill({ status: 404, body: "missing shard" }),
  );
  expect(await page.evaluate(() => window.lab.missingShard())).toBe(true);
  await page.unroute("**/models/deep-scan/weights.bin");
  report.checks.missingShardRejected = true;
  if (converter)
    report.checks.conversion = {
      files: conversion,
      browser: await page.evaluate(() => window.lab.quantized()),
    };
  else
    report.checks.conversion = {
      status: "not_run",
      reason: "Set TFJS_CONVERTER to the pinned CLI executable",
    };
  if (pretrained) {
    const q8 = await page.evaluate(() => window.lab.pretrained("q8"));
    const fp32 = await page.evaluate(() => window.lab.pretrained("fp32"));
    await context.setOffline(true);
    const cached = await page.evaluate(() => window.lab.pretrained("q8"));
    await context.setOffline(false);
    expect(cached.predictions).toEqual(q8.predictions);
    report.checks.pretrained = {
      artifact: hfArtifact,
      q8,
      fp32,
      cacheOffline: cached,
    };
  } else
    report.checks.pretrained = {
      status: "not_run",
      reason: "Pass --pretrained to download the pinned model (about 335 MB)",
    };
  expect(errors).toEqual([]);
  report.status = converter && pretrained ? "passed" : "partial";
  const output =
    process.env.RUNTIME_REPORT || join(root, "test-results/runtime-lab.json");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        status: report.status,
        report: output,
        parityError: report.checks.runtime.maxError,
        checks: Object.keys(report.checks),
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
  await rm(scratch, { recursive: true, force: true });
}
