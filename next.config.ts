import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  // Only apply basePath and output: export for GitHub Pages
  output: isGithubActions ? 'export' : undefined,
  basePath: isGithubActions ? '/my-notebook' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
