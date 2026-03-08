import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tensorcraft/ui",
    "@tensorcraft/themes",
    "@tensorcraft/supabase",
  ],
};

export default nextConfig;
