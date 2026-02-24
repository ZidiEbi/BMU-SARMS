import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // ensures Turbopack uses this project folder
  },

  experimental: {
    allowedDevOrigins: ["192.168.137.1", "localhost:3000"], // Add your local IP and port here
  },
};

export default nextConfig;
