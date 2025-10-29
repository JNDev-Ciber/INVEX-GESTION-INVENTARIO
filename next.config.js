/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    TZ: "UTC",
  },
  distDir: ".next",
  generateEtags: false,
  experimental: {
    esmExternals: true,
  },
};

module.exports = nextConfig;
