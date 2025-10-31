import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
