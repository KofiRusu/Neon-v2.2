/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
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
  // HTTPS redirect for custom domain
  async redirects() {
    return [
      {
        source: "/(.*)",
        destination: "https://neonhubecosystem.com/$1",
        permanent: true,
        has: [
          {
            type: "host",
            value: "www.neonhubecosystem.com",
          },
        ],
      },
    ];
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
