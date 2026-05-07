import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.pexels.com' },
      { protocol: 'https', hostname: '**.storyblok.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '**.clerk.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['react-markdown', 'remark-gfm', 'd3-geo'],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
