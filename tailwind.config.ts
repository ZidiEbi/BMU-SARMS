import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bmu: {
          // The Royal Blue from the bottom ribbon
          blue: "#0033CC",
          // The vibrant Green from the medical cross
          green: "#66FF00",
          // The deep Purple/Maroon from the circular border
          maroon: "#8E4B8E",
          // A clean, sterile 2026 medical gray for backgrounds
          slate: "#F8FAFC", 
        },
      },
      boxShadow: {
        // High-end medical software "Glass" effect
        'medical': '0 10px 40px -10px rgba(0, 51, 204, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;