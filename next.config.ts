import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdf-parse on server to avoid build-time issues
      config.externals = [...(config.externals || []), 'pdf-parse'];
    }
    return config;
  },
  devIndicators: false
};

export default nextConfig;
