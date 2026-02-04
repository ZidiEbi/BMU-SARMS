import type { NextConfig } from "next";

const nextConfig = {
  turbopack: {
    root: __dirname, // ensures Turbopack uses this project folder
  },
};

export default nextConfig;
