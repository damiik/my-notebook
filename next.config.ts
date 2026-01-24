import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/my-notebook',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
