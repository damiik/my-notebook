import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const isVercel = process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  // Only apply static export for GitHub Pages, never on Vercel
  output: (isGithubActions && !isVercel) ? 'export' : undefined,
  basePath: (isGithubActions && !isVercel) ? '/my-notebook' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
