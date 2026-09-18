// Parse each JavaScript/TypeScript teaching block, including sketches.
// Parsing cannot establish correctness, dependencies or backend support.
import { readdir, readFile } from "node:fs/promises";
import { transformWithEsbuild } from "vite";
const root = new URL(
  "../packages/content/content/deep-orbit/",
  import.meta.url,
);
let count = 0,
  failed = 0;
for (const module of await readdir(root, { withFileTypes: true })) {
  if (!module.isDirectory()) continue;
  const dir = new URL(module.name + "/", root);
  for (const file of await readdir(dir)) {
    if (!file.endsWith(".mdx")) continue;
    const source = await readFile(new URL(file, dir), "utf8");
    for (const [, language, title, template] of source.matchAll(
      /<CodeBlock language="(typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    )) {
      count++;
      try {
        const code = new Function("return `" + template + "`;")();
        // Leave imports at module scope; blocks may contain top-level await.
        await transformWithEsbuild(
          code,
          "lesson." + (language === "typescript" ? "ts" : "js"),
          {
            loader: language === "typescript" ? "ts" : "js",
            target: "es2022",
            logLevel: "silent",
          },
        );
      } catch (error) {
        failed++;
        console.error(
          `${module.name}/${file} [${title}]: ${error.message.split("\n").slice(0, 3).join(" ")}`,
        );
      }
    }
  }
}
console.log(`${count} lesson code blocks parsed; ${failed} failures`);
process.exitCode = failed ? 1 : 0;
