import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: ["media.licdn.com"]
  },
  output: 'export',
};

export default nextConfig;
