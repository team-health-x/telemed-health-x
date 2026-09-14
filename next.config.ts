import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.TELEMED_CONTAINER_BUILD === 'true' ? { output: 'standalone' as const } : {}),
  typescript: { tsconfigPath: "tsconfig.next.json" },
};

export default nextConfig;
