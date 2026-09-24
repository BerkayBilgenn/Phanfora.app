import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@phanfora/currency', '@phanfora/domain'],
  experimental: { optimizePackageImports: ['@phanfora/currency'] },
};

export default nextConfig;
