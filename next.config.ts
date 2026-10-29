import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Garante que os route handlers rodem sempre no runtime Node (e nao Edge).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
