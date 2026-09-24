import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  transpilePackages: ['@phanfora/currency', '@phanfora/domain'],
  experimental: { optimizePackageImports: ['@phanfora/currency'] },
};

export default nextConfig;
