import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 🔥 allows deployment even if TS errors exist
  },
};

export default nextConfig;