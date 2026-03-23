import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    /* Next 15 + eslint-config-next can hit a circular JSON bug in `next build`; use `tsc` in `npm run lint`. */
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
