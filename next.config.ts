import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keeps heavy cryptographic packages out of the internal compilation server pipeline
  serverExternalPackages: ['@aztec/bb.js', '@noir-lang/backend_barretenberg', '@noir-lang/noir_js'],
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
