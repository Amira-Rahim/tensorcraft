import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import withBundleAnalyzer from "@next/bundle-analyzer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const velitePath = path.resolve(__dirname, "../../packages/content/.velite");

const nextConfig: NextConfig = {
  eslint: {
    // Prototype pages have intentional scaffolding vars — lint in CI, not build
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    "@tensorcraft/ui",
    "@tensorcraft/themes",
    "@tensorcraft/supabase",
    "@tensorcraft/content",
    "@tensorcraft/shared",
  ],
  webpack: (config) => {
    // Treat .velite output as managed (immutable) so webpack doesn't
    // watch it for changes — prevents dev server crashes when Velite
    // regenerates large JSON files (2MB+)
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [...(config.snapshot?.managedPaths || []), velitePath],
    };
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/.velite/**"],
    };
    return config;
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withAnalyzer(nextConfig);
