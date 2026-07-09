import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crust: "#7a3b1e",
        cheese: "#f2b544",
        tomato: "#c0392b",
        basil: "#3f6b3f",
      },
    },
  },
  plugins: [],
};

export default config;
