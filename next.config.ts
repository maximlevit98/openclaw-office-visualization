import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const config: NextConfig = {
  reactStrictMode: true,
  // Keep dev artifacts separate from production build output.
  // This prevents chunk/runtime corruption when `next dev` and `next build`
  // run in parallel (for example, local UI + agent checks).
  distDir: isDev ? ".next-dev" : ".next",
  serverExternalPackages: [],
};

export default config;
