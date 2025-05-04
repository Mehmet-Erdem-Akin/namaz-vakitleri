import type { NextConfig } from 'next';

const nextConfig = {
  reactStrictMode: true,
  // Disable static export for pages with client components
  output: 'standalone',
};

export default nextConfig;
