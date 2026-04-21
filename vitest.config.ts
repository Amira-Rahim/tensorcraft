import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", ".next", "dist", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        ".velite/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "e2e/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web"),
      "@tensorcraft/supabase": path.resolve(__dirname, "packages/supabase/src"),
      "@tensorcraft/shared": path.resolve(__dirname, "packages/shared/src"),
      "@tensorcraft/themes": path.resolve(__dirname, "packages/themes/src"),
      "@tensorcraft/ui": path.resolve(__dirname, "packages/ui/src"),
      "@tensorcraft/content": path.resolve(__dirname, "packages/content/src"),
      // Hoist React to the root node_modules (resolved via packages/ui)
      // so tests in packages without a local react install (e.g.
      // packages/content/__tests__/) still resolve the JSX runtime.
      react: path.resolve(__dirname, "packages/ui/node_modules/react"),
      "react-dom": path.resolve(
        __dirname,
        "packages/ui/node_modules/react-dom",
      ),
    },
  },
});
