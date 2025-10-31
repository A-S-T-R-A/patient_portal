/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable ESLint during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Image optimization
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
