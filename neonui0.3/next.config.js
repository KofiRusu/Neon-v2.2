/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    optimizePackageImports: ["lucide-react", "@heroicons/react"],
  },
  transpilePackages: ["@radix-ui/react-*"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "picsum.photos",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": "./src",
    };
    return config;
  },
};

module.exports = nextConfig;
