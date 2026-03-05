import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move this out of experimental
  devIndicators: {
  },
  // If you are on the very latest Next.js, this key is often not needed 
  // unless you are using specific cross-origin dev tools.
  // experimental: { }, 
  
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;